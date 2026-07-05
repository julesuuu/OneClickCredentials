# Appointment Reschedule & Cancel Fix — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the cancel flow so cancelled requests become eligible for re-booking, and add an inline reschedule dialog so students can change appointment date/time without re-booking.

**Architecture:** Modify the existing `cancelAppointment` server action to also clear `DocumentRequest.appointmentId`. Add a new `rescheduleAppointment` server action. Add a `RescheduleDialog` component with date/time picker and a "Reschedule" button on upcoming appointment cards.

**Tech Stack:** Next.js 16 Server Actions, Prisma, date-fns, shadcn/ui (Dialog, Calendar, Popover, RadioGroup, Button), sonner, lucide-react

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `src/app/(student)/dashboard/appointments/actions.ts` | Modify | Fix cancel to clear `appointmentId`; add `rescheduleAppointment()` |
| `src/app/(student)/dashboard/appointments/AppointmentsList.tsx` | Modify | Add Reschedule button + `RescheduleDialog` component |

No schema changes needed. No new files.

---

### Task 1: Fix cancelAppointment to free the DocumentRequest

**Files:**
- Modify: `src/app/(student)/dashboard/appointments/actions.ts:140-202`

**Context:**
- Currently `cancelAppointment` only sets the appointment status to `"Cancelled"` but never clears `DocumentRequest.appointmentId`
- After this fix, a cancelled request with `status === "Ready"` will appear in `getEligibleRequests()` because the `appointment: null` filter will match

- [ ] **Step 1: Modify the cancel transaction to also clear appointmentId**

Replace the transaction block in `cancelAppointment` (lines 174-200):

Old code (lines 174-200):
```ts
  const [updatedAppointment] = await prisma.$transaction([
    prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: "Cancelled" },
      include: {
        documentRequest: {
          select: {
            documentType: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    }),
    prisma.notification.create({
      data: {
        studentProfileId: profile.id,
        title: "Appointment Cancelled",
        message: `Your appointment for ${appointment.documentRequest.documentType.name} on ${appointment.date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })} has been cancelled.`,
        type: "APPOINTMENT_CANCELLED",
        relatedEntityType: "appointment",
        relatedEntityId: appointment.id,
      },
    }),
  ]);
```

New code:
```ts
  const [updatedAppointment] = await prisma.$transaction([
    prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: "Cancelled" },
      include: {
        documentRequest: {
          select: {
            documentType: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    }),
    prisma.documentRequest.update({
      where: { id: appointment.documentRequestId },
      data: { appointmentId: null },
    }),
    prisma.notification.create({
      data: {
        studentProfileId: profile.id,
        title: "Appointment Cancelled",
        message: `Your appointment for ${appointment.documentRequest.documentType.name} on ${appointment.date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })} has been cancelled.`,
        type: "APPOINTMENT_CANCELLED",
        relatedEntityType: "appointment",
        relatedEntityId: appointment.id,
      },
    }),
  ]);
```

- [ ] **Step 2: Run lint**

```bash
npm run lint
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/\(student\)/dashboard/appointments/actions.ts
git commit -m "fix: clear DocumentRequest.appointmentId on cancel so request is freed for re-booking"
```

---

### Task 2: Add rescheduleAppointment server action

**Files:**
- Modify: `src/app/(student)/dashboard/appointments/actions.ts`

**Context:**
- New action appended after `cancelAppointment`
- Same validation pattern as `createAppointment`: ownership check, status check, date range validation, timeSlot validation
- Updates the appointment's `date` and `timeSlot` in-place (preserves `id`, `status`, etc.)

- [ ] **Step 1: Add rescheduleAppointment at the end of actions.ts**

Append this after the last closing brace of `cancelAppointment`:

