# Payments Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an append-only payment event log, make both PayMongo confirmation paths enforce the same amount rules, and cover the core payment logic with fast offline tests.

**Architecture:** A `PaymentEvent` table records every payment lifecycle change. A pure `payment-rules.ts` module owns status predicates and amount validation, and `payments.ts` writes transitions, notifications, and events in one transaction. The webhook and return page share the validator; admin actions use the same atomic guards.

**Tech Stack:** Next.js 16, TypeScript, Prisma 7, PostgreSQL, Vitest 5.

---

**Branch:** `feat/paymongo-payments`

**Important:** The local dev database was created with `db push` and its
`_prisma_migrations` table is empty. Apply the new migration with
`prisma db execute`. Do **not** run `prisma migrate dev`; it would offer to reset
the database.

---

## File structure

| File | Responsibility |
|---|---|
| `src/lib/payment-rules.ts` | Pure status predicates and amount validation |
| `src/lib/payment-events.ts` | Event types, actor shape, external-ID builder, event writer |
| `src/lib/payments.ts` | Paid/failed transitions, mismatch flagging, notifications |
| `src/app/(student)/dashboard/requests/actions.ts` | Writes `CREATED` when the payment row is created |
| `src/app/(student)/dashboard/payments/actions.ts` | Uses checkout rules and writes `CHECKOUT_STARTED` |
| `src/app/(student)/dashboard/payments/success/page.tsx` | Validates the paid amount and shows the review state |
| `src/app/api/paymongo/webhook/route.ts` | Validates paid events and writes webhook events |
| `src/app/(admin)/admin/payments/actions.ts` | Admin paid/refund actions with actor events |
| `src/app/(admin)/admin/requests/actions.ts` | Completion/rejection guards and cancellation event |
| `src/app/(admin)/admin/payments/page.tsx` | Passes event history to the manager |
| `src/app/(admin)/admin/payments/PaymentsManager.tsx` | Admin payment view model |
| `src/app/(admin)/admin/payments/PaymentDetailDialog.tsx` | Payment history timeline |
| `prisma/schema.prisma` | `PaymentEvent` model |
| `prisma/migrations/20261125120000_add_payment_events/migration.sql` | Table/index/FK SQL |
| `vitest.config.ts` | Vitest alias and environment |
| `src/lib/*.test.ts` | Unit tests |
| `AGENTS.md` | Test commands |

---

## Task 1: Fix the onboarding lint errors

**Files:**
- Modify: `src/app/(student)/dashboard/onboarding/page.tsx`

- [ ] **Step 1: Make the profile variable const and remove `Date.now()`**

Replace the `let studentProfile` declaration with `const`:

```tsx
  const studentProfile = await prisma.studentProfile.upsert({
```

Replace the temporary LRN line:

```tsx
      lrn: `temp_${session.user.id}_${Date.now()}`,
```

with:

```tsx
      lrn: `temp_${session.user.id}`,
```

The temporary LRN remains unique because `StudentProfile.userId` is unique.

- [ ] **Step 2: Run ESLint on the file**

Run:

```bash
npx eslint "src/app/(student)/dashboard/onboarding/page.tsx"
```

Expected: no output, exit code 0.

- [ ] **Step 3: Commit the isolated lint fix**

```bash
git add "src/app/(student)/dashboard/onboarding/page.tsx"
git commit -m "fix(onboarding): remove impure render call"
```

---

## Task 2: Add Vitest and webhook signature tests

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`
- Create: `src/lib/paymongo.test.ts`
- Modify: `AGENTS.md`

- [ ] **Step 1: Install Vitest**

Run:

```bash
npm install --save-dev vitest@^5.1.2
```

- [ ] **Step 2: Add test scripts**

In `package.json`, add these scripts after `"lint": "eslint"`:

```json
    "test": "vitest run",
    "test:watch": "vitest",
```

- [ ] **Step 3: Create the Vitest config**

Create `vitest.config.ts`:

```ts
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
```

- [ ] **Step 4: Write the signature tests**

Create `src/lib/paymongo.test.ts`:

```ts
import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { verifyWebhookSignature } from "./paymongo";

const SECRET = "whsec_test_secret";
const BODY = JSON.stringify({ data: { id: "evt_1" } });

function sign(
  body: string,
  secret: string,
  timestamp = "1700000000",
): string {
  return createHmac("sha256", secret)
    .update(`${timestamp}.${body}`)
    .digest("hex");
}

describe("verifyWebhookSignature", () => {
  it("accepts a valid test-mode signature", () => {
    const timestamp = "1700000000";
    const header = `t=${timestamp},te=${sign(BODY, SECRET, timestamp)}`;

    expect(verifyWebhookSignature(BODY, header, SECRET, false)).toBe(true);
  });

  it("accepts a valid live-mode signature", () => {
    const timestamp = "1700000000";
    const header = `t=${timestamp},li=${sign(BODY, SECRET, timestamp)}`;

    expect(verifyWebhookSignature(BODY, header, SECRET, true)).toBe(true);
  });

  it("rejects a tampered body", () => {
    const timestamp = "1700000000";
    const header = `t=${timestamp},te=${sign(BODY, SECRET, timestamp)}`;

    expect(verifyWebhookSignature(`${BODY} `, header, SECRET, false)).toBe(
      false,
    );
  });

  it("rejects the wrong secret", () => {
    const timestamp = "1700000000";
    const header = `t=${timestamp},te=${sign(BODY, "wrong-secret", timestamp)}`;

    expect(verifyWebhookSignature(BODY, header, SECRET, false)).toBe(false);
  });

  it("rejects a missing header", () => {
    expect(verifyWebhookSignature(BODY, null, SECRET, false)).toBe(false);
  });

  it("rejects a malformed header", () => {
    expect(
      verifyWebhookSignature(BODY, "not-a-signature", SECRET, false),
    ).toBe(false);
  });

  it("rejects a test signature in live mode", () => {
    const timestamp = "1700000000";
    const header = `t=${timestamp},te=${sign(BODY, SECRET, timestamp)}`;

    expect(verifyWebhookSignature(BODY, header, SECRET, true)).toBe(false);
  });
});
```

- [ ] **Step 5: Run the signature tests**

Run:

```bash
npx vitest run src/lib/paymongo.test.ts
```

Expected: 7 tests pass.

- [ ] **Step 6: Update `AGENTS.md`**

Under **Build/Lint/Test Commands**, add:

```markdown
- `npm test` - Run Vitest unit tests
- `npm run test:watch` - Run Vitest in watch mode
```

Replace the **Testing** paragraph:

```markdown
### Testing

- `npm test` - Run Vitest unit tests (offline; no database required)
- `npm run test:watch` - Run Vitest in watch mode

Use manual testing and Next.js dev server checks for UI flows.
```

- [ ] **Step 7: Run the full test suite and lint the new files**

```bash
npm test
npx eslint vitest.config.ts src/lib/paymongo.test.ts
```

Expected: tests pass; ESLint reports no errors.

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json vitest.config.ts src/lib/paymongo.test.ts AGENTS.md
git commit -m "test: add vitest and cover webhook signatures"
```

---

## Task 3: Add pure payment rules and amount validation

