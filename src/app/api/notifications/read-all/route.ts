import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PATCH() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const studentProfile = await prisma.studentProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  if (!studentProfile) {
    return NextResponse.json({ error: "Student profile not found" }, { status: 404 });
  }

  const result = await prisma.notification.updateMany({
    where: { studentProfileId: studentProfile.id, isRead: false },
    data: { isRead: true },
  });

  return NextResponse.json({ count: result.count });
}
