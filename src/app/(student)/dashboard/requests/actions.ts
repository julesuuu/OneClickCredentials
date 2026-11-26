"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { recordPaymentEvent } from "@/lib/payment-events";
import { headers } from "next/headers";

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

  const totalPrice = documentType.price * quantity;

  await prisma.$transaction(async (tx) => {
    const request = await tx.documentRequest.create({
      data: {
        userId: session.user.id,
        documentTypeId,
        quantity,
        totalPrice,
        notes: notes || null,
        status: "Pending",
      },
    });

    const payment = await tx.payment.create({
      data: {
        documentRequestId: request.id,
        method: "Cash",
        amount: totalPrice,
        status: "Pending",
      },
    });

    await tx.payment.update({
      where: { id: payment.id },
      data: { referenceNumber: payment.id },
    });

    await recordPaymentEvent(tx, {
      paymentId: payment.id,
      type: "CREATED",
      fromStatus: null,
      toStatus: "Pending",
      amount: payment.amount,
      actor: {
        type: "Student",
        userId: session.user.id,
        name: session.user.name ?? session.user.email,
      },
      source: "request_created",
      message: "Payment created with document request.",
    });
  });

  return { success: true };
}