**Files:**
- Create: `src/lib/payment-rules.ts`
- Create: `src/lib/payment-rules.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/lib/payment-rules.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  canCancelPayment,
  canCompleteRequest,
  canRefund,
  canRejectRequest,
  canStartCheckout,
  canTransitionToFailed,
  canTransitionToPaid,
  validatePaymentAmount,
} from "./payment-rules";

describe("canStartCheckout", () => {
  it.each(["Pending", "Failed"])("allows a %s payment", (status) => {
    expect(canStartCheckout(status, "Pending")).toBe(true);
  });

  it.each(["Paid", "Refunded", "Cancelled"])(
    "blocks a %s payment",
    (status) => {
      expect(canStartCheckout(status, "Pending")).toBe(false);
    },
  );

  it.each(["Rejected", "Cancelled", "Completed"])(
    "blocks a %s request",
    (status) => {
      expect(canStartCheckout("Pending", status)).toBe(false);
    },
  );
});

describe("payment transitions", () => {
  it.each(["Pending", "Failed"])("allows paid from %s", (status) => {
    expect(canTransitionToPaid(status)).toBe(true);
  });

  it.each(["Paid", "Refunded", "Cancelled"])(
    "blocks paid from %s",
    (status) => {
      expect(canTransitionToPaid(status)).toBe(false);
    },
  );

  it("allows failed only from Pending", () => {
    expect(canTransitionToFailed("Pending")).toBe(true);
    expect(canTransitionToFailed("Failed")).toBe(false);
    expect(canTransitionToFailed("Paid")).toBe(false);
  });

  it("allows refund only from Paid", () => {
    expect(canRefund("Paid")).toBe(true);
    expect(canRefund("Pending")).toBe(false);
  });

  it("allows cancellation only from Pending or Failed", () => {
    expect(canCancelPayment("Pending")).toBe(true);
    expect(canCancelPayment("Failed")).toBe(true);
    expect(canCancelPayment("Paid")).toBe(false);
  });
});

describe("request guards", () => {
  it("blocks rejection only for paid or refunded payments", () => {
    expect(canRejectRequest(null)).toBe(true);
    expect(canRejectRequest("Pending")).toBe(true);
    expect(canRejectRequest("Failed")).toBe(true);
    expect(canRejectRequest("Paid")).toBe(false);
    expect(canRejectRequest("Refunded")).toBe(false);
  });

  it("allows completion only when paid", () => {
    expect(canCompleteRequest("Paid")).toBe(true);
    expect(canCompleteRequest("Pending")).toBe(false);
    expect(canCompleteRequest(null)).toBe(false);
  });
});

describe("validatePaymentAmount", () => {
  it("accepts an exact PHP amount", () => {
    expect(
      validatePaymentAmount({
        paymentAmount: 100,
        paidAmount: 10000,
        currency: "PHP",
      }),
    ).toEqual({ valid: true });
  });

  it("rejects a centavo mismatch", () => {
    expect(
      validatePaymentAmount({
        paymentAmount: 100,
        paidAmount: 9999,
        currency: "PHP",
      }),
    ).toEqual({
      valid: false,
      reason:
        "Amount mismatch: expected 10000 centavos (PHP), received 9999 PHP",
    });
  });

  it("rejects a non-PHP currency", () => {
    expect(
      validatePaymentAmount({
        paymentAmount: 100,
        paidAmount: 10000,
        currency: "USD",
      }),
    ).toEqual({
      valid: false,
      reason: "Unexpected currency: expected PHP, received USD",
    });
  });

  it.each([0, -100, 10.5])("rejects an invalid peso amount: %s", (amount) => {
    expect(
      validatePaymentAmount({
        paymentAmount: amount,
        paidAmount: 10000,
        currency: "PHP",
      }),
    ).toEqual({
      valid: false,
      reason: "Payment amount must be a positive integer",
    });
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run:

```bash
npx vitest run src/lib/payment-rules.test.ts
```

Expected: FAIL because `./payment-rules` does not exist.

- [ ] **Step 3: Implement the rules module**

Create `src/lib/payment-rules.ts`:

```ts
export const PAID_FROM = ["Pending", "Failed"] as const;
export const FAILED_FROM = ["Pending"] as const;
export const PAYABLE_PAYMENT_STATUSES = ["Pending", "Failed"] as const;
export const UNPAYABLE_REQUEST_STATUSES = [
  "Rejected",
  "Cancelled",
  "Completed",
] as const;

function includesStatus(
  statuses: readonly string[],
  status: string,
): boolean {
  return statuses.includes(status);
}

export function canStartCheckout(
  paymentStatus: string,
  requestStatus: string,
): boolean {
  return (
    includesStatus(PAYABLE_PAYMENT_STATUSES, paymentStatus) &&
    !includesStatus(UNPAYABLE_REQUEST_STATUSES, requestStatus)
  );
}

export function canTransitionToPaid(paymentStatus: string): boolean {
  return includesStatus(PAID_FROM, paymentStatus);
}

export function canTransitionToFailed(paymentStatus: string): boolean {
  return includesStatus(FAILED_FROM, paymentStatus);
}

export function canRefund(paymentStatus: string): boolean {
  return paymentStatus === "Paid";
}

export function canCancelPayment(paymentStatus: string): boolean {
  return includesStatus(PAYABLE_PAYMENT_STATUSES, paymentStatus);
}

export function canRejectRequest(
  paymentStatus: string | null | undefined,
): boolean {
  return paymentStatus !== "Paid" && paymentStatus !== "Refunded";
}

export function canCompleteRequest(
  paymentStatus: string | null | undefined,
): boolean {
  return paymentStatus === "Paid";
}

export interface AmountValidationInput {
  paymentAmount: number;
  paidAmount: number;
  currency: string;
}

export type AmountValidationResult =
  | { valid: true }
  | { valid: false; reason: string };

