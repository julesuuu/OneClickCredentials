import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "@react-email/render";

const sendMock = vi.fn();
const resendConstructorMock = vi.fn();

vi.mock("resend", () => ({
  Resend: class MockResend {
    emails = { send: sendMock };
    constructor(apiKey: string) {
      resendConstructorMock(apiKey);
    }
  },
}));

import {
  getAppUrl,
  sendDocumentRequestStatusEmail,
  sendEmail,
  sendStudentNotificationEmail,
} from "./email";

const originalEnv = { ...process.env };

beforeEach(() => {
  vi.clearAllMocks();
  process.env = {
    ...originalEnv,
    RESEND_API_KEY: "re_test_key_1",
    EMAIL_SENDER_NAME: "OneClickCredentials",
    EMAIL_SENDER_ADDRESS: "noreply@oneclickapp.online",
    NEXT_PUBLIC_BASE_URL: "https://oneclickapp.online",
  };
});

afterEach(() => {
  process.env = { ...originalEnv };
});

describe("getAppUrl", () => {
  it("builds URLs from NEXT_PUBLIC_BASE_URL without duplicate slashes", () => {
    process.env.NEXT_PUBLIC_BASE_URL = "https://oneclickapp.online/";
    expect(getAppUrl("/dashboard/requests")).toBe(
      "https://oneclickapp.online/dashboard/requests",
    );
    expect(getAppUrl("dashboard/requests")).toBe(
      "https://oneclickapp.online/dashboard/requests",
    );
  });

  it("falls back to localhost when base URL env vars are unset", () => {
    delete process.env.NEXT_PUBLIC_BASE_URL;
    delete process.env.BETTER_AUTH_URL;
    expect(getAppUrl("/dashboard")).toBe("http://localhost:3000/dashboard");
  });
});

describe("sendEmail", () => {
  it("skips sending when RESEND_API_KEY is missing", async () => {
    delete process.env.RESEND_API_KEY;
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const result = await sendEmail({
      to: "student@example.com",
      subject: "Test",
      react: {} as never,
    });

    expect(result).toEqual({
      sent: false,
      reason: "Email service is not configured",
    });
    expect(sendMock).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it("skips sending when recipient is empty", async () => {
    const result = await sendEmail({
      to: "   ",
      subject: "Test",
      react: {} as never,
    });

    expect(result).toEqual({
      sent: false,
      reason: "Missing recipient email",
    });
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("returns sent=false without throwing when Resend returns an error", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    sendMock.mockResolvedValue({
      data: null,
      error: { message: "Domain not verified", name: "validation_error" },
    });

    const result = await sendEmail({
      to: "student@example.com",
      subject: "Test",
      react: {} as never,
    });

    expect(result).toEqual({
      sent: false,
      reason: "Domain not verified",
    });
    errorSpy.mockRestore();
  });

  it("returns sent=false without throwing when Resend rejects", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    sendMock.mockRejectedValue(new Error("Network timeout"));

    const result = await sendEmail({
      to: "student@example.com",
      subject: "Test",
      react: {} as never,
    });

    expect(result).toEqual({
      sent: false,
      reason: "Network timeout",
    });
    errorSpy.mockRestore();
  });
});

describe("sendDocumentRequestStatusEmail", () => {
  it.each([
    {
      status: "Processing",
      expectedSubject: "Your Transcript of Records request is being processed",
      expectedUrl: "https://oneclickapp.online/dashboard/requests",
      expectedText: "Request Being Processed",
    },
    {
      status: "Ready",
      expectedSubject: "Your Transcript of Records is ready for pickup",
      expectedUrl:
        "https://oneclickapp.online/dashboard/appointments/new?requestId=req_1",
      expectedText: "Book Pickup Appointment",
    },
    {
      status: "Completed",
      expectedSubject: "Your Transcript of Records request has been completed",
      expectedUrl: "https://oneclickapp.online/dashboard/requests",
      expectedText: "Request Completed",
    },
    {
      status: "Rejected",
      expectedSubject: "Your Transcript of Records request was rejected",
      expectedUrl: "https://oneclickapp.online/dashboard/requests",
      expectedText: "Missing clearance",
    },
  ])(
    "sends $status notification email with rendered HTML",
    async ({ status, expectedSubject, expectedUrl, expectedText }) => {
      sendMock.mockResolvedValue({ data: { id: "email_123" }, error: null });

      const result = await sendDocumentRequestStatusEmail({
        to: "student@example.com",
        studentName: "Juan Dela Cruz",
        requestId: "req_1",
        documentName: "Transcript of Records",
        quantity: 2,
        status,
        declineReason: status === "Rejected" ? "Missing clearance" : undefined,
      });

      expect(result).toEqual({ sent: true, id: "email_123" });
      expect(sendMock).toHaveBeenCalledTimes(1);

      const payload = sendMock.mock.calls[0][0];
      expect(payload.from).toBe(
        "OneClickCredentials <noreply@oneclickapp.online>",
      );
      expect(payload.to).toBe("student@example.com");
      expect(payload.subject).toBe(expectedSubject);

      const html = await render(payload.react);
      expect(html).toContain("Juan Dela Cruz");
      expect(html).toContain("Transcript of Records");
      expect(html).toContain(expectedUrl);
      expect(html).toContain(expectedText);
    },
  );
});

describe("sendStudentNotificationEmail", () => {
  it("renders title, details, and CTA link", async () => {
    sendMock.mockResolvedValue({ data: { id: "email_456" }, error: null });

    const result = await sendStudentNotificationEmail({
      to: "student@example.com",
      studentName: "Maria Santos",
      subject: "Verification Approved",
      title: "Verification Approved",
      message: "Your profile has been verified.",
      tone: "success",
      badgeText: "Verified",
      details: [{ label: "Student No.", value: "2024-0001" }],
      actionLabel: "Request a Document",
      actionPath: "/dashboard/requests/new",
    });

    expect(result).toEqual({ sent: true, id: "email_456" });
    const payload = sendMock.mock.calls[0][0];
    const html = await render(payload.react);
    expect(html).toContain("Maria Santos");
    expect(html).toContain("Verification Approved");
    expect(html).toContain("2024-0001");
    expect(html).toContain(
      "https://oneclickapp.online/dashboard/requests/new",
    );
  });
});
