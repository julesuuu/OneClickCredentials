"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

type ActivityItem =
  | { id: string; type: "request"; documentTypeName: string; status: string; declineReason: string | null; createdAt: Date }
  | { id: string; type: "appointment"; documentTypeName: string; status: string; date: Date; timeSlot: string; createdAt: Date };

export async function getDashboardData() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return null;
  }

  const userId = session.user.id;
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalCount,
    pendingCount,
    completedCount,
    declinedCount,
    recentRequests,
    upcomingAppointment,
    pendingBalance,
    requestsThisMonth,
    recentAppointments,
    studentProfile,
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
    prisma.documentRequest.count({
      where: {
        userId,
        createdAt: { gte: startOfMonth },
      },
    }),
    prisma.appointment.findMany({
      where: {
        documentRequest: {
          userId,
        },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
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
    prisma.studentProfile.findUnique({
      where: { userId },
      select: { isProfileComplete: true, isVerified: true },
    }),
  ]);

  const requestActivityItems: ActivityItem[] = recentRequests.map((r) => ({
    id: r.id,
    type: "request" as const,
    documentTypeName: r.documentType.name,
    status: r.status,
    declineReason: r.declineReason,
    createdAt: r.createdAt,
  }));

  const appointmentActivityItems: ActivityItem[] = recentAppointments.map((a) => ({
    id: a.id,
    type: "appointment" as const,
    documentTypeName: a.documentRequest.documentType.name,
    status: a.status,
    date: a.date,
    timeSlot: a.timeSlot,
    createdAt: a.createdAt,
  }));

  const recentActivity = [...requestActivityItems, ...appointmentActivityItems]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 5);

  const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return {
    userName: session.user.name,
    userImage: session.user.image,
    stats: {
      total: totalCount,
      pending: pendingCount,
      completed: completedCount,
      declined: declinedCount,
    },
    requestsThisMonth,
    completionRate,
    recentRequests,
    recentActivity,
    upcomingAppointment,
    pendingAmount: pendingBalance._sum.amount ?? 0,
    profile: studentProfile ?? { isProfileComplete: false, isVerified: false },
  };
}