export function validatePaymentAmount(
  input: AmountValidationInput,
): AmountValidationResult {
  const { paymentAmount, paidAmount, currency } = input;

  if (!Number.isInteger(paymentAmount) || paymentAmount <= 0) {
    return {
      valid: false,
      reason: "Payment amount must be a positive integer",
    };
  }

  if (currency !== "PHP") {
    return {
      valid: false,
      reason: `Unexpected currency: expected PHP, received ${currency}`,
    };
  }

  const expected = paymentAmount * 100;

  if (paidAmount !== expected) {
    return {
      valid: false,
      reason: `Amount mismatch: expected ${expected} centavos (PHP), received ${paidAmount} ${currency}`,
    };
  }

  return { valid: true };
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run:

```bash
npx vitest run src/lib/payment-rules.test.ts
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/payment-rules.ts src/lib/payment-rules.test.ts
git commit -m "feat(payments): add shared payment rules"
```

---

## Task 4: Add the PaymentEvent schema and migration

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/20261125120000_add_payment_events/migration.sql`

- [ ] **Step 1: Add the model and relation**

In `prisma/schema.prisma`, add `events PaymentEvent[]` to `Payment`:

```prisma
model Payment {
  id                String          @id @default(cuid())
  documentRequestId String          @unique
  documentRequest   DocumentRequest @relation(fields: [documentRequestId], references: [id], onDelete: Cascade)
  method            String          @default("Cash")
  referenceNumber   String?
  amount            Int
  status            String          @default("Pending")
  checkoutSessionId String?  @unique
  paymentIntentId   String?
  paymongoPaymentId String?  @unique
  paymentMethodType String?
  paidAt            DateTime?
  failureReason     String?
  createdAt         DateTime        @default(now())
  updatedAt         DateTime        @updatedAt

  uploads            Upload[]
  events             PaymentEvent[]

  @@map("payment")
}
```

Add the new model after `Payment`:

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

- [ ] **Step 2: Create the migration SQL**

Create `prisma/migrations/20261125120000_add_payment_events/migration.sql`:

```sql
-- CreateTable
CREATE TABLE "paymentEvent" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "fromStatus" TEXT,
    "toStatus" TEXT,
    "amount" INTEGER,
    "actorType" TEXT NOT NULL,
    "actorUserId" TEXT,
    "actorName" TEXT,
    "source" TEXT NOT NULL,
    "message" TEXT,
    "metadata" JSONB,
    "externalEventId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "paymentEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "paymentEvent_externalEventId_key" ON "paymentEvent"("externalEventId");

-- CreateIndex
CREATE INDEX "paymentEvent_paymentId_createdAt_idx" ON "paymentEvent"("paymentId", "createdAt");

-- AddForeignKey
ALTER TABLE "paymentEvent" ADD CONSTRAINT "paymentEvent_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
```

- [ ] **Step 3: Validate the schema and generate the client**

```bash
npx prisma validate
npx prisma generate
```

Expected: schema valid; Prisma client generated.

- [ ] **Step 4: Apply the migration to the local dev database**

```bash
npx prisma db execute --file prisma/migrations/20261125120000_add_payment_events/migration.sql
```

Expected: command succeeds. Do not run `prisma migrate dev`.

- [ ] **Step 5: Type-check**

```bash
npx tsc --noEmit
```

Expected: exit code 0.

- [ ] **Step 6: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/20261125120000_add_payment_events/migration.sql
git commit -m "feat(payments): add payment event model"
```

---

## Task 5: Add the event writer and external-ID builder

**Files:**
- Create: `src/lib/payment-events.ts`
- Create: `src/lib/payment-events.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/lib/payment-events.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";
import {
  buildExternalEventId,
  recordPaymentEvent,
  type RecordPaymentEventInput,
} from "./payment-events";

describe("buildExternalEventId", () => {
  it("builds a webhook key", () => {
    expect(buildExternalEventId("webhook", "evt_1", "paid")).toBe(
      "webhook:evt_1:paid",
    );
  });

  it("builds a return key with session and payment", () => {
    expect(
      buildExternalEventId("return", "cs_1:pay_1", "mismatch"),
    ).toBe("return:cs_1:pay_1:mismatch");
  });

  it("builds a checkout key without a suffix", () => {
    expect(buildExternalEventId("checkout", "cs_1")).toBe("checkout:cs_1");
  });
});

describe("recordPaymentEvent", () => {
  it("writes the event with actor snapshots and skipDuplicates", async () => {
    const createMany = vi.fn().mockResolvedValue({ count: 1 });
    const tx = {
      paymentEvent: { createMany },
    } as unknown as Parameters<typeof recordPaymentEvent>[0];

    const input: RecordPaymentEventInput = {
      paymentId: "pay_1",
      type: "PAID",
      fromStatus: "Pending",
      toStatus: "Paid",
      amount: 100,
      actor: { type: "PayMongo", userId: null, name: null },
      source: "webhook",
      message: "Payment confirmed.",
      metadata: { checkoutSessionId: "cs_1" },
      externalEventId: "webhook:evt_1:paid",
    };

    await recordPaymentEvent(tx, input);

    expect(createMany).toHaveBeenCalledWith({
      data: [
        {
          paymentId: "pay_1",
          type: "PAID",
          fromStatus: "Pending",
          toStatus: "Paid",
          amount: 100,
          actorType: "PayMongo",
          actorUserId: null,
          actorName: null,
          source: "webhook",
          message: "Payment confirmed.",
          metadata: { checkoutSessionId: "cs_1" },
          externalEventId: "webhook:evt_1:paid",
        },
      ],
      skipDuplicates: true,
    });
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

```bash
npx vitest run src/lib/payment-events.test.ts
```

Expected: FAIL because `./payment-events` does not exist.

- [ ] **Step 3: Implement the event module**

Create `src/lib/payment-events.ts`:

```ts
import type { Prisma } from "@/generated/prisma/client";

export const PAYMENT_EVENT_TYPES = [
  "CREATED",
  "CHECKOUT_STARTED",
  "PAID",
  "FAILED",
  "REFUNDED",
  "CANCELLED",
  "AMOUNT_MISMATCH",
] as const;

export type PaymentEventType = (typeof PAYMENT_EVENT_TYPES)[number];

export const PAYMENT_EVENT_SOURCES = [
  "request_created",
  "student_checkout",
  "webhook",
  "return_page",
  "admin",
  "system",
] as const;

export type PaymentEventSource = (typeof PAYMENT_EVENT_SOURCES)[number];

export type PaymentActorType = "Student" | "Admin" | "System" | "PayMongo";

export interface PaymentActor {
  type: PaymentActorType;
  userId?: string | null;
  name?: string | null;
}

export interface RecordPaymentEventInput {
  paymentId: string;
  type: PaymentEventType;
  fromStatus?: string | null;
  toStatus?: string | null;
  amount?: number | null;
  actor: PaymentActor;
  source: PaymentEventSource;
  message?: string | null;
  metadata?: Prisma.InputJsonValue;
  externalEventId?: string | null;
}

export type ExternalEventNamespace = "webhook" | "return" | "checkout";

export function buildExternalEventId(
  namespace: ExternalEventNamespace,
  reference: string,
  suffix?: "paid" | "failed" | "mismatch",
): string {
  return [namespace, reference, suffix].filter(Boolean).join(":");
}

export async function recordPaymentEvent(
  tx: Prisma.TransactionClient,
  input: RecordPaymentEventInput,
): Promise<void> {
  await tx.paymentEvent.createMany({
    data: [
      {
        paymentId: input.paymentId,
        type: input.type,
        fromStatus: input.fromStatus ?? null,
        toStatus: input.toStatus ?? null,
        amount: input.amount ?? null,
        actorType: input.actor.type,
        actorUserId: input.actor.userId ?? null,
        actorName: input.actor.name ?? null,
        source: input.source,
        message: input.message ?? null,
        metadata: input.metadata,
        externalEventId: input.externalEventId ?? null,
      },
    ],
    skipDuplicates: true,
  });
}
```

- [ ] **Step 4: Run the tests to verify they pass**

```bash
npx vitest run src/lib/payment-events.test.ts
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/payment-events.ts src/lib/payment-events.test.ts
git commit -m "feat(payments): add payment event writer"
```

---

## Task 6: Rewrite payment transitions with guards and events

**Files:**
- Modify: `src/lib/payments.ts`
- Create: `src/lib/payments.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/lib/payments.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";
import prisma from "@/lib/prisma";
import {
  confirmPaymentFailed,
  confirmPaymentPaid,
  recordAmountMismatch,
} from "./payments";

vi.mock("@/lib/prisma", () => ({
  default: {
    $transaction: vi.fn(),
  },
}));

interface FakeTransaction {
  payment: {
    findUnique: ReturnType<typeof vi.fn>;
    updateMany: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
  notification: {
    create: ReturnType<typeof vi.fn>;
  };
  paymentEvent: {
    createMany: ReturnType<typeof vi.fn>;
  };
}

function makeTransaction(): FakeTransaction {
  return {
    payment: {
      findUnique: vi.fn(),
      updateMany: vi.fn(),
      update: vi.fn(),
    },
    notification: { create: vi.fn() },
    paymentEvent: { createMany: vi.fn() },
  };
}

const transactionMock = prisma.$transaction as unknown as ReturnType<
  typeof vi.fn
>;

function useTransaction(tx: FakeTransaction) {
  transactionMock.mockImplementation(
    async (callback: (transaction: FakeTransaction) => Promise<unknown>) =>
      callback(tx),
  );
}

const paymentRow = {
  status: "Pending",
  amount: 100,
  documentRequest: {
    documentType: { name: "Transcript" },
    user: { studentProfile: { id: "sp_1" } },
  },
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("confirmPaymentPaid", () => {
  it("writes the paid event and notification", async () => {
    const tx = makeTransaction();
    tx.payment.findUnique.mockResolvedValue(paymentRow);
    tx.payment.updateMany.mockResolvedValue({ count: 1 });
    useTransaction(tx);

    await expect(
      confirmPaymentPaid(
        "pay_1",
        { paymongoPaymentId: "paymongo_1" },
        {
          actor: { type: "PayMongo" },
          source: "webhook",
          externalEventId: "webhook:evt_1:paid",
          message: "Payment confirmed.",
          metadata: { checkoutSessionId: "cs_1" },
        },
      ),
    ).resolves.toBe(true);

    expect(tx.payment.findUnique).toHaveBeenCalledWith({
      where: { id: "pay_1" },
      select: expect.any(Object),
    });
    expect(tx.payment.updateMany).toHaveBeenCalledWith({
      where: { id: "pay_1", status: { in: ["Pending", "Failed"] } },
      data: expect.objectContaining({
        status: "Paid",
        paymongoPaymentId: "paymongo_1",
        failureReason: null,
      }),
    });
    expect(tx.notification.create).toHaveBeenCalledTimes(1);
    expect(tx.paymentEvent.createMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({
          paymentId: "pay_1",
          type: "PAID",
          fromStatus: "Pending",
          toStatus: "Paid",
          amount: 100,
          actorType: "PayMongo",
          source: "webhook",
          message: "Payment confirmed.",
          externalEventId: "webhook:evt_1:paid",
        }),
      ],
      skipDuplicates: true,
    });
  });

  it("pre-fetches snapshots before the atomic update", async () => {
    const tx = makeTransaction();
    tx.payment.findUnique.mockResolvedValue(paymentRow);
    tx.payment.updateMany.mockResolvedValue({ count: 1 });
    useTransaction(tx);

    await confirmPaymentPaid("pay_1");

    expect(
      tx.payment.findUnique.mock.invocationCallOrder[0],
    ).toBeLessThan(tx.payment.updateMany.mock.invocationCallOrder[0]);
  });

  it("is a no-op when the atomic guard updates nothing", async () => {
    const tx = makeTransaction();
    tx.payment.findUnique.mockResolvedValue(paymentRow);
    tx.payment.updateMany.mockResolvedValue({ count: 0 });
    useTransaction(tx);

    await expect(confirmPaymentPaid("pay_1")).resolves.toBe(false);

    expect(tx.notification.create).not.toHaveBeenCalled();
    expect(tx.paymentEvent.createMany).not.toHaveBeenCalled();
  });

  it("writes the paid event when recovering a failed payment", async () => {
    const tx = makeTransaction();
    tx.payment.findUnique.mockResolvedValue({
      ...paymentRow,
      status: "Failed",
    });
    tx.payment.updateMany.mockResolvedValue({ count: 1 });
    useTransaction(tx);

    await expect(confirmPaymentPaid("pay_1")).resolves.toBe(true);

    expect(tx.payment.updateMany).toHaveBeenCalledWith({
      where: { id: "pay_1", status: { in: ["Pending", "Failed"] } },
      data: expect.objectContaining({ status: "Paid" }),
    });
    expect(tx.paymentEvent.createMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({
          type: "PAID",
          fromStatus: "Failed",
          toStatus: "Paid",
        }),
      ],
      skipDuplicates: true,
    });
  });

  it.each(["Cancelled", "Refunded"])(
    "does not revive a %s payment",
    async (status) => {
      const tx = makeTransaction();
      tx.payment.findUnique.mockResolvedValue({
        ...paymentRow,
        status,
      });
      useTransaction(tx);

      await expect(confirmPaymentPaid("pay_1")).resolves.toBe(false);
      expect(tx.payment.updateMany).not.toHaveBeenCalled();
    },
  );
});

