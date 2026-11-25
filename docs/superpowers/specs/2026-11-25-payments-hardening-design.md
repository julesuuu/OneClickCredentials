# Payments Hardening

## Overview

Module 4 (PayMongo payments) is implemented on `feat/paymongo-payments`. Three
gaps remain before the module is safe to run money through:

1. **No audit trail.** Admin mark-paid and refund actions record nothing about
   who acted or why. There is no history of checkout attempts or failures.
2. **The return page trusts any paid entry.** The webhook validates the paid
   amount and currency, but `/dashboard/payments/success` does not. The two
   confirmation paths can disagree.
3. **No automated tests.** The status transitions, signature verifier, and
   amount checks are only covered by manual checks.

This spec closes those gaps with an append-only payment event log, one shared
amount validator, and a focused Vitest suite. It also fixes the two pre-existing
lint errors in the student onboarding page so `npm run lint` is clean.

**Goal:** every money-related state change is attributable, both confirmation
paths enforce the same amount rules, and the core payment logic is covered by
fast offline tests.

## Current state

- Branch: `feat/paymongo-payments`.
- `npx tsc --noEmit` and `npm run build` pass.
- `npm run lint` reports two errors in
  `src/app/(student)/dashboard/onboarding/page.tsx`:
  - `prefer-const` for `studentProfile`.
  - `react-hooks/purity` for `Date.now()` during render.
- PayMongo checkout creation uses `POST /v2/checkout_sessions`; retrieval uses
  `GET /v1/checkout_sessions/{id}`.
- The Maya identifier is `paymaya`, not `maya`.
- No test runner is configured.

## Locked decisions

| Decision | Choice |
|---|---|
| Audit scope | Payments only; no generic app-wide audit log |
| Event coverage | Full payment lifecycle, including checkout starts |
| Mismatch handling | Leave status unchanged, flag for admin review, never auto-mark paid |
| Return-page behavior | Mirror the webhook's amount/currency check |
| Test depth | Focused Vitest unit tests with mocked Prisma; no database or network |
| Admin visibility | Payment history timeline in the existing payment detail dialog |
| Notifications | Existing paid/failed/refund notifications unchanged; no new mismatch notification |
| Onboarding lint | Fix the two pre-existing errors in this pass |

## Non-goals

- A generic audit log for requests, students, or appointments.
- Automated PayMongo refunds or refund webhooks.
- Email notifications.
- Receipt upload restrictions or receipt rejection.
- Student-initiated request cancellation.
- A standalone payment history route.
- Database integration tests, browser tests, or CI workflow changes.
- Changing the existing payment status or method vocabulary.

## Data model

Add to `prisma/schema.prisma`:

```prisma
model PaymentEvent {
  id              String   @id @default(cuid())
  paymentId       String
  payment         Payment  @relation(fields: [paymentId], references: [id], onDelete: Cascade)
  type            String
  fromStatus      String?
  toStatus        String?
  amount          Int?
  actorType       String
  actorUserId     String?
  actorName       String?
  source          String
  message         String?
  metadata        Json?
  externalEventId String?  @unique
  createdAt       DateTime @default(now())

  @@index([paymentId, createdAt])
  @@map("paymentEvent")
}
```

Add to `Payment`:

```prisma
events PaymentEvent[]
```

### Field semantics

- `type` is one of `CREATED`, `CHECKOUT_STARTED`, `PAID`, `FAILED`, `REFUNDED`,
  `CANCELLED`, `AMOUNT_MISMATCH`.
- `fromStatus` and `toStatus` describe the payment status before and after the
  event. `toStatus` is null when the event does not change status.
- `amount` is the payment amount in pesos at event time. It is a snapshot, not
  a live reference.
- `actorType` is `Student`, `Admin`, `System`, or `PayMongo`.
- `actorUserId` and `actorName` are snapshots. There is deliberately no foreign
  key to `User`, so history survives user deletion.
- `source` is one of `request_created`, `student_checkout`, `webhook`,
  `return_page`, `admin`, `system`.
- `metadata` holds structured details such as checkout session IDs, PayMongo
  payment IDs, expected/received centavos, or a rejection reason.
- `externalEventId` deduplicates webhook retries and return-page refreshes.
  Values are namespaced, for example:
  - `webhook:<eventId>:paid`
  - `webhook:<eventId>:mismatch`
  - `return:<checkoutSessionId>:<paymentId>:paid`
  - `return:<checkoutSessionId>:<paymentId>:mismatch`
  - `checkout:<checkoutSessionId>`

The table is append-only. Application code never updates or deletes events.
Events cascade-delete only when the payment itself is deleted.

### Migration

Add
`prisma/migrations/20261125120000_add_payment_events/migration.sql` with the
table, unique index on `externalEventId`, composite index on
`(paymentId, createdAt)`, and the foreign key to `payment`.

