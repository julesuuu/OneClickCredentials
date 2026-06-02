# Admin Appointments Management

## Overview

Add an admin page to view and act on student pickup appointments. Today, students can book appointments via `/dashboard/appointments/new` (which writes an `Appointment` record with status `Scheduled`), but admins have no UI to see what's coming up, mark appointments as completed, flag no-shows, or cancel. This spec adds a full appointments queue mirroring the existing `/admin/requests` pattern: table + status filter + search + detail dialog with action buttons.

Students continue to manage their own reschedules (cancel + rebook) — admins do not reschedule. This keeps the admin surface area focused on lifecycle transitions only, matching the request workflow.

## Status Flow

```
Scheduled ──→ Completed     (date ≤ today)
           ─→ No-show       (date < today)
           ─→ Cancelled     (any time, optional reason)
```

| Current Status | Available Actions | Date Requirement |
|---------------|-------------------|------------------|
| Scheduled | Complete, No-show, Cancel | Complete: date ≤ today; No-show: date < today; Cancel: any |
| Completed | (none — terminal) | — |
| No-show | (none — terminal) | — |
| Cancelled | (none — terminal) | — |

Past-but-still-`Scheduled` appointments are surfaced in the UI with an "Overdue" warning badge and a destructive-color left border, but no automatic status change. Admin must act.

## New Files

### 1. `src/app/(admin)/admin/appointments/page.tsx` (server component)

Thin shell. Renders `<AppointmentsManager />`. No data fetched server-side; client component fetches via TanStack Query for consistency with `RequestsManager`. Auth/role guard inherited from the parent admin layout (`(admin)/admin/layout.tsx`).

### 2. `src/app/(admin)/admin/appointments/AppointmentsManager.tsx` (client component)

Table-based UI matching the `/admin/requests/RequestsManager.tsx` pattern:

- **Page header**: "Appointments" title + subtitle "Manage scheduled pickup appointments".
- **Status filter (segmented)**: All, Scheduled, Overdue (Scheduled + date < today), Completed, No-show, Cancelled. "All" is the default.
- **Search bar** — filters by student name and student number (case-insensitive substring).
- **Table columns**: Date, Time, Student (name + student number), Document (type name), Status (badge). Date sorted DESC, timeSlot ASC within the same date.
- **Overdue indicator**: any row with `status === "Scheduled" && date < today` shows a `⚠ Overdue` badge in the Status column and a `border-l-4 border-destructive` accent on the row.
- **Row click** — opens `AppointmentDetailDialog` (controlled state in manager).
- **Empty state**: centered card with calendar icon and "No appointments yet".
- **Loading state**: shadcn `Skeleton` rows (same approach as `RequestsManager`).

### 3. `src/app/(admin)/admin/appointments/AppointmentDetailDialog.tsx` (client component)

Dialog overlaying the table, max-width 2xl, three sections:

1. **Header**: Formatted date (e.g. "Friday, June 5, 2026"), time slot label ("AM Session (8:00 - 12:00)" or "PM Session (1:00 - 5:00)"), and status badge.
2. **Body**:
   - **Student card**: full name, student number, course, year level, email. A "View request →" link navigates to `/admin/requests` (out of scope: deep-linking into the existing `RequestDetailDialog`).
   - **Appointment details**: date, time slot, current status, created date, updated date.
   - **Existing notes** (if `notes !== null`): shown as a read-only block. For admin-cancelled appointments this contains the cancellation reason.
3. **Actions footer** (only when status is `Scheduled`):
   - **Mark Completed** (primary button, enabled only when `date ≤ today`)
   - **Mark No-show** (outline button, enabled only when `date < today`)
   - **Cancel Appointment** (destructive button, opens `AlertDialog` with optional reason textarea)
4. **Closed state** (status is not Scheduled): footer shows a disabled "Closed" label and a read-only "Last updated" timestamp.

### 4. `src/app/(admin)/admin/appointments/actions.ts` (server actions)