describe("confirmPaymentFailed", () => {
  it("writes the failed event and notification", async () => {
    const tx = makeTransaction();
    tx.payment.findUnique.mockResolvedValue(paymentRow);
    tx.payment.updateMany.mockResolvedValue({ count: 1 });
    useTransaction(tx);

    await expect(
      confirmPaymentFailed("pay_1", "Card declined", {
        actor: { type: "PayMongo" },
        source: "webhook",
        externalEventId: "webhook:evt_2:failed",
      }),
    ).resolves.toBe(true);

    expect(tx.payment.updateMany).toHaveBeenCalledWith({
      where: { id: "pay_1", status: "Pending" },
      data: { status: "Failed", failureReason: "Card declined" },
    });
    expect(tx.notification.create).toHaveBeenCalledTimes(1);
    expect(tx.paymentEvent.createMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({
          type: "FAILED",
          fromStatus: "Pending",
          toStatus: "Failed",
          message: "Card declined",
          externalEventId: "webhook:evt_2:failed",
        }),
      ],
      skipDuplicates: true,
    });
  });

  it("does not fail a paid payment", async () => {
    const tx = makeTransaction();
    tx.payment.findUnique.mockResolvedValue({
      ...paymentRow,
      status: "Paid",
    });
    useTransaction(tx);

    await expect(confirmPaymentFailed("pay_1")).resolves.toBe(false);
    expect(tx.payment.updateMany).not.toHaveBeenCalled();
  });
});

describe("recordAmountMismatch", () => {
  it("flags a mismatch without changing status", async () => {
    const tx = makeTransaction();
    tx.payment.findUnique.mockResolvedValue({
      status: "Pending",
      amount: 100,
      failureReason: null,
    });
    tx.payment.update.mockResolvedValue({});
    useTransaction(tx);

    await expect(
      recordAmountMismatch("pay_1", {
        expectedCentavos: 10000,
        receivedCentavos: 9999,
        currency: "PHP",
        source: "webhook",
        externalEventId: "webhook:evt_3:mismatch",
      }),
    ).resolves.toBe(true);

    expect(tx.payment.update).toHaveBeenCalledWith({
      where: { id: "pay_1" },
      data: {
        failureReason:
          "Amount mismatch: expected 10000 centavos (PHP), received 9999 PHP",
      },
    });
    expect(tx.paymentEvent.createMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({
          type: "AMOUNT_MISMATCH",
          fromStatus: "Pending",
          toStatus: null,
          source: "webhook",
          actorType: "PayMongo",
          externalEventId: "webhook:evt_3:mismatch",
        }),
      ],
      skipDuplicates: true,
    });
  });

  it.each(["Paid", "Refunded", "Cancelled"])(
    "does not flag a %s payment",
    async (status) => {
      const tx = makeTransaction();
      tx.payment.findUnique.mockResolvedValue({
        status,
        amount: 100,
        failureReason: null,
      });
      useTransaction(tx);

      await expect(
        recordAmountMismatch("pay_1", {
          expectedCentavos: 10000,
          receivedCentavos: 9999,
          currency: "PHP",
          source: "webhook",
          externalEventId: "webhook:evt_4:mismatch",
        }),
      ).resolves.toBe(false);

      expect(tx.payment.update).not.toHaveBeenCalled();
      expect(tx.paymentEvent.createMany).not.toHaveBeenCalled();
    },
  );
});
```

- [ ] **Step 2: Run the tests to verify they fail**

```bash
npx vitest run src/lib/payments.test.ts
```

Expected: FAIL because the new context parameters and mismatch function do not exist.

- [ ] **Step 3: Replace `src/lib/payments.ts`**

```ts
import type { Prisma } from "@/generated/prisma/client";
import prisma from "@/lib/prisma";
import {
  canTransitionToFailed,
  canTransitionToPaid,
  PAYABLE_PAYMENT_STATUSES,
} from "@/lib/payment-rules";
import {
  recordPaymentEvent,
  type PaymentActor,
  type PaymentEventSource,
} from "@/lib/payment-events";

interface ConfirmPaidInput {
  paymongoPaymentId?: string | null;
  paymentIntentId?: string | null;
  paymentMethodType?: string | null;
  method?: "Cash" | "Online";
  paidAt?: Date;
}

