# PayMongo Payments Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a `Payment` for every document request, support cash receipt upload and admin verification, and accept online payments through PayMongo Hosted Checkout.

**Architecture:** A request and its `Payment` are created in one Prisma transaction. Students pay through a server action that creates a PayMongo Checkout Session and redirects to the hosted page. A signature-verified webhook and the return page both call the same idempotent transition helper, so either path can settle a payment. Admins review cash receipts and record payments/refunds from a dedicated page.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript strict, Prisma 7 + PostgreSQL, PayMongo REST API v2, UploadThing, shadcn/ui, sonner.

**Testing note:** This repo has no automated test runner (`AGENTS.md`). Every task is verified with `npx tsc --noEmit`, `npm run lint`, and the manual sandbox checks in Task 15. Do not add a test framework as part of this plan.

**Spec:** `docs/superpowers/specs/2026-11-23-paymongo-payments-design.md`

---

## Execution status

Implemented on branch `feat/paymongo-payments`. All tasks are complete except the
browser-based manual checks in Task 15, which still need a signed-in student and
admin session.

Deviations from the steps below, all deliberate:

1. **Task 1 used `migrate diff` + `db execute`, not `migrate dev`.** The dev
   database was created with `db push` and has no `_prisma_migrations` history,
   so `migrate dev` would have offered to reset it. The generated migration file
   is `prisma/migrations/20261123120000_add_paymongo_payment_fields`.
2. **Tasks 7 and 8 were committed together** (`ac7e5c1`). The `input` prop only
   exists on `UploadButton` once the endpoint declares an input schema, so the
   two changes cannot type-check independently.
3. **`UploadWithUrl` re-types `UploadButton`** as `UploadButtonWithInput`
   instead of using `input as never`. `UploadButton`'s props drop `input`
   entirely when `endpoint` is a union of endpoints, so a cast on the value was
   not enough.
4. **Checkout retrieval uses `/v1/checkout_sessions/{id}`**, while creation uses
   `/v2/checkout_sessions`. Verified against the sandbox: the v2 retrieval route
   returns 404.
5. **`payment.failed` resolves the payment via `checkout_session_id`** when the
   event has no `paymentId` metadata.
6. **Maya is `paymaya`, not `maya`.** Checkout session creation accepts `maya`,
   but the hosted page rejects it when the customer selects it. Fixed after a
   manual report; the identifier list now uses `paymaya`.

Known pre-existing issue, unrelated to this work: `npm run lint` reports two
errors in `src/app/(student)/dashboard/onboarding/page.tsx` (`prefer-const` and
an impure call during render). Type-check and build are clean.

---

## Task 1: Add PayMongo fields to the Payment model

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add the new columns**

In `model Payment`, after `referenceNumber String?`, add:

```prisma
  checkoutSessionId String?  @unique
  paymentIntentId   String?
  paymongoPaymentId String?  @unique
  paymentMethodType String?
  paidAt            DateTime?
  failureReason     String?
```

The block becomes:

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

  @@map("payment")
}
```

- [ ] **Step 2: Validate the schema**

Run: `npx prisma validate`
Expected: `The schema at prisma/schema.prisma is valid 🚀`

- [ ] **Step 3: Create the migration**

Run: `npx prisma migrate dev --name add_paymongo_payment_fields`
Expected: a new folder under `prisma/migrations/` and `Your database is now in sync with your schema.`

- [ ] **Step 4: Regenerate the client**

Run: `npx prisma generate`
Expected: `Generated Prisma Client`

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma prisma/migrations
git commit -m "feat(payments): add PayMongo fields to Payment"
```

---

## Task 2: Create the PayMongo REST client

**Files:**
- Create: `src/lib/paymongo.ts`

- [ ] **Step 1: Write the client**

Create `src/lib/paymongo.ts`:

```ts
import { createHmac, timingSafeEqual } from "crypto";

const PAYMONGO_BASE_URL = "https://api.paymongo.com/v2";

export interface CreateCheckoutSessionInput {
  name: string;
  amount: number; // centavos
  referenceNumber: string;
  paymentId: string;
  description?: string;
  successUrl: string;
  cancelUrl: string;
}

export interface CheckoutSessionSummary {
  id: string;
  checkoutUrl: string | null;
  status: string;
  paymentIntentId: string | null;
  payments: Array<{
    id: string;
    status: string;
    amount: number;
    currency: string;
    sourceType: string | null;
  }>;
}

function getSecretKey(): string {
  const key = process.env.PAYMONGO_SECRET_KEY;
  if (!key) throw new Error("PAYMONGO_SECRET_KEY is not configured");
  return key;
}

async function paymongoRequest<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`${PAYMONGO_BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Basic ${Buffer.from(`${getSecretKey()}:`).toString(
        "base64",
      )}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
    cache: "no-store",
  });

  const json = (await response.json().catch(() => null)) as
    | { errors?: Array<{ detail?: string }> }
    | null;

  if (!response.ok) {
    const message =
      json?.errors?.[0]?.detail ??
      `PayMongo request failed with status ${response.status}`;
    throw new Error(message);
  }

  return json as unknown as T;
}

export async function createCheckoutSession(
  input: CreateCheckoutSessionInput,
): Promise<{ id: string; checkoutUrl: string }> {
  const json = await paymongoRequest<{
    data: {
      id: string;
      attributes: { checkout_url: string };
    };
  }>("/checkout_sessions", {
    method: "POST",
    body: JSON.stringify({
      data: {
        attributes: {
          line_items: [
            {
              name: input.name,
              amount: input.amount,
              currency: "PHP",
              quantity: 1,
            },
          ],
          payment_method_types: ["gcash", "paymaya", "card", "qrph"],
          reference_number: input.referenceNumber,
          metadata: { paymentId: input.paymentId },
          success_url: input.successUrl,
          cancel_url: input.cancelUrl,
          description: input.description,
        },
      },
    }),
  });

  return {
    id: json.data.id,
    checkoutUrl: json.data.attributes.checkout_url,
  };
}

export async function retrieveCheckoutSession(
  sessionId: string,
): Promise<CheckoutSessionSummary> {
  const json = await paymongoRequest<{
    data: {
      id: string;
      attributes: {
        checkout_url?: string | null;
        status: string;
        payment_intent?: { id: string } | null;
        payments?: Array<{
          id: string;
          attributes: {
            status: string;
            amount: number;
            currency: string;
            source?: { type?: string } | null;
          };
        }>;
      };
    };
  }>(`/checkout_sessions/${sessionId}`);

  const attributes = json.data.attributes;

  return {
    id: json.data.id,
    checkoutUrl: attributes.checkout_url ?? null,
    status: attributes.status,
    paymentIntentId: attributes.payment_intent?.id ?? null,
    payments: (attributes.payments ?? []).map((payment) => ({
      id: payment.id,
      status: payment.attributes.status,
      amount: payment.attributes.amount,
      currency: payment.attributes.currency,
      sourceType: payment.attributes.source?.type ?? null,
    })),
  };
}

