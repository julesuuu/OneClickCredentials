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
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return students;
}