export interface PaymentTransitionContext {
  actor?: PaymentActor;
  source?: PaymentEventSource;
  externalEventId?: string | null;
  message?: string | null;
  metadata?: Prisma.InputJsonValue;
}

export interface AmountMismatchInput {
  expectedCentavos: number;
  receivedCentavos: number;
  currency: string;
  source: "webhook" | "return_page";
  externalEventId: string;
  metadata?: Prisma.InputJsonValue;
}

const paymentContextSelect = {
  status: true,
  amount: true,
  documentRequest: {
    select: {
      documentType: { select: { name: true } },
      user: { select: { studentProfile: { select: { id: true } } } },
    },
  },
} satisfies Prisma.PaymentSelect;

async function getPaymentContext(
  tx: Prisma.TransactionClient,
  paymentId: string,
) {
  return tx.payment.findUnique({
    where: { id: paymentId },
    select: paymentContextSelect,
  });
}

export async function confirmPaymentPaid(
  paymentId: string,
  details: ConfirmPaidInput = {},
  context: PaymentTransitionContext = {},
): Promise<boolean> {
  return prisma.$transaction(async (tx) => {
    const payment = await getPaymentContext(tx, paymentId);

    if (!payment || !canTransitionToPaid(payment.status)) {
      return false;
    }

    const updated = await tx.payment.updateMany({
      where: { id: paymentId, status: { in: ["Pending", "Failed"] } },
      data: {
        status: "Paid",
        paidAt: details.paidAt ?? new Date(),
        paymongoPaymentId: details.paymongoPaymentId ?? undefined,
        paymentIntentId: details.paymentIntentId ?? undefined,
        paymentMethodType: details.paymentMethodType ?? undefined,
        method: details.method ?? "Online",
        failureReason: null,
      },
    });

    if (updated.count === 0) {
      return false;
    }

    const studentProfileId =
      payment.documentRequest.user.studentProfile?.id ?? null;

    if (studentProfileId) {
      await tx.notification.create({
        data: {
          studentProfileId,
          title: "Payment Received",
          message: `Your payment of ₱${payment.amount.toLocaleString()} for ${payment.documentRequest.documentType.name} has been confirmed.`,
          type: "PAYMENT_PAID",
          relatedEntityType: "payment",
          relatedEntityId: paymentId,
        },
      });
    }

    await recordPaymentEvent(tx, {
      paymentId,
      type: "PAID",
      fromStatus: payment.status,
      toStatus: "Paid",
      amount: payment.amount,
      actor: context.actor ?? { type: "System" },
      source: context.source ?? "system",
      message: context.message ?? "Payment confirmed.",
      metadata: context.metadata,
      externalEventId: context.externalEventId ?? null,
    });

    return true;
  });
}

export async function confirmPaymentFailed(
  paymentId: string,
  reason?: string | null,
  context: PaymentTransitionContext = {},
): Promise<boolean> {
  return prisma.$transaction(async (tx) => {
    const payment = await getPaymentContext(tx, paymentId);

    if (!payment || !canTransitionToFailed(payment.status)) {
      return false;
    }

    const failureReason = reason ?? "Payment failed";

    const updated = await tx.payment.updateMany({
      where: { id: paymentId, status: "Pending" },
      data: {
        status: "Failed",
        failureReason,
      },
    });

    if (updated.count === 0) {
      return false;
    }

    const studentProfileId =
      payment.documentRequest.user.studentProfile?.id ?? null;

    if (studentProfileId) {
      await tx.notification.create({
        data: {
          studentProfileId,
          title: "Payment Failed",
          message: `Your payment for ${payment.documentRequest.documentType.name} failed. You can try again.`,
          type: "PAYMENT_FAILED",
          relatedEntityType: "payment",
          relatedEntityId: paymentId,
        },
      });
    }

    await recordPaymentEvent(tx, {
      paymentId,
      type: "FAILED",
      fromStatus: payment.status,
      toStatus: "Failed",
      amount: payment.amount,
      actor: context.actor ?? { type: "System" },
      source: context.source ?? "system",
      message: context.message ?? failureReason,
      metadata: context.metadata,
      externalEventId: context.externalEventId ?? null,
    });

    return true;
  });
}

export async function recordAmountMismatch(
  paymentId: string,
  input: AmountMismatchInput,
): Promise<boolean> {
  return prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({
      where: { id: paymentId },
      select: { status: true, amount: true, failureReason: true },
    });

    if (
      !payment ||
      !(PAYABLE_PAYMENT_STATUSES as readonly string[]).includes(
        payment.status,
      )
    ) {
      return false;
    }

    const reason = `Amount mismatch: expected ${input.expectedCentavos} centavos (PHP), received ${input.receivedCentavos} ${input.currency}`;

    if (payment.failureReason !== reason) {
      await tx.payment.update({
        where: { id: paymentId },
        data: { failureReason: reason },
      });
    }

    await recordPaymentEvent(tx, {
      paymentId,
      type: "AMOUNT_MISMATCH",
      fromStatus: payment.status,
      toStatus: null,
      amount: payment.amount,
      actor: {
        type: input.source === "webhook" ? "PayMongo" : "System",
      },
      source: input.source,
      message: reason,
      metadata: input.metadata,
      externalEventId: input.externalEventId,
    });

    return true;
  });
}
```

- [ ] **Step 4: Run the tests to verify they pass**

```bash
npx vitest run src/lib/payments.test.ts
```

Expected: all tests pass.

- [ ] **Step 5: Type-check and lint**

```bash
npx tsc --noEmit
npx eslint src/lib/payments.ts src/lib/payments.test.ts
```

Expected: exit code 0.

- [ ] **Step 6: Commit**

```bash
git add src/lib/payments.ts src/lib/payments.test.ts
git commit -m "feat(payments): log payment transitions"
```

---

## Task 7: Write creation and checkout events

**Files:**
- Modify: `src/app/(student)/dashboard/requests/actions.ts`
- Modify: `src/app/(student)/dashboard/payments/actions.ts`

- [ ] **Step 1: Add the `CREATED` event**

In `src/app/(student)/dashboard/requests/actions.ts`, add the import:

```ts
import { recordPaymentEvent } from "@/lib/payment-events";
```

In the transaction, after the reference-number update:

```ts
    await tx.payment.update({
      where: { id: payment.id },
      data: { referenceNumber: payment.id },
    });

    await recordPaymentEvent(tx, {
      paymentId: payment.id,
      type: "CREATED",
      fromStatus: null,
      toStatus: "Pending",
      amount: payment.amount,
      actor: {
        type: "Student",
        userId: session.user.id,
        name: session.user.name ?? session.user.email,
      },
      source: "request_created",
      message: "Payment created with document request.",
    });
```

- [ ] **Step 2: Use the checkout rule and write `CHECKOUT_STARTED`**

In `src/app/(student)/dashboard/payments/actions.ts`, add imports:

```ts
import { canStartCheckout } from "@/lib/payment-rules";
import {
  buildExternalEventId,
  recordPaymentEvent,
} from "@/lib/payment-events";
```

Replace the two inline status checks:

```ts
  if (!["Pending", "Failed"].includes(payment.status)) {
    throw new Error("This payment is no longer payable.");
  }

  if (
    ["Rejected", "Cancelled", "Completed"].includes(
      payment.documentRequest.status,
    )
  ) {
    throw new Error("This request is no longer payable.");
  }
```

with:

```ts
  if (!canStartCheckout(payment.status, payment.documentRequest.status)) {
    throw new Error("This payment is no longer payable.");
  }
```

Replace the final payment update:

```ts
  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      checkoutSessionId: checkout.id,
      referenceNumber: payment.id,
      method: "Online",
      failureReason: null,
    },
  });
