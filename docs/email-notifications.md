# Email Notifications

OneClickCredentials sends transactional email notifications via **Resend** and **React Email** whenever key status changes occur in the student workflow, alongside the existing in-app `Notification` records.

> Authentication emails (OTP verification, two-factor codes, password reset, and account deletion) continue to be handled in [src/lib/auth.ts](../src/lib/auth.ts).

## Architecture & Delivery Guarantees

- **Server-only mailer:** [src/lib/email.ts](../src/lib/email.ts) lazily initializes `Resend` when `RESEND_API_KEY` is configured and exposes `sendEmail`, `sendDocumentRequestStatusEmail`, `sendStudentNotificationEmail`, and `getAppUrl`.
- **Post-transaction & non-blocking:** Emails are always sent *after* the Prisma transaction commits. If `RESEND_API_KEY` or a sender address is missing, or if Resend returns an error / rejects, `sendEmail` logs the failure and returns `{ sent: false, reason }` without throwing or rolling back the database update.
- **Duplicate protection:** `updateRequestStatus` exits early without creating duplicate in-app notifications or emails if the request is already in the target status.
- **Admin UI feedback:** [RequestsManager.tsx](../src/app/(admin)/admin/requests/RequestsManager.tsx) and [admin/students/page.tsx](../src/app/(admin)/admin/students/page.tsx) show `sonner` toast messages indicating whether the update succeeded and whether the notification email was sent.

## Email Templates

Templates live in `src/components/emails/` and use `@react-email/components` with Tailwind styling:

| Template | Purpose | Key Props |
|---|---|---|
| [document-request-status.tsx](../src/components/emails/document-request-status.tsx) | Document request lifecycle updates (`Processing`, `Ready`, `Completed`, `Rejected`) | `studentName`, `documentName`, `quantity`, `status`, `declineReason`, `actionUrl` |
| [notification-update.tsx](../src/components/emails/notification-update.tsx) | General status updates for verification, appointments, and payments | `studentName`, `title`, `message`, `tone`, `badgeText`, `details`, `reason`, `actionLabel`, `actionUrl` |

When a document request transitions to **`Ready`**, the email CTA links directly to `/dashboard/appointments/new?requestId=<id>` so the student can immediately schedule a pickup slot.

## Trigger Matrix

| Domain | Function & File | Events / Statuses | CTA Destination |
|---|---|---|---|
| **Document Requests** | `updateRequestStatus`, `rejectRequest` in [admin/requests/actions.ts](../src/app/(admin)/admin/requests/actions.ts) | `Processing`, `Ready`, `Completed`, `Rejected` | `/dashboard/appointments/new?requestId=...` (when `Ready`) or `/dashboard/requests` |
| **Student Verification** | `verifyStudent` in [admin/students/actions.ts](../src/app/(admin)/admin/students/actions.ts) | Approved (`isVerified = true`), Rejected (`isVerified = false` + `declineReason`) | `/dashboard/requests/new` (approved) or `/dashboard/verification` (rejected) |
| **Appointments** | `updateAppointmentStatus` in [admin/appointments/actions.ts](../src/app/(admin)/admin/appointments/actions.ts) | `Completed`, `No-show`, `Cancelled` | `/dashboard/appointments` |
| **Payments** | `confirmPaymentPaid`, `confirmPaymentFailed` in [src/lib/payments.ts](../src/lib/payments.ts); `adminMarkPaymentRefunded` in [admin/payments/actions.ts](../src/app/(admin)/admin/payments/actions.ts) | `Paid`, `Failed`, `Refunded` | `/dashboard/payments` |

## Environment Configuration

Configure the following variables in `.env.local` (see [.env.example](../.env.example)):

```env
RESEND_API_KEY="re_..."
EMAIL_SENDER_NAME="OneClickCredentials"
EMAIL_SENDER_ADDRESS="noreply@yourdomain.com"
EMAIL_DEFAULT_SENDER="noreply@yourdomain.com" # fallback if EMAIL_SENDER_ADDRESS is unset
NEXT_PUBLIC_BASE_URL="http://localhost:3000"   # used for CTA links; falls back to BETTER_AUTH_URL
```

- `EMAIL_SENDER_ADDRESS` (or `EMAIL_DEFAULT_SENDER`) must belong to a verified domain in Resend for production delivery.
- In local environments without `RESEND_API_KEY`, email delivery is safely skipped with a console warning while in-app notifications and status updates still succeed.

## Testing

Offline unit tests (no network or database required) cover the mailer and document request triggers:

- [src/lib/email.test.ts](../src/lib/email.test.ts) — missing config, empty recipient, Resend API errors, rejected promises, URL resolution, and rendered HTML output for all document request statuses and general notification emails.
- [src/app/(admin)/admin/requests/actions.test.ts](../src/app/(admin)/admin/requests/actions.test.ts) — `updateRequestStatus` and `rejectRequest` DB writes, in-app notifications, email dispatch, duplicate-status guard, unpaid completion guard, and graceful handling when email delivery fails.

Run checks with:

```bash
npm test
npm run lint
npm exec tsc -- --noEmit
```
