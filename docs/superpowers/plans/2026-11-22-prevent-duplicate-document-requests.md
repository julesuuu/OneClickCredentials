# Prevent Duplicate Document Requests Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ensure one submit on the new-document-request form creates at most one `DocumentRequest` row, even on rapid double-clicks or retries.

**Architecture:** A synchronous `useRef` lock on the client stops same-tick double-clicks, and a per-page `submitToken` is stored under a unique database constraint so the server rejects any second insert carrying the same token. The `P2002` violation is treated as a successful idempotent retry.

**Tech Stack:** Next.js 16 App Router, TypeScript, TanStack Form, Prisma (`db push` workflow), PostgreSQL via Prisma Accelerate, shadcn/ui, sonner.

**Note on testing:** This project has no unit/integration test runner configured (`AGENTS.md`). Verification is lint + build + deterministic manual checks, including a temporary removal of the client guard to exercise the server path.

---

## File Structure

- `prisma/schema.prisma` — add the `submitToken` column and unique constraint to `DocumentRequest`.
- `src/app/(student)/dashboard/requests/actions.ts` — validate the token, store it, and translate the `P2002` unique violation into an idempotent success.
- `src/app/(student)/dashboard/requests/new/NewRequestForm.tsx` — add the synchronous submit lock, generate/send the token, and clear it after a received success.

Task order keeps the app working after every commit: the schema lands first (nullable, ignored), then the client starts sending a token (server ignores it), then the server enforces it.

---

### Task 1: Add `submitToken` to the schema

**Files:**
- Modify: `prisma/schema.prisma` (`DocumentRequest` model, around lines 162–184)

- [ ] **Step 1: Add the field**

In the `DocumentRequest` model, immediately after `declineReason String?`, add:

```prisma
  submitToken    String?      @unique
```

The finished model should read:

```prisma
model DocumentRequest {
  id             String       @id @default(cuid())
  userId         String
  user           User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  documentTypeId String
  documentType   DocumentType @relation(fields: [documentTypeId], references: [id])
  quantity       Int
  totalPrice     Int
  status         String       @default("Pending")
  notes          String?
  declineReason  String?
  submitToken    String?      @unique

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  paymentId     String?      @unique
  payment       Payment?
  appointmentId String?      @unique
  appointment   Appointment?

  @@index([userId])
  @@map("documentRequest")
}
```

- [ ] **Step 2: Regenerate the Prisma client**

Run:

```bash
npx prisma generate
```

Expected: output ends with `Generated Prisma Client`.

- [ ] **Step 3: Push the schema to the database**

Run:

```bash
npx prisma db push
```

Expected: `Your database is now in sync with your Prisma schema.` (This project uses `db push`, not migration files.)

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma
git commit -m "feat: add submitToken to DocumentRequest"
```

---

### Task 2: Add the client-side submit lock and token

**Files:**
- Modify: `src/app/(student)/dashboard/requests/new/NewRequestForm.tsx`

- [ ] **Step 1: Add the two refs**

Directly after the existing `notes` state declaration:

```tsx
  const [notes, setNotes] = React.useState("");
  const submittingRef = React.useRef(false);
  const submitTokenRef = React.useRef<string | null>(null);
