"use server";

import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guards";
import {
  canCancelPayment,
  canCompleteRequest,
  canRejectRequest,
} from "@/lib/payment-rules";
import { recordPaymentEvent } from "@/lib/payment-events";

export async function getAllRequests() {
  const requests = await prisma.documentRequest.findMany({
    include: {
      user: {
        select: {
          email: true,
          studentProfile: {
            select: {
              id: true,
              fullName: true,
              studentNumber: true,
              course: true,
              yearLevel: true,
            },
          },
        },
      },
      documentType: {
        select: {
          name: true,
          price: true,
        },
      },
      payment: {
        select: {
          method: true,
          status: true,
        },
      },
      appointment: {
        select: {
          date: true,
          timeSlot: true,
          status: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return requests;
}

export async function updateRequestStatus(
  requestId: string,
  status: string
) {
  await requireAdmin();

  const request = await prisma.documentRequest.findUnique({
    where: { id: requestId },
    include: {
      payment: { select: { status: true } },
      user: {
        select: {
          studentProfile: { select: { id: true } },
        },
      },
      documentType: { select: { name: true } },
    },
  });

  if (!request) throw new Error("Request not found");

  if (status === "Completed" && !canCompleteRequest(request.payment?.status)) {
    throw new Error("Mark the payment as paid before completing this request.");
  }

  const studentProfileId = request.user.studentProfile?.id;
  if (!studentProfileId) throw new Error("Student profile not found");

  const notificationData: Record<string, { title: string; message: string }> = {
    Processing: {
      title: "Request Being Processed",
      message: `Your request for ${request.documentType.name} is now being processed.`,
    },
    Ready: {
      title: "Ready for Pickup",
      message: `Your ${request.documentType.name} request is ready for pickup.`,
    },
    Completed: {
      title: "Request Completed",
      message: `Your ${request.documentType.name} request has been marked as completed.`,
    },
  };

  await prisma.$transaction([
    prisma.documentRequest.update({
      where: { id: requestId },
      data: { status },
    }),
    prisma.notification.create({
      data: {
        studentProfileId,
        title: notificationData[status]?.title ?? "Status Updated",
        message:
          notificationData[status]?.message ??
          `Your request status has been updated to ${status}.`,
        type: status.toUpperCase(),
        relatedEntityType: "document_request",
        relatedEntityId: requestId,
      },
    }),
  ]);

  return { success: true };
}

export async function rejectRequest(requestId: string, reason: string) {
  const session = await requireAdmin();

  const request = await prisma.documentRequest.findUnique({
    where: { id: requestId },
    include: {
      payment: { select: { id: true, status: true } },
      user: {
        select: {
          studentProfile: { select: { id: true } },
        },
      },
      documentType: { select: { name: true } },
    },
  });

  if (!request) throw new Error("Request not found");

  if (!canRejectRequest(request.payment?.status)) {
    throw new Error("This request has been paid and cannot be rejected.");
  }

  const studentProfileId = request.user.studentProfile?.id;
  if (!studentProfileId) throw new Error("Student profile not found");

  await prisma.$transaction(async (tx) => {
    await tx.documentRequest.update({
      where: { id: requestId },
      data: { status: "Rejected", declineReason: reason },
    });

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
