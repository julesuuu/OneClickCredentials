# PayMongo Payments (Module 4)

## Overview

The `Payment` model exists but nothing in the app creates or updates it. As a
result:

- `/dashboard/payments` and `/admin/payments` render placeholder `<p>` tags.
- The dashboard balance card always shows ₱0 because `payment.aggregate` runs
  against an empty table.
- Request rows always show "Not paid".
- The `paymentProof` UploadThing endpoint exists but is never called.
- `src/app/api/paymongo/` contains empty `create-intent` and `webhook`
  directories; there is no gateway integration.

This spec implements the full payment module: payment records created with
each request, cash receipt upload with admin verification, and online payment
through PayMongo Hosted Checkout (GCash, Maya, cards, QRPh).

**Goal:** a student can request a document, see the amount due, pay online or
in cash, and have the payment reflected consistently for both the student and
an admin — without manual database edits.

## Locked decisions

| Decision | Choice |
|---|---|
| Scope | Full Module 4: cash + online + admin verification |
| Gateway API | PayMongo **Hosted Checkout** (`/v2/checkout_sessions`) |
| When payment is allowed | Immediately after the request is created |
| Rejection after payment | **Not allowed**; admin completes or manually refunds |
| Cash confirmation | Optional receipt upload; admin marks `Paid` |
| Status confirmation | Webhook as source of truth + return-page fallback |
| Server structure | Server actions + one webhook route handler |
| Verification at signup | A separate future change; this spec does not implement it |

## Non-goals

- Moving student verification to signup.
- Automated PayMongo refunds. Admins refund in the PayMongo dashboard and then
  mark the payment `Refunded` here.
- Email notifications for payment events (Module 5 gap).
- Admin announcements / notification bell for admins.
- Receipt OCR or automatic cash matching.
- Partial payments, installments, or multiple payments per request.
- A payment history route separate from `/dashboard/payments`.

## Status and method vocabulary

`Payment.status`:

| Status | Meaning |
|---|---|
| `Pending` | Created with the request; money not received |
| `Paid` | Confirmed by webhook/return check, or by an admin for cash |
| `Failed` | Checkout/payment failed; the student may retry |
| `Refunded` | Admin refunded manually and recorded it |
| `Cancelled` | Request was rejected before payment |

`Payment.method`: `Cash` (default) or `Online`.

This replaces the inconsistent `Completed`/`Paid` usage in the current request
list. All new code uses `Paid`.

## Data model

Add to `Payment` in `prisma/schema.prisma`:

```prisma
checkoutSessionId String?  @unique   // cs_...
paymentIntentId   String?            // pi_...
paymongoPaymentId String?  @unique   // pay_...
paymentMethodType String?            // gcash | maya | card | qrph
paidAt            DateTime?
failureReason     String?
```

Existing fields stay as-is:

- `amount Int` — pesos, matching `DocumentRequest.totalPrice`.
- `referenceNumber String?` — stores the PayMongo reference (the local payment
  id is used as the reference).
- `method String @default("Cash")`.
- `status String @default("Pending")`.
- `uploads Upload[]` — receipt images/PDFs (`category = "paymentProof"`).

PayMongo amounts are centavos, so conversion happens only at the API boundary:
`amount * 100`. Currency is always `PHP`.

No `User` relation is added; ownership is derived through
`payment.documentRequest.userId`.

## Payment lifecycle

```
Request created ──► Payment(Pending, Cash)
                         │
        ┌────────────────┴─────────────────┐
        │                                  │
   "Pay online"                     "Pay cash"
        │                                  │
 Checkout Session                 instructions + optional
 (GCash/Maya/card/QRPh)           receipt upload (UploadThing)
        │                                  │
 PayMongo hosted page              Admin reviews proof
        │                                  │
 webhook ──┐                       Admin marks Paid
           ├──► Payment(Paid) + notification
 return ───┘
```

Rules:

1. `createDocumentRequest` creates the request and its payment in one
   transaction, with `status: "Pending"`, `method: "Cash"`, and
   `amount: totalPrice`.