```

- [ ] **Step 2: Replace the `onSubmit` handler**

Replace the entire existing `onSubmit` block inside `useForm({ ... })` with:

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
          // A received response means this submit attempt is settled. Clear the
          // token so a later submit (e.g. navigation failed and the user edited
          // the form) is treated as a new order.
          submitTokenRef.current = null;
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

Do **not** change the existing submit button `disabled` expression:

```tsx
disabled={!selectedType || form.state.isSubmitting}
```

It remains as visual feedback; the ref is now the functional gate.

- [ ] **Step 3: Lint**

Run:

```bash
npm run lint
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add "src/app/(student)/dashboard/requests/new/NewRequestForm.tsx"
git commit -m "feat: lock document request submit against double clicks"
```

At this point the client already prevents ordinary double-clicks. The server still ignores `submitToken`, so the app works normally.

---

### Task 3: Enforce the token on the server

**Files:**
- Modify: `src/app/(student)/dashboard/requests/actions.ts` (`createDocumentRequest`)
- Modify: `src/app/(student)/dashboard/requests/new/NewRequestForm.tsx` (duplicate-aware toast)

- [ ] **Step 1: Replace `createDocumentRequest`**

Replace the whole function with:

```ts
export async function createDocumentRequest(formData: FormData) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const documentTypeId = formData.get("documentTypeId") as string;
  const quantity = parseInt(formData.get("quantity") as string, 10);
  const notes = formData.get("notes") as string;

  const submitToken = formData.get("submitToken");
  if (
    typeof submitToken !== "string" ||
    submitToken.length < 10 ||
    submitToken.length > 100
  ) {
    throw new Error("Please refresh the page and try again.");
  }

  if (!documentTypeId) {
    throw new Error("Document type is required");
  }

  if (!quantity || quantity < 1) {
    throw new Error("Quantity must be at least 1");
  }

  const MAX_QUANTITY = 5;
  if (quantity > MAX_QUANTITY) {
    throw new Error(`Maximum quantity allowed is ${MAX_QUANTITY}`);
  }

  const documentType = await prisma.documentType.findUnique({
    where: { id: documentTypeId },
  });

  if (!documentType) {
    throw new Error("Invalid document type");
  }

  const totalPrice = documentType.price * quantity;

  try {
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

    return { success: true, duplicate: false };
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
}
```

- [ ] **Step 2: Make the success toast duplicate-aware**

In `NewRequestForm.tsx`, replace:

```tsx
          toast.success("Request submitted successfully");
```

with:

```tsx
          toast.success(
            result.duplicate
              ? "This request was already submitted"
              : "Request submitted successfully",
          );
```

- [ ] **Step 3: Lint**

Run:

```bash
npm run lint
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add "src/app/(student)/dashboard/requests/actions.ts" "src/app/(student)/dashboard/requests/new/NewRequestForm.tsx"
git commit -m "feat: reject duplicate document request submissions"
```

---

### Task 4: Verify end to end

**Prerequisite:** the database currently has no document types and no login accounts (it was reset earlier). Before running these checks, ensure at least one active `DocumentType` exists and you can sign in. This is manual setup outside the scope of this plan.

**Files:** none.

- [ ] **Step 1: Start the dev server**

Run:

```bash
npm run dev
```

Expected: `Ready on http://localhost:3000`.

- [ ] **Step 2: Verify the normal double-click path**

1. In Chrome DevTools → Network, set throttling to **Slow 3G**.
2. Open `/dashboard/requests/new`, select a document type, and double-click **Submit Request** rapidly.
3. Open `/dashboard/requests`.

Expected: exactly **one** new request row.

- [ ] **Step 3: Verify the server path deterministically**

1. In `NewRequestForm.tsx`, temporarily comment out these two lines:

   ```tsx
   if (submittingRef.current) return;
   submittingRef.current = true;
   ```

2. With throttling still on Slow 3G, submit the form by double-clicking.
3. Check `/dashboard/requests`.

Expected: exactly **one** new request row. The second call receives `P2002` and returns `duplicate: true`. The toast may read "This request was already submitted".

4. Restore the two commented lines and confirm `npm run lint` still passes.

- [ ] **Step 4: Verify a legitimate second order still works**

1. Submit one request and wait for the success toast and navigation.
2. Use the browser back button to return to `/dashboard/requests/new`.
3. Submit again.

Expected: a **second** request row is created (new page mount → new token). This is intentional.

- [ ] **Step 5: Final build**

Run:

```bash
npm run build
```

Expected: build completes successfully.

- [ ] **Step 6: Commit any leftover changes**

If Step 3 left no changes (the guard was restored), there is nothing to commit. Otherwise:

```bash
git add -A
git commit -m "test: verify duplicate request protection"
```
