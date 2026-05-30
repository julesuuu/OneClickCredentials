# Student Appointment Booking System

## Overview

Students book document pickup appointments once their document request reaches `Ready` status. The system provides a list view of all appointments and a guided booking flow.

## Pages

### `/dashboard/appointments` — Appointments List

- **Upcoming tab** — Appointments with `Scheduled` status and date >= today, sorted ascending
- **Past tab** — Appointments with `Completed`, `Cancelled`, `No-show` status, or past-date `Scheduled`, sorted descending
- Each appointment renders as a card showing:
  - Date block (day number, month abbreviation, day name)
  - Document type name (from linked DocumentRequest → DocumentType)
  - Time slot label: "AM Session (8:00 - 12:00)" or "PM Session (1:00 - 5:00)"
  - Status badge (`Scheduled` → blue, `Completed` → green, `Cancelled` → gray, `No-show` → red)
  - Cancel button (only on upcoming `Scheduled` appointments, opens confirmation dialog)
- **"Book New Appointment"** button at the bottom → links to `/dashboard/appointments/new`
- **Empty state** (no appointments at all): illustration + "No appointments yet" + link to `/dashboard/appointments/new`
- **Empty upcoming / all cancelled**: separate message showing no upcoming appointments

### `/dashboard/appointments/new` — Booking Flow

Single-page form with three visual steps:

**Step 1: Select Request**
- Radio list of the student's `Ready` document requests that do NOT already have a scheduled appointment
- Each item shows: document type name, request ID, "Ready" label
- If `?requestId=` query param is present, pre-select that request and auto-advance
- If no eligible requests exist, show a message: "You don't have any document requests ready for pickup. Requests become available for booking once they are marked as Ready."

**Step 2: Select Date & Time**
- Calendar date picker showing the next 30 days (from today onward)
- Dates in the past and beyond 30 days disabled/grayed out
- Weekends can be selected (no restriction)
- Time slot: two radio options — AM (8:00-12:00) and PM (1:00-5:00)
- Both date and time slot must be selected to proceed

**Step 3: Confirm**
- Summary card showing: document type name, date (formatted), time slot
- "Confirm Booking" button — creates the appointment, shows success toast, redirects to `/dashboard/appointments`
- On error, shows error toast and stays on the page

The page has a visual step indicator (1 → 2 → 3) highlighting the current step.

### `/dashboard/requests` — Updated Request List

- Each request row with status `Ready` gets a **"Book Appointment"** button
- Button links to `/dashboard/appointments/new?requestId={request.id}`
- No button shown on non-Ready requests, or on Ready requests that already have a scheduled appointment
- Uses existing `Badge` or `Button` variant matching the table row pattern

## Server Actions

### `getMyAppointments()`

```
Returns: Array<{
  id, date, timeSlot, status, notes, createdAt,
  documentRequest: {
    documentType: { name }
  }
}>
```

- Fetches from `prisma.appointment.findMany`
- Where clause: `documentRequest.userId === session.user.id`
- Order: upcoming (future dates, Scheduled first) then past (recent past first)
- No pagination needed for initial implementation

### `getEligibleRequests()`

```
Returns: Array<{
  id, documentType: { name }, createdAt
}>
```

- Fetches DocumentRequests where:
  - `userId === session.user.id`
  - `status === "Ready"`
  - `appointment === null` (no existing appointment)
- Used in the booking form to populate the request selector

### `createAppointment(data: { documentRequestId, date, timeSlot })`

- Validates:
  1. The document request belongs to the current user
  2. The request status is `Ready`
  3. The request does NOT already have an appointment
  4. The date is within the valid range (today through +30 days)
  5. The timeSlot is either `"AM"` or `"PM"`
- Creates `Appointment` record with status `"Scheduled"`
- Creates an in-app notification via `createNotification`:
  - `type`: `"APPOINTMENT_SCHEDULED"`
  - `userId`: student's ID
  - `title`: "Appointment Confirmed"
  - `message`: "Your appointment for {documentType} on {formattedDate} ({timeSlot}) has been scheduled."
  - `relatedEntityId`: appointment.id
  - `relatedEntityType`: "appointment"
- Returns the created appointment with document type included

### `cancelAppointment(appointmentId)`

- Validates the appointment belongs to the current user and is `Scheduled`
- Updates status to `"Cancelled"`
- Creates an in-app notification:
  - `type`: `"APPOINTMENT_CANCELLED"`
  - `userId`: student's ID
  - `title`: "Appointment Cancelled"
  - `message`: "Your appointment for {documentType} on {formattedDate} has been cancelled."
  - `relatedEntityId`: appointment.id
  - `relatedEntityType`: "appointment"
- Returns the updated appointment

## Data Flow

```
Student Dashboard ──→ Requests List ──→ "Book Appointment" (Ready only)
                                            │
                                            ▼
                              /dashboard/appointments/new?requestId=xxx
                                            │
                              ┌─────────────┼─────────────┐
                              ▼             ▼             ▼
                          Select      Select Date    Confirm
                          Request     + Time Slot     + Create
                                            │
                                            ▼
                              /dashboard/appointments
                              (success toast)
```

## Component Architecture

### New Files

| File | Purpose |
|------|---------|
| `src/app/(student)/dashboard/appointments/page.tsx` | Appointments list page (server component fetching data, pass to client) |
| `src/app/(student)/dashboard/appointments/AppointmentsList.tsx` | Client component with tabs, cancel action, empty states |
| `src/app/(student)/dashboard/appointments/new/page.tsx` | Booking form page layout |
| `src/app/(student)/dashboard/appointments/new/BookingForm.tsx` | Multi-step booking form client component |
| `src/app/(student)/dashboard/appointments/actions.ts` | Server actions (getMyAppointments, getEligibleRequests, createAppointment, cancelAppointment) |

### Modified Files

| File | Change |
|------|--------|
| `src/app/(student)/dashboard/requests/RequestsList.tsx` | Add "Book Appointment" button on Ready rows without existing appointment |
| `src/app/(student)/dashboard/page.tsx` | May already be wired via `UpcomingAppointment` — verify |

## Notifications

Two new notification types (stored as strings in the `type` field, matching existing `createNotification` pattern):

- `"APPOINTMENT_SCHEDULED"` — on booking
- `"APPOINTMENT_CANCELLED"` — on cancellation

The `getNotificationUrl` helper in `lib/notifications.ts` should handle these types by returning `/dashboard/appointments`.

## Validation & Edge Cases

- **Request already has appointment**: If a request somehow already has a scheduled appointment, exclude it from eligible list; if user tries to double-book via URL manipulation, server action rejects
- **Status changed after page load**: If a request was `Ready` when listed but admin changed it before booking, server action validates and returns error
- **Cancelling past appointments**: Cancel button only shown on future `Scheduled` appointments
- **Concurrent booking**: No locking needed — if two users somehow book the same slot, they both succeed (no slot limits)

## Future Considerations (Out of Scope)

- Admin appointment calendar and management
- Slot availability limits per day
- Blocked dates (holidays, closures)
- Email notifications
- Rescheduling (change date/time of existing appointment)
- Admin broadcast notifications about appointments
