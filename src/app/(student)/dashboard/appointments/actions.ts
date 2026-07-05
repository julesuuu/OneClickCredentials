"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function getMyAppointments() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return [];

  const appointments = await prisma.appointment.findMany({
    where: {
      documentRequest: {
        userId: session.user.id,
      },
    },
    include: {
      documentRequest: {
        select: {
          documentType: {
            select: {
              name: true,
            },
          },
        },
      },
    },
    orderBy: [{ date: "desc" }, { timeSlot: "asc" }],
  });

  return appointments;
}

export async function getEligibleRequests() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return [];

  const requests = await prisma.documentRequest.findMany({
    where: {
      userId: session.user.id,
      status: "Ready",
      appointment: null,
    },
    select: {
      id: true,
      createdAt: true,
      documentType: {
        select: {
          name: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return requests;
}

export async function createAppointment(
  documentRequestId: string,
  date: string,
  timeSlot: string
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Not authenticated");

  const request = await prisma.documentRequest.findFirst({
    where: {
      id: documentRequestId,
      userId: session.user.id,
      status: "Ready",
      appointment: null,
    },
    include: {
      documentType: { select: { name: true } },
    },
  });

  if (!request) throw new Error("Invalid or ineligible request");

  if (!["AM", "PM"].includes(timeSlot)) {
    throw new Error("Time slot must be AM or PM");
  }

  const appointmentDate = new Date(date + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + 30);

  if (appointmentDate < today || appointmentDate > maxDate) {
    throw new Error("Date must be between today and 30 days from now");
  }

  const profile = await prisma.studentProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  if (!profile) throw new Error("Student profile not found");

  const [appointment] = await prisma.$transaction(async (tx) => {
    const appointment = await tx.appointment.create({
      data: {
        documentRequestId,
        date: appointmentDate,
        timeSlot,
      },
      include: {
        documentRequest: {
          select: {
            documentType: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    await tx.notification.create({
      data: {
        studentProfileId: profile.id,
        title: "Appointment Confirmed",
        message: `Your appointment for ${request.documentType.name} on ${appointmentDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })} (${timeSlot === "AM" ? "AM Session (8:00 - 12:00)" : "PM Session (1:00 - 5:00)"}) has been scheduled.`,
        type: "APPOINTMENT_SCHEDULED",
        relatedEntityType: "appointment",
        relatedEntityId: appointment.id,
      },
    });

    return [appointment];
  });

  return appointment;
}

export async function cancelAppointment(appointmentId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Not authenticated");

  const appointment = await prisma.appointment.findFirst({
    where: {
      id: appointmentId,
      status: "Scheduled",
      documentRequest: {
        userId: session.user.id,
      },
    },
    include: {
      documentRequest: {
        select: {
          documentType: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });

  if (!appointment) throw new Error("Appointment not found or cannot be cancelled");

  const profile = await prisma.studentProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  if (!profile) throw new Error("Student profile not found");

  const [updatedAppointment] = await prisma.$transaction([
    prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: "Cancelled" },
      include: {
        documentRequest: {
          select: {
            documentType: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    }),
    prisma.documentRequest.update({
      where: { id: appointment.documentRequestId },
      data: { appointmentId: null },
    }),
    prisma.notification.create({
      data: {
        studentProfileId: profile.id,
        title: "Appointment Cancelled",
        message: `Your appointment for ${appointment.documentRequest.documentType.name} on ${appointment.date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })} has been cancelled.`,
        type: "APPOINTMENT_CANCELLED",
        relatedEntityType: "appointment",
        relatedEntityId: appointment.id,
      },
    }),
  ]);

  return updatedAppointment;
}
