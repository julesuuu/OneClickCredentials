import { describe, expect, it } from "vitest";
import { buildAdminActivity } from "./activity";

const student = {
  name: "Fallback Name",
  studentProfile: { fullName: "Juan Dela Cruz" },
};

const requestDate = new Date("2026-11-27T10:00:00Z");
const paymentDate = new Date("2026-11-27T11:00:00Z");
const appointmentDate = new Date("2026-11-27T12:00:00Z");
const studentDate = new Date("2026-11-27T09:00:00Z");

describe("buildAdminActivity", () => {
  it("builds a labelled item for each module and sorts newest first", () => {
    const items = buildAdminActivity({
      requests: [
        {
          id: "req_1",
          quantity: 2,
          status: "Pending",
          updatedAt: requestDate,
          documentType: { name: "Transcript of Records" },
          user: student,
        },
      ],
      payments: [
        {
          id: "pay_1",
          amount: 500,
          status: "Paid",
          updatedAt: paymentDate,
          documentRequest: {
            documentType: { name: "Transcript of Records" },
            user: student,
          },
        },
      ],
      appointments: [
        {
          id: "apt_1",
          date: new Date(2026, 10, 28),
          timeSlot: "AM",
          status: "Scheduled",
          updatedAt: appointmentDate,
          documentRequest: {
            documentType: { name: "Transcript of Records" },
            user: student,
          },
        },
      ],
      students: [
        {
          id: "stu_1",
          fullName: "Maria Santos",
          isVerified: true,
          declineReason: null,
          updatedAt: studentDate,
        },
      ],
    });

    expect(items.map((item) => item.type)).toEqual([
      "appointment",
      "payment",
      "request",
      "student",
    ]);

    expect(items.find((item) => item.type === "request")).toMatchObject({
      id: "request-req_1",
      title: "Transcript of Records ×2",
      description: "Juan Dela Cruz requested",
      status: "Pending",
      href: "/admin/requests",
      timestamp: requestDate,
    });
    expect(items.find((item) => item.type === "payment")).toMatchObject({
      id: "payment-pay_1",
      title: "₱500",
      description: "Juan Dela Cruz • Transcript of Records",
      status: "Paid",
      href: "/admin/payments",
      timestamp: paymentDate,
    });
    expect(items.find((item) => item.type === "appointment")).toMatchObject({
      id: "appointment-apt_1",
      title: "AM session",
      description: "Juan Dela Cruz • Transcript of Records • Nov 28",
      status: "Scheduled",
      href: "/admin/appointments",
      timestamp: appointmentDate,
    });
    expect(items.find((item) => item.type === "student")).toMatchObject({
      id: "student-stu_1",
      title: "Maria Santos",
      description: "Verification",
      status: "Verified",
      href: "/admin/students",
      timestamp: studentDate,
    });
  });

  it("falls back to the account name when no student profile exists", () => {
    const [item] = buildAdminActivity({
      requests: [
        {
          id: "req_1",
          quantity: 1,
          status: "Ready",
          updatedAt: requestDate,
          documentType: { name: "Certificate of Enrollment" },
          user: { name: "Alex Cruz", studentProfile: null },
        },
      ],
      payments: [],
      appointments: [],
      students: [],
    });

    expect(item.description).toBe("Alex Cruz requested");
    expect(item.title).toBe("Certificate of Enrollment");
  });

  it("derives student verification status from the profile", () => {
    const items = buildAdminActivity({
      requests: [],
      payments: [],
      appointments: [],
      students: [
        {
          id: "verified",
          fullName: "Verified Student",
          isVerified: true,
          declineReason: null,
          updatedAt: new Date("2026-11-27T12:00:00Z"),
        },
        {
          id: "declined",
          fullName: "Declined Student",
          isVerified: false,
          declineReason: "Blurry document",
          updatedAt: new Date("2026-11-27T11:00:00Z"),
        },
        {
          id: "pending",
          fullName: "Pending Student",
          isVerified: false,
          declineReason: null,
          updatedAt: new Date("2026-11-27T10:00:00Z"),
        },
      ],
    });

    expect(items.map((item) => item.status)).toEqual([
      "Verified",
      "Declined",
      "Pending",
    ]);
  });

  it("keeps only the 10 newest items across all modules", () => {
    const requests = Array.from({ length: 6 }, (_, index) => ({
      id: `req_${index}`,
      quantity: 1,
      status: "Pending",
      updatedAt: new Date(`2026-11-27T10:0${index}:00Z`),
      documentType: { name: "Transcript of Records" },
      user: student,
    }));
    const payments = Array.from({ length: 6 }, (_, index) => ({
      id: `pay_${index}`,
      amount: 500,
      status: "Paid",
      updatedAt: new Date(`2026-11-27T11:0${index}:00Z`),
      documentRequest: {
        documentType: { name: "Transcript of Records" },
        user: student,
      },
    }));

    const items = buildAdminActivity({
      requests,
      payments,
      appointments: [],
      students: [],
    });

    expect(items).toHaveLength(10);
    expect(items[0].id).toBe("payment-pay_5");
    expect(items.at(-1)?.id).toBe("request-req_2");
  });
});
