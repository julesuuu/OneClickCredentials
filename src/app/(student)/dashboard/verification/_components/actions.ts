"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";

interface VerificationSubmitData {
  proofOfEnrollmentUrl: string;
  proofOfEnrollmentUploadId: string;
}

export async function submitVerificationAction(data: VerificationSubmitData) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized. Please sign in again." };
    }

    const studentProfile = await prisma.studentProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!studentProfile) {
      return { success: false, error: "Profile not found." };
    }

    await prisma.studentProfile.update({
      where: { id: studentProfile.id },
      data: {
        isVerified: false,
        declineReason: null,
      },
    });

    if (data.proofOfEnrollmentUploadId) {
      await prisma.upload.update({
        where: { id: data.proofOfEnrollmentUploadId },
        data: { studentProfileId: studentProfile.id },
      });
    }

    await prisma.notification.create({
      data: {
        studentProfileId: studentProfile.id,
        title: "Verification Resubmitted",
        message: "Your verification has been resubmitted for review. We'll notify you once processed.",
        type: "PENDING",
      },
    });

    return { success: true };
  } catch (error: unknown) {
    console.error("Verification submission error:", error);
    return {
      success: false,
      error: "An unexpected error occurred during submission.",
    };
  }
}