| Action | Description | Side Effects |
|--------|-------------|-------------|
| `getAllAppointments()` | Fetch all appointments with full includes (see query below) | — |
| `updateAppointmentStatus(id, status, options?)` | Transition Scheduled → Completed / No-show / Cancelled. `options.reason` is optional and only used for Cancelled. | Validates transition allowed (status must be `Scheduled`); creates a `Notification` in the same transaction; for Cancelled, writes `notes: "Cancelled by admin: {reason}"` |

#### `getAllAppointments()` query

```ts
prisma.appointment.findMany({
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
```

#### `updateAppointmentStatus` validation

| Target status | Pre-conditions |
|---------------|----------------|
| `Completed` | `current.status === "Scheduled" && current.date ≤ today` |
| `No-show` | `current.status === "Scheduled" && current.date < today` |
| `Cancelled` | `current.status === "Scheduled"` (no date restriction) |

On validation failure, throw a descriptive `Error` (the client surfaces it via `toast.error`).

#### Notifications

Each successful transition creates a `Notification` row in the same `prisma.$transaction` as the appointment update. `relatedEntityType: "appointment"`, `relatedEntityId: appointment.id` — the existing `getNotificationUrl()` helper in `src/lib/notifications.ts` already routes this to `/dashboard/appointments`.

| Event | `type` | Title | Message |
|-------|--------|-------|---------|
| → Completed | `APPOINTMENT_COMPLETED` | Appointment Completed | "Your appointment for {DocumentType} on {date} has been marked as completed." |
| → No-show | `APPOINTMENT_NO_SHOW` | Missed Appointment | "You missed your appointment for {DocumentType} on {date}. Please rebook." |
| → Cancelled | `APPOINTMENT_CANCELLED_BY_ADMIN` | Appointment Cancelled | "Your appointment for {DocumentType} on {date} was cancelled by an administrator.{reasonSuffix}" where `reasonSuffix = reason ? ` Reason: ${reason}` : ""` |

Dates are formatted with `Intl.DateTimeFormat` (or `date-fns/format`) as e.g. "Friday, June 5, 2026" — same style as the existing student `cancelAppointment` message in `src/app/(student)/dashboard/appointments/actions.ts`.

## Data Layer Changes

None. The `Appointment` model already exposes `date`, `timeSlot`, `status`, and `notes`. The previously-unused `notes` field is repurposed to store the admin's cancellation reason (prefixed with `"Cancelled by admin: "`). No migration required.

## Sidebar Update

None. `src/components/admin-sidebar.tsx` already includes an "Appointments" link to `/admin/appointments` (verified during exploration). The existing icon (`Calendar` from `lucide-react`) is appropriate.

## Dependencies

- All shadcn/ui components used (`Dialog`, `Table`, `Badge`, `Input`, `Button`, `AlertDialog`, `Skeleton`, `Card`, `Textarea`) are already installed.
- `lucide-react` icons: `Calendar`, `Clock`, `Search`, `AlertTriangle` (all already in the dependency).
- `@tanstack/react-query` (already in the project and used by `RequestsManager`).
- `sonner` (already in the project, used for toasts).
- `date-fns` (already in the project, used for date formatting).

## Files Changed

| File | Action |
|------|--------|
| `src/app/(admin)/admin/appointments/page.tsx` | Create |
| `src/app/(admin)/admin/appointments/AppointmentsManager.tsx` | Create |
| `src/app/(admin)/admin/appointments/AppointmentDetailDialog.tsx` | Create |
| `src/app/(admin)/admin/appointments/actions.ts` | Create |
| `src/app/(admin)/admin/appointments/loading.tsx` | Create (skeleton) |

No existing files are modified.

## Out of Scope

- Admin reschedule (cancel + rebook by student is the workflow)
- Calendar / week-grid view (table is sufficient for v1)
- Cron-based auto-no-show (manual with UI highlight is the agreed approach)
- Multi-slot capacity tracking (no double-booking protection; existing student flow already constrains to one appointment per request)
- "View request" deep-link into the existing `RequestDetailDialog` (admin can navigate to `/admin/requests` instead)
- Test coverage (project doesn't have a test framework configured per `AGENTS.md`)
