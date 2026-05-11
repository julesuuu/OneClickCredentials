"use server";

import prisma from "@/lib/prisma";

export async function getStudents() {
  const students = await prisma.studentProfile.findMany({
    include: {
      user: {
        select: {
          email: true,
        },
      },
      uploads: {
        where: { category: "proofOfEnrollment" },
        select: { id: true, url: true, fileType: true },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return students;
}

export async function verifyStudent(studentId: string, isVerified: boolean, declineReason?: string) {
  const student = await prisma.studentProfile.update({
    where: { id: studentId },
    data: {
      isVerified,
      declineReason: isVerified ? null : declineReason ?? null,
    },
  });

  if (!isVerified && declineReason) {
    await prisma.notification.create({
      data: {
        studentProfileId: studentId,
        title: "Verification Rejected",
        message: `Your verification was rejected. Reason: ${declineReason}. Please re-upload your proof of enrollment.`,
        type: "REJECTED",
      },
    });
  }

  if (isVerified) {
    await prisma.notification.create({
      data: {
        studentProfileId: studentId,
        title: "Verification Approved",
        message: "Congratulations! Your verification has been approved.",
        type: "VERIFIED",
      },
    });
  }

  return { success: true };
}
