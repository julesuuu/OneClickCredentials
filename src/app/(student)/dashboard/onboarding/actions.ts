"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import { studentFormSchema } from "./types";
import type { z } from "zod";

export type OnboardingFormData = z.infer<typeof studentFormSchema>;

export async function submitOnboardingAction(formData: OnboardingFormData) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized. Please sign in again." };
    }

    const validationResult = studentFormSchema.safeParse(formData);
    if (!validationResult.success) {
      const errorMessages = validationResult.error.issues
        .map((issue) => issue.message)
        .join(", ");
      return { success: false, error: `Validation failed: ${errorMessages}` };
    }

    const validatedData = validationResult.data;

    await prisma.studentProfile.upsert({
      where: { userId: session.user.id },
      update: {
        fullName: validatedData.fullName,
        gender: validatedData.gender,
        birthDate: new Date(validatedData.birthDate),
        phoneNumber: validatedData.phoneNumber,
        lrn: validatedData.lrn,
        studentNumber: validatedData.studentNumber,
        course: validatedData.course,
        yearLevel: validatedData.yearLevel,
        isProfileComplete: true,
      },
      create: {
        userId: session.user.id,
        fullName: validatedData.fullName,
        gender: validatedData.gender,
        birthDate: new Date(validatedData.birthDate),
        phoneNumber: validatedData.phoneNumber,
        lrn: validatedData.lrn,
        studentNumber: validatedData.studentNumber,
        course: validatedData.course,
        yearLevel: validatedData.yearLevel,
        isProfileComplete: true,
      },
    });

    return { success: true };
  } catch (error: unknown) {
    console.error("Onboarding submission error:", error);

    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2002" &&
      "meta" in error
    ) {
      const meta = error.meta as { target?: string[] };
      const target = meta?.target;
      if (target?.includes("lrn")) {
        return { success: false, error: "This LRN is already registered." };
      }
      if (target?.includes("studentNumber")) {
        return {
          success: false,
          error: "This student number is already registered.",
        };
      }
      if (target?.includes("userId")) {
        return {
          success: false,
          error: "A profile already exists for this user.",
        };
      }
    }

    return {
      success: false,
      error: "An unexpected error occurred during onboarding.",
    };
  }
}