```

with:

```ts
  await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id: payment.id },
      data: {
        checkoutSessionId: checkout.id,
        referenceNumber: payment.id,
        method: "Online",
        failureReason: null,
      },
    });

    await recordPaymentEvent(tx, {
      paymentId: payment.id,
      type: "CHECKOUT_STARTED",
      fromStatus: payment.status,
      toStatus: null,
      amount: payment.amount,
      actor: {
        type: "Student",
        userId: session.user.id,
        name: session.user.name ?? session.user.email,
      },
      source: "student_checkout",
      message: "PayMongo checkout started.",
      metadata: {
        checkoutSessionId: checkout.id,
        method: "Online",
      },
      externalEventId: buildExternalEventId("checkout", checkout.id),
    });
  });
```

- [ ] **Step 3: Type-check and lint**

```bash
npx tsc --noEmit
npx eslint "src/app/(student)/dashboard/requests/actions.ts" "src/app/(student)/dashboard/payments/actions.ts"
```

Expected: exit code 0.

- [ ] **Step 4: Commit**

```bash
git add "src/app/(student)/dashboard/requests/actions.ts" "src/app/(student)/dashboard/payments/actions.ts"
git commit -m "feat(payments): record creation and checkout events"
```

---

## Task 8: Validate webhook amounts and record webhook events

**Files:**
- Modify: `src/app/api/paymongo/webhook/route.ts`

- [ ] **Step 1: Add imports**

```ts
import { validatePaymentAmount } from "@/lib/payment-rules";
import { buildExternalEventId } from "@/lib/payment-events";
import {
  confirmPaymentFailed,
  confirmPaymentPaid,
  recordAmountMismatch,
} from "@/lib/payments";
```

Remove the old `confirmPaymentFailed, confirmPaymentPaid` import block.

- [ ] **Step 2: Replace the inline amount check**

Replace:

```ts
      if (
        paid.attributes.amount !== payment.amount * 100 ||
        paid.attributes.currency !== "PHP"
      ) {
        console.error("PayMongo amount mismatch", {
          paymentId,
          expected: payment.amount * 100,
          received: paid.attributes.amount,
        });
        await prisma.payment.update({
          where: { id: paymentId },
          data: {
            failureReason: `Amount mismatch: expected ${payment.amount * 100} centavos, received ${paid.attributes.amount}`,
          },
        });
        return NextResponse.json({ received: true });
      }

      await confirmPaymentPaid(paymentId, {
        paymongoPaymentId: paid.id,
        paymentIntentId: attributes.payment_intent?.id ?? null,
        paymentMethodType: paid.attributes.source?.type ?? null,
      });
```

with:

```ts
      const validation = validatePaymentAmount({
        paymentAmount: payment.amount,
        paidAmount: paid.attributes.amount,
        currency: paid.attributes.currency,
      });

      if (!validation.valid) {
        console.error("PayMongo amount mismatch", {
          paymentId,
          expected: payment.amount * 100,
          received: paid.attributes.amount,
          currency: paid.attributes.currency,
          reason: validation.reason,
        });

        await recordAmountMismatch(paymentId, {
          expectedCentavos: payment.amount * 100,
          receivedCentavos: paid.attributes.amount,
          currency: paid.attributes.currency,
          source: "webhook",
          externalEventId: buildExternalEventId(
            "webhook",
            event.data.id,
            "mismatch",
          ),
          metadata: {
            checkoutSessionId: resource.id,
            paymongoPaymentId: paid.id,
          },
        });

        return NextResponse.json({ received: true });
      }

      await confirmPaymentPaid(
        paymentId,
        {
          paymongoPaymentId: paid.id,
          paymentIntentId: attributes.payment_intent?.id ?? null,
          paymentMethodType: paid.attributes.source?.type ?? null,
        },
        {
          actor: { type: "PayMongo" },
          source: "webhook",
          externalEventId: buildExternalEventId(
            "webhook",
            event.data.id,
            "paid",
          ),
          message: "Payment confirmed.",
          metadata: {
            checkoutSessionId: resource.id,
            paymongoPaymentId: paid.id,
            paymentIntentId: attributes.payment_intent?.id ?? null,
            paymentMethodType: paid.attributes.source?.type ?? null,
          },
        },
      );