```ts
export async function rescheduleAppointment(
  appointmentId: string,
  date: string,
  timeSlot: string
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Not authenticated");

  const appointment = await prisma.appointment.findFirst({
    where: {
      id: appointmentId,
      status: "Scheduled",
      documentRequest: {
        userId: session.user.id,
      },
    },
    include: {
      documentRequest: {
        select: {
          id: true,
          documentType: { select: { name: true } },
        },
      },
    },
  });

  if (!appointment) throw new Error("Appointment not found or cannot be rescheduled");

  if (!["AM", "PM"].includes(timeSlot)) {
    throw new Error("Time slot must be AM or PM");
  }

  const newDate = new Date(date + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + 30);

  if (newDate < today || newDate > maxDate) {
    throw new Error("Date must be between today and 30 days from now");
  }

  const profile = await prisma.studentProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  if (!profile) throw new Error("Student profile not found");

  const formattedDate = newDate.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const timeSlotLabel =
    timeSlot === "AM"
      ? "AM Session (8:00 - 12:00)"
      : "PM Session (1:00 - 5:00)";

  const [updated] = await prisma.$transaction([
    prisma.appointment.update({
      where: { id: appointmentId },
      data: { date: newDate, timeSlot },
      include: {
        documentRequest: {
          select: {
            documentType: { select: { name: true } },
          },
        },
      },
    }),
    prisma.notification.create({
      data: {
        studentProfileId: profile.id,
        title: "Appointment Rescheduled",
        message: `Your appointment for ${appointment.documentRequest.documentType.name} has been rescheduled to ${formattedDate} (${timeSlotLabel}).`,
        type: "APPOINTMENT_RESCHEDULED",
        relatedEntityType: "appointment",
        relatedEntityId: appointment.id,
      },
    }),
  ]);

  return updated;
}
```

- [ ] **Step 2: Run lint**

```bash
npm run lint
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/\(student\)/dashboard/appointments/actions.ts
git commit -m "feat: add rescheduleAppointment server action"
```

---

### Task 3: Add RescheduleButton and RescheduleDialog to AppointmentsList

**Files:**
- Modify: `src/app/(student)/dashboard/appointments/AppointmentsList.tsx`

**Context:**
- Add a "Reschedule" button on upcoming `Scheduled` appointments, next to the "Cancel" button
- Clicking opens a Dialog with a Calendar date picker and AM/PM radio (pre-filled with current values)
- On save, calls `rescheduleAppointment` from actions, shows toast, refreshes

- [ ] **Step 1: Add imports for dialog components to AppointmentsList.tsx**

Add these imports after the existing shadcn imports (after line 21):

```tsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { rescheduleAppointment } from "./actions";
```

- [ ] **Step 2: Add the RescheduleDialog component**

Add this before the `EmptyState` component (before line 123):

```tsx
function RescheduleDialog({
  appointment,
  open,
  onOpenChange,
}: {
  appointment: Appointment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [date, setDate] = useState<Date | undefined>(
    appointment ? new Date(appointment.date) : undefined
  );
  const [timeSlot, setTimeSlot] = useState(appointment?.timeSlot ?? "");
  const [submitting, setSubmitting] = useState(false);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + 30);

  useEffect(() => {
    if (appointment) {
      setDate(new Date(appointment.date));
      setTimeSlot(appointment.timeSlot);
    }
  }, [appointment]);

  async function handleSave() {
    if (!appointment || !date || !timeSlot) return;
    setSubmitting(true);
    try {
      await rescheduleAppointment(appointment.id, date.toISOString(), timeSlot);
      toast.success("Appointment rescheduled successfully");
      onOpenChange(false);
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to reschedule appointment"
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reschedule Appointment</DialogTitle>
          <DialogDescription>
            {appointment?.documentRequest.documentType.name}
            &ensp;&middot;&ensp;
            Currently{" "}
            {appointment
              ? `${format(new Date(appointment.date), "MMM d, yyyy")} \u00B7 ${appointment.timeSlot === "AM" ? "AM Session (8:00 - 12:00)" : "PM Session (1:00 - 5:00)"}`
              : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>New Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "MMMM d, yyyy") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  disabled={(d) => d < today || d > maxDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>New Time Slot</Label>
            <RadioGroup value={timeSlot} onValueChange={setTimeSlot}>
              <div className="flex gap-2">
                <Label
                  htmlFor="reschedule-am"
                  className="flex-1 flex items-center gap-3 p-4 border rounded-lg cursor-pointer has-[:checked]:border-primary has-[:checked]:bg-primary/5 hover:bg-muted/50 transition-colors"
                >
                  <RadioGroupItem value="AM" id="reschedule-am" />
                  <div>
                    <div className="font-medium">AM Session</div>
                    <div className="text-sm text-muted-foreground">
                      8:00 AM - 12:00 PM
                    </div>
                  </div>
                </Label>
                <Label
                  htmlFor="reschedule-pm"
                  className="flex-1 flex items-center gap-3 p-4 border rounded-lg cursor-pointer has-[:checked]:border-primary has-[:checked]:bg-primary/5 hover:bg-muted/50 transition-colors"
                >
                  <RadioGroupItem value="PM" id="reschedule-pm" />
                  <div>
                    <div className="font-medium">PM Session</div>
                    <div className="text-sm text-muted-foreground">
                      1:00 PM - 5:00 PM
                    </div>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!date || !timeSlot || submitting}>
            {submitting ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 3: Add state and "Reschedule" button to AppointmentCard**

Add `useState` for the dialog (already imported):

In `AppointmentsList` function component, add after `const [cancellingId, setCancellingId]` (line 161):
```tsx
  const [rescheduling, setRescheduling] = useState<Appointment | null>(null);
