"use server";

import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guards";
import { canRefund, canTransitionToPaid } from "@/lib/payment-rules";
import { recordPaymentEvent } from "@/lib/payment-events";
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
    },
    orderBy: { createdAt: "desc" },
  });
}

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
