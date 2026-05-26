import prisma from "@/lib/prisma";

export async function getDocumentTypes() {
  const types = await prisma.documentType.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      description: true,
      price: true,
    },
    orderBy: { name: "asc" },
  });

  return types.map((t) => ({
    ...t,
    price: t.price,
  }));
}
