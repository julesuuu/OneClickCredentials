"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function updateProfileImage(imageUrl: string) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { image: imageUrl },
  });

  return { success: true };
}
