import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { OnboardingForm } from "./OnboardingForm";

export default async function OnboardingPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    redirect("/auth/sign-in");
  }

  if (session.user.role === "admin") {
    redirect("/admin");
  }

  const studentProfile = await prisma.studentProfile.findUnique({
    where: { userId: session.user.id },
    select: { isProfileComplete: true },
  });

  if (studentProfile?.isProfileComplete) {
    redirect("/dashboard");
  }

  return <OnboardingForm />;
}
