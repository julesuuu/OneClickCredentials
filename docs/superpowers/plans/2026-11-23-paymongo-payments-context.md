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

- Branch: `fix/duplicate-document-requests` (leftover name from prior work — it
  contains the spec + plan commits; consider a fresh branch for implementation).
- Working tree is clean.
- Commits: `1f63534` (spec), `c6c9e0c` (spec revisions), `a7180a0` (plan).
- Nothing in the payment module is implemented yet. Existing pages are
  placeholders:
  - `src/app/(student)/dashboard/payments/page.tsx`
  - `src/app/(admin)/admin/payments/page.tsx`
- Empty directories `src/app/api/paymongo/create-intent/` and
  `src/app/api/paymongo/webhook/` exist; the plan removes `create-intent`.

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
- `UploadButton`'s `input` prop is a union of every endpoint's input type, so
  `UploadWithUrl` forwards it as `input as never`.
- Test card for sandbox: `4343434343434345`, any future expiry, CVV `123`.

## Next step

Execute the plan task by task. Recommended: subagent-driven development (fresh
subagent per task, review between tasks). Inline execution also works.

Start with Task 1 (schema + migration) and work in order — later tasks depend on
earlier ones (notably Task 4's helpers and Task 7's upload `input` prop).

Do not start a new plan or rewrite the spec unless implementation reveals a real
contradiction; if that happens, surface it before changing course.
