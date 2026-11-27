import { beforeEach, describe, expect, it, vi } from "vitest";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guards";
import { sendDocumentRequestStatusEmail } from "@/lib/email";
import { rejectRequest, updateRequestStatus } from "./actions";

vi.mock("@/lib/prisma", () => ({
  default: {
    documentRequest: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    notification: {
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock("@/lib/auth-guards", () => ({
  requireAdmin: vi.fn(),
}));

vi.mock("@/lib/email", () => ({
  sendDocumentRequestStatusEmail: vi.fn(),
}));

const requireAdminMock = requireAdmin as unknown as ReturnType<typeof vi.fn>;
const findUniqueMock = prisma.documentRequest
  .findUnique as unknown as ReturnType<typeof vi.fn>;
const transactionMock = prisma.$transaction as unknown as ReturnType<
  typeof vi.fn
>;
const sendDocumentRequestStatusEmailMock =
  sendDocumentRequestStatusEmail as unknown as ReturnType<typeof vi.fn>;

const baseRequest = {
  id: "req_1",
  status: "Pending",
  quantity: 2,
  payment: { id: "pay_1", status: "Pending" },
  documentType: { name: "Transcript of Records" },
  user: {
    email: "student@example.com",
    name: "Juan Dela Cruz",
    studentProfile: {
      id: "sp_1",
      fullName: "Juan Dela Cruz",
    },
  },
};

beforeEach(() => {
  vi.clearAllMocks();
  requireAdminMock.mockResolvedValue({
    user: { id: "admin_1", name: "Admin", email: "admin@example.com" },
  });
  sendDocumentRequestStatusEmailMock.mockResolvedValue({
    sent: true,
    id: "email_1",
  });
});

describe("updateRequestStatus", () => {
  it("updates status, creates in-app notification, and sends status email", async () => {
    findUniqueMock.mockResolvedValue(baseRequest);
    transactionMock.mockResolvedValue([{}, {}]);

    const result = await updateRequestStatus("req_1", "Ready");

    expect(result).toEqual({ success: true, emailSent: true });
    expect(transactionMock).toHaveBeenCalledTimes(1);
    expect(prisma.documentRequest.update).toHaveBeenCalledWith({
      where: { id: "req_1" },
      data: { status: "Ready" },
    });
    expect(prisma.notification.create).toHaveBeenCalledWith({
      data: {
        studentProfileId: "sp_1",
        title: "Ready for Pickup",
        message: "Your Transcript of Records request is ready for pickup.",
        type: "READY",
        relatedEntityType: "document_request",
        relatedEntityId: "req_1",
      },
    });
    expect(sendDocumentRequestStatusEmailMock).toHaveBeenCalledWith({
      to: "student@example.com",
      studentName: "Juan Dela Cruz",
      requestId: "req_1",
      documentName: "Transcript of Records",
      quantity: 2,
      status: "Ready",
    });
  });

  it("still succeeds when email delivery returns sent=false", async () => {
    findUniqueMock.mockResolvedValue(baseRequest);
    transactionMock.mockResolvedValue([{}, {}]);
    sendDocumentRequestStatusEmailMock.mockResolvedValue({
      sent: false,
      reason: "Email service is not configured",
    });

    const result = await updateRequestStatus("req_1", "Processing");

    expect(result).toEqual({ success: true, emailSent: false });
    expect(transactionMock).toHaveBeenCalledTimes(1);
  });

  it("skips duplicate update and email when already in target status", async () => {
    findUniqueMock.mockResolvedValue({ ...baseRequest, status: "Processing" });

    const result = await updateRequestStatus("req_1", "Processing");

    expect(result).toEqual({ success: true, emailSent: false });
    expect(transactionMock).not.toHaveBeenCalled();
    expect(sendDocumentRequestStatusEmailMock).not.toHaveBeenCalled();
  });

  it("blocks completing an unpaid request without sending email", async () => {
    findUniqueMock.mockResolvedValue({
      ...baseRequest,
      status: "Ready",
      payment: { status: "Pending" },
    });

    await expect(updateRequestStatus("req_1", "Completed")).rejects.toThrow(
      "Mark the payment as paid before completing this request.",
    );
    expect(transactionMock).not.toHaveBeenCalled();
    expect(sendDocumentRequestStatusEmailMock).not.toHaveBeenCalled();
  });
});

describe("rejectRequest", () => {
  it("rejects the request, creates notification, and sends rejection email", async () => {
    findUniqueMock.mockResolvedValue(baseRequest);
    const tx = {
      documentRequest: { update: vi.fn() },
      payment: {
        findUnique: vi.fn().mockResolvedValue({ status: "Pending", amount: 200 }),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
      paymentEvent: { createMany: vi.fn() },
      notification: { create: vi.fn() },
    };
    transactionMock.mockImplementation(
      async (callback: (transaction: typeof tx) => Promise<void>) =>
        callback(tx),
    );

    const result = await rejectRequest("req_1", "  Incomplete clearance  ");

    expect(result).toEqual({ success: true, emailSent: true });
    expect(tx.documentRequest.update).toHaveBeenCalledWith({
      where: { id: "req_1" },
      data: { status: "Rejected", declineReason: "Incomplete clearance" },
    });
    expect(tx.notification.create).toHaveBeenCalledWith({
      data: {
        studentProfileId: "sp_1",
        title: "Request Rejected",
        message:
          "Your request for Transcript of Records was rejected. Reason: Incomplete clearance",
        type: "REJECTED",
        relatedEntityType: "document_request",
        relatedEntityId: "req_1",
      },
    });
    expect(sendDocumentRequestStatusEmailMock).toHaveBeenCalledWith({
      to: "student@example.com",
      studentName: "Juan Dela Cruz",
      requestId: "req_1",
      documentName: "Transcript of Records",
      quantity: 2,
      status: "Rejected",
      declineReason: "Incomplete clearance",
    });
  });

  it("rejects empty reasons before querying the database", async () => {
    await expect(rejectRequest("req_1", "   ")).rejects.toThrow(
      "Rejection reason is required.",
    );
    expect(findUniqueMock).not.toHaveBeenCalled();
    expect(sendDocumentRequestStatusEmailMock).not.toHaveBeenCalled();
  });
});