2. Payment status is independent of request status. A request can be
   `Processing` or `Ready` while its payment is `Pending`.
3. Online payment is allowed while the payment is `Pending` and the request is
   not `Rejected`, `Cancelled`, or `Completed`.
4. `rejectRequest` must check for a `Paid` payment and throw before changing
   anything. Rejecting an unpaid request sets its payment to `Cancelled`.
5. `Paid` is terminal except for an admin `Refunded`.
6. Every transition is idempotent: conditional update plus notification only
   on the actual transition, so webhook retries and a webhook/return-page race
   are harmless.

## Server surface

### Files

| File | Action |
|---|---|
| `src/lib/paymongo.ts` | Create — typed REST client and signature verifier |
| `src/lib/payments.ts` | Create — shared idempotent status transitions |
| `src/lib/auth-guards.ts` | Create — `requireStudent`, `requireAdmin` |
| `src/app/(student)/dashboard/payments/actions.ts` | Create — student queries and `startOnlinePayment` |
| `src/app/(student)/dashboard/payments/page.tsx` | Replace placeholder |
| `src/app/(student)/dashboard/payments/PaymentsList.tsx` | Create — client table |
| `src/app/(student)/dashboard/payments/PaymentActions.tsx` | Create — pay/upload buttons |
| `src/app/(student)/dashboard/payments/success/page.tsx` | Create — return page |
| `src/app/(admin)/admin/payments/actions.ts` | Create — admin queries and transitions |
| `src/app/(admin)/admin/payments/page.tsx` | Replace placeholder |
| `src/app/(admin)/admin/payments/PaymentsManager.tsx` | Create — client table |
| `src/app/(admin)/admin/payments/PaymentDetailDialog.tsx` | Create — proof review and actions |
| `src/app/api/paymongo/webhook/route.ts` | Create |
| `src/app/api/uploadthing/core.ts` | Modify — ownership check on `paymentProof` |
| `src/app/(student)/dashboard/requests/actions.ts` | Modify — create payment in transaction |
| `src/app/(admin)/admin/requests/actions.ts` | Modify — block reject when paid, cancel payment |
| `src/app/(student)/dashboard/requests/RequestsList.tsx` | Modify — `Paid` badge |
| `src/lib/notifications.ts` | Modify — map payment notifications |
| `prisma/schema.prisma` | Modify — new payment fields |

The empty `src/app/api/paymongo/create-intent/` directory is removed; checkout
creation is a server action, not an API route.

### `src/lib/paymongo.ts`

A small `fetch` wrapper — no SDK dependency.

```ts
const BASE = "https://api.paymongo.com/v2";

function authHeader() {
  const key = process.env.PAYMONGO_SECRET_KEY;
  if (!key) throw new Error("PAYMONGO_SECRET_KEY is not configured");
  return `Basic ${Buffer.from(`${key}:`).toString("base64")}`;
}
```

Exports:

| Function | Behavior |
|---|---|
| `createCheckoutSession(input)` | POST `/checkout_sessions`; returns `{ id, checkoutUrl }` |
| `retrieveCheckoutSession(id)` | GET `/checkout_sessions/{id}`; returns the session |
| `verifyWebhookSignature(rawBody, header, secret)` | Parses `t`, `te`, `li`; returns `boolean` |

`createCheckoutSession` input:

```ts
{
  line_items: [
    {
      name: `${documentType.name} x${quantity}`,
      amount: payment.amount * 100,
      currency: "PHP",
      quantity: 1,
    },
  ],
  payment_method_types: ["gcash", "maya", "card", "qrph"],
  reference_number: payment.id,
  metadata: { paymentId: payment.id },
  success_url: `${baseUrl}/dashboard/payments/success?paymentId=${payment.id}`,
  cancel_url: `${baseUrl}/dashboard/payments?canceled=1`,
  description: `Document request ${payment.documentRequestId}`,
}
```

`baseUrl` comes from `NEXT_PUBLIC_BASE_URL`, with no trailing slash.

`verifyWebhookSignature`:

