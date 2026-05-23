"use server";

import prisma from "@/lib/prisma";

export async function getAdminDashboardData() {
  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalStudents,
    newStudentsThisMonth,
    pendingVerifications,
    activeRequests,
    readyForPickup,
    recentRequests,
    requestsByStatus,
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
    prisma.documentRequest.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        user: {
          select: {
            studentProfile: {
              select: { fullName: true },
            },
          },
        },
        documentType: { select: { name: true } },
      },
    }),
    prisma.documentRequest.groupBy({
      by: ["status"],
      _count: true,
    }),
  ]);

  const statusBreakdown = Object.fromEntries(
    requestsByStatus.map((s) => [s.status, s._count])
  );

  return {
    totalStudents,
    newStudentsThisMonth,
    pendingVerifications,
    activeRequests,
    readyForPickup,
    recentRequests,
    statusBreakdown,
  };
}