The local dev database was created with `db push` and has no migration history,
so apply the SQL locally with `prisma db execute`. Do not run `prisma migrate
dev`; it would offer to reset the database. Run `npx prisma generate` afterward.

## Event recording

Create `src/lib/payment-events.ts` with:

- Event type, source, and actor type unions.
- A `PaymentActor` shape: `{ type, userId?, name? }`.
- `recordPaymentEvent(tx, input)` that writes one row with
  `createMany({ skipDuplicates: true })` inside the caller's transaction.

Every caller writes the event in the same transaction as the status change,
notification, or payment update it describes. If the event write fails, the
whole operation rolls back.

### Event wiring

| Event | Written when | Actor | Source |
|---|---|---|---|
| `CREATED` | Payment row is created with the request | Student | `request_created` |
| `CHECKOUT_STARTED` | A new PayMongo checkout session is created; not on reuse | Student | `student_checkout` |
| `PAID` | Status actually changes to `Paid` | Admin, System, or PayMongo | `admin`, `return_page`, or `webhook` |
| `FAILED` | Status actually changes to `Failed` | System or PayMongo | `return_page` or `webhook` |
| `REFUNDED` | Admin records a refund | Admin | `admin` |
| `CANCELLED` | Request rejection cancels an unpaid payment | Admin | `admin` |
| `AMOUNT_MISMATCH` | Paid amount or currency does not match | System or PayMongo | `return_page` or `webhook` |

`confirmPaymentPaid` and `confirmPaymentFailed` gain an optional context:

```ts
interface PaymentTransitionContext {
  actor?: PaymentActor;
  source?: PaymentEventSource;
  externalEventId?: string | null;
  metadata?: Prisma.InputJsonValue;
}
```

Defaults are `{ type: "System" }` and `system`. Callers pass:

- Webhook: `PayMongo` actor, `webhook` source, and the PayMongo event ID.
- Return page: `System` actor, `return_page` source, and a synthetic ID based on
  the checkout session and PayMongo payment.
- Admin actions: `Admin` actor with the signed-in admin's ID and name, `admin`
  source.

`confirmPaymentPaid` fetches the payment with its request, document type, and
student profile once. It uses that row for the status guard, amount snapshot,
notification context, and event data. `confirmPaymentFailed` does the same.

## Payment rules

Create `src/lib/payment-rules.ts` as a pure module with no Prisma or network
imports:

- `PAID_FROM = ["Pending", "Failed"]`
- `FAILED_FROM = ["Pending"]`
- `PAYABLE_PAYMENT_STATUSES = ["Pending", "Failed"]`
- `UNPAYABLE_REQUEST_STATUSES = ["Rejected", "Cancelled", "Completed"]`

Predicates:

- `canStartCheckout(paymentStatus, requestStatus)`
- `canTransitionToPaid(paymentStatus)`
- `canTransitionToFailed(paymentStatus)`
- `canRefund(paymentStatus)`
- `canCancelPayment(paymentStatus)`
- `canRejectRequest(paymentStatus)`
- `canCompleteRequest(paymentStatus)`

`canRejectRequest` returns false for `Paid` and `Refunded`, matching the current
guard. `canCompleteRequest` returns true only for `Paid`.

### Amount validation

```ts
validatePaymentAmount({
  paymentAmount, // pesos
  paidAmount,    // centavos
  currency,
}):
  | { valid: true }
  | { valid: false; reason: string }
```

Rules:

- `paymentAmount` must be a positive integer.
- `currency` must be `PHP`.
- `paidAmount` must equal `paymentAmount * 100`.
- The reason string names the expected and received values.

The webhook and the return page both call this function. Cash payments recorded
manually by an admin do not use it.

## Mismatch handling

Add `recordAmountMismatch(paymentId, input)` to `src/lib/payments.ts`. In one
transaction it:

1. Loads the payment.
2. Returns false if the payment is missing or no longer `Pending`/`Failed`.
3. Writes `failureReason` with the expected/received values, unless it is
   already identical.
4. Appends an `AMOUNT_MISMATCH` event with `fromStatus` set and `toStatus` null.

The payment status is never changed by a mismatch.

Webhook behavior:

- Validate the paid entry with `validatePaymentAmount`.
- On mismatch, call `recordAmountMismatch` with source `webhook` and a namespaced
  external event ID.
- Return HTTP 200 so PayMongo stops retrying.

Return-page behavior:

- Validate the paid entry the same way.
- On mismatch, call `recordAmountMismatch` with source `return_page`.
- Show a new **review** state instead of success.

An admin can still reconcile and mark the payment paid manually after checking
the PayMongo dashboard.

## Return page