- Header format: `t=<timestamp>,te=<test signature>,li=<live signature>`
  (comma-separated `key=value` pairs).
- Expected signature: hex HMAC-SHA256 of `` `${t}.${rawBody}` `` using
  `PAYMONGO_WEBHOOK_SECRET`.
- Compare with `crypto.timingSafeEqual`, checking buffer lengths first.
- Use `te` when `livemode` is false, `li` when true. If the header is missing
  a value, return `false`.
- The verifier receives the raw body string, never a re-serialized object.

### `src/lib/payments.ts`

`markPaymentPaid(paymentId, details)`:

```ts
const result = await prisma.$transaction(async (tx) => {
  const updated = await tx.payment.updateMany({
    where: { id: paymentId, status: { not: "Paid" } },
    data: {
      status: "Paid",
      paidAt: details.paidAt ?? new Date(),
      paymongoPaymentId: details.paymongoPaymentId,
      paymentIntentId: details.paymentIntentId,
      paymentMethodType: details.paymentMethodType,
      method: details.method ?? "Online",
      failureReason: null,
    },
  });

  if (updated.count === 0) return false;

  const payment = await tx.payment.findUnique({
    where: { id: paymentId },
    include: {
      documentRequest: {
        include: {
          documentType: { select: { name: true } },
          user: { select: { studentProfile: { select: { id: true } } } },
        },
      },
    },
  });

  const studentProfileId = payment?.documentRequest.user.studentProfile?.id;
  if (studentProfileId) {
    await tx.notification.create({
      data: {
        studentProfileId,
        title: "Payment Received",
        message: `Your payment of ₱${payment.documentRequest.totalPrice.toLocaleString()} for ${payment.documentRequest.documentType.name} has been confirmed.`,
        type: "PAYMENT_PAID",
        relatedEntityType: "payment",
        relatedEntityId: paymentId,
      },
    });
  }

  return true;
});
```

`markPaymentFailed(paymentId, reason)` follows the same pattern: update only
when the status is `Pending`, set `failureReason`, and create a
`PAYMENT_FAILED` notification.

Both helpers return `true` only when a transition happened.

### Student actions

`getMyPayments()`:

- `requireStudent`.
- `prisma.payment.findMany({ where: { documentRequest: { userId } } })`,
  including `documentRequest.documentType`, `documentRequest`, and `uploads`.
- Order by `createdAt desc`.

`startOnlinePayment(paymentId)`:

1. `requireStudent`.
2. Load the payment with its request and document type.
3. Verify `payment.documentRequest.userId === session.user.id`; otherwise throw
   `Unauthorized`.
4. Verify the payment is `Pending` and the request status is payable.
5. If `checkoutSessionId` exists, retrieve it. If it is still `active`, return
   its `checkout_url` without creating a new session. If retrieval fails or it
   is expired, continue.
6. Create a Checkout Session (payload above).
7. Update the payment with `checkoutSessionId` and `method: "Online"`.
8. Return `{ checkoutUrl }`.

The client calls `window.location.assign(checkoutUrl)`.

### Admin actions

`getAllPayments()`:

- `requireAdmin`.
- Include request, document type, user email, student profile (name, student
  number), and proof uploads.
- Order by `createdAt desc`.

`markPaymentPaid(paymentId)`:

- `requireAdmin`.
- Allowed only from `Pending` or `Failed`.
- Calls `markPaymentPaid` from `src/lib/payments.ts` with `method: "Cash"` and
  no PayMongo ids.
- Returns `{ success: true }`.

`markPaymentRefunded(paymentId)`:

- `requireAdmin`.
- Allowed only from `Paid`.
- Updates status to `Refunded` and creates a `PAYMENT_REFUNDED` notification.
- The actual refund is performed manually in the PayMongo dashboard; the UI
  states this.

### Webhook route

`POST /api/paymongo/webhook`:

1. `const raw = await req.text()`.
2. Read `Paymongo-Signature`. If missing or invalid, return `401`.
3. If `PAYMONGO_WEBHOOK_SECRET` is missing or still the placeholder
   `whsec_your_webhook_secret_here`, log an error and return `500`. Never
   process an unverified event.
