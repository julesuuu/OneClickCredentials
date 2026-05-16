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

  let studentProfile = await prisma.studentProfile.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      fullName: "",
      gender: "MALE",
      birthDate: new Date(),
      phoneNumber: "",
      lrn: `temp_${session.user.id}_${Date.now()}`,
      studentNumber: "",
      course: "BSIT",
      yearLevel: "FIRST_YEAR",
      isProfileComplete: false,
    },
    update: {},
    select: { id: true, isProfileComplete: true },
  });

  if (studentProfile.isProfileComplete) {
    redirect("/dashboard");
  }

  return <OnboardingForm studentProfileId={studentProfile.id} />;
}
