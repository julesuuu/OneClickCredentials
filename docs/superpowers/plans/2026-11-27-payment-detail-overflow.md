# Fix Payment Detail Dialog Overflow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prevent long unbroken strings (such as `referenceNumber`, emails, and proof filenames) from overflowing `PaymentDetailDialog` on `/admin/payments` across desktop and mobile viewports.

**Architecture:** Constrain `DialogContent` in the shared Radix dialog primitive using `grid-cols-[minmax(0,1fr)]` so CSS grid tracks cannot expand beyond `max-w-*`. Then update `PaymentDetailDialog` to override `sm:max-w-sm` with `sm:max-w-2xl`, add `min-w-0` on the body wrapper and grid/list containers, rebalance the metadata grid with `Student` and `Reference` at `sm:col-span-2`, and apply `break-all` / `break-words` to text fields.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Radix UI Dialog (`shadcn/ui`), Vitest, ESLint.

---

## File Structure

- Modify: `src/components/ui/dialog.tsx:50-70` — Add `grid-cols-[minmax(0,1fr)]` to `DialogContent` base classes so implicit CSS grid columns shrink to fit the container width.
- Modify: `src/app/(admin)/admin/payments/PaymentDetailDialog.tsx:69-212` — Set `sm:max-w-2xl` + `max-h-[90vh] overflow-y-auto`, add `min-w-0` on the `space-y-6` wrapper and list/grid items, reorder and span `Student` and `Reference` (`sm:col-span-2`), and apply `break-all` / `break-words`.

---

### Task 1: Constrain `DialogContent` CSS Grid Track

**Files:**

- Modify: `src/components/ui/dialog.tsx:61-68`

- [ ] **Step 1: Inspect `DialogContent` in `src/components/ui/dialog.tsx`**

Verify lines 61-68 currently read:

```tsx
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(
          "fixed top-1/2 left-1/2 z-50 grid w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 gap-4 rounded-xl bg-popover p-4 text-sm text-popover-foreground ring-1 ring-foreground/10 duration-100 outline-none sm:max-w-sm data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
          className
        )}
        {...props}
      >
```

- [ ] **Step 2: Add `grid-cols-[minmax(0,1fr)]` to `DialogContent`**

Update lines 61-68 of `src/components/ui/dialog.tsx`:

```tsx
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(
          "fixed top-1/2 left-1/2 z-50 grid w-full max-w-[calc(100%-2rem)] grid-cols-[minmax(0,1fr)] -translate-x-1/2 -translate-y-1/2 gap-4 rounded-xl bg-popover p-4 text-sm text-popover-foreground ring-1 ring-foreground/10 duration-100 outline-none sm:max-w-sm data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
          className
        )}
        {...props}
      >
```

- [ ] **Step 3: Run lint and type-check build to verify no regressions**

Run: `npm run lint && npm run build`
Expected: Exit code 0 with zero ESLint or TypeScript/Next.js build errors.

- [ ] **Step 4: Commit `DialogContent` grid fix**

```bash
git add src/components/ui/dialog.tsx
git commit -m "fix(ui): constrain DialogContent grid column to minmax(0, 1fr)"
```

---

### Task 2: Update `PaymentDetailDialog` Sizing, Grid Layout, and Text Wrapping

**Files:**

- Modify: `src/app/(admin)/admin/payments/PaymentDetailDialog.tsx:69-212`

- [ ] **Step 1: Update `DialogContent`, body wrapper, metadata grid, Proof, and History sections**

Note: There may already be partial uncommitted edits in `src/app/(admin)/admin/payments/PaymentDetailDialog.tsx` on this branch. Ensure lines 69-212 match the complete layout below:

