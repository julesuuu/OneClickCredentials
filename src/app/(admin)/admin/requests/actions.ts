"use server";

import prisma from "@/lib/prisma";

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
  const request = await prisma.documentRequest.findUnique({
    where: { id: requestId },
    include: {
      user: {
        select: {
          studentProfile: { select: { id: true } },
        },
      },
      documentType: { select: { name: true } },
    },
  });

  if (!request) throw new Error("Request not found");

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
      },
    }),
  ]);

  return { success: true };
}

export async function rejectRequest(requestId: string, reason: string) {
  const request = await prisma.documentRequest.findUnique({
    where: { id: requestId },
    include: {
      user: {
        select: {
          studentProfile: { select: { id: true } },
        },
      },
      documentType: { select: { name: true } },
    },
  });

  if (!request) throw new Error("Request not found");

  const studentProfileId = request.user.studentProfile?.id;
  if (!studentProfileId) throw new Error("Student profile not found");

  await prisma.$transaction([
    prisma.documentRequest.update({
      where: { id: requestId },
      data: { status: "Rejected", declineReason: reason },
    }),
    prisma.notification.create({
      data: {
        studentProfileId,
        title: "Request Rejected",
        message: `Your request for ${request.documentType.name} was rejected. Reason: ${reason}`,
        type: "REJECTED",
      },
    }),
  ]);

  return { success: true };
}
