"use server";

import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guards";
import { sendStudentNotificationEmail } from "@/lib/email";

export async function getStudents() {
  await requireAdmin();

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

export async function verifyStudent(
  studentId: string,
  isVerified: boolean,
  declineReason?: string
) {
  await requireAdmin();

  const student = await prisma.studentProfile.update({
    where: { id: studentId },
    data: {
      isVerified,
      declineReason: isVerified ? null : declineReason ?? null,
    },
    include: {
      user: {
        select: {
          email: true,
          name: true,
        },
      },
    },
  });

  let emailSent = false;

  if (!isVerified && declineReason) {
    const title = "Verification Rejected";
    const message = `Your verification was rejected. Reason: ${declineReason}. Please re-upload your proof of enrollment.`;

    await prisma.notification.create({
      data: {
        studentProfileId: studentId,
        title,
        message,
        type: "REJECTED",
        relatedEntityType: "verification",
        relatedEntityId: studentId,
      },
    });

    if (student.user.email) {
      const result = await sendStudentNotificationEmail({
        to: student.user.email,
        studentName: student.fullName || student.user.name || "Student",
        subject: "Student Verification Rejected",
        title,
        message:
          "Your student verification could not be approved. Please review the reason below and re-upload your proof of enrollment.",
        tone: "danger",
        badgeText: "Rejected",
        reason: declineReason,
        actionLabel: "Re-upload Verification",
        actionPath: "/dashboard/verification",
      });
      emailSent = result.sent;
    }
  }

  if (isVerified) {
    const title = "Verification Approved";
    const message = "Congratulations! Your verification has been approved.";

    await prisma.notification.create({
      data: {
        studentProfileId: studentId,
        title,
        message,
        type: "VERIFIED",
        relatedEntityType: "verification",
        relatedEntityId: studentId,
      },
    });

    if (student.user.email) {
      const result = await sendStudentNotificationEmail({
        to: student.user.email,
        studentName: student.fullName || student.user.name || "Student",
        subject: "Student Verification Approved",
        title,
        message:
          "Congratulations! Your student profile has been verified. You can now submit document requests online.",
        tone: "success",
        badgeText: "Verified",
        actionLabel: "Request a Document",
        actionPath: "/dashboard/requests/new",
      });
      emailSent = result.sent;
    }
  }

  return { success: true, emailSent };
}