```

- [ ] **Step 3: Pass context for failed events**

Replace:

```ts
      if (paymentId) {
        await confirmPaymentFailed(paymentId, reason);
      } else {
```

with:

```ts
      if (paymentId) {
        await confirmPaymentFailed(paymentId, reason, {
          actor: { type: "PayMongo" },
          source: "webhook",
          externalEventId: buildExternalEventId(
            "webhook",
            event.data.id,
            "failed",
          ),
          message: reason,
          metadata: {
            checkoutSessionId: attributes.checkout_session_id ?? null,
          },
        });
      } else {
```

- [ ] **Step 4: Type-check and lint**

```bash
npx tsc --noEmit
npx eslint src/app/api/paymongo/webhook/route.ts
```

Expected: exit code 0.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/paymongo/webhook/route.ts
git commit -m "feat(payments): validate and log webhook payments"
```

---

## Task 9: Add return-page validation and review state

**Files:**
- Modify: `src/app/(student)/dashboard/payments/success/page.tsx`

- [ ] **Step 1: Add imports and view state**

Change the lucide import:

```ts
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
} from "lucide-react";
```

Add imports:

```ts
import { validatePaymentAmount } from "@/lib/payment-rules";
import { buildExternalEventId } from "@/lib/payment-events";
import {
  confirmPaymentFailed,
  confirmPaymentPaid,
  recordAmountMismatch,
} from "@/lib/payments";
```

Change the view-state type:

```ts
type ViewState =
  | "paid"
  | "confirming"
  | "failed"
  | "expired"
  | "review"
  | "other";
```

Add this helper above the component:

```ts
function viewStateFor(status: string): ViewState {
  if (status === "Paid") return "paid";
  if (status === "Failed") return "failed";
  if (status === "Refunded" || status === "Cancelled") return "other";
  return "confirming";
}
```

- [ ] **Step 2: Replace the confirmation block**

Replace the block from `let viewState` through the end of the `if (viewState === "confirming" && payment.checkoutSessionId)` block with:

```ts
  const hasCheckoutSession = Boolean(payment.checkoutSessionId);
  let viewState: ViewState =
    payment.status === "Paid"
      ? "paid"
      : payment.status === "Refunded" || payment.status === "Cancelled"
        ? "other"
        : payment.status === "Failed" && !hasCheckoutSession
          ? "failed"
          : "confirming";
  let failureReason = payment.failureReason;
  let currentStatus = payment.status;

  const refreshCurrentState = async () => {
    const current = await prisma.payment.findUnique({
      where: { id: payment.id },
      select: { status: true, failureReason: true },
    });

    failureReason = current?.failureReason ?? failureReason;
    currentStatus = current?.status ?? currentStatus;
    viewState = current ? viewStateFor(current.status) : viewState;
  };

  const shouldCheck =
    hasCheckoutSession &&
    (payment.status === "Pending" || payment.status === "Failed");

  if (shouldCheck && payment.checkoutSessionId) {
    try {
      const checkout = await retrieveCheckoutSession(
        payment.checkoutSessionId,
      );
      const paid = checkout.payments.find((p) => p.status === "paid");
      const failed = checkout.payments.find((p) => p.status === "failed");

      if (paid) {
        const validation = validatePaymentAmount({
          paymentAmount: payment.amount,
          paidAmount: paid.amount,
          currency: paid.currency,
        });

        if (!validation.valid) {
          const flagged = await recordAmountMismatch(payment.id, {
            expectedCentavos: payment.amount * 100,
            receivedCentavos: paid.amount,
            currency: paid.currency,
            source: "return_page",
            externalEventId: buildExternalEventId(
              "return",
              `${payment.checkoutSessionId}:${paid.id}`,
              "mismatch",
            ),
            metadata: {
              checkoutSessionId: payment.checkoutSessionId,
              paymongoPaymentId: paid.id,
            },
          });

          if (flagged) {
            viewState = "review";
          } else {
            await refreshCurrentState();
          }
        } else {
          const transitioned = await confirmPaymentPaid(
            payment.id,
            {
              paymongoPaymentId: paid.id,
              paymentIntentId: checkout.paymentIntentId,
              paymentMethodType: paid.sourceType,
            },
            {
              actor: { type: "System" },
              source: "return_page",
              externalEventId: buildExternalEventId(
                "return",
                `${payment.checkoutSessionId}:${paid.id}`,
                "paid",
              ),
              message: "Payment confirmed.",
              metadata: {
                checkoutSessionId: payment.checkoutSessionId,
                paymongoPaymentId: paid.id,
              },
            },
          );

          if (transitioned) {
            viewState = "paid";
            currentStatus = "Paid";
          } else {
            await refreshCurrentState();
          }
        }
      } else if (failed) {
        if (payment.status === "Pending") {
          const transitioned = await confirmPaymentFailed(
            payment.id,
            "Payment failed",
            {
              actor: { type: "System" },
              source: "return_page",
              externalEventId: buildExternalEventId(
                "return",
                `${payment.checkoutSessionId}:${failed.id}`,
                "failed",
              ),
              message: "Payment failed during checkout.",
              metadata: {
                checkoutSessionId: payment.checkoutSessionId,
              },
            },
          );

          if (transitioned) {
            viewState = "failed";
            currentStatus = "Failed";
          } else {
            await refreshCurrentState();
          }
        } else {
          viewState = "failed";
        }
      } else if (checkout.status === "expired") {
        viewState = payment.status === "Failed" ? "failed" : "expired";
      } else {
        viewState = payment.status === "Failed" ? "failed" : "confirming";
      }
    } catch (error) {
      console.error("Failed to confirm PayMongo checkout session", error);
      if (payment.status === "Failed") {
        viewState = "failed";
      }
    }
  }
```

- [ ] **Step 3: Render the review state**

Add the review icon before the existing failed/expired/other icon:

```tsx
          {viewState === "review" && (
            <AlertTriangle className="mx-auto mb-3 h-12 w-12 text-amber-500" />
          )}
```

Add the review title:

```tsx
            {viewState === "review" && "Payment received — under review"}
```

Add the review body after the failed paragraph:

```tsx
          {viewState === "review" && (
            <p className="text-muted-foreground">
              We received a payment, but the amount or currency does not match
              this request. An admin will review it before it is marked paid.
            </p>
          )}
```

- [ ] **Step 4: Type-check and lint**

```bash
npx tsc --noEmit
npx eslint "src/app/(student)/dashboard/payments/success/page.tsx"
```

Expected: exit code 0.

- [ ] **Step 5: Commit**

```bash
git add "src/app/(student)/dashboard/payments/success/page.tsx"
git commit -m "feat(payments): validate return-page payments"
```

---

## Task 10: Add admin actor events and atomic refunds

**Files:**
- Modify: `src/app/(admin)/admin/payments/actions.ts`
- Modify: `src/app/(admin)/admin/requests/actions.ts`

- [ ] **Step 1: Update admin payment actions**

In `src/app/(admin)/admin/payments/actions.ts`, add imports:

```ts
import { canRefund, canTransitionToPaid } from "@/lib/payment-rules";
import { recordPaymentEvent } from "@/lib/payment-events";
```

Replace `adminMarkPaymentPaid`:

```ts
export async function adminMarkPaymentPaid(paymentId: string) {
  const session = await requireAdmin();

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    select: { status: true },
  });

  if (!payment) throw new Error("Payment not found");
  if (!canTransitionToPaid(payment.status)) {
    throw new Error("This payment cannot be marked paid.");
  }

  const transitioned = await confirmPaymentPaid(
    paymentId,
    { method: "Cash" },
    {
      actor: {
        type: "Admin",
        userId: session.user.id,
        name: session.user.name ?? session.user.email,
      },
      source: "admin",
      message: "Marked paid manually by admin.",
      metadata: { manual: true },
    },
  );

  if (!transitioned) throw new Error("Payment could not be updated.");

  return { success: true };
}
```

Replace `adminMarkPaymentRefunded`:

```ts
export async function adminMarkPaymentRefunded(paymentId: string) {
  const session = await requireAdmin();

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      documentRequest: {
        include: {
          documentType: { select: { name: true } },
          user: {
            select: {
              studentProfile: { select: { id: true } },
            },
          },
        },
      },
    },
  });

  if (!payment) throw new Error("Payment not found");
  if (!canRefund(payment.status)) {
    throw new Error("Only paid payments can be refunded.");
  }

  await prisma.$transaction(async (tx) => {
    const updated = await tx.payment.updateMany({
      where: { id: paymentId, status: "Paid" },
      data: { status: "Refunded" },
    });

    if (updated.count === 0) {
      throw new Error("Only paid payments can be refunded.");
    }

    const studentProfileId =
      payment.documentRequest.user.studentProfile?.id;

    if (studentProfileId) {
      await tx.notification.create({
        data: {
          studentProfileId,
          title: "Payment Refunded",
          message: `Your payment of ₱${payment.amount.toLocaleString()} for ${payment.documentRequest.documentType.name} has been refunded.`,
          type: "PAYMENT_REFUNDED",
          relatedEntityType: "payment",
          relatedEntityId: paymentId,
        },
      });
    }

    await recordPaymentEvent(tx, {
      paymentId,
      type: "REFUNDED",
      fromStatus: "Paid",
      toStatus: "Refunded",
      amount: payment.amount,
      actor: {
        type: "Admin",
        userId: session.user.id,
        name: session.user.name ?? session.user.email,
      },
      source: "admin",
      message: "Refund recorded manually by admin.",
      metadata: { manual: true },
    });
  });

  return { success: true };
}
```

- [ ] **Step 2: Update admin request actions**

In `src/app/(admin)/admin/requests/actions.ts`, add imports:

```ts
import {
  canCancelPayment,
  canCompleteRequest,
  canRejectRequest,
} from "@/lib/payment-rules";
import { recordPaymentEvent } from "@/lib/payment-events";
```

In `updateRequestStatus`, replace the completion check:

```ts
  if (status === "Completed" && request.payment?.status !== "Paid") {
    throw new Error("Mark the payment as paid before completing this request.");
  }
```

with:

```ts
  if (status === "Completed" && !canCompleteRequest(request.payment?.status)) {
    throw new Error("Mark the payment as paid before completing this request.");
  }
```

In `rejectRequest`, change `await requireAdmin();` to:

```ts
  const session = await requireAdmin();
```

Replace the rejection check:

```ts
  if (
    request.payment?.status === "Paid" ||
    request.payment?.status === "Refunded"
  ) {
    throw new Error("This request has been paid and cannot be rejected.");
  }
```

with:

```ts
  if (!canRejectRequest(request.payment?.status)) {
    throw new Error("This request has been paid and cannot be rejected.");
  }
```

Replace the cancellation block inside the transaction:

```ts
    if (
      request.payment &&
      (request.payment.status === "Pending" ||
        request.payment.status === "Failed")
    ) {
      await tx.payment.update({
        where: { id: request.payment.id },
        data: { status: "Cancelled" },
      });
    }
```

with a fresh-status guard, atomic update, and event:

```ts
    if (request.payment) {
      const currentPayment = await tx.payment.findUnique({
        where: { id: request.payment.id },
        select: { status: true, amount: true },
      });

      if (currentPayment && !canRejectRequest(currentPayment.status)) {
        throw new Error("This request has been paid and cannot be rejected.");
      }

      if (currentPayment && canCancelPayment(currentPayment.status)) {
        const cancelled = await tx.payment.updateMany({
          where: {
            id: request.payment.id,
            status: { in: ["Pending", "Failed"] },
          },
          data: { status: "Cancelled" },
        });

        if (cancelled.count === 1) {
          await recordPaymentEvent(tx, {
            paymentId: request.payment.id,
            type: "CANCELLED",
            fromStatus: currentPayment.status,
            toStatus: "Cancelled",
            amount: currentPayment.amount,
            actor: {
              type: "Admin",
              userId: session.user.id,
              name: session.user.name ?? session.user.email,
            },
            source: "admin",
            message: `Request rejected: ${reason}.`,
            metadata: {
              requestId,
              reason,
            },
          });
        }
      }
    }
```

- [ ] **Step 3: Type-check and lint**

```bash
npx tsc --noEmit
npx eslint "src/app/(admin)/admin/payments/actions.ts" "src/app/(admin)/admin/requests/actions.ts"
```

Expected: exit code 0.

- [ ] **Step 4: Commit**

```bash
git add "src/app/(admin)/admin/payments/actions.ts" "src/app/(admin)/admin/requests/actions.ts"
git commit -m "feat(payments): record admin payment actions"
```

---

## Task 11: Show the payment history in the admin dialog

**Files:**
- Modify: `src/app/(admin)/admin/payments/actions.ts`
- Modify: `src/app/(admin)/admin/payments/page.tsx`
- Modify: `src/app/(admin)/admin/payments/PaymentsManager.tsx`
- Modify: `src/app/(admin)/admin/payments/PaymentDetailDialog.tsx`

- [ ] **Step 1: Include events in the admin query**

In `getAllPayments`, add this after the `uploads` include:

```ts
      events: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          type: true,
          fromStatus: true,
          toStatus: true,
          amount: true,
          actorType: true,
          actorName: true,
          message: true,
          createdAt: true,
        },
      },
```

- [ ] **Step 2: Pass events through the page**

In `src/app/(admin)/admin/payments/page.tsx`, add this to the mapped payment object after `uploads`:

```ts
        events: payment.events,
```

- [ ] **Step 3: Add the event type to `PaymentsManager`**

In `src/app/(admin)/admin/payments/PaymentsManager.tsx`, add this to `AdminPayment` after `uploads`:

```ts
  events: Array<{
    id: string;
    type: string;
    fromStatus: string | null;
    toStatus: string | null;
    amount: number | null;
    actorType: string;
    actorName: string | null;
    message: string | null;
    createdAt: Date;
  }>;
```

- [ ] **Step 4: Add labels and the timeline**

In `src/app/(admin)/admin/payments/PaymentDetailDialog.tsx`, add this map after `statusVariant`:

```ts
const eventLabels: Record<string, string> = {
  CREATED: "Payment created",
  CHECKOUT_STARTED: "Checkout started",
  PAID: "Payment paid",
  FAILED: "Payment failed",
  REFUNDED: "Payment refunded",
  CANCELLED: "Payment cancelled",
  AMOUNT_MISMATCH: "Amount mismatch",
};
```

Add this section after the Proof block and before the action footer:

```tsx
          <div>
            <p className="mb-2 text-sm text-muted-foreground">History</p>
            {payment.events.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No history recorded.
              </p>
            ) : (
              <ul className="max-h-64 space-y-3 overflow-y-auto border-l pl-4">
                {payment.events.map((event) => (
                  <li key={event.id} className="relative">
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
                    <p className="text-xs text-muted-foreground">
                      {event.actorName ?? event.actorType} •{" "}
                      {format(
                        new Date(event.createdAt),
                        "MMM dd, yyyy • h:mm a",
                      )}
                    </p>
                    {event.message && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {event.message}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
```

- [ ] **Step 5: Type-check, lint, and build**

```bash
npx tsc --noEmit
npx eslint "src/app/(admin)/admin/payments/actions.ts" "src/app/(admin)/admin/payments/page.tsx" "src/app/(admin)/admin/payments/PaymentsManager.tsx" "src/app/(admin)/admin/payments/PaymentDetailDialog.tsx"
npm run build
```

Expected: exit code 0; build succeeds.

- [ ] **Step 6: Commit**

```bash
git add "src/app/(admin)/admin/payments/actions.ts" "src/app/(admin)/admin/payments/page.tsx" "src/app/(admin)/admin/payments/PaymentsManager.tsx" "src/app/(admin)/admin/payments/PaymentDetailDialog.tsx"
git commit -m "feat(payments): show admin payment history"
```

---

## Task 12: Final verification and manual checks

**Files:**
- No code changes expected.

- [ ] **Step 1: Run the full automated checks**

```bash
npm test
npx tsc --noEmit
npm run lint
npm run build
```

Expected: all pass. `npm run lint` should now be clean.

- [ ] **Step 2: Start the dev server**

```bash
npm run dev
```

- [ ] **Step 3: Verify student payment creation and checkout**

1. Sign in as a student.
2. Create a document request.
3. Open `/dashboard/payments`.
4. Confirm the payment shows `Pending` and the amount.
5. Click **Pay Online** and pay with test card `4343434343434345`, any future
   expiry, CVV `123`.
6. Confirm the return page shows **Payment confirmed**.
7. Revisit the success URL and confirm no duplicate notification is created.

- [ ] **Step 4: Verify cash and admin history**

1. Upload a cash receipt from the student payments page.
2. Sign in as an admin and open `/admin/payments`.
3. Open the payment dialog.
4. Confirm the History timeline shows `Payment created`, `Checkout started`,
   `Payment paid`, and any later admin action.
5. Mark a cash payment paid and confirm the student notification appears.
6. Record a refund and confirm the `Payment refunded` history entry appears.

- [ ] **Step 5: Verify guards**

1. Reject an unpaid request; confirm its payment becomes `Cancelled` and a
   `Payment cancelled` history entry appears.
2. Try to reject a paid request; confirm it is blocked.
3. Try to complete an unpaid request; confirm it is blocked.

- [ ] **Step 6: Verify the webhook route still behaves**

```bash
curl -i -X POST http://localhost:3000/api/paymongo/webhook -d 'not-json'
```

Expected: HTTP 400.

```bash
curl -i -X POST http://localhost:3000/api/paymongo/webhook -H 'paymongo-signature: t=1,te=bad' -d '{}'
```

Expected: HTTP 401 when a real secret is configured, or 500 when the secret is
missing or still the placeholder value.

- [ ] **Step 7: Commit any documentation updates**

If a manual check required a doc change:

```bash
git add <changed-docs>
git commit -m "docs: update payments verification notes"
```

If no docs changed, skip this step.

---

## Self-review checklist

- [ ] Every spec section has a task:
  - Data model and migration → Task 4
  - Event recording, actor, source, messages, external IDs → Tasks 5–8
  - Payment rules and amount validation → Task 3
  - Mismatch handling → Tasks 6, 8, 9
  - Return page states → Task 9
  - Admin history → Task 11
  - Onboarding lint fix → Task 1
  - Test suite → Tasks 2, 3, 5, 6
  - Documentation → Task 2
- [ ] No placeholders or "similar to Task N" references.
- [ ] Types and signatures match across tasks:
  - `PaymentTransitionContext` has `message`
  - `recordPaymentEvent` takes `RecordPaymentEventInput`
  - `buildExternalEventId` takes a namespace, not a source
  - `recordAmountMismatch` takes `AmountMismatchInput`
- [ ] All commits are focused and use conventional messages.
