# Prevent Duplicate Document Requests

## Overview

Double-clicking **Submit Request** on `/dashboard/requests/new` can create two
`DocumentRequest` rows with the same contents and different `id`s.

The current guard is:

```tsx
disabled={!selectedType || form.state.isSubmitting}
```

`form.state.isSubmitting` is React state. It only becomes `true` after a
re-render, so two clicks landing before that commit both pass through and both
call the server action. The server action itself has no duplicate protection:
it always runs `prisma.documentRequest.create(...)`.

**Goal:** one user submission produces at most one `DocumentRequest` row,
regardless of click speed, network retries, or a lost response.

## Approach

Two layers, both required:

1. **Client — synchronous lock.** A `useRef` flips immediately, before any
   `await`, so the second click is rejected in the same tick. A per-page
   `submitToken` is generated once and sent with every attempt.
2. **Server — idempotency key.** `submitToken` is stored on the row with a
   unique constraint. A second insert carrying the same token fails with
   `P2002` and is treated as success instead of creating a duplicate.

## Data Model

Add to `DocumentRequest` in `prisma/schema.prisma`:

```prisma
submitToken String? @unique
```

Nullable so existing rows are unaffected. Postgres allows multiple `NULL`
values in a unique index, so historical rows without a token do not conflict.

## Client Changes — `NewRequestForm.tsx`

Add two refs:

```tsx
const submittingRef = React.useRef(false);
const submitTokenRef = React.useRef<string | null>(null);
```

Update `onSubmit`:

```tsx
onSubmit: async ({ value }) => {
  if (submittingRef.current) return;
  submittingRef.current = true;

  try {
    if (!value.documentTypeId) {
      toast.error("Please select a document type");
      return;
    }

    if (!submitTokenRef.current) {
      submitTokenRef.current = crypto.randomUUID();
    }

    const formData = new FormData();
    formData.append("documentTypeId", value.documentTypeId);
    formData.append("quantity", quantity.toString());
    formData.append("notes", notes || "");
    formData.append("submitToken", submitTokenRef.current);

    const result = await createDocumentRequest(formData);
    if (result.success) {
      toast.success("Request submitted successfully");
      router.push("/dashboard/requests");
    }
  } catch (error) {
    toast.error(
      error instanceof Error ? error.message : "Failed to create request",
    );
  } finally {
    submittingRef.current = false;
  }
},
```

Notes:

- The ref is set **before** validation so a fast double-click cannot slip
  through while validation runs.
- `finally` releases the lock on the validation early-return and on thrown
  errors, so the form never gets stuck.
- The token is created lazily on first submit, avoiding any SSR/hydration
  mismatch. It stays stable for retries on this page; a fresh page load gets a
  new token.
- Keep the existing `disabled` expression. It is still useful visual feedback;
  the ref is now the functional gate.
- A `duplicate: true` response is handled by the same `result.success` branch:
  the original request already exists, so navigating to the list is correct.

## Server Changes — `requests/actions.ts`

In `createDocumentRequest`:

1. Read and validate the token:

```ts
const submitToken = formData.get("submitToken");
if (
  typeof submitToken !== "string" ||
  submitToken.length < 10 ||
  submitToken.length > 100
) {
  throw new Error("Please refresh the page and try again.");
}
```

2. Pass it to the existing create call:

```ts
await prisma.documentRequest.create({
  data: {
    userId: session.user.id,
    documentTypeId,
    quantity,
    totalPrice,
    notes: notes || null,
    status: "Pending",
    submitToken,
  },
});
```

3. Wrap the create in `try / catch` and follow the `P2002` pattern already used
   in `dashboard/onboarding/actions.ts` (no new Prisma error imports):

```ts
} catch (error: unknown) {
  if (
    error &&
    typeof error === "object" &&
    "code" in error &&
    error.code === "P2002" &&
    "meta" in error
  ) {
    const target = (error.meta as { target?: string[] })?.target;
    if (target?.includes("submitToken")) {
      const existing = await prisma.documentRequest.findUnique({
        where: { submitToken },
        select: { userId: true },
      });

      if (existing?.userId === session.user.id) {
        return { success: true, duplicate: true };
      }
      throw new Error("Invalid submission token");
    }
  }
  throw error;
}
```

All other errors are rethrown so genuine failures still surface.

## Behavior and Edge Cases

| Scenario | Result |
| --- | --- |
| Rapid double-click | Second click rejected by `submittingRef` before any request |
| Slow network, user clicks again | Same token; server returns `duplicate: true`; no second row |
| Server succeeded but response was lost, user retries | Same token; `P2002`; treated as success |
| Two different browser tabs | **Not covered** — each tab has its own token, so both can create a row |
| Browser back, then submit again | New page mount → new token → creates a new request (intentional re-order) |
| Stale cached page without a token | Server rejects with "Please refresh the page and try again." |
| Existing rows created before this change | `submitToken` is `NULL`; no unique conflict |
| Token collision with another user | Ownership check fails; throws "Invalid submission token" |

## Out of Scope

- Time-window content deduplication (same user + document + quantity within N
  seconds). This would be the backstop for the two-tab case.
- Applying the same pattern to payment, appointment, or onboarding forms.
- Cleaning up duplicate rows already in the database.

## Testing

Manual:

1. `npx prisma generate` then `npx prisma db push`.
2. `npm run lint` and `npm run build`.
3. In DevTools, throttle the network to Slow 3G, open
   `/dashboard/requests/new`, and double-click Submit. Confirm exactly one row
   appears in `/dashboard/requests`.
4. Submit once, then use the browser back button to return to the form and
   submit again. Confirm a second request is created (expected).

## Files Touched

- `prisma/schema.prisma` — add `submitToken`
- `src/app/(student)/dashboard/requests/actions.ts` — idempotency handling
- `src/app/(student)/dashboard/requests/new/NewRequestForm.tsx` — client lock
