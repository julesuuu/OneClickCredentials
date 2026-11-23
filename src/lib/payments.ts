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
