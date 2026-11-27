import { format } from "date-fns";

export type AdminActivityType =
  | "request"
  | "payment"
  | "appointment"
  | "student";

export interface AdminActivityItem {
  id: string;
  type: AdminActivityType;
  title: string;
  description: string;
  status: string;
  timestamp: Date;
  href: string;
}

interface ActivityUser {
  name: string;
  studentProfile: { fullName: string } | null;
}

export interface ActivityRequest {
  id: string;
  quantity: number;
  status: string;
  updatedAt: Date;
  documentType: { name: string };
  user: ActivityUser;
}

export interface ActivityPayment {
  id: string;
  amount: number;
  status: string;
  updatedAt: Date;
  documentRequest: {
    documentType: { name: string };
    user: ActivityUser;
  };
}

export interface ActivityAppointment {
  id: string;
  date: Date;
  timeSlot: string;
  status: string;
  updatedAt: Date;
  documentRequest: {
    documentType: { name: string };
    user: ActivityUser;
  };
}

export interface ActivityStudent {
  id: string;
  fullName: string;
  isVerified: boolean;
  declineReason: string | null;
  updatedAt: Date;
}

interface BuildAdminActivityInput {
  requests: ActivityRequest[];
  payments: ActivityPayment[];
  appointments: ActivityAppointment[];
  students: ActivityStudent[];
}

function displayStudentName(user: ActivityUser) {
  return user.studentProfile?.fullName ?? user.name;
}

function studentStatus(student: ActivityStudent) {
  if (student.isVerified) return "Verified";
  if (student.declineReason) return "Declined";
  return "Pending";
}

export function buildAdminActivity({
  requests,
  payments,
  appointments,
  students,
}: BuildAdminActivityInput): AdminActivityItem[] {
  return [
    ...requests.map((request) => ({
      id: `request-${request.id}`,
      type: "request" as const,
      title: `${request.documentType.name}${
        request.quantity > 1 ? ` ×${request.quantity}` : ""
      }`,
      description: `${displayStudentName(request.user)} requested`,
      status: request.status,
      timestamp: request.updatedAt,
      href: "/admin/requests",
    })),
    ...payments.map((payment) => ({
      id: `payment-${payment.id}`,
      type: "payment" as const,
      title: `₱${payment.amount.toLocaleString()}`,
      description: `${displayStudentName(
        payment.documentRequest.user,
      )} • ${payment.documentRequest.documentType.name}`,
      status: payment.status,
      timestamp: payment.updatedAt,
      href: "/admin/payments",
    })),
    ...appointments.map((appointment) => ({
      id: `appointment-${appointment.id}`,
      type: "appointment" as const,
      title: `${appointment.timeSlot} session`,
      description: `${displayStudentName(
        appointment.documentRequest.user,
      )} • ${appointment.documentRequest.documentType.name} • ${format(
        appointment.date,
        "MMM d",
      )}`,
      status: appointment.status,
      timestamp: appointment.updatedAt,
      href: "/admin/appointments",
    })),
    ...students.map((student) => ({
      id: `student-${student.id}`,
      type: "student" as const,
      title: student.fullName,
      description: "Verification",
      status: studentStatus(student),
      timestamp: student.updatedAt,
      href: "/admin/students",
    })),
  ]
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, 10);
}