`src/app/(student)/dashboard/payments/success/page.tsx` gains a `review` view
state and changes its confirmation logic:

- `Paid` shows the existing success state.
- `Refunded` and `Cancelled` show the existing "other" state.
- `Pending` with a checkout session is re-checked.
- `Failed` with a checkout session is also re-checked, so a successful retry is
  confirmed even if the webhook is delayed.
- `Failed` without a checkout session shows the existing failure state.
- No paid/failed entry and an active session shows "confirming".
- An expired session shows "expired".
- A failed entry records the failure and shows "failed".
- A paid entry with a valid amount records the paid transition and shows
  "paid".
- A paid entry with an invalid amount records the mismatch and shows "review".

The review state displays an amber alert with:

- Title: "Payment received — under review"
- Body: the amount or currency did not match, and an admin will review it
  before the payment is marked paid.

Refreshing the page does not create duplicate events. The paid/failed
transitions only write events when the status actually changes, and mismatch
events use stable external IDs.

## Admin payment history

`getAllPayments` includes events newest-first. The `AdminPayment` type and the
payment detail dialog gain a **History** section below Proof:

- Event type label.
- Status transition when present, for example `Pending → Paid`.
- Actor name, falling back to actor type.
- Message when present.
- Timestamp formatted as `MMM dd, yyyy • h:mm a`.
- A scrollable list so long histories do not stretch the dialog.

The existing failure-reason display stays prominent. No new route or page is
added.

## Onboarding lint fix

In `src/app/(student)/dashboard/onboarding/page.tsx`:

- Change `let studentProfile` to `const studentProfile`.
- Replace `lrn: \`temp_${session.user.id}_${Date.now()}\`` with
  `lrn: \`temp_${session.user.id}\``.

The temporary LRN stays unique because `StudentProfile.userId` is unique. The
change removes the impure `Date.now()` call during render. `birthDate: new
Date()` is unchanged.

## Test suite

Add Vitest as a dev dependency with `vitest.config.ts`:

- Node environment.
- `@` alias to `src`.
- Tests in `src/**/*.test.ts`.

Add scripts:

```json
"test": "vitest run",
"test:watch": "vitest"
```

### `src/lib/paymongo.test.ts`

- Valid test-mode signature.
- Valid live-mode signature.
- Tampered body.
- Wrong secret.
- Missing header.
- Malformed header.
- Live mode with only a test signature is rejected.

### `src/lib/payment-rules.test.ts`

- Checkout allowed from `Pending` and `Failed`.
- Checkout blocked from `Paid`, `Refunded`, and `Cancelled`.
- Checkout blocked for `Rejected`, `Cancelled`, and `Completed` requests.
- Paid transition allowed only from `Pending` and `Failed`.
- Failed transition allowed only from `Pending`.
- Refund allowed only from `Paid`.
- Cancellation allowed only from `Pending` and `Failed`.
- Reject blocked for `Paid` and `Refunded`.
- Complete allowed only for `Paid`.
- Amount validation: exact match, centavo mismatch, wrong currency, zero amount,
  negative amount, non-integer amount.

### `src/lib/payment-events.test.ts`

- Writes the expected payment ID, type, status transition, amount, actor,
  source, message, metadata, and external event ID.
- Uses `skipDuplicates: true`.

The fake transaction exposes only `paymentEvent.createMany`.

### `src/lib/payments.test.ts`

Uses a mocked `@/lib/prisma` and a fake transaction:

- Paid transition from `Pending` writes the event and notification.
- Paid transition from `Failed` writes the event and notification.
- Paid transition from `Cancelled` or `Refunded` is rejected without an update.
- Failed transition from `Pending` writes the event and notification.
- Failed transition from `Paid` is rejected.
- `updateMany` returning `count: 0` is a no-op: no event, no notification.
- The paid update guard uses `status: { in: ["Pending", "Failed"] }`.
- The failed update guard uses `status: "Pending"`.
- `recordAmountMismatch` updates `failureReason` and writes an
  `AMOUNT_MISMATCH` event without changing status.
- `recordAmountMismatch` is a no-op for `Paid`, `Refunded`, and `Cancelled`.

### Documentation

Update `AGENTS.md`:

- Replace "does not have explicit unit/integration tests configured".
- Add `npm test` and `npm run test:watch`.
- Note that tests are offline and do not need a database.

## Verification

After implementation:

1. `npx prisma generate`
2. `npm test`
3. `npx tsc --noEmit`
4. `npm run lint` (should now be clean)
5. `npm run build`
6. Manual return-page check with the PayMongo sandbox card
   `4343434343434345`, any future expiry, CVV `123`.
7. Manual admin check: open a payment with history and confirm the timeline
   renders.

The webhook route should still return 200 for valid signatures, 401 for bad or
missing signatures, and 400 for invalid JSON.
