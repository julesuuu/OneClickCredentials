"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import { z } from "zod";

const profileUpdateSchema = z.object({
  fullName: z
    .string()
    .min(5, "Name must be at least 5 characters")
    .max(100, "Name must be at most 100 characters"),
  phoneNumber: z
    .string()
    .regex(
      /^09\d{9}$/,
      "Must be a valid 11-digit PH mobile number starting with 09",
    ),
  gender: z.enum(["MALE", "FEMALE", "NON_BINARY", "PREFER_NOT_TO_SAY", "OTHER"]),
  birthDate: z.coerce.date(),
  course: z.enum(["BSIT", "BSHM", "BSBA", "BEED", "BSED", "BSCRIM"]),
  yearLevel: z.enum([
    "FIRST_YEAR",
    "SECOND_YEAR",
    "THIRD_YEAR",
    "FOURTH_YEAR",
    "GRADUATE",
    "IRREGULAR",
  ]),
});

export async function getProfile() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) return null;

  const [profile, user] = await Promise.all([
    prisma.studentProfile.findUnique({
      where: { userId: session.user.id },
      select: {
        fullName: true,
        gender: true,
        birthDate: true,
        phoneNumber: true,
        lrn: true,
        studentNumber: true,
        course: true,
        yearLevel: true,
        isVerified: true,
        declineReason: true,
      },
    }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, image: true },
    }),
  ]);

  if (!profile) return null;

  return {
    ...profile,
    birthDate: profile.birthDate.toISOString().split("T")[0],
    email: session.user.email,
    name: user?.name ?? session.user.name,
    image: user?.image ?? null,
  };
}

export async function updateProfile(formData: {
  fullName: string;
  phoneNumber: string;
  gender: string;
  birthDate: string;
  course: string;
  yearLevel: string;
}) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const validated = profileUpdateSchema.safeParse(formData);
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.issues.map((i) => i.message).join(", "),
      };
    }

    await prisma.studentProfile.update({
      where: { userId: session.user.id },
      data: {
        fullName: validated.data.fullName,
        phoneNumber: validated.data.phoneNumber,
        gender: validated.data.gender,
        birthDate: new Date(validated.data.birthDate),
        course: validated.data.course,
        yearLevel: validated.data.yearLevel,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Profile update error:", error);
    return { success: false, error: "Failed to update profile" };
  }
}
