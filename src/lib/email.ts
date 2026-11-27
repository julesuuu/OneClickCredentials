import type { ReactElement } from "react";
import { Resend } from "resend";
import DocumentRequestStatusEmail from "@/components/emails/document-request-status";
import NotificationUpdateEmail, {
  type NotificationEmailDetail,
  type NotificationTone,
} from "@/components/emails/notification-update";

export interface SendEmailResult {
  sent: boolean;
  id?: string;
  reason?: string;
}

interface SendEmailInput {
  to: string;
  subject: string;
  react: ReactElement;
}

export interface DocumentRequestEmailInput {
  to: string;
  studentName: string;
  requestId: string;
  documentName: string;
  quantity: number;
  status: string;
  declineReason?: string | null;
}

export interface StudentNotificationEmailInput {
  to: string;
  studentName: string;
  subject: string;
  title: string;
  message: string;
  tone?: NotificationTone;
  badgeText?: string;
  details?: NotificationEmailDetail[];
  reason?: string | null;
  actionLabel?: string;
  actionPath: string;
}

let cachedResend: { apiKey: string; client: Resend } | null = null;

function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) return null;

  if (!cachedResend || cachedResend.apiKey !== apiKey) {
    cachedResend = { apiKey, client: new Resend(apiKey) };
  }
  return cachedResend.client;
}

function getEmailSender(): string | null {
  const address =
    process.env.EMAIL_SENDER_ADDRESS?.trim() ||
    process.env.EMAIL_DEFAULT_SENDER?.trim();

  if (!address) return null;

  const name =
    process.env.EMAIL_SENDER_NAME?.trim() || "OneClickCredentials";

  return `${name} <${address}>`;
}

export function getAppUrl(path: string): string {
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL?.trim() ||
    process.env.BETTER_AUTH_URL?.trim() ||
    "http://localhost:3000";

  const normalizedBase = baseUrl.replace(/\/+$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
}

export async function sendEmail({
  to,
  subject,
  react,
}: SendEmailInput): Promise<SendEmailResult> {
  const recipient = to.trim();
  if (!recipient) {
    return { sent: false, reason: "Missing recipient email" };
  }

  const resend = getResendClient();
  const from = getEmailSender();

  if (!resend || !from) {
    console.warn(
      `[email] Skipping "${subject}" to ${recipient}: RESEND_API_KEY or sender address is not configured.`,
    );
    return { sent: false, reason: "Email service is not configured" };
  }

  try {
    const result = await resend.emails.send({
      from,
      to: recipient,
      subject,
      react,
    });

    if (result.error) {
      console.error(
        `[email] Failed to send "${subject}" to ${recipient}:`,
        result.error,
      );
      return { sent: false, reason: result.error.message };
    }

    return { sent: true, id: result.data?.id };
  } catch (error) {
    console.error(
      `[email] Unexpected error sending "${subject}" to ${recipient}:`,
      error,
    );
    return {
      sent: false,
      reason: error instanceof Error ? error.message : "Unknown email error",
    };
  }
}

function getDocumentRequestEmailSubject(
  status: string,
  documentName: string,
): string {
  switch (status) {
    case "Processing":
      return `Your ${documentName} request is being processed`;
    case "Ready":
      return `Your ${documentName} is ready for pickup`;
    case "Completed":
      return `Your ${documentName} request has been completed`;
    case "Rejected":
      return `Your ${documentName} request was rejected`;
    default:
      return `Document request update: ${documentName} (${status})`;
  }
}

export async function sendDocumentRequestStatusEmail({
  to,
  studentName,
  requestId,
  documentName,
  quantity,
  status,
  declineReason,
}: DocumentRequestEmailInput): Promise<SendEmailResult> {
  const actionPath =
    status === "Ready"
      ? `/dashboard/appointments/new?requestId=${encodeURIComponent(requestId)}`
      : "/dashboard/requests";

  return sendEmail({
    to,
    subject: getDocumentRequestEmailSubject(status, documentName),
    react: DocumentRequestStatusEmail({
      studentName: studentName || "Student",
      documentName,
      quantity,
      status,
      declineReason,
      actionUrl: getAppUrl(actionPath),
    }),
  });
}

export async function sendStudentNotificationEmail({
  to,
  studentName,
  subject,
  title,
  message,
  tone,
  badgeText,
  details,
  reason,
  actionLabel,
  actionPath,
}: StudentNotificationEmailInput): Promise<SendEmailResult> {
  return sendEmail({
    to,
    subject,
    react: NotificationUpdateEmail({
      studentName: studentName || "Student",
      title,
      message,
      tone,
      badgeText,
      details,
      reason,
      actionLabel,
      actionUrl: getAppUrl(actionPath),
    }),
  });
}