export function verifyWebhookSignature(
  rawBody: string,
  header: string | null,
  secret: string,
  livemode: boolean,
): boolean {
  if (!header) return false;

  const parts = Object.fromEntries(
    header.split(",").map((part) => {
      const [key, ...rest] = part.split("=");
      return [key.trim(), rest.join("=").trim()];
    }),
  );

  const timestamp = parts.t;
  const signature = livemode ? parts.li : parts.te;

  if (!timestamp || !signature) return false;

  const expected = createHmac("sha256", secret)
    .update(`${timestamp}.${rawBody}`)
    .digest("hex");

  const expectedBuffer = Buffer.from(expected, "utf8");
  const actualBuffer = Buffer.from(signature, "utf8");

  if (expectedBuffer.length !== actualBuffer.length) return false;

  return timingSafeEqual(expectedBuffer, actualBuffer);
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors from `src/lib/paymongo.ts`

- [ ] **Step 3: Commit**

```bash
git add src/lib/paymongo.ts
git commit -m "feat(payments): add PayMongo REST client"
```

---

## Task 3: Add auth guards

**Files:**
- Create: `src/lib/auth-guards.ts`

- [ ] **Step 1: Write the guards**

Create `src/lib/auth-guards.ts`:

```ts
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export async function requireStudent() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  if (session.user.role === "admin") {
    throw new Error("Admins cannot access student payments");
  }

  return session;
}

export async function requireAdmin() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  if (session.user.role !== "admin") {
    throw new Error("Forbidden");
  }

  return session;
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/lib/auth-guards.ts
git commit -m "feat(auth): add requireStudent and requireAdmin guards"
```

---

## Task 4: Add shared payment transitions

**Files:**
- Create: `src/lib/payments.ts`

- [ ] **Step 1: Write the transition helpers**

Create `src/lib/payments.ts`:

```ts
import { Prisma } from "@/generated/prisma/client";
import prisma from "@/lib/prisma";

interface ConfirmPaidInput {
  paymongoPaymentId?: string | null;
  paymentIntentId?: string | null;
  paymentMethodType?: string | null;
  method?: "Cash" | "Online";
  paidAt?: Date;
}

interface PaymentNotificationContext {
  amount: number;
  documentName: string;
  studentProfileId: string | null;
}

async function getNotificationContext(
  tx: Prisma.TransactionClient,
  paymentId: string,
): Promise<PaymentNotificationContext | null> {
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

  if (!payment) return null;

  return {
    amount: payment.amount,
    documentName: payment.documentRequest.documentType.name,
    studentProfileId:
      payment.documentRequest.user.studentProfile?.id ?? null,
  };
}

export async function confirmPaymentPaid(
  paymentId: string,
  details: ConfirmPaidInput = {},
): Promise<boolean> {
  return prisma.$transaction(async (tx) => {
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

    if (updated.count === 0) return false;

    const context = await getNotificationContext(tx, paymentId);
    if (context?.studentProfileId) {
      await tx.notification.create({
        data: {
          studentProfileId: context.studentProfileId,
          title: "Payment Received",
          message: `Your payment of ₱${context.amount.toLocaleString()} for ${context.documentName} has been confirmed.`,
          type: "PAYMENT_PAID",
          relatedEntityType: "payment",
          relatedEntityId: paymentId,
        },
      });
    }

    return true;
  });
}

export async function confirmPaymentFailed(
  paymentId: string,
  reason?: string | null,
): Promise<boolean> {
  return prisma.$transaction(async (tx) => {
    const updated = await tx.payment.updateMany({
      where: { id: paymentId, status: "Pending" },
      data: {
        status: "Failed",
        failureReason: reason ?? "Payment failed",
      },
    });

    if (updated.count === 0) return false;

    const context = await getNotificationContext(tx, paymentId);
    if (context?.studentProfileId) {
      await tx.notification.create({
        data: {
          studentProfileId: context.studentProfileId,
          title: "Payment Failed",
          message: `Your payment for ${context.documentName} failed. You can try again.`,
          type: "PAYMENT_FAILED",
          relatedEntityType: "payment",
          relatedEntityId: paymentId,
        },
      });
    }

    return true;
  });
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/lib/payments.ts
git commit -m "feat(payments): add idempotent payment transitions"
```

---

## Task 5: Create a Payment with every request and guard request status changes

**Files:**
- Modify: `src/app/(student)/dashboard/requests/actions.ts`
- Modify: `src/app/(admin)/admin/requests/actions.ts`

- [ ] **Step 1: Create the payment inside `createDocumentRequest`**

In `src/app/(student)/dashboard/requests/actions.ts`, replace everything from `await prisma.documentRequest.create({` to the end of the function with:

```ts
  await prisma.$transaction(async (tx) => {
    const request = await tx.documentRequest.create({
      data: {
        userId: session.user.id,
        documentTypeId,
        quantity,
        totalPrice,
        notes: notes || null,
        status: "Pending",
      },
    });

    const payment = await tx.payment.create({
      data: {
        documentRequestId: request.id,
        method: "Cash",
        amount: totalPrice,
        status: "Pending",
      },
    });

    await tx.payment.update({
      where: { id: payment.id },
      data: { referenceNumber: payment.id },
    });
  });

  return { success: true };
}
```

Keep the existing validation and `totalPrice` calculation above it. The function must end with exactly one `return { success: true };`.

- [ ] **Step 2: Guard `updateRequestStatus`**

In `src/app/(admin)/admin/requests/actions.ts`, add the import at the top:

```ts
import { requireAdmin } from "@/lib/auth-guards";
```

At the start of `updateRequestStatus`, add:

```ts
  await requireAdmin();
```

Add `payment` to the `include` of the `findUnique` call:

```ts
    include: {
      payment: { select: { status: true } },
      user: {
        select: {
          studentProfile: { select: { id: true } },
        },
      },
      documentType: { select: { name: true } },
    },
```

After the `if (!request) throw new Error("Request not found");` line, add:

```ts
  if (status === "Completed" && request.payment?.status !== "Paid") {
    throw new Error("Mark the payment as paid before completing this request.");
  }
```

- [ ] **Step 3: Guard `rejectRequest`**

At the start of `rejectRequest`, add:

```ts
  await requireAdmin();
```

Add `payment` to its `include` the same way as Step 2:

```ts
    include: {
      payment: { select: { id: true, status: true } },
      user: {
        select: {
          studentProfile: { select: { id: true } },
        },
      },
      documentType: { select: { name: true } },
    },
```

After `if (!request) throw new Error("Request not found");`, add:

```ts
  if (
    request.payment?.status === "Paid" ||
    request.payment?.status === "Refunded"
  ) {
    throw new Error("This request has been paid and cannot be rejected.");
  }
```

Replace everything from `await prisma.$transaction([...]);` to the end of the function with:

```ts
  await prisma.$transaction(async (tx) => {
    await tx.documentRequest.update({
      where: { id: requestId },
      data: { status: "Rejected", declineReason: reason },
    });

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

    await tx.notification.create({
      data: {
        studentProfileId,
        title: "Request Rejected",
        message: `Your request for ${request.documentType.name} was rejected. Reason: ${reason}`,
        type: "REJECTED",
        relatedEntityType: "document_request",
        relatedEntityId: requestId,
      },
    });
  });

  return { success: true };
}
```

- [ ] **Step 4: Type-check and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors

- [ ] **Step 5: Commit**

```bash
git add "src/app/(student)/dashboard/requests/actions.ts" "src/app/(admin)/admin/requests/actions.ts"
git commit -m "feat(payments): create payment with request and guard status changes"
```

---

## Task 6: Add student payment actions

**Files:**
- Create: `src/app/(student)/dashboard/payments/actions.ts`

- [ ] **Step 1: Write the actions**

Create `src/app/(student)/dashboard/payments/actions.ts`:

```ts
"use server";

import prisma from "@/lib/prisma";
import { requireStudent } from "@/lib/auth-guards";
import {
  createCheckoutSession,
  retrieveCheckoutSession,
} from "@/lib/paymongo";

export async function getMyPayments() {
  const session = await requireStudent();

  return prisma.payment.findMany({
    where: { documentRequest: { userId: session.user.id } },
    include: {
      documentRequest: {
        include: {
          documentType: { select: { name: true } },
        },
      },
      uploads: {
        select: { id: true, url: true, name: true, fileType: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function startOnlinePayment(paymentId: string) {
  const session = await requireStudent();

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      documentRequest: {
        include: {
          documentType: { select: { name: true } },
        },
      },
    },
  });

  if (!payment || payment.documentRequest.userId !== session.user.id) {
    throw new Error("Unauthorized");
  }

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

  if (payment.checkoutSessionId) {
    try {
      const existing = await retrieveCheckoutSession(
        payment.checkoutSessionId,
      );

      if (existing.status === "active" && existing.checkoutUrl) {
        if (payment.method !== "Online") {
          await prisma.payment.update({
            where: { id: payment.id },
            data: { method: "Online" },
          });
        }
        return { checkoutUrl: existing.checkoutUrl };
      }
    } catch (error) {
      console.error("Could not reuse PayMongo checkout session", error);
    }
  }

  const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL ?? "").replace(/\/$/, "");
  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_BASE_URL is not configured");
  }

  const checkout = await createCheckoutSession({
    name: `${payment.documentRequest.documentType.name} x${payment.documentRequest.quantity}`,
    amount: payment.amount * 100,
    referenceNumber: payment.referenceNumber ?? payment.id,
    paymentId: payment.id,
    description: `Document request ${payment.documentRequestId}`,
    successUrl: `${baseUrl}/dashboard/payments/success?paymentId=${payment.id}`,
    cancelUrl: `${baseUrl}/dashboard/payments?canceled=1`,
  });

  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      checkoutSessionId: checkout.id,
      referenceNumber: payment.id,
      method: "Online",
      failureReason: null,
    },
  });

  return { checkoutUrl: checkout.checkoutUrl };
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add "src/app/(student)/dashboard/payments/actions.ts"
git commit -m "feat(payments): add student payment actions"
```

---

## Task 7: Add UploadThing input forwarding and build the student payments page

**Files:**
- Modify: `src/components/upload/upload-with-url.types.ts`
- Modify: `src/components/upload/upload-with-url.tsx`
- Modify: `src/app/(student)/dashboard/payments/page.tsx`
- Create: `src/app/(student)/dashboard/payments/PaymentsList.tsx`
- Create: `src/app/(student)/dashboard/payments/PaymentActions.tsx`

- [ ] **Step 1: Add the input prop type**

In `src/components/upload/upload-with-url.types.ts`, add to `UploadWithUrlProps`:

```ts
  input?: Record<string, unknown>;
```

The interface becomes:

```ts
export interface UploadWithUrlProps {
  endpoint: UploadEndpoint;
  field: {
    state: {
      value: string;
    };
    handleChange: (value: string) => void;
  };
  input?: Record<string, unknown>;
  label?: string;
  description?: React.ReactNode;
  existingUrl?: string;
  onUploadComplete?: (url: string) => void;
  onUploadIdComplete?: (uploadId: string) => void;
  onPreview?: (url: string) => void;
  className?: string;
}
```

- [ ] **Step 2: Destructure and forward the prop**

In `src/components/upload/upload-with-url.tsx`, add `input,` after `field,` in the destructuring:

```tsx
export function UploadWithUrl({
  endpoint,
  field,
  input,
  label,
```

Then pass it to `UploadButton`:

```tsx
          <UploadButton
            endpoint={endpoint}
            input={input as never}
            onClientUploadComplete={handleUploadComplete}
```

The `as never` cast is required because `UploadButton`'s `input` prop is a union of every endpoint's input type.

- [ ] **Step 3: Replace the page**

Replace `src/app/(student)/dashboard/payments/page.tsx` with:

```tsx
import { getMyPayments } from "./actions";
import { PaymentsList } from "./PaymentsList";

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ canceled?: string }>;
}) {
  const { canceled } = await searchParams;
  const payments = await getMyPayments();

  return (
    <div className="container mx-auto py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Payments</h1>
        <p className="mt-1 text-muted-foreground">
          Pay for your document requests or upload a cash receipt.
        </p>
      </div>

      <PaymentsList
        canceled={canceled === "1"}
        payments={payments.map((payment) => ({
          id: payment.id,
          amount: payment.amount,
          method: payment.method,
          status: payment.status,
          referenceNumber: payment.referenceNumber,
          failureReason: payment.failureReason,
          createdAt: payment.createdAt,
          paidAt: payment.paidAt,
          documentRequest: {
            id: payment.documentRequest.id,
            quantity: payment.documentRequest.quantity,
            totalPrice: payment.documentRequest.totalPrice,
            status: payment.documentRequest.status,
            documentType: {
              name: payment.documentRequest.documentType.name,
            },
          },
          uploads: payment.uploads,
        }))}
      />
    </div>
  );
}
```

- [ ] **Step 4: Create the list**

Create `src/app/(student)/dashboard/payments/PaymentsList.tsx`:

```tsx
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { CreditCard } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PaymentActions } from "./PaymentActions";

export interface PaymentListItem {
  id: string;
  amount: number;
  method: string;
  status: string;
  referenceNumber: string | null;
  failureReason: string | null;
  createdAt: Date;
  paidAt: Date | null;
  documentRequest: {
    id: string;
    quantity: number;
    totalPrice: number;
    status: string;
    documentType: { name: string };
  };
  uploads: Array<{
    id: string;
    url: string;
    name: string;
    fileType: string;
  }>;
}

const statusVariant: Record<
  string,
  "default" | "secondary" | "outline" | "destructive"
> = {
  Pending: "secondary",
  Paid: "default",
  Failed: "destructive",
  Refunded: "outline",
  Cancelled: "outline",
};

const filters = [
  { value: "all", label: "All" },
  { value: "outstanding", label: "Outstanding" },
  { value: "paid", label: "Paid" },
] as const;

type Filter = (typeof filters)[number]["value"];

interface PaymentsListProps {
  payments: PaymentListItem[];
  canceled: boolean;
}

export function PaymentsList({ payments, canceled }: PaymentsListProps) {
  const [filter, setFilter] = useState<Filter>("all");

  const outstanding = payments
    .filter((p) => p.status === "Pending" || p.status === "Failed")
    .reduce((sum, p) => sum + p.amount, 0);

  const collected = payments
    .filter((p) => p.status === "Paid")
    .reduce((sum, p) => sum + p.amount, 0);

  const filtered = useMemo(() => {
    if (filter === "outstanding") {
      return payments.filter(
        (p) => p.status === "Pending" || p.status === "Failed",
      );
    }
    if (filter === "paid") {
      return payments.filter((p) => p.status === "Paid");
    }
    return payments;
  }, [filter, payments]);

  return (
    <div className="space-y-6">
      {canceled && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm">
          Checkout canceled — no payment was taken.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Outstanding Balance</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-2xl font-bold">
              ₱{outstanding.toLocaleString()}
            </p>
            <p className="text-sm text-muted-foreground">
              Pending or failed payments
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Paid</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-2xl font-bold">
              ₱{collected.toLocaleString()}
            </p>
            <p className="text-sm text-muted-foreground">
              Confirmed payments
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-2">
        {filters.map(({ value, label }) => (
          <Button
            key={value}
            size="sm"
            variant={filter === value ? "default" : "outline"}
            onClick={() => setFilter(value)}
          >
            {label}
          </Button>
        ))}
      </div>

      {payments.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <CreditCard className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="text-lg font-semibold">No payments yet</h3>
            <p className="mt-2 text-muted-foreground">
              Create a document request to get started.
            </p>
            <Button className="mt-4" asChild>
              <Link href="/dashboard/requests/new">New Request</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Document</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="h-24 text-center text-muted-foreground"
                    >
                      No payments match this filter.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>
                        <div className="font-medium">
                          {payment.documentRequest.documentType.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {payment.documentRequest.quantity > 1
                            ? `Quantity: ${payment.documentRequest.quantity}`
                            : "Single copy"}
                        </div>
                        {payment.failureReason && (
                          <div className="text-xs text-destructive">
                            {payment.failureReason}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        ₱{payment.amount.toLocaleString()}
                      </TableCell>
                      <TableCell>{payment.method}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            statusVariant[payment.status] ?? "secondary"
                          }
                        >
                          {payment.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(payment.createdAt), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="text-right">
                        <PaymentActions
                          paymentId={payment.id}
                          canPay={
                            payment.status === "Pending" ||
                            payment.status === "Failed"
                          }
                          hasReceipt={payment.uploads.length > 0}
                          receiptUrl={payment.uploads[0]?.url}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
```

- [ ] **Step 5: Create the actions component**

Create `src/app/(student)/dashboard/payments/PaymentActions.tsx`:

```tsx
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { UploadWithUrl } from "@/components/upload/upload-with-url";
import { startOnlinePayment } from "./actions";

interface PaymentActionsProps {
  paymentId: string;
  canPay: boolean;
  hasReceipt: boolean;
  receiptUrl?: string;
}

export function PaymentActions({
  paymentId,
  canPay,
  hasReceipt,
  receiptUrl,
}: PaymentActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [uploadUrl, setUploadUrl] = useState("");

  const handlePay = () => {
    startTransition(async () => {
      try {
        const { checkoutUrl } = await startOnlinePayment(paymentId);
        window.location.assign(checkoutUrl);
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Could not start checkout. Please try again.",
        );
      }
    });
  };

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      {receiptUrl && (
        <Button asChild size="sm" variant="ghost">
          <a href={receiptUrl} target="_blank" rel="noopener noreferrer">
            View Receipt
          </a>
        </Button>
      )}

      {canPay && (
        <Button size="sm" onClick={handlePay} disabled={isPending}>
          {isPending ? "Redirecting..." : "Pay Online"}
        </Button>
      )}

      <Dialog open={receiptOpen} onOpenChange={setReceiptOpen}>
        <DialogTrigger asChild>
          <Button size="sm" variant="outline">
            {hasReceipt ? "Replace Receipt" : "Upload Receipt"}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload cash receipt</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Optional. Upload a photo or PDF of your receipt so an admin can
            verify your cash payment.
          </p>
          <UploadWithUrl
            endpoint="paymentProof"
            input={{ paymentId }}
            field={{
              state: { value: uploadUrl },
              handleChange: setUploadUrl,
            }}
            onUploadComplete={() => {
              toast.success("Receipt uploaded. An admin will verify it.");
              setReceiptOpen(false);
              router.refresh();
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
```

- [ ] **Step 6: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 7: Commit**

```bash
git add src/components/upload/upload-with-url.types.ts src/components/upload/upload-with-url.tsx "src/app/(student)/dashboard/payments/page.tsx" "src/app/(student)/dashboard/payments/PaymentsList.tsx" "src/app/(student)/dashboard/payments/PaymentActions.tsx"
git commit -m "feat(payments): add student payments page"
```

---

## Task 8: Verify payment ownership in the paymentProof endpoint

**Files:**
- Modify: `src/app/api/uploadthing/core.ts`

- [ ] **Step 1: Require and verify `paymentId` in the endpoint**

In `src/app/api/uploadthing/core.ts`, replace the whole `paymentProof` entry with:

```ts
  paymentProof: f({
    image: { maxFileSize: "4MB", maxFileCount: 1 },
    pdf: { maxFileSize: "4MB", maxFileCount: 1 },
  })
    .input(z.object({ paymentId: z.string() }))
    .middleware(async ({ req, input }) => {
      const session = await auth.api.getSession({ headers: req.headers });
      if (!session) {
        throw new Error("Unauthorized: You must be signed in to upload files.");
      }

      const payment = await prisma.payment.findUnique({
        where: { id: input.paymentId },
        select: {
          id: true,
          documentRequest: { select: { userId: true } },
        },
      });

      if (
        !payment ||
        payment.documentRequest.userId !== session.user.id
      ) {
        throw new Error("Payment not found.");
      }

      return { paymentId: payment.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      const upload = await prisma.upload.create({
        data: {
          name: file.name,
          url: file.ufsUrl,
          fileType: file.type,
          fileSize: file.size,
          category: "paymentProof",
          paymentId: metadata.paymentId,
        },
      });
      return { url: file.ufsUrl, uploadId: upload.id };
    }),
```

- [ ] **Step 2: Type-check and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/app/api/uploadthing/core.ts
git commit -m "feat(payments): verify payment ownership on receipt uploads"
```

---

## Task 9: Build the return page

**Files:**
- Create: `src/app/(student)/dashboard/payments/success/page.tsx`

- [ ] **Step 1: Write the page**

Create `src/app/(student)/dashboard/payments/success/page.tsx`:

```tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireStudent } from "@/lib/auth-guards";
import prisma from "@/lib/prisma";
import { retrieveCheckoutSession } from "@/lib/paymongo";
import {
  confirmPaymentFailed,
  confirmPaymentPaid,
} from "@/lib/payments";

