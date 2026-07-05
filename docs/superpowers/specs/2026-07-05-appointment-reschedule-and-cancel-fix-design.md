# Student Appointment Reschedule & Cancel Fix

## Overview

Two changes to the student appointment system:

1. **Cancel fix** — When a student cancels an appointment, the linked `DocumentRequest` is freed so it becomes eligible for re-booking (the original bug: `appointmentId` was never cleared, hiding cancelled requests from `getEligibleRequests`).
2. **Reschedule** — Students can change the date and time of an upcoming `Scheduled` appointment directly, without cancelling and re-booking.

## Server Actions

### Modified: `cancelAppointment(id)` (in `actions.ts`)

After setting the appointment status to `"Cancelled"`, also set `documentRequest.appointmentId = null` on the linked request. The request's status remains `"Ready"`, making it immediately visible in `getEligibleRequests()` for re-booking.

```ts
// Additional update in the existing transaction:
prisma.documentRequest.update({
  where: { id: appointment.documentRequestId },
  data: { appointmentId: null },
})
```

### New: `rescheduleAppointment(id, date, timeSlot)`

Validates:
- Appointment belongs to the current user
- Current status is `"Scheduled"`
- `date` is within valid range (today through +30 days from today)
- `timeSlot` is `"AM"` or `"PM"`

On success:
- Updates the appointment's `date` and `timeSlot`
- Creates an `APPOINTMENT_RESCHEDULED` notification: "Your appointment for {docType} has been rescheduled to {date} ({timeSlot})."
- Returns the updated appointment

## UI Changes

### Appointment Card (AppointmentsList.tsx)

Upcoming `Scheduled` appointments show two buttons:
- **Reschedule** (outline button) — opens the reschedule dialog
- **Cancel** (destructive ghost button) — existing confirmation dialog, unchanged

### Reschedule Dialog

A shadcn `Dialog` component with:
- Header: "Reschedule Appointment"
- Subtitle: document type name + current date/time for reference
- Date picker (`Calendar` from shadcn/ui, same component as booking form, pre-selected with current appointment date)
- Time slot radio (`AM` / `PM`, pre-selected with current slot)
- Footer: "Cancel" (outline) + "Save Changes" (primary)

On successful save: toast "Appointment rescheduled", dialog closes, list refreshes via `router.refresh()`.

## Data Flow

```
Reschedule button click
  → Dialog opens (pre-filled with current date/timeSlot)
  → Student picks new values → "Save Changes"
  → calls rescheduleAppointment(id, date, timeSlot)
  → validates ownership + status + date range
  → prisma.appointment.update({ date, timeSlot })
  → creates APPOINTMENT_RESCHEDULED notification
  → toast + refresh list
```

## Validation & Edge Cases

| Case | Handling |
|------|----------|
| Reschedule on past/cancelled/completed appointment | Button only shown on upcoming `Scheduled` |
| Status changed by admin between page load and reschedule | Server validates status is still `"Scheduled"` — rejects with error toast |
| Past date or beyond 30 days | Calendar component disables invalid dates; server re-validates |
| Request deleted while appointment exists | Cascade deletes the appointment — handled by Prisma |
| Reschedule to same date/time | Allowed — no-op update is harmless |
| Cancel frees request that was already re-booked | Impossible: cancel only runs on the one active appointment per request (1:1 relation) |

## Files Changed

| File | Change |
|------|--------|
| `src/app/(student)/dashboard/appointments/actions.ts` | Fix `cancelAppointment` to clear `appointmentId`; add `rescheduleAppointment` |
| `src/app/(student)/dashboard/appointments/AppointmentsList.tsx` | Add Reschedule button + dialog component |
| `src/lib/notifications.ts` | No change needed (already routes `"appointment"` to `/dashboard/appointments`) |

## Notifications

New notification type (same pattern as existing `APPOINTMENT_SCHEDULED`, `APPOINTMENT_CANCELLED`):

| Type | Title | Message |
|------|-------|---------|
| `APPOINTMENT_RESCHEDULED` | Appointment Rescheduled | "Your appointment for {DocumentType} has been rescheduled to {date} ({timeSlot})." |

## Out of Scope

- Admin-triggered reschedule (admins cancel only, student re-books)
- Reschedule limits (e.g. max 2 reschedules per appointment)
- Email notification for reschedule
- Capacity/slot tracking

## Acceptance Criteria

1. Student cancels an appointment → request appears in eligible list for re-booking
2. Student reschedules an upcoming appointment → date/time updates in-place
3. Reschedule button only shows on upcoming `Scheduled` appointments
4. Reschedule dialog pre-fills with current values
5. Corresponding notification created on reschedule
6. Both `npm run lint` and `npx tsc --noEmit` pass