4. Parse JSON and read `data.attributes.type`.
5. `checkout_session.payment.paid`:
   - `session = data.attributes.data`.
   - `paymentId = session.attributes.metadata?.paymentId ?? session.attributes.reference_number`.
   - Load the payment. If missing, log and return `200`.
   - Find the entry in `session.attributes.payments` with `status === "paid"`.
   - Verify its `amount === payment.amount * 100` and `currency === "PHP"`.
     On mismatch, log, leave the payment `Pending`, return `200`.
   - Call `markPaymentPaid(paymentId, { paymongoPaymentId: entry.id,
     paymentIntentId: session.attributes.payment_intent?.id,
     paymentMethodType: entry.attributes.source?.type })`.
6. `payment.failed`:
   - Load the payment by `metadata.paymentId` when present; otherwise ignore.
   - Call `markPaymentFailed` with the event's failure message.
7. Unknown event types return `200`.
8. Always return a JSON body so PayMongo sees a successful delivery.

Replay safety comes from the conditional update in `markPaymentPaid`, so no
event-id table is needed in v1.

### Return page

`/dashboard/payments/success?paymentId=…` is a server component
(`searchParams` is a Promise in Next 16).

1. `requireStudent`; redirect to `/dashboard/payments` if `paymentId` is
   missing.
2. Load the payment and verify ownership.
3. If `Paid`, render the success card.
4. Otherwise, if `checkoutSessionId` exists, retrieve the session:
   - paid entry present → `markPaymentPaid`, then render success.
   - session expired → render "Checkout expired" with a retry link.
   - still active → render "We're confirming your payment" with a refresh link.
5. If retrieval fails, render the confirming state and log the error. The
   webhook still settles the payment.

No polling loop; the page can be refreshed.

## UI

### Student payments page — `/dashboard/payments`

Server page shell:

- `requireStudent`, fetch payments.
- Header: "Payments" + subtitle.
- Outstanding balance card: sum of `Pending` payments.
- If `?canceled=1`, an inline alert: "Checkout canceled — no payment was
  taken."
- Renders `<PaymentsList payments={…} />`.

`PaymentsList` (client, table like `RequestsList`):

- Segmented filter: **All / Outstanding / Paid** (default All).
- Columns: Document (name + request date), Amount, Method, Status, Action.
- Status badges: `Pending` secondary, `Paid` default, `Failed` destructive,
  `Refunded` outline, `Cancelled` outline.
- Actions for `Pending`:
  - **Pay Online** — calls `startOnlinePayment`, then redirects to PayMongo.
  - **Upload Receipt** — opens a receipt dialog (cash flow).
- `Paid` with uploads: **View Receipt** link.
- Empty state: card with credit-card icon and "No payments yet" plus a link to
  `/dashboard/requests/new`.
- Loading state: skeleton rows (matches other tables).

Receipt dialog:

- Uses the existing `UploadWithUrl` component with `endpoint="paymentProof"`.
- Extend `paymentProof`'s client input to pass `paymentId`; the endpoint's
  middleware verifies ownership.
- On upload complete, `router.refresh()` and toast "Receipt uploaded. An admin
  will verify it."
- Copy explains that uploading is optional and that cash is also accepted at
  the cashier.

### Success page

Centered card with one of three states:

| State | Content |
|---|---|
| Paid | Check icon, "Payment confirmed", amount, document name, "Back to payments" |
| Confirming | Clock icon, "We're confirming your payment", refresh button, "Back to payments" |
| Expired | Warning icon, "Checkout expired", "Try again" button to payments |

### Admin payments page — `/admin/payments`

Server page shell:

- `requireAdmin`, fetch payments.
- Header: "Payments" + subtitle "Review payments and verify cash receipts".
- Summary line: outstanding count and amount, collected this month.
- Renders `<PaymentsManager payments={…} />`.

`PaymentsManager` (client):

