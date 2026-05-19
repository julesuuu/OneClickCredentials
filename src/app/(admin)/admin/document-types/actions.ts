"use server";

import prisma from "@/lib/prisma";

export async function getDocumentTypes() {
  return await prisma.documentType.findMany({
    orderBy: { createdAt: "desc" },
  });
}

export async function createDocumentType(formData: FormData) {
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const price = parseFloat(formData.get("price") as string);

  if (!name || isNaN(price)) {
    throw new Error("Name and price are required");
  }

  await prisma.documentType.create({
    data: {
      name,
      description: description || null,
      price,
      isActive: true,
    },
  });

  return { success: true };
}

export async function updateDocumentType(formData: FormData) {
  const id = formData.get("id") as string;
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const price = parseFloat(formData.get("price") as string);
  const isActive = formData.get("isActive") === "true";

  if (!id || !name || isNaN(price)) {
    throw new Error("ID, name and price are required");
  }

  await prisma.documentType.update({
    where: { id },
    data: {
      name,
      description: description || null,
      price,
      isActive,
    },
  });

  return { success: true };
}

export async function deleteDocumentType(id: string) {
  await prisma.documentType.delete({
    where: { id },
  });

  return { success: true };
}

export async function toggleDocumentTypeActive(id: string, isActive: boolean) {
  await prisma.documentType.update({
    where: { id },
    data: { isActive },
  });

  return { success: true };
}