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
import { sendStudentNotificationEmail } from "@/lib/email";

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
      user: {
        select: {
          email: true,
          name: true,
          studentProfile: { select: { id: true, fullName: true } },
        },
      },
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
  const result = await prisma.$transaction(async (tx) => {
    const payment = await getPaymentContext(tx, paymentId);

    if (!payment || !canTransitionToPaid(payment.status)) {
      return { transitioned: false as const };
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
      return { transitioned: false as const };
    }

    const studentProfileId =
      payment.documentRequest.user.studentProfile?.id ?? null;
    const documentName = payment.documentRequest.documentType.name;

    if (studentProfileId) {
      await tx.notification.create({
        data: {
          studentProfileId,
          title: "Payment Received",
          message: `Your payment of ₱${payment.amount.toLocaleString()} for ${documentName} has been confirmed.`,
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

    return {
      transitioned: true as const,
      email: payment.documentRequest.user.email ?? null,
      studentName:
        payment.documentRequest.user.studentProfile?.fullName ??
        payment.documentRequest.user.name ??
        "Student",
      amount: payment.amount,
      documentName,
      method: details.method ?? "Online",
    };
  });

  if (!result.transitioned) {
    return false;
  }

  if (result.email) {
    await sendStudentNotificationEmail({
      to: result.email,
      studentName: result.studentName,
      subject: `Payment Received: ${result.documentName}`,
      title: "Payment Received",
      message: `Your payment of ₱${result.amount.toLocaleString()} for ${result.documentName} has been confirmed.`,
      tone: "success",
      badgeText: "Paid",
      details: [
        { label: "Document", value: result.documentName },
        { label: "Amount", value: `₱${result.amount.toLocaleString()}` },
        { label: "Method", value: result.method },
      ],
      actionLabel: "View Payments",
      actionPath: "/dashboard/payments",
    });
  }

  return true;
}

export async function confirmPaymentFailed(
  paymentId: string,
  reason?: string | null,
  context: PaymentTransitionContext = {},
): Promise<boolean> {
  const result = await prisma.$transaction(async (tx) => {
    const payment = await getPaymentContext(tx, paymentId);

    if (!payment || !canTransitionToFailed(payment.status)) {
      return { transitioned: false as const };
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
      return { transitioned: false as const };
    }

    const studentProfileId =
      payment.documentRequest.user.studentProfile?.id ?? null;
    const documentName = payment.documentRequest.documentType.name;

    if (studentProfileId) {
      await tx.notification.create({
        data: {
          studentProfileId,
          title: "Payment Failed",
          message: `Your payment for ${documentName} failed. You can try again.`,
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

    return {
      transitioned: true as const,
      email: payment.documentRequest.user.email ?? null,
      studentName:
        payment.documentRequest.user.studentProfile?.fullName ??
        payment.documentRequest.user.name ??
        "Student",
      amount: payment.amount,
      documentName,
      failureReason,
    };
  });

  if (!result.transitioned) {
    return false;
  }

  if (result.email) {
    await sendStudentNotificationEmail({
      to: result.email,
      studentName: result.studentName,
      subject: `Payment Failed: ${result.documentName}`,
      title: "Payment Failed",
      message: `Your payment for ${result.documentName} could not be completed. You can retry the payment from your dashboard.`,
      tone: "danger",
      badgeText: "Failed",
      details: [
        { label: "Document", value: result.documentName },
        { label: "Amount", value: `₱${result.amount.toLocaleString()}` },
      ],
      reason: result.failureReason,
      actionLabel: "Retry Payment",
      actionPath: "/dashboard/payments",
    });
  }

  return true;
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
