"use server";

import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guards";
import { sendStudentNotificationEmail } from "@/lib/email";

export interface AppointmentWithRelations {
  id: string;
  date: Date;
  timeSlot: string;
  status: string;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  documentRequest: {
    id: string;
    documentType: { name: string };
    user: {
      email: string;
      studentProfile: {
        id: string;
        fullName: string;
        studentNumber: string;
        course: string;
        yearLevel: string;
      } | null;
    };
  };
}

export async function getAllAppointments(): Promise<AppointmentWithRelations[]> {
  await requireAdmin();

  const appointments = await prisma.appointment.findMany({
    include: {
      documentRequest: {
        select: {
          id: true,
          documentType: { select: { name: true } },
          user: {
            select: {
              email: true,
              studentProfile: {
                select: {
                  id: true,
                  fullName: true,
                  studentNumber: true,
                  course: true,
                  yearLevel: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: [{ date: "desc" }, { timeSlot: "asc" }],
  });
  return appointments;
}

type AppointmentTransitionStatus = "Completed" | "No-show" | "Cancelled";

interface UpdateAppointmentStatusOptions {
  reason?: string;
}

const DATE_FORMAT = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  month: "long",
  day: "numeric",
  year: "numeric",
});

export async function updateAppointmentStatus(
  id: string,
  status: AppointmentTransitionStatus,
  options: UpdateAppointmentStatusOptions = {}
) {
  await requireAdmin();

  const appointment = await prisma.appointment.findUnique({
    where: { id },
    include: {
      documentRequest: {
        select: {
          documentType: { select: { name: true } },
          user: {
            select: {
              email: true,
              name: true,
              studentProfile: { select: { id: true, fullName: true } },
            },
          },
        },
      },
    },
  });

  if (!appointment) {
    throw new Error("Appointment not found");
  }
  if (appointment.status !== "Scheduled") {
    throw new Error(`Cannot transition from ${appointment.status} to ${status}`);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const appointmentDate = new Date(appointment.date);
  appointmentDate.setHours(0, 0, 0, 0);

  if (status === "Completed" && appointmentDate > today) {
    throw new Error("Cannot mark a future appointment as completed");
  }
  if (status === "No-show" && appointmentDate >= today) {
    throw new Error("No-show can only be marked for past appointments");
  }

  const studentProfileId =
    appointment.documentRequest.user.studentProfile?.id;
  if (!studentProfileId) {
    throw new Error("Student profile not found");
  }

  const documentName = appointment.documentRequest.documentType.name;
  const dateLabel = DATE_FORMAT.format(appointment.date);

  const notificationContent: Record<
    AppointmentTransitionStatus,
    { title: string; message: string; type: string }
  > = {
    Completed: {
      title: "Appointment Completed",
      message: `Your appointment for ${documentName} on ${dateLabel} has been marked as completed.`,
      type: "APPOINTMENT_COMPLETED",
    },
    "No-show": {
      title: "Missed Appointment",
      message: `You missed your appointment for ${documentName} on ${dateLabel}. Please rebook.`,
      type: "APPOINTMENT_NO_SHOW",
    },
    Cancelled: {
      title: "Appointment Cancelled",
      message: `Your appointment for ${documentName} on ${dateLabel} was cancelled by an administrator.${
        options.reason ? ` Reason: ${options.reason}` : ""
      }`,
      type: "APPOINTMENT_CANCELLED_BY_ADMIN",
    },
  };

  const content = notificationContent[status];

  const notesUpdate =
    status === "Cancelled"
      ? `Cancelled by admin: ${options.reason ?? ""}`.trim()
      : undefined;

  await prisma.$transaction([
    prisma.appointment.update({
      where: { id },
      data: {
        status,
        ...(notesUpdate !== undefined ? { notes: notesUpdate } : {}),
      },
    }),
    prisma.notification.create({
      data: {
        studentProfileId,
        title: content.title,
        message: content.message,
        type: content.type,
        relatedEntityType: "appointment",
        relatedEntityId: id,
      },
    }),
  ]);

  const recipientEmail = appointment.documentRequest.user.email;
  const studentName =
    appointment.documentRequest.user.studentProfile?.fullName ??
    appointment.documentRequest.user.name ??
    "Student";

  if (recipientEmail) {
    const sessionLabel =
      appointment.timeSlot === "AM"
        ? "AM Session (8:00 - 12:00)"
        : "PM Session (1:00 - 5:00)";

    await sendStudentNotificationEmail({
      to: recipientEmail,
      studentName,
      subject: `${content.title}: ${documentName}`,
      title: content.title,
      message: content.message,
      tone: status === "Completed" ? "success" : "danger",
      badgeText: status,
      details: [
        { label: "Document", value: documentName },
        { label: "Date", value: dateLabel },
        { label: "Session", value: sessionLabel },
      ],
      reason: status === "Cancelled" ? options.reason : undefined,
      actionLabel: "View Appointments",
      actionPath: "/dashboard/appointments",
    });
  }

  return { success: true };
}