type ViewState = "paid" | "confirming" | "failed" | "expired" | "other";

export default async function PaymentSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ paymentId?: string }>;
}) {
  const { paymentId } = await searchParams;
  if (!paymentId) redirect("/dashboard/payments");

  const session = await requireStudent();

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      documentRequest: {
        include: {
          documentType: { select: { name: true } },
        },
      },
    },
  });

  if (!payment || payment.documentRequest.userId !== session.user.id) {
    redirect("/dashboard/payments");
  }

  let viewState: ViewState =
    payment.status === "Paid"
      ? "paid"
      : payment.status === "Failed"
        ? "failed"
        : "confirming";
  let failureReason = payment.failureReason;
  let currentStatus = payment.status;

  if (viewState === "confirming" && payment.checkoutSessionId) {
    try {
      const checkout = await retrieveCheckoutSession(
        payment.checkoutSessionId,
      );
      const paid = checkout.payments.find((p) => p.status === "paid");
      const failed = checkout.payments.find((p) => p.status === "failed");

      if (paid) {
        const transitioned = await confirmPaymentPaid(payment.id, {
          paymongoPaymentId: paid.id,
          paymentIntentId: checkout.paymentIntentId,
          paymentMethodType: paid.sourceType,
        });

        if (transitioned) {
          viewState = "paid";
        } else {
          const current = await prisma.payment.findUnique({
            where: { id: payment.id },
            select: { status: true, failureReason: true },
          });
          failureReason = current?.failureReason ?? failureReason;
          currentStatus = current?.status ?? currentStatus;
          viewState =
            current?.status === "Paid"
              ? "paid"
              : current?.status === "Failed"
                ? "failed"
                : current?.status === "Refunded" ||
                    current?.status === "Cancelled"
                  ? "other"
                  : "confirming";
        }
      } else if (failed) {
        const transitioned = await confirmPaymentFailed(
          payment.id,
          "Payment failed",
        );
        viewState = transitioned ? "failed" : "other";
        if (transitioned) currentStatus = "Failed";
      } else if (checkout.status === "expired") {
        viewState = "expired";
      }
    } catch (error) {
      console.error("Failed to confirm PayMongo checkout session", error);
    }
  }

  const documentName = payment.documentRequest.documentType.name;
  const amount = payment.amount;

  return (
    <div className="container mx-auto flex min-h-[60vh] items-center justify-center py-10">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {viewState === "paid" && (
            <CheckCircle2 className="mx-auto mb-3 h-12 w-12 text-green-600" />
          )}
          {viewState === "confirming" && (
            <Clock className="mx-auto mb-3 h-12 w-12 text-amber-500" />
          )}
          {(viewState === "failed" ||
            viewState === "expired" ||
            viewState === "other") && (
            <XCircle className="mx-auto mb-3 h-12 w-12 text-destructive" />
          )}
          <CardTitle>
            {viewState === "paid" && "Payment confirmed"}
            {viewState === "confirming" && "We're confirming your payment"}
            {viewState === "failed" && "Payment failed"}
            {viewState === "expired" && "Checkout expired"}
            {viewState === "other" && "Payment status"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          {viewState === "paid" && (
            <p className="text-muted-foreground">
              ₱{amount.toLocaleString()} for {documentName} has been received.
            </p>
          )}

          {viewState === "confirming" && (
            <p className="text-muted-foreground">
              We have not received the confirmation yet. Refresh this page in a
              moment, or check the payments page.
            </p>
          )}

          {viewState === "failed" && (
            <p className="text-muted-foreground">
              {failureReason ?? "The payment did not go through."} You can try
              again from the payments page.
            </p>
          )}

          {viewState === "expired" && (
            <p className="text-muted-foreground">
              The checkout session expired. Start a new payment from the
              payments page.
            </p>
          )}

          {viewState === "other" && (
            <p className="text-muted-foreground">
              This payment is {currentStatus.toLowerCase()}. See the payments
              page for details.
            </p>
          )}

          <div className="flex flex-col gap-2">
            {viewState === "confirming" && (
              <Button asChild variant="outline">
                <Link href={`/dashboard/payments/success?paymentId=${payment.id}`}>
                  Refresh
                </Link>
              </Button>
            )}
            <Button asChild>
              <Link href="/dashboard/payments">Back to payments</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add "src/app/(student)/dashboard/payments/success/page.tsx"
git commit -m "feat(payments): add checkout return page"
```

---

## Task 10: Add the PayMongo webhook

**Files:**
- Create: `src/app/api/paymongo/webhook/route.ts`

- [ ] **Step 1: Write the route**

Create `src/app/api/paymongo/webhook/route.ts`:

```ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyWebhookSignature } from "@/lib/paymongo";
import {
  confirmPaymentFailed,
  confirmPaymentPaid,
} from "@/lib/payments";

interface PayMongoEvent {
  data: {
    id: string;
    attributes: {
      type: string;
      livemode: boolean;
      data: {
        id: string;
        attributes: {
          reference_number?: string | null;
          metadata?: { paymentId?: string } | null;
          payment_intent?: { id: string } | null;
          status?: string;
          failure_message?: string | null;
          payments?: Array<{
            id: string;
            attributes: {
              status: string;
              amount: number;
              currency: string;
              source?: { type?: string } | null;
            };
          }>;
        };
      };
    };
  };
}

export async function POST(req: Request) {
  const rawBody = await req.text();
  const secret = process.env.PAYMONGO_WEBHOOK_SECRET;

  if (!secret || secret === "whsec_your_webhook_secret_here") {
    console.error("PAYMONGO_WEBHOOK_SECRET is not configured");
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 },
    );
  }

  let event: PayMongoEvent;
  try {
    event = JSON.parse(rawBody) as PayMongoEvent;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const signature = req.headers.get("paymongo-signature");
  const livemode = event.data?.attributes?.livemode === true;

  if (!verifyWebhookSignature(rawBody, signature, secret, livemode)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const type = event.data?.attributes?.type;
  const resource = event.data?.attributes?.data;

  try {
    if (type === "checkout_session.payment.paid") {
      const attributes = resource.attributes;
      const paymentId =
        attributes.metadata?.paymentId ?? attributes.reference_number;

      if (!paymentId) {
        console.warn("PayMongo webhook missing payment id", {
          eventId: event.data.id,
        });
        return NextResponse.json({ received: true });
      }

      const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
      });

      if (!payment) {
        console.warn("PayMongo webhook for unknown payment", { paymentId });
        return NextResponse.json({ received: true });
      }

      const paid = attributes.payments?.find(
        (entry) => entry.attributes.status === "paid",
      );

      if (!paid) {
        console.warn("checkout_session.payment.paid without paid entry", {
          paymentId,
        });
        return NextResponse.json({ received: true });
      }

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
    } else if (type === "payment.failed") {
      const attributes = resource.attributes;
      const paymentId = attributes.metadata?.paymentId;
      const reason =
        attributes.failure_message ?? attributes.status ?? "Payment failed";

      if (paymentId) {
        await confirmPaymentFailed(paymentId, reason);
      } else {
        console.warn("payment.failed without payment metadata", {
          eventId: event.data.id,
        });
      }
    }
  } catch (error) {
    console.error("PayMongo webhook handler error", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 },
    );
  }

  return NextResponse.json({ received: true });
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/app/api/paymongo/webhook/route.ts
git commit -m "feat(payments): add PayMongo webhook handler"
```

---

## Task 11: Add admin payment actions

**Files:**
- Create: `src/app/(admin)/admin/payments/actions.ts`

- [ ] **Step 1: Write the actions**

Create `src/app/(admin)/admin/payments/actions.ts`:

```ts
"use server";