- Status filter: All, Pending, Paid, Failed, Refunded, Cancelled.
- Search by student name, student number, or reference number.
- Table columns: Student, Document, Amount, Method, Status, Proof, Date.
- Proof column: "View" when uploads exist, "—" otherwise.
- Row click opens `PaymentDetailDialog`.
- Empty/loading states match `/admin/requests`.

`PaymentDetailDialog`:

- Student card (name, student number, email) and a link to `/admin/requests`.
- Payment details: amount, method, status, reference, PayMongo ids when
  present, created/paid dates.
- Request details: document type, quantity, total, request status.
- Proof section: image thumbnail or PDF link for each upload; "No receipt
  uploaded" otherwise.
- Actions:
  - `Pending`/`Failed` → **Mark as Paid** (primary).
  - `Paid` → **Mark as Refunded** (destructive, confirmation dialog with copy
    explaining the manual PayMongo refund).
  - Terminal states → Close.

### Existing UI touch-ups

- `RequestsList`: map `Paid` to the default badge; keep `Failed` destructive
  and `Refunded`/`Cancelled` outline.
- `RequestDetailDialog` (admin): show the payment method/status line so an
  admin sees whether a request is paid before acting.
- `rejectRequest`: server-side guard (see lifecycle rule 4). The dialog can
  hide/disable Reject when `payment.status === "Paid"` for a clearer UX.
- Dashboard balance card and request payment badges start working
  automatically once payments are created; no component change needed.

## Notifications

| Event | Type | Message | Related entity |
|---|---|---|---|
| Payment confirmed | `PAYMENT_PAID` | "Your payment of ₱X for <document> has been confirmed." | `payment` / payment id |
| Payment failed | `PAYMENT_FAILED` | "Your payment for <document> failed. You can try again." | `payment` / payment id |
| Refund recorded | `PAYMENT_REFUNDED` | "Your payment of ₱X for <document> has been refunded." | `payment` / payment id |

`getNotificationUrl` maps `relatedEntityType === "payment"` to
`/dashboard/payments`.

Notifications are created only when a transition actually happens. If the
student profile is missing, the payment still updates and the notification is
skipped.

## Security and error handling

- The PayMongo secret key is server-only. It is never exposed to the client and
  is not prefixed with `NEXT_PUBLIC_`.
- Every student action verifies payment ownership through
  `documentRequest.userId`. Every admin action calls `requireAdmin`.
- The webhook verifies the raw-body signature with a timing-safe comparison and
  refuses to process when the secret is not configured.
- The webhook verifies amount and currency before marking a payment paid.
- `paymentProof` middleware rejects uploads whose `paymentId` does not belong
  to the signed-in user (currently it trusts the client input).
- PayMongo API errors surface as a toast ("Could not start checkout. Please
  try again.") and are logged with the payment id. The payment stays `Pending`.
- `markPaymentPaid` is idempotent, so duplicate webhooks and the return page
  cannot double-credit or double-notify.

## Environment and setup

Required in `.env.local`:

```bash
PAYMONGO_PUBLIC_KEY=pk_test_...
PAYMONGO_SECRET_KEY=sk_test_...
PAYMONGO_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

`PAYMONGO_PUBLIC_KEY` is not used by hosted checkout but stays documented for
future embedded checkout work.

Create `.env.example` (currently missing) documenting all required variables,
including these four, without real values.

Webhook registration:

1. Expose the app publicly (e.g. `cloudflared tunnel --url http://localhost:3000`
   or a deployed preview URL).
2. In PayMongo Dashboard → Developers → Webhooks, add
   `https://<public-host>/api/paymongo/webhook`.
3. Subscribe to `checkout_session.payment.paid` and `payment.failed`.
4. Copy the endpoint's signing secret into `PAYMONGO_WEBHOOK_SECRET`.
5. Use test-mode endpoints with test-mode keys; live and test secrets are
   separate.

Until the webhook is registered, the return page still confirms payments via
`retrieveCheckoutSession`. The webhook remains required for students who close
the browser before returning.

## Migration

`npx prisma migrate dev --name add_paymongo_payment_fields`, then
`npx prisma generate`.

