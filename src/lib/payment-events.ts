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
