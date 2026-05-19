import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NewRequestForm } from "./NewRequestForm";

export default async function NewRequestPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    redirect("/auth/sign-in");
  }

  if (session.user.role === "admin") {
    redirect("/admin");
  }

  const documentTypes = await prisma.documentType.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      description: true,
      price: true,
    },
  });

  return (
    <NewRequestForm
      documentTypes={documentTypes.map((d) => ({
        id: d.id,
        name: d.name,
        description: d.description,
        price: d.price,
      }))}
    />
  );
}