```

Update the `AppointmentCard` component to accept and render a Reschedule button. Replace the `canCancel` block inside `AppointmentCard` (lines 90-117) with:

```tsx
        <div className="flex items-center gap-2">
          <Badge variant={config.variant}>{config.label}</Badge>
          {canCancel && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onReschedule?.(appointment);
                }}
              >
                Reschedule
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" disabled={isCancelling}>
                    {isCancelling ? "Cancelling..." : "Cancel"}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Cancel Appointment</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to cancel your appointment for{" "}
                      {appointment.documentRequest.documentType.name} on{" "}
                      {format(date, "EEEE, MMMM d, yyyy")}?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Keep Appointment</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onCancel(appointment.id)}>
                      Yes, Cancel
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
        </div>
```

Update the `AppointmentCard` props and function signature to add the `onReschedule` prop:

Change the props interface (lines 52-60):
```tsx
function AppointmentCard({
  appointment,
  onCancel,
  onReschedule,
  isCancelling,
}: {
  appointment: Appointment;
  onCancel: (id: string) => void;
  onReschedule?: (appointment: Appointment) => void;
  isCancelling?: boolean;
}) {
```

- [ ] **Step 4: Pass reschedule state and dialog to the rendering section**

Update the upcoming appointments rendering. Replace the existing upcoming map (lines 249-256) with:

```tsx
              <div className="space-y-3">
                {upcoming.map((appointment) => (
                  <AppointmentCard
                    key={appointment.id}
                    appointment={appointment}
                    onCancel={handleCancel}
                    onReschedule={setRescheduling}
                    isCancelling={cancellingId === appointment.id}
                  />
                ))}
              </div>
```

Add the `RescheduleDialog` before the closing `</div>` of the component (before the final closing `</div>` on line 278):

```tsx
      <RescheduleDialog
        appointment={rescheduling}
        open={!!rescheduling}
        onOpenChange={(open) => {
          if (!open) setRescheduling(null);
        }}
      />
```

- [ ] **Step 5: Verify the import list is complete**

The final import block should look like this (lines 1-23 plus new imports):

```tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { Calendar, CalendarIcon, Clock, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { cancelAppointment, rescheduleAppointment } from "./actions";
```

Note: The Calendar import from lucide-react (icon) and the Calendar import from shadcn/ui need different names. Use `Calendar as CalendarComponent` for the shadcn one.

- [ ] **Step 6: Run lint**

```bash
npm run lint
```

Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add src/app/\(student\)/dashboard/appointments/AppointmentsList.tsx
git commit -m "feat: add reschedule dialog to appointment cards"
```

---

### Final Verification

- [ ] **Step 1: Run typecheck**

```bash
npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 2: Run lint**

```bash
npm run lint
```

Expected: zero errors.

- [ ] **Step 3: Verify git status**

```bash
git status
```

Expected: working tree clean with 2 commits on top of main.