import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guards";
import { confirmPaymentPaid } from "@/lib/payments";

export async function getAllPayments() {
  await requireAdmin();

  return prisma.payment.findMany({
    include: {
      documentRequest: {
        include: {
          documentType: { select: { name: true } },
          user: {
            select: {
              email: true,
              studentProfile: {
                select: { fullName: true, studentNumber: true },
              },
            },
          },
        },
      },
      uploads: {
        select: { id: true, name: true, url: true, fileType: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function adminMarkPaymentPaid(paymentId: string) {
  await requireAdmin();

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    select: { status: true },
  });

  if (!payment) throw new Error("Payment not found");
  if (!["Pending", "Failed"].includes(payment.status)) {
    throw new Error("This payment cannot be marked paid.");
  }

  const transitioned = await confirmPaymentPaid(paymentId, {
    method: "Cash",
  });

  if (!transitioned) throw new Error("Payment could not be updated.");

  return { success: true };
}

export async function adminMarkPaymentRefunded(paymentId: string) {
  await requireAdmin();

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
  if (payment.status !== "Paid") {
    throw new Error("Only paid payments can be refunded.");
  }

  await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id: paymentId },
      data: { status: "Refunded" },
    });

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
  });

  return { success: true };
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add "src/app/(admin)/admin/payments/actions.ts"
git commit -m "feat(payments): add admin payment actions"
```

---

## Task 12: Build the admin payments page

**Files:**
- Modify: `src/app/(admin)/admin/payments/page.tsx`
- Create: `src/app/(admin)/admin/payments/PaymentsManager.tsx`
- Create: `src/app/(admin)/admin/payments/PaymentDetailDialog.tsx`

- [ ] **Step 1: Replace the page**

Replace `src/app/(admin)/admin/payments/page.tsx` with:

```tsx
import { getAllPayments } from "./actions";
import { PaymentsManager } from "./PaymentsManager";

