"use server";

import prisma from "@/lib/prisma";
import { requireStudent } from "@/lib/auth-guards";
import {
  createCheckoutSession,
  retrieveCheckoutSession,
} from "@/lib/paymongo";
import { canStartCheckout } from "@/lib/payment-rules";
import {
  buildExternalEventId,
  recordPaymentEvent,
} from "@/lib/payment-events";

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

  if (!canStartCheckout(payment.status, payment.documentRequest.status)) {
    throw new Error("This payment is no longer payable.");
  }

  if (payment.checkoutSessionId) {
    try {
      const existing = await retrieveCheckoutSession(
        payment.checkoutSessionId,
      );

      if (existing.status === "active" && existing.checkoutUrl) {
        // Sessions created before the paymaya fix carry the invalid "maya"
        // identifier and fail at checkout, so never reuse those.
        if (existing.paymentMethodTypes.includes("maya")) {
          console.warn(
            "Discarding checkout session created with the invalid maya method",
            { checkoutSessionId: existing.id },
          );
        } else {
          if (payment.method !== "Online") {
            await prisma.payment.update({
              where: { id: payment.id },
              data: { method: "Online" },
            });
          }
          return { checkoutUrl: existing.checkoutUrl };
        }
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

  return { checkoutUrl: checkout.checkoutUrl };
}
