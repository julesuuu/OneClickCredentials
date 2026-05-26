import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { VerificationStatus } from "./_components/VerificationStatus";

export default async function VerificationPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/auth/sign-in");
  }

  if (session.user.role === "admin") {
    redirect("/admin");
  }

  const studentProfile = await prisma.studentProfile.findUnique({
    where: { userId: session.user.id },
    include: {
      uploads: {
        where: { category: "proofOfEnrollment" },
        select: { id: true, url: true, fileType: true, createdAt: true },
      },
    },
  });

  if (!studentProfile) {
    redirect("/dashboard/onboarding");
  }

  return (
    <VerificationStatus
      isVerified={studentProfile.isVerified}
      declineReason={studentProfile.declineReason}
      hasUploads={studentProfile.uploads.length > 0}
      lastUpload={studentProfile.uploads[0] || null}
    />
  );
}