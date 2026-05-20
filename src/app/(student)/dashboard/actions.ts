"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function getDashboardData() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return null;
  }

  const userId = session.user.id;

  const [
    totalCount,
    pendingCount,
    completedCount,
    declinedCount,
    recentRequests,
    upcomingAppointment,
    pendingBalance,
  ] = await Promise.all([
    prisma.documentRequest.count({
      where: { userId },
    }),
    prisma.documentRequest.count({
      where: { userId, status: { in: ["Pending", "Processing"] } },
    }),
    prisma.documentRequest.count({
      where: { userId, status: { in: ["Completed", "Ready"] } },
    }),
    prisma.documentRequest.count({
      where: { userId, status: { in: ["Rejected", "Cancelled"] } },
    }),
    prisma.documentRequest.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        documentType: {
          select: { name: true },
        },
      },
    }),
    prisma.appointment.findFirst({
      where: {
        documentRequest: {
          userId,
        },
        status: "Scheduled",
        date: {
          gte: new Date(),
        },
      },
      orderBy: { date: "asc" },
      include: {
        documentRequest: {
          include: {
            documentType: {
              select: { name: true },
            },
          },
        },
      },
    }),
    prisma.payment.aggregate({
      where: {
        documentRequest: {
          userId,
        },
        status: "Pending",
      },
      _sum: {
        amount: true,
      },
    }),
  ]);

  return {
    userName: session.user.name,
    stats: {
      total: totalCount,
      pending: pendingCount,
      completed: completedCount,
      declined: declinedCount,
    },
    recentRequests,
    upcomingAppointment,
    pendingAmount: pendingBalance._sum.amount ?? 0,
  };
}
