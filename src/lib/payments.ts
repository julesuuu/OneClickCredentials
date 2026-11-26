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
