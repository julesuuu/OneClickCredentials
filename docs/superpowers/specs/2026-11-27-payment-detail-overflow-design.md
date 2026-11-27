# Fix Payment Detail Dialog Text Overflow

## Overview

In `/admin/payments`, clicking a payment opens `PaymentDetailDialog`, where long unbroken strings — especially `referenceNumber` (PayMongo IDs or generated references), emails, and receipt filenames — overflow the modal container instead of wrapping.

**Goal:** Ensure all fields inside `PaymentDetailDialog` stay strictly within the dialog bounds across mobile and desktop viewports, with enough horizontal room for long identifiers to read cleanly.

## Root Cause

Two layout issues combine to cause the overflow:

1. **Base `sm:max-w-sm` overrides `max-w-lg`:** In `src/components/ui/dialog.tsx`, `DialogContent` defines `sm:max-w-sm` (`24rem` / `384px`). On `PaymentDetailDialog`, the original `max-w-lg` (`32rem`) is unprefixed, so `sm:max-w-sm` wins at `>= 640px`. Splitting `384px` into a 2-column grid leaves ~`170px` per column.
2. **CSS Grid minimum sizing (`minmax(auto, 1fr)`):** `DialogContent` uses `display: grid` without an explicit column template or `min-w-0` on its direct child wrapper. In CSS Grid, implicit columns default to `minmax(auto, 1fr)`, allowing unbroken text (such as `referenceNumber` or long emails) to expand the track past `max-w-*`.

## Scope & Non-Goals

**In scope:**
- `src/components/ui/dialog.tsx` (`DialogContent` grid track constraint)
- `src/app/(admin)/admin/payments/PaymentDetailDialog.tsx` (dialog sizing, balanced grid layout, `min-w-0`, and word-wrapping classes)

**Non-goals:**
- Modifying `RequestDetailDialog.tsx`, `AppointmentDetailDialog.tsx`, or other modals beyond inheriting the safe `DialogContent` grid track fix.
- Truncating references with ellipses or adding copy-to-clipboard buttons.
- Changing the `/admin/payments` table columns, Prisma schema, or payment actions.

## Design

### 1. Shared Dialog Primitive (`src/components/ui/dialog.tsx`)

Add `grid-cols-[minmax(0,1fr)]` to `DialogContent`'s base class list:

```tsx
"fixed top-1/2 left-1/2 z-50 grid w-full max-w-[calc(100%-2rem)] grid-cols-[minmax(0,1fr)] -translate-x-1/2 -translate-y-1/2 gap-4 rounded-xl bg-popover p-4 text-sm text-popover-foreground ring-1 ring-foreground/10 duration-100 outline-none sm:max-w-sm ..."
```

`DialogContent` stacks its children (`DialogHeader`, body content, footer) in a single vertical column. Replacing the implicit `auto` minimum track size with `minmax(0, 1fr)` ensures no child can force a dialog wider than its `max-w-*` cap.

### 2. Payment Detail Dialog (`src/app/(admin)/admin/payments/PaymentDetailDialog.tsx`)

#### Dialog Container & Scroll
- Set `DialogContent` `className` to:
  `max-h-[90vh] overflow-y-auto sm:max-w-2xl`
- `sm:max-w-2xl` (`42rem` / `672px`) uses the `sm:` prefix so it overrides `DialogContent`'s `sm:max-w-sm` on desktop while retaining `max-w-[calc(100%-2rem)]` on narrow mobile screens.
- Add `min-w-0` to the direct body wrapper inside `DialogContent`:
  `<div className="min-w-0 space-y-6">`

#### Balanced Metadata Grid
Use `grid grid-cols-1 gap-4 sm:grid-cols-2`, with `min-w-0` on every grid cell. Give `Student` and `Reference` full width on desktop (`sm:col-span-2`) so long emails and references get ~`620px` and the remaining four fields form two balanced 2-column rows without orphan cells:

| Order | Field | Grid Span (`sm:`) | Contents & Wrapping |
|---|---|---|---|
| 1 | Student | `sm:col-span-2` | Full name (`break-words`), student number, email (`break-all`) |
| 2 | Status | 1 col | Status `Badge`, `method` + `paymentMethodType` (`break-words`) |
| 3 | Amount | 1 col | Formatted `₱` amount |
| 4 | Document | 1 col | `documentType.name` (`break-words`), quantity & request status |
| 5 | Created | 1 col | Created date and optional paid date |
| 6 | Reference | `sm:col-span-2` | `referenceNumber ?? "—"` in `font-mono text-sm font-medium break-all` |

#### Supporting Sections & Wrapping Rules
- **Failure Reason:** `break-words` on the destructive reason text.
- **Proof:** `min-w-0` on each `<li>` and `break-all` on the upload `<a>` link so long filenames/URLs wrap cleanly.
- **History:** `min-w-0` on each `<li>`, `break-words` on the actor/timestamp line and `event.message`. Keep `max-h-64 overflow-y-auto` so long event logs remain bounded.
- **Wrapping strategy:** Use `break-words` for natural-language text (names, document types, failure/event messages) so words wrap at boundaries first, and `break-all` for unbroken technical strings (emails, `referenceNumber`, proof filenames).

## Edge Cases

- Missing optional fields (`referenceNumber`, `studentProfile`, `paymentMethodType`, `paidAt`, `failureReason`) and empty `uploads` / `events` arrays preserve their existing fallback text (`"—"`, `"Unknown"`, `"No receipt uploaded."`, `"No history recorded."`).
- Extra-long unbroken strings (e.g., 60+ character references or emails) wrap inside both desktop (`sm:max-w-2xl`) and mobile (`calc(100% - 2rem)`) viewports without triggering horizontal scrolling on `DialogContent`.
- Refund confirmation `AlertDialog` and action buttons (`Mark as Paid`, `Mark as Refunded`, `Close`) remain unchanged.

## Verification

After implementation:
1. Run `npm run lint` — must pass with zero errors/warnings introduced.
2. Run `npm test` — existing Vitest suite must continue passing.
3. Run `npm run build` — TypeScript check and Next.js production build must succeed.
4. Visually verify `/admin/payments` in the browser across desktop (`>= 640px`) and mobile (`< 640px`) widths using both typical PayMongo/CUID references and an artificially long unbroken `referenceNumber` (60+ chars), confirming no horizontal overflow occurs in `PaymentDetailDialog`.