export default async function AdminPaymentsPage() {
  const payments = await getAllPayments();

  return (
    <PaymentsManager
      payments={payments.map((payment) => ({
        id: payment.id,
        amount: payment.amount,
        method: payment.method,
        status: payment.status,
        referenceNumber: payment.referenceNumber,
        paymentMethodType: payment.paymentMethodType,
        failureReason: payment.failureReason,
        createdAt: payment.createdAt,
        paidAt: payment.paidAt,
        documentRequest: {
          id: payment.documentRequest.id,
          quantity: payment.documentRequest.quantity,
          totalPrice: payment.documentRequest.totalPrice,
          status: payment.documentRequest.status,
          documentType: {
            name: payment.documentRequest.documentType.name,
          },
          user: {
            email: payment.documentRequest.user.email,
            studentProfile: payment.documentRequest.user.studentProfile,
          },
        },
        uploads: payment.uploads,
      }))}
    />
  );
}
```

- [ ] **Step 2: Create the manager**

Create `src/app/(admin)/admin/payments/PaymentsManager.tsx`:

```tsx
"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Search } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PaymentDetailDialog } from "./PaymentDetailDialog";
import {
  adminMarkPaymentPaid,
  adminMarkPaymentRefunded,
} from "./actions";

export interface AdminPayment {
  id: string;
  amount: number;
  method: string;
  status: string;
  referenceNumber: string | null;
  paymentMethodType: string | null;
  failureReason: string | null;
  createdAt: Date;
  paidAt: Date | null;
  documentRequest: {
    id: string;
    quantity: number;
    totalPrice: number;
    status: string;
    documentType: { name: string };
    user: {
      email: string;
      studentProfile: {
        fullName: string;
        studentNumber: string;
      } | null;
    };
  };
  uploads: Array<{
    id: string;
    name: string;
    url: string;
    fileType: string;
  }>;
}

