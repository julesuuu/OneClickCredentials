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
