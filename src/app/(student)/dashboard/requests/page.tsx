import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { RequestsList } from "./RequestsList";

export default async function RequestsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    redirect("/auth/sign-in");
  }

  if (session.user.role === "admin") {
    redirect("/admin");
  }

  const requests = await prisma.documentRequest.findMany({
    where: { userId: session.user.id },
    include: {
      documentType: {
        select: {
          name: true,
          description: true,
          price: true,
        },
      },
      payment: true,
      appointment: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return <RequestsList requests={requests} />;
}