const statusVariant: Record<
  string,
  "default" | "secondary" | "outline" | "destructive"
> = {
  Pending: "secondary",
  Paid: "default",
  Failed: "destructive",
  Refunded: "outline",
  Cancelled: "outline",
};

const filters = [
  "all",
  "Pending",
  "Paid",
  "Failed",
  "Refunded",
  "Cancelled",
] as const;

type Filter = (typeof filters)[number];

interface PaymentsManagerProps {
  payments: AdminPayment[];
}

export function PaymentsManager({ payments }: PaymentsManagerProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [selected, setSelected] = useState<AdminPayment | null>(null);
  const [isPending, startTransition] = useTransition();

  const outstanding = payments.filter(
    (p) => p.status === "Pending" || p.status === "Failed",
  );
  const outstandingAmount = outstanding.reduce((sum, p) => sum + p.amount, 0);
  const collected = payments
    .filter((p) => p.status === "Paid")
    .reduce((sum, p) => sum + p.amount, 0);

  const filtered = useMemo(() => {
    return payments.filter((payment) => {
      if (filter !== "all" && payment.status !== filter) return false;
      if (!search) return true;

      const query = search.toLowerCase();
      const name =
        payment.documentRequest.user.studentProfile?.fullName ?? "";
      const number =
        payment.documentRequest.user.studentProfile?.studentNumber ?? "";
      const reference = payment.referenceNumber ?? "";

      return (
        name.toLowerCase().includes(query) ||
        number.toLowerCase().includes(query) ||
        reference.toLowerCase().includes(query)
      );
    });
  }, [filter, payments, search]);

  const handleMarkPaid = (paymentId: string) => {
    startTransition(async () => {
      try {
        await adminMarkPaymentPaid(paymentId);
        toast.success("Payment marked as paid.");
        setSelected(null);
        router.refresh();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Could not update payment.",
        );
      }
    });
  };

  const handleRefund = (paymentId: string) => {
    startTransition(async () => {
      try {
        await adminMarkPaymentRefunded(paymentId);
        toast.success("Payment marked as refunded.");
        setSelected(null);
        router.refresh();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Could not update payment.",
        );
      }
    });
  };

  return (
    <div className="container mx-auto py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Payments</h1>
        <p className="mt-1 text-muted-foreground">
          Review payments and verify cash receipts.
        </p>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Outstanding</p>
          <p className="text-2xl font-bold">
            ₱{outstandingAmount.toLocaleString()}
          </p>
          <p className="text-sm text-muted-foreground">
            {outstanding.length} pending or failed
          </p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Collected</p>
          <p className="text-2xl font-bold">₱{collected.toLocaleString()}</p>
          <p className="text-sm text-muted-foreground">
            {payments.filter((p) => p.status === "Paid").length} paid
          </p>
        </div>
      </div>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by student name, number, or reference..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {filters.map((value) => (
            <Button
              key={value}
              size="sm"
              variant={filter === value ? "default" : "outline"}
              onClick={() => setFilter(value)}
            >
              {value === "all" ? "All" : value}
            </Button>
          ))}
        </div>
      </div>

      <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Document</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Proof</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-24 text-center text-muted-foreground"
                >
                  No payments found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((payment) => (
                <TableRow
                  key={payment.id}
                  className="cursor-pointer"
                  onClick={() => setSelected(payment)}
                >
                  <TableCell>
                    <p className="font-medium">
                      {payment.documentRequest.user.studentProfile?.fullName ??
                        "Unknown"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {payment.documentRequest.user.studentProfile
                        ?.studentNumber ?? "—"}
                    </p>
                  </TableCell>
                  <TableCell>
                    {payment.documentRequest.documentType.name}
                  </TableCell>
                  <TableCell>
                    ₱{payment.amount.toLocaleString()}
                  </TableCell>
                  <TableCell>{payment.method}</TableCell>
                  <TableCell>
                    <Badge
                      variant={statusVariant[payment.status] ?? "secondary"}
                    >
                      {payment.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {payment.uploads.length > 0
                      ? `${payment.uploads.length} file(s)`
                      : "—"}
                  </TableCell>
                  <TableCell>
                    {format(new Date(payment.createdAt), "MMM d, yyyy")}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <PaymentDetailDialog
        payment={selected}
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
        onMarkPaid={handleMarkPaid}
        onRefund={handleRefund}
        isPending={isPending}
      />
    </div>
  );
}
```

- [ ] **Step 3: Create the detail dialog**

Create `src/app/(admin)/admin/payments/PaymentDetailDialog.tsx`:

```tsx
"use client";

import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { AdminPayment } from "./PaymentsManager";

interface PaymentDetailDialogProps {
  payment: AdminPayment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMarkPaid: (paymentId: string) => void;
  onRefund: (paymentId: string) => void;
  isPending: boolean;
}

const statusVariant: Record<
  string,
  "default" | "secondary" | "outline" | "destructive"
> = {
  Pending: "secondary",
  Paid: "default",
  Failed: "destructive",
  Refunded: "outline",
  Cancelled: "outline",
};

export function PaymentDetailDialog({
  payment,
  open,
  onOpenChange,
  onMarkPaid,
  onRefund,
  isPending,
}: PaymentDetailDialogProps) {
  if (!payment) return null;

  const canMarkPaid =
    payment.status === "Pending" || payment.status === "Failed";
  const canRefund = payment.status === "Paid";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Payment Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Student</p>
              <p className="font-medium">
                {payment.documentRequest.user.studentProfile?.fullName ??
                  "Unknown"}
              </p>
              <p className="text-sm text-muted-foreground">
                {payment.documentRequest.user.studentProfile?.studentNumber ??
                  "—"}
              </p>
              <p className="text-sm text-muted-foreground">
                {payment.documentRequest.user.email}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge
                variant={statusVariant[payment.status] ?? "secondary"}
              >
                {payment.status}
              </Badge>
              <p className="mt-2 text-sm text-muted-foreground">
                {payment.method}
                {payment.paymentMethodType
                  ? ` • ${payment.paymentMethodType}`
                  : ""}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Amount</p>
              <p className="font-medium">
                ₱{payment.amount.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Reference</p>
              <p className="font-medium">
                {payment.referenceNumber ?? "—"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Document</p>
              <p className="font-medium">
                {payment.documentRequest.documentType.name}
              </p>
              <p className="text-sm text-muted-foreground">
                Qty {payment.documentRequest.quantity} • Request{" "}
                {payment.documentRequest.status}
              </p>
            </div>
            <div>
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
          </div>

          {payment.failureReason && (
            <div>
              <p className="text-sm text-muted-foreground">Failure Reason</p>
              <p className="text-sm text-destructive">
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
                  <li key={upload.id}>
                    <a
                      href={upload.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      {upload.name}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t pt-4">
          {canMarkPaid && (
            <Button
              onClick={() => onMarkPaid(payment.id)}
              disabled={isPending}
            >
              Mark as Paid
            </Button>
          )}

          {canRefund && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={isPending}>
                  Mark as Refunded
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Mark this payment refunded?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Refund the transaction in the PayMongo dashboard first,
                    then record it here. This does not move money by itself.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onRefund(payment.id)}>
                    Record refund
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}

          {!canMarkPaid && !canRefund && (
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 4: Type-check and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors

- [ ] **Step 5: Commit**

```bash
git add "src/app/(admin)/admin/payments/page.tsx" "src/app/(admin)/admin/payments/PaymentsManager.tsx" "src/app/(admin)/admin/payments/PaymentDetailDialog.tsx"
git commit -m "feat(payments): add admin payments page"
```

---

## Task 13: Update notifications and existing payment displays

**Files:**
- Modify: `src/lib/notifications.ts`
- Modify: `src/app/(student)/dashboard/actions.ts`
- Modify: `src/components/dashboard/balance-card.tsx`
- Modify: `src/app/(student)/dashboard/requests/RequestsList.tsx`
- Modify: `src/app/(admin)/admin/requests/RequestDetailDialog.tsx`

- [ ] **Step 1: Map payment notifications**

In `src/lib/notifications.ts`, inside `getNotificationUrl`, before the `document_request` check, add:

```ts
  if (notification.relatedEntityType === "payment") {
    return "/dashboard/payments";
  }
```

- [ ] **Step 2: Count failed payments as outstanding**

In `src/app/(student)/dashboard/actions.ts`, change the `pendingBalance` aggregate filter from:

```ts
        status: "Pending",
```

to:

```ts
        status: { in: ["Pending", "Failed"] },
```

- [ ] **Step 3: Update the balance card label**

In `src/components/dashboard/balance-card.tsx`, change:

```tsx
        <CardTitle className="text-base">Pending Balance</CardTitle>
```

to:

```tsx
        <CardTitle className="text-base">Outstanding Balance</CardTitle>
```

- [ ] **Step 4: Use the `Paid` vocabulary in the request list**

In `src/app/(student)/dashboard/requests/RequestsList.tsx`, replace the payment badge variant expression with:

```tsx
                            variant={
                              request.payment.status === "Paid"
                                ? "default"
                                : request.payment.status === "Failed"
                                  ? "destructive"
                                  : request.payment.status === "Refunded" ||
                                      request.payment.status === "Cancelled"
                                    ? "outline"
                                    : "secondary"
                            }
```

- [ ] **Step 5: Show payment in the admin request dialog**

In `src/app/(admin)/admin/requests/RequestDetailDialog.tsx`, after the Status grid item, add:

```tsx
            <div>
              <p className="text-sm text-muted-foreground">Payment</p>
              <p className="font-medium">
                {request.payment
                  ? `${request.payment.method} — ${request.payment.status}`
                  : "Not paid"}
              </p>
            </div>
```

Disable Reject when the payment is terminal. Change the Reject button's `disabled` prop to:

```tsx
                disabled={
                  isPending ||
                  request.payment?.status === "Paid" ||
                  request.payment?.status === "Refunded"
                }
```

Disable the main action when completing an unpaid request. Change the main action button's `disabled` prop to:

```tsx
                disabled={
                  isPending ||
                  (action.nextStatus === "Completed" &&
                    request.payment?.status !== "Paid")
                }
```

- [ ] **Step 6: Type-check and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors

- [ ] **Step 7: Commit**

```bash
git add src/lib/notifications.ts "src/app/(student)/dashboard/actions.ts" src/components/dashboard/balance-card.tsx "src/app/(student)/dashboard/requests/RequestsList.tsx" "src/app/(admin)/admin/requests/RequestDetailDialog.tsx"
git commit -m "feat(payments): wire notifications and payment displays"
```

---

## Task 14: Document environment variables and remove the empty route

**Files:**
- Create: `.env.example`
- Remove: `src/app/api/paymongo/create-intent/` (empty directory)

- [ ] **Step 1: Create `.env.example`**

Create `.env.example`:

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/oneclickcredentials"
MONGODB_URI="mongodb://localhost:27017/oneclickcredentials"

# Better Auth
BETTER_AUTH_SECRET="generate-with-openssl-rand-base64-32"
BETTER_AUTH_URL="http://localhost:3000"
BETTER_AUTH_API_KEY=""
BETTER_AUTH_TELEMETRY="0"

# App
NEXT_PUBLIC_BASE_URL="http://localhost:3000"

# Email (Resend)
RESEND_API_KEY=""
EMAIL_SENDER_NAME="OneClickCredentials"
EMAIL_SENDER_ADDRESS="noreply@example.com"
EMAIL_DEFAULT_SENDER="noreply@example.com"

# Uploads
UPLOADTHING_TOKEN=""
CLOUDINARY_URL=""

# OAuth (optional)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
FACEBOOK_CLIENT_ID=""
FACEBOOK_CLIENT_SECRET=""
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""

# PayMongo (test mode)
PAYMONGO_PUBLIC_KEY="pk_test_..."
PAYMONGO_SECRET_KEY="sk_test_..."
PAYMONGO_WEBHOOK_SECRET="whsec_..."
```

- [ ] **Step 2: Remove the empty create-intent directory**

Run:

```bash
rmdir "src/app/api/paymongo/create-intent"
```

Expected: no output. If it is not empty, stop and inspect its contents before deleting anything.

- [ ] **Step 3: Commit**

```bash
git add .env.example
git commit -m "chore(payments): document env vars and remove empty route"
```

---

## Task 15: Verify end to end

**Files:** none

- [ ] **Step 1: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 2: Lint**

Run: `npm run lint`
Expected: no errors

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: a successful production build

- [ ] **Step 4: Start the dev server**

Run: `npm run dev`
Expected: the app starts on `http://localhost:3000`

- [ ] **Step 5: Run the manual checks**

With a student account:

1. Create a request. Confirm the dashboard balance shows the amount and the request row shows `Cash - Pending`.
2. Open `/dashboard/payments`. Confirm the payment is listed as outstanding.
3. Click **Pay Online**. Confirm the redirect to PayMongo.
4. Pay with test card `4343434343434345`, any future expiry, CVV `123`. Confirm the return page shows "Payment confirmed" and the payment becomes `Paid`.
5. Upload a receipt from the payments page. Confirm it appears in the admin dialog.
6. As an admin, open `/admin/payments`, filter by status, search by student, and mark a pending cash payment `Paid`. Confirm the student notification appears.
7. Reject an unpaid request. Confirm the payment becomes `Cancelled`.
8. Try to reject a paid request and try to complete an unpaid request. Confirm both are blocked with an error.
9. Open `/dashboard/payments/success?paymentId=<paid id>` again. Confirm it still shows Paid and does not create a duplicate notification.

With a webhook tunnel (optional but required for production confidence):

1. Expose the app with `cloudflared tunnel --url http://localhost:3000`.
2. Register `https://<host>/api/paymongo/webhook` in the PayMongo dashboard and subscribe to `checkout_session.payment.paid` and `payment.failed`.
3. Put the real signing secret in `PAYMONGO_WEBHOOK_SECRET`.
4. Pay with the browser closed before returning. Confirm the webhook marks the payment `Paid`.
5. Replay the event. Confirm no duplicate notification.

- [ ] **Step 6: Commit any fixes**

```bash
git add -A
git commit -m "fix(payments): address verification findings"
```

Only create this commit if Step 5 required code changes.

---

## Task 16: Update the implementation-gaps audit

**Files:**
- Modify: `docs/implementation-gaps.md`

- [ ] **Step 1: Mark Module 4 as implemented**

Replace the entire "### 1. Payment system (Module 4) — biggest gap" section with:

```md
### 1. Payment system (Module 4) — implemented

- `/dashboard/payments` and `/admin/payments` are implemented.
- `Payment` rows are created with every request.
- Cash receipt upload and admin verification are wired.
- PayMongo Hosted Checkout covers GCash, Maya, cards, and QRPh.
- The webhook verifies signatures and the return page provides a fallback.
- Remaining: automated refunds and email notifications for payment events.
```

- [ ] **Step 2: Update the suggested priority list**

Remove item 1 (Payments end-to-end) from the numbered list and renumber the rest.

- [ ] **Step 3: Commit**

```bash
git add docs/implementation-gaps.md
git commit -m "docs: mark payments module as implemented"
```
