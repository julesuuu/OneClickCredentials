# PayMongo Payments — Session Handoff

Use this file to start a fresh session with full context. Read it first, then
read the two linked documents.

## Objective

Implement Module 4 (PayMongo payments) for OneClickCredentials:

- Every document request gets a `Payment` row at creation.
- Students pay cash (optional receipt upload, admin verifies) or online through
  PayMongo Hosted Checkout.
- Admins get a payments page to review proofs and record paid/refunded.
- In-app notifications for payment events.

## Documents (read these, in order)

1. Spec: `docs/superpowers/specs/2026-11-23-paymongo-payments-design.md`
2. Plan: `docs/superpowers/plans/2026-11-23-paymongo-payments.md`

The plan is the source of truth for implementation. It has 16 tasks, each with
exact code and a commit step. Do not redesign what the spec already decided.

## Current state

**Implementation is complete** on `feat/paymongo-payments`; only the manual
browser checks remain.

- Branch: `feat/paymongo-payments`, created from `fix/duplicate-document-requests`
  (the branch that carries the spec, plan, and handoff commits).
- Working tree is clean.
- `npx tsc --noEmit` and `npm run build` both pass.
- `npm run lint` reports two **pre-existing** errors in
  `src/app/(student)/dashboard/onboarding/page.tsx` (`prefer-const` and an
  impure call during render). They are unrelated to payments.
- Verified against the PayMongo sandbox: checkout creation (`POST
  /v2/checkout_sessions`) succeeds, and retrieval works only on
  `GET /v1/checkout_sessions/{id}` (the v2 route 404s).
- The webhook route was exercised with signed payloads: valid signature → 200,
  bad/missing signature → 401, invalid JSON → 400.
- The webhook signature verifier was unit-checked for test/live mode, tampered
  body, missing header, and wrong secret.
- `src/app/api/paymongo/create-intent/` has been removed.

## Remaining work

Run the manual checklist in Task 15 of the plan (browser, signed-in student and
admin). It has not been run because it needs real sessions:

1. Create a request; confirm the dashboard balance and the request payment badge.
2. Pay online with test card `4343434343434345`, any future expiry, CVV `123`.
3. Upload a cash receipt; verify it in the admin dialog.
4. Admin marks a cash payment paid; student notification appears.
5. Reject an unpaid request (payment becomes `Cancelled`); confirm rejecting a
   paid request and completing an unpaid request are both blocked.
6. Revisit the success URL for an already-paid payment; confirm no duplicate
   notification.
7. Optional: tunnel + real `PAYMONGO_WEBHOOK_SECRET` to test the webhook path.

## Decisions already made (do not re-litigate)

- PayMongo **Hosted Checkout Sessions** (`/v2/checkout_sessions`), not Payment
  Intents.
- Payment statuses: `Pending`, `Paid`, `Failed`, `Refunded`, `Cancelled`.
  Methods: `Cash`, `Online`.
- `Failed` is retryable; online checkout allowed from `Pending` or `Failed`.
- `confirmPaymentPaid` only transitions from `Pending`/`Failed`. It must never
  revive `Cancelled` or `Refunded`.
- Rejecting a request with `Paid` or `Refunded` payment is blocked; a
  `Pending`/`Failed` payment becomes `Cancelled` on reject.
- A request cannot be marked `Completed` unless payment is `Paid`.
- Refunds are performed manually in the PayMongo dashboard; the app only records
  `Refunded`.
- Admin actions are named `adminMarkPaymentPaid` / `adminMarkPaymentRefunded`
  to avoid colliding with the shared helper names.
- `referenceNumber` is set to the local payment id at creation.
- Webhook is the source of truth; the return page is a fallback that calls the
  same idempotent transitions. Local dev must work without a tunnel.
- Webhook handler parses JSON first to read `livemode`, then verifies the
  raw-body signature (`t` + `te`/`li`, HMAC-SHA256 over `` `${t}.${rawBody}` ``).
- Outstanding balance = `Pending` + `Failed`.
- Student verification moving to signup is a **future** change. Out of scope.

## Repo facts that bite

- No test runner. Verify with `npx tsc --noEmit`, `npm run lint`,
  `npm run build`, plus the manual checklist in Task 15.
- Prisma client is generated into `src/generated/prisma` (not
  `@prisma/client` for app imports). Use `Prisma.TransactionClient` from
  `@/generated/prisma/client` for transaction params.
- Migrations are used (`prisma/migrations`), not `db push`.
- Amounts are stored in pesos; PayMongo wants centavos (`amount * 100`), PHP.
- `.env.local` already has test PayMongo keys, but
  `PAYMONGO_WEBHOOK_SECRET=whsec_your_webhook_secret_here` is a placeholder —
  the webhook route treats that value as unconfigured.
- `UploadButton`'s props drop `input` when `endpoint` is a union, so
  `UploadWithUrl` re-types the component as `UploadButtonWithInput`.
- Checkout creation is `POST /v2/checkout_sessions`; retrieval is
  `GET /v1/checkout_sessions/{id}` (v2 retrieval 404s).
- Test card for sandbox: `4343434343434345`, any future expiry, CVV `123`.

## Next step

Implementation is done. Run the manual checklist above, then open a PR for
`feat/paymongo-payments`.

If a check fails, fix it on this branch and commit; do not start a new plan or
rewrite the spec unless a real contradiction surfaces. If one does, surface it
before changing course.
