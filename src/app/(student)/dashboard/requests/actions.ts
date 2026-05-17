"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export async function getDocumentTypes() {
  const types = await prisma.documentType.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      description: true,
      price: true,
    },
  });

  return types;
}

export async function getMyDocumentRequests() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return [];
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

  return requests;
}

export async function createDocumentRequest(formData: FormData) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const documentTypeId = formData.get("documentTypeId") as string;
  const quantity = parseInt(formData.get("quantity") as string, 10);
  const notes = formData.get("notes") as string;

  if (!documentTypeId) {
    throw new Error("Document type is required");
  }

  if (!quantity || quantity < 1) {
    throw new Error("Quantity must be at least 1");
  }

  const MAX_QUANTITY = 5;
  if (quantity > MAX_QUANTITY) {
    throw new Error(`Maximum quantity allowed is ${MAX_QUANTITY}`);
  }

  const documentType = await prisma.documentType.findUnique({
    where: { id: documentTypeId },
  });

  if (!documentType) {
    throw new Error("Invalid document type");
  }

  const totalPrice = Number(documentType.price) * quantity;

  await prisma.documentRequest.create({
    data: {
      userId: session.user.id,
      documentTypeId,
      quantity,
      totalPrice,
      notes: notes || null,
      status: "Pending",
    },
  });

  redirect("/dashboard/requests");
}