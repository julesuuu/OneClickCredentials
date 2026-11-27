"use server";

import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guards";
import { buildAdminActivity } from "./activity";

export async function getAdminDashboardData() {
  await requireAdmin();

  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const startOfTomorrow = new Date(startOfToday);
  startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);

  const [
    totalStudents,
    newStudentsThisMonth,
    pendingVerifications,
    activeRequests,
    readyForPickup,
    todaysAppointments,
    nextAppointment,
    pendingPayments,
    pendingPaymentTotal,
    activeDocumentTypes,
    inactiveDocumentTypes,
    requestsByStatus,
    recentRequests,
    recentPayments,
    recentAppointments,
    recentStudents,
  ] = await Promise.all([
    prisma.studentProfile.count(),
    prisma.studentProfile.count({
      where: { createdAt: { gte: firstOfMonth } },
    }),
    prisma.studentProfile.count({
      where: { isVerified: false, declineReason: null },
    }),
    prisma.documentRequest.count({
      where: { status: { in: ["Pending", "Processing"] } },
    }),
    prisma.documentRequest.count({
      where: { status: "Ready" },
    }),
    prisma.appointment.count({
      where: {
        status: "Scheduled",
        date: { gte: startOfToday, lt: startOfTomorrow },
      },
    }),
    prisma.appointment.findFirst({
      where: { status: "Scheduled", date: { gte: startOfToday } },
      orderBy: [{ date: "asc" }, { timeSlot: "asc" }],
      select: {
        date: true,
        timeSlot: true,
        documentRequest: {
          select: {
            documentType: { select: { name: true } },
            user: {
              select: {
                name: true,
                studentProfile: { select: { fullName: true } },
              },
            },
          },
        },
      },
    }),
    prisma.payment.count({
      where: { status: "Pending" },
    }),
    prisma.payment.aggregate({
      where: { status: "Pending" },
      _sum: { amount: true },
    }),
    prisma.documentType.count({
      where: { isActive: true },
    }),
    prisma.documentType.count({
      where: { isActive: false },
    }),
    prisma.documentRequest.groupBy({
      by: ["status"],
      _count: true,
    }),
    prisma.documentRequest.findMany({
      orderBy: { updatedAt: "desc" },
      take: 10,
      select: {
        id: true,
        quantity: true,
        status: true,
        updatedAt: true,
        documentType: { select: { name: true } },
        user: {
          select: {
            name: true,
            studentProfile: { select: { fullName: true } },
          },
        },
      },
    }),
    prisma.payment.findMany({
      orderBy: { updatedAt: "desc" },
      take: 10,
      select: {
        id: true,
        amount: true,
        status: true,
        updatedAt: true,
        documentRequest: {
          select: {
            documentType: { select: { name: true } },
            user: {
              select: {
                name: true,
                studentProfile: { select: { fullName: true } },
              },
            },
          },
        },
      },
    }),
    prisma.appointment.findMany({
      orderBy: { updatedAt: "desc" },
      take: 10,
      select: {
        id: true,
        date: true,
        timeSlot: true,
        status: true,
        updatedAt: true,
        documentRequest: {
          select: {
            documentType: { select: { name: true } },
            user: {
              select: {
                name: true,
                studentProfile: { select: { fullName: true } },
              },
            },
          },
        },
      },
    }),
    prisma.studentProfile.findMany({
      orderBy: { updatedAt: "desc" },
      take: 10,
      select: {
        id: true,
        fullName: true,
        isVerified: true,
        declineReason: true,
        updatedAt: true,
      },
    }),
  ]);

  const statusBreakdown = Object.fromEntries(
    requestsByStatus.map((s) => [s.status, s._count]),
  );

  const recentActivity = buildAdminActivity({
    requests: recentRequests,
    payments: recentPayments,
    appointments: recentAppointments,
    students: recentStudents,
  });

  return {
    totalStudents,
    newStudentsThisMonth,
    pendingVerifications,
    activeRequests,
    readyForPickup,
    todaysAppointments,
    nextAppointment,
    pendingPayments,
    pendingPaymentTotal: pendingPaymentTotal._sum.amount ?? 0,
    activeDocumentTypes,
    inactiveDocumentTypes,
    statusBreakdown,
    recentActivity,
  };
}
