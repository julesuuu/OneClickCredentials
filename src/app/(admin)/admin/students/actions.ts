"use server";

import prisma from "@/lib/prisma";

export async function getStudents({
  search = "",
  filter = "all",
}: {
  search?: string;
  filter?: "all" | "pending" | "verified";
} = {}) {
  const where: {
    OR?: Array<{
      fullName?: { contains: string; mode: "insensitive" };
      studentNumber?: { contains: string; mode: "insensitive" };
      user?: { email?: { contains: string; mode: "insensitive" } };
    }>;
    isVerified?: boolean;
  } = {};

  if (search) {
    where.OR = [
      { fullName: { contains: search, mode: "insensitive" } },
      { studentNumber: { contains: search, mode: "insensitive" } },
      { user: { email: { contains: search, mode: "insensitive" } } },
    ];
  }

  if (filter === "verified") {
    where.isVerified = true;
  } else if (filter === "pending") {
    where.isVerified = false;
  }

  const students = await prisma.studentProfile.findMany({
    where,
    include: {
      user: {
        select: {
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return students;
}