All new columns are nullable, so existing rows are unaffected. No existing
`Payment` rows are expected (the audit found none), but if any exist with
`status = "Completed"`, backfill them to `Paid` as part of the migration.

## Testing (manual, sandbox)

1. **Request creation** — create a request; confirm one `Payment` row exists
   (`Pending`, `Cash`, correct amount), the dashboard balance shows the amount,
   and the request row shows "Cash - Pending".
2. **Online happy path** — click Pay Online; confirm redirect to PayMongo;
   pay with test card `4343434343434345`, any future expiry, CVV `123`; confirm
   the success page shows Paid and the payment becomes `Paid` with
   `paymentMethodType = "card"`.
3. **E-wallet** — repeat with GCash in test mode and confirm
   `paymentMethodType = "gcash"`.
4. **Webhook** — with a tunnel registered, confirm the webhook marks the
   payment paid even if the browser is closed before returning. Replay the
   event from the PayMongo dashboard and confirm no duplicate notification.
5. **Return fallback** — disable/unregister the webhook, pay, return, and
   confirm the success page still marks the payment paid.
6. **Amount mismatch** — send a test `checkout_session.payment.paid` with a
   different amount; confirm the payment stays `Pending` and the mismatch is
   logged.
7. **Bad signature** — POST to the webhook with a wrong signature; confirm
   `401` and no status change.
8. **Cash flow** — upload a receipt from the payments page; confirm the admin
   dialog shows it; mark Paid; confirm the student notification and status.
9. **Rejection rules** — reject an unpaid request; confirm the payment becomes
   `Cancelled`. Attempt to reject a paid request; confirm the server action
   throws and the status does not change.
10. **Authorization** — call `startOnlinePayment` with another student's
    payment id; confirm it throws. Upload a receipt with another user's
    `paymentId`; confirm the upload is rejected.
11. **Admin page** — filter by each status, search by name/number, and verify
    refund recording from `Paid`.
12. `npm run lint` and `npm run build`.

## Risks and open items

- **Webhook secret** is still a placeholder. Online payments can be tested via
  the return page, but production correctness requires registering the
  endpoint.
- **Public base URL** must be HTTPS in production. If PayMongo rejects
  `http://localhost:3000` as a `success_url` in sandbox, use the tunnel URL in
  `NEXT_PUBLIC_BASE_URL` during testing.
- **Account capabilities** determine which payment methods appear in test mode
  (GCash, Maya, cards, QRPh). The checkout request lists all four; PayMongo
  shows the enabled ones.
- **Refunds** are manual in v1. The app records the outcome, not the
  transaction.
- **Signup verification** is a separate spec. Payment eligibility is isolated
  in `startOnlinePayment` so it can be re-gated with a one-line change if
  needed.

## File summary

**Create**

- `src/lib/paymongo.ts`
- `src/lib/payments.ts`
- `src/lib/auth-guards.ts`
- `src/app/(student)/dashboard/payments/actions.ts`
- `src/app/(student)/dashboard/payments/PaymentsList.tsx`
- `src/app/(student)/dashboard/payments/PaymentActions.tsx`
- `src/app/(student)/dashboard/payments/success/page.tsx`
- `src/app/(admin)/admin/payments/actions.ts`
- `src/app/(admin)/admin/payments/PaymentsManager.tsx`
- `src/app/(admin)/admin/payments/PaymentDetailDialog.tsx`
- `src/app/api/paymongo/webhook/route.ts`
- `.env.example`

**Modify**

- `prisma/schema.prisma`
- `src/app/(student)/dashboard/payments/page.tsx`
- `src/app/(admin)/admin/payments/page.tsx`
- `src/app/(student)/dashboard/requests/actions.ts`
- `src/app/(admin)/admin/requests/actions.ts`
- `src/app/(student)/dashboard/requests/RequestsList.tsx`
- `src/app/(admin)/admin/requests/RequestDetailDialog.tsx`
- `src/app/api/uploadthing/core.ts`
- `src/lib/notifications.ts`

**Remove**

- Empty `src/app/api/paymongo/create-intent/` directory.