```tsx
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Payment Details</DialogTitle>
        </DialogHeader>

        <div className="min-w-0 space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="min-w-0 sm:col-span-2">
              <p className="text-sm text-muted-foreground">Student</p>
              <p className="font-medium break-words">
                {payment.documentRequest.user.studentProfile?.fullName ??
                  "Unknown"}
              </p>
              <p className="text-sm text-muted-foreground">
                {payment.documentRequest.user.studentProfile?.studentNumber ??
                  "—"}
              </p>
              <p className="text-sm text-muted-foreground break-all">
                {payment.documentRequest.user.email}
              </p>
            </div>
            <div className="min-w-0">
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge
                variant={statusVariant[payment.status] ?? "secondary"}
              >
                {payment.status}
              </Badge>
              <p className="mt-2 text-sm text-muted-foreground break-words">
                {payment.method}
                {payment.paymentMethodType
                  ? ` • ${payment.paymentMethodType}`
                  : ""}
              </p>
            </div>
            <div className="min-w-0">
              <p className="text-sm text-muted-foreground">Amount</p>
              <p className="font-medium">
                ₱{payment.amount.toLocaleString()}
              </p>
            </div>
            <div className="min-w-0">
              <p className="text-sm text-muted-foreground">Document</p>
              <p className="font-medium break-words">
                {payment.documentRequest.documentType.name}
              </p>
              <p className="text-sm text-muted-foreground">
                Qty {payment.documentRequest.quantity} • Request{" "}
                {payment.documentRequest.status}
              </p>
            </div>
            <div className="min-w-0">
              <p className="text-sm text-muted-foreground">Created</p>
              <p className="font-medium">
                {format(new Date(payment.createdAt), "MMM dd, yyyy")}
              </p>
              {payment.paidAt && (
                <p className="text-sm text-muted-foreground">
                  Paid {format(new Date(payment.paidAt), "MMM dd, yyyy")}
                </p>
              )}
            </div>
            <div className="min-w-0 sm:col-span-2">
              <p className="text-sm text-muted-foreground">Reference</p>
              <p className="font-mono text-sm font-medium break-all">
                {payment.referenceNumber ?? "—"}
              </p>
            </div>
          </div>

          {payment.failureReason && (
            <div>
              <p className="text-sm text-muted-foreground">Failure Reason</p>
              <p className="text-sm text-destructive break-words">
                {payment.failureReason}
              </p>
            </div>
          )}

          <div>
            <p className="mb-2 text-sm text-muted-foreground">Proof</p>
            {payment.uploads.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No receipt uploaded.
              </p>
            ) : (
              <ul className="space-y-2">
                {payment.uploads.map((upload) => (
                  <li key={upload.id} className="min-w-0">
                    <a
                      href={upload.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 break-all hover:underline"
                    >
                      {upload.name}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <p className="mb-2 text-sm text-muted-foreground">History</p>
            {payment.events.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No history recorded.
              </p>
            ) : (
              <ul className="max-h-64 space-y-3 overflow-y-auto border-l pl-4">
                {payment.events.map((event) => (
                  <li key={event.id} className="relative min-w-0">
                    <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-border" />
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium">
                        {eventLabels[event.type] ?? event.type}
                      </p>
                      {event.toStatus && (
                        <span className="text-xs text-muted-foreground">
                          {event.fromStatus ?? "—"} → {event.toStatus}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground break-words">
                      {event.actorName ?? event.actorType} •{" "}
                      {format(
                        new Date(event.createdAt),
                        "MMM dd, yyyy • h:mm a",
                      )}
                    </p>
                    {event.message && (
                      <p className="mt-1 text-sm text-muted-foreground break-words">
                        {event.message}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
```

- [ ] **Step 2: Run lint, tests, and production build**

Run: `npm run lint && npm test && npm run build`
Expected:

- `npm run lint`: passes with 0 errors.
- `npm test`: all Vitest unit tests pass.
- `npm run build`: succeeds cleanly.

- [ ] **Step 3: Visually verify `/admin/payments` in the dev server (manual check)**

Run: `npm run dev` (in a local browser at `http://localhost:3000/admin/payments`)
Verify:

1. On desktop (`>= 640px`), `PaymentDetailDialog` renders at `sm:max-w-2xl` (`672px` max width) with balanced rows (`Student` full-width, `Status | Amount`, `Document | Created`, `Reference` full-width).
2. A long unbroken `referenceNumber` (60+ characters), long email, and long upload filename wrap inside the dialog without horizontal overflow or clipping.
3. On mobile (`< 640px`), the dialog stacks into 1 column within `max-w-[calc(100%-2rem)]` with no horizontal overflow.
4. Clicking **Close**, **Mark as Paid**, or **Mark as Refunded** (and its confirmation `AlertDialog`) still works normally.

- [ ] **Step 4: Commit `PaymentDetailDialog` changes**

```bash
git add src/app/(admin)/admin/payments/PaymentDetailDialog.tsx
git commit -m "fix(payments): prevent text overflow in PaymentDetailDialog"
```
