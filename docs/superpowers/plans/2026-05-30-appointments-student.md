# Student Appointment Booking Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the student-side appointment booking system — list appointments, book new (when request is Ready), cancel, with notification integration.

**Architecture:** Server actions for all data mutations (matching existing pattern). Client components for the list view (tabs, cancel) and multi-step booking form. Updates to existing RequestsList to add "Book Appointment" trigger.

**Tech Stack:** Next.js 16 App Router, Prisma, Better Auth, date-fns, shadcn/ui, Tailwind CSS

---

### Task 1: Appointment Server Actions

**Files:**
- Create: `src/app/(student)/dashboard/appointments/actions.ts`

**Context:**
- Session obtained via: `const session = await auth.api.getSession({ headers: await headers() });`
- Notification pattern (from `admin/requests/actions.ts:89-99`):
  ```typescript
  await prisma.$transaction([
    prisma.documentRequest.update({ ... }),
    prisma.notification.create({
      data: {
        studentProfileId,
        title: "...",
        message: "...",
        type: "STATUS",
        relatedEntityType: "document_request",
        relatedEntityId: id,
      },
    }),
  ]);
  ```
- Student profile ID from session: `const profile = await prisma.studentProfile.findUnique({ where: { userId: session.user.id }, select: { id: true } });`
- The `Appointment` model uses `documentRequestId` (NOT userId) — user is chained via `documentRequest.userId`
- `timeSlot` values are `"AM"` and `"PM"`

- [ ] **Step 1: Create actions.ts with imports and getMyAppointments**

```typescript
"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function getMyAppointments() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) return [];

  const appointments = await prisma.appointment.findMany({
    where: { documentRequest: { userId: session.user.id } },
    include: {
      documentRequest: {
        select: { documentType: { select: { name: true } } },
      },
    },
    orderBy: [{ date: "desc" }, { timeSlot: "asc" }],
  });

  return appointments;
}
```

- [ ] **Step 2: Add getEligibleRequests**

```typescript
export async function getEligibleRequests() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) return [];

  const requests = await prisma.documentRequest.findMany({
    where: {
      userId: session.user.id,
      status: "Ready",
      appointment: null,
    },
    select: {
      id: true,
      createdAt: true,
      documentType: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return requests;
}
```

- [ ] **Step 3: Add createAppointment**

```typescript
export async function createAppointment(
  documentRequestId: string,
  date: string,
  timeSlot: string
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) throw new Error("Unauthorized");

  const profile = await prisma.studentProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!profile) throw new Error("Student profile not found");

  const request = await prisma.documentRequest.findUnique({
    where: { id: documentRequestId },
    include: { documentType: { select: { name: true } } },
  });
  if (!request) throw new Error("Document request not found");
  if (request.userId !== session.user.id) throw new Error("Unauthorized");
  if (request.status !== "Ready") throw new Error("Document request is not ready for appointment");
  if (request.appointmentId) throw new Error("Appointment already exists for this request");

  const appointmentDate = new Date(date);
  const now = new Date();
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 30);

  if (appointmentDate < new Date(now.toDateString())) {
    throw new Error("Cannot book appointment in the past");
  }
  if (appointmentDate > maxDate) {
    throw new Error("Cannot book more than 30 days in advance");
  }
  if (timeSlot !== "AM" && timeSlot !== "PM") {
    throw new Error("Invalid time slot");
  }

  const formattedDate = appointmentDate.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const timeSlotLabel = timeSlot === "AM" ? "AM Session (8:00 - 12:00)" : "PM Session (1:00 - 5:00)";

  const [appointment] = await prisma.$transaction([
    prisma.appointment.create({
      data: {
        documentRequestId,
        date: appointmentDate,
        timeSlot,
        status: "Scheduled",
      },
      include: {
        documentRequest: {
          select: { documentType: { select: { name: true } } },
        },
      },
    }),
    prisma.notification.create({
      data: {
        studentProfileId: profile.id,
        title: "Appointment Confirmed",
        message: `Your appointment for ${request.documentType.name} on ${formattedDate} (${timeSlotLabel}) has been scheduled.`,
        type: "APPOINTMENT_SCHEDULED",
        relatedEntityType: "appointment",
      },
    }),
  ]);

  return appointment;
}
```

- [ ] **Step 4: Add cancelAppointment**

```typescript
export async function cancelAppointment(appointmentId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) throw new Error("Unauthorized");

  const profile = await prisma.studentProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!profile) throw new Error("Student profile not found");

  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      documentRequest: {
        include: { documentType: { select: { name: true } } },
      },
    },
  });
  if (!appointment) throw new Error("Appointment not found");
  if (appointment.documentRequest.userId !== session.user.id) {
    throw new Error("Unauthorized");
  }
  if (appointment.status !== "Scheduled") {
    throw new Error("Can only cancel scheduled appointments");
  }

  const formattedDate = new Date(appointment.date).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const [updated] = await prisma.$transaction([
    prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: "Cancelled" },
      include: {
        documentRequest: {
          select: { documentType: { select: { name: true } } },
        },
      },
    }),
    prisma.notification.create({
      data: {
        studentProfileId: profile.id,
        title: "Appointment Cancelled",
        message: `Your appointment for ${appointment.documentRequest.documentType.name} on ${formattedDate} has been cancelled.`,
        type: "APPOINTMENT_CANCELLED",
        relatedEntityType: "appointment",
      },
    }),
  ]);

  return updated;
}
```

---

### Task 2: Appointments List Page

**Files:**
- Create: `src/app/(student)/dashboard/appointments/page.tsx`
- Create: `src/app/(student)/dashboard/appointments/AppointmentsList.tsx`

**Context:**
- Client component pattern: `"use client"`, shadcn/ui components (`Card`, `Badge`, `Button`, `Calendar`, `Clock` from lucide-react)
- Status badge variants: Scheduled → blue/`default`, Completed → green, Cancelled → gray/`secondary`, No-show → red/`destructive`
- date-fns `format` used throughout: `format(new Date(date), "EEEE, MMMM d, yyyy")` for full date, `format(new Date(date), "MMM d")` for compact
- Time slot display: `timeSlot === "AM" ? "AM Session (8:00 - 12:00)" : "PM Session (1:00 - 5:00)"`

- [ ] **Step 1: Create page.tsx (server component)**

```typescript
import { getMyAppointments } from "./actions";
import { AppointmentsList } from "./AppointmentsList";

export default async function AppointmentsPage() {
  const appointments = await getMyAppointments();
  return <AppointmentsList appointments={appointments} />;
}
```

- [ ] **Step 2: Create AppointmentsList.tsx (client component)**

```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { Calendar, Clock, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { toast } from "sonner";
import { cancelAppointment } from "./actions";

interface Appointment {
  id: string;
  date: Date;
  timeSlot: string;
  status: string;
  notes: string | null;
  createdAt: Date;
  documentRequest: {
    documentType: { name: string };
  };
}

interface AppointmentsListProps {
  appointments: Appointment[];
}

const statusConfig: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
  Scheduled: { variant: "default", label: "Scheduled" },
  Completed: { variant: "default", label: "Completed" },
  Cancelled: { variant: "secondary", label: "Cancelled" },
  "No-show": { variant: "destructive", label: "No-show" },
};

function getTimeSlotLabel(timeSlot: string): string {
  return timeSlot === "AM" ? "AM Session (8:00 - 12:00)" : "PM Session (1:00 - 5:00)";
}

function AppointmentCard({
  appointment,
  onCancel,
}: {
  appointment: Appointment;
  onCancel: (id: string) => void;
}) {
  const config = statusConfig[appointment.status] ?? { variant: "secondary" as const, label: appointment.status };
  const isUpcoming = appointment.status === "Scheduled" && new Date(appointment.date) >= new Date(new Date().toDateString());

  return (
    <Card>
      <CardContent className="p-5 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="text-center w-16 shrink-0">
            <div className="text-xs text-muted-foreground uppercase">
              {format(new Date(appointment.date), "EEE")}
            </div>
            <div className="text-2xl font-semibold">
              {format(new Date(appointment.date), "d")}
            </div>
            <div className="text-xs text-muted-foreground uppercase">
              {format(new Date(appointment.date), "MMM")}
            </div>
          </div>
          <div>
            <div className="font-semibold">{appointment.documentRequest.documentType.name}</div>
            <div className="text-sm text-muted-foreground mt-0.5 flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {getTimeSlotLabel(appointment.timeSlot)}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant={config.variant}>{config.label}</Badge>
          {isUpcoming && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                  Cancel
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Cancel Appointment?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will cancel your appointment for {appointment.documentRequest.documentType.name} on{" "}
                    {format(new Date(appointment.date), "EEEE, MMMM d, yyyy")}.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onCancel(appointment.id)}>
                    Yes, Cancel
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function AppointmentsList({ appointments }: AppointmentsListProps) {
  const router = useRouter();
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");
  const [cancelling, setCancelling] = useState(false);

  const now = new Date();
  const todayStart = new Date(now.toDateString());

  const upcomingAppointments = appointments.filter(
    (a) => a.status === "Scheduled" && new Date(a.date) >= todayStart
  );
  const pastAppointments = appointments.filter(
    (a) => a.status !== "Scheduled" || new Date(a.date) < todayStart
  );

  const displayedAppointments = tab === "upcoming" ? upcomingAppointments : pastAppointments;

  async function handleCancel(id: string) {
    setCancelling(true);
    try {
      await cancelAppointment(id);
      toast.success("Appointment cancelled");
      router.refresh();
    } catch {
      toast.error("Failed to cancel appointment");
    } finally {
      setCancelling(false);
    }
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Appointments</h1>
          <p className="text-muted-foreground mt-1">Manage and book document pickup appointments</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/appointments/new">
            <Plus className="mr-2 h-4 w-4" />
            Book New Appointment
          </Link>
        </Button>
      </div>

      <div className="flex gap-4 border-b mb-6">
        <button
          onClick={() => setTab("upcoming")}
          className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
            tab === "upcoming"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Upcoming ({upcomingAppointments.length})
        </button>
        <button
          onClick={() => setTab("past")}
          className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
            tab === "past"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Past ({pastAppointments.length})
        </button>
      </div>

      {appointments.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No Appointments Yet</h3>
            <p className="text-muted-foreground mt-2">
              Book an appointment once your document request is marked as Ready.
            </p>
            <Button className="mt-4" asChild>
              <Link href="/dashboard/appointments/new">Book Your First Appointment</Link>
            </Button>
          </CardContent>
        </Card>
      ) : displayedAppointments.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">
              {tab === "upcoming" ? "No Upcoming Appointments" : "No Past Appointments"}
            </h3>
            <p className="text-muted-foreground mt-2">
              {tab === "upcoming"
                ? "You have no upcoming appointments scheduled."
                : "You have no past appointments."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {displayedAppointments.map((appointment) => (
            <AppointmentCard
              key={appointment.id}
              appointment={appointment}
              onCancel={handleCancel}
            />
          ))}
        </div>
      )}
    </div>
  );
}
```

---

### Task 3: Booking Form

**Files:**
- Create: `src/app/(student)/dashboard/appointments/new/page.tsx`
- Create: `src/app/(student)/dashboard/appointments/new/BookingForm.tsx`

**Context:**
- Access eligible requests via `getEligibleRequests()` from `../actions`
- Create via `createAppointment()` from `../actions`
- If `?requestId=xxx` query param present, pre-select that request
- Date range: today through +30 days. Weekends allowed.
- Calendar: Use a simple date picker. The project already has shadcn's Popover + Calendar components available. The pattern from `src/components/ui/calendar.tsx` should be used with `mode="single"`.
- The `timeSlot` values are `"AM"` and `"PM"`
- On success: toast + redirect to `/dashboard/appointments`

- [ ] **Step 1: Create new/page.tsx**

```typescript
import { getEligibleRequests } from "../actions";
import { BookingForm } from "./BookingForm";

export default async function NewAppointmentPage() {
  const eligibleRequests = await getEligibleRequests();
  return <BookingForm eligibleRequests={eligibleRequests} />;
}
```

- [ ] **Step 2: Create new/BookingForm.tsx**

```typescript
"use client";

import { useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format, addDays, startOfDay } from "date-fns";
import { CalendarIcon, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { createAppointment } from "../actions";

interface EligibleRequest {
  id: string;
  createdAt: Date;
  documentType: { name: string };
}

interface BookingFormProps {
  eligibleRequests: EligibleRequest[];
}

type Step = "request" | "datetime" | "confirm";

export function BookingForm({ eligibleRequests }: BookingFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedId = searchParams.get("requestId");

  const [step, setStep] = useState<Step>(preselectedId && eligibleRequests.some((r) => r.id === preselectedId) ? "datetime" : "request");
  const [selectedRequestId, setSelectedRequestId] = useState<string>(preselectedId ?? "");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  const today = startOfDay(new Date());
  const maxDate = addDays(today, 30);

  const selectedRequest = eligibleRequests.find((r) => r.id === selectedRequestId);

  const canProceedToDateTime = selectedRequestId !== "";
  const canProceedToConfirm = canProceedToDateTime && selectedDate && selectedTimeSlot;

  async function handleConfirm() {
    if (!selectedRequestId || !selectedDate || !selectedTimeSlot) return;
    setSubmitting(true);
    try {
      await createAppointment(selectedRequestId, selectedDate.toISOString(), selectedTimeSlot);
      toast.success("Appointment booked successfully!");
      router.push("/dashboard/appointments");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to book appointment");
    } finally {
      setSubmitting(false);
    }
  }

  if (eligibleRequests.length === 0) {
    return (
      <div className="container mx-auto py-10 max-w-2xl">
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <CalendarIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No Eligible Requests</h3>
            <p className="text-muted-foreground mt-2">
              You don&apos;t have any document requests ready for pickup. Requests become available for booking once they are marked as Ready.
            </p>
            <Button className="mt-4" asChild>
              <a href="/dashboard/requests">View My Requests</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 max-w-2xl">
      <h1 className="text-2xl font-bold tracking-tight mb-2">Book Appointment</h1>
      <p className="text-muted-foreground mb-8">Schedule a date and time to pick up your documents.</p>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8 text-sm">
        <div className={`flex items-center gap-2 ${step === "request" ? "text-primary font-semibold" : step === "datetime" || step === "confirm" ? "text-primary" : "text-muted-foreground"}`}>
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${
            step === "request" ? "bg-primary text-primary-foreground" :
            step === "datetime" || step === "confirm" ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
          }`}>
            {step === "datetime" || step === "confirm" ? <CheckCircle2 className="h-4 w-4" /> : "1"}
          </div>
          Request
        </div>
        <div className="h-px flex-1 bg-border" />
        <div className={`flex items-center gap-2 ${step === "datetime" ? "text-primary font-semibold" : step === "confirm" ? "text-primary" : "text-muted-foreground"}`}>
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${
            step === "datetime" ? "bg-primary text-primary-foreground" :
            step === "confirm" ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
          }`}>
            {step === "confirm" ? <CheckCircle2 className="h-4 w-4" /> : "2"}
          </div>
          Date & Time
        </div>
        <div className="h-px flex-1 bg-border" />
        <div className={`flex items-center gap-2 ${step === "confirm" ? "text-primary font-semibold" : "text-muted-foreground"}`}>
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${
            step === "confirm" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
          }`}>
            3
          </div>
          Confirm
        </div>
      </div>

      {/* Step 1: Select Request */}
      {step === "request" && (
        <Card>
          <CardHeader>
            <CardTitle>Select Document Request</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              These are your requests that are marked as Ready for pickup.
            </p>
            <RadioGroup value={selectedRequestId} onValueChange={setSelectedRequestId}>
              <div className="space-y-3">
                {eligibleRequests.map((req) => (
                  <Label
                    key={req.id}
                    htmlFor={req.id}
                    className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer has-[:checked]:border-primary has-[:checked]:bg-primary/5 hover:bg-muted/50 transition-colors"
                  >
                    <RadioGroupItem value={req.id} id={req.id} />
                    <div>
                      <div className="font-medium">{req.documentType.name}</div>
                      <div className="text-sm text-muted-foreground">
                        Requested {format(new Date(req.createdAt), "MMM d, yyyy")}
                      </div>
                    </div>
                  </Label>
                ))}
              </div>
            </RadioGroup>
            <Button
              className="mt-6 w-full"
              disabled={!canProceedToDateTime}
              onClick={() => setStep("datetime")}
            >
              Continue
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Date & Time */}
      {step === "datetime" && (
        <Card>
          <CardHeader>
            <CardTitle>Select Date & Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label className="text-sm font-medium mb-2 block">Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !selectedDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, "MMMM d, yyyy") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      disabled={(date) => date < today || date > maxDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label className="text-sm font-medium mb-2 block">Time Slot</Label>
                <RadioGroup value={selectedTimeSlot} onValueChange={setSelectedTimeSlot}>
                  <div className="space-y-2">
                    <Label
                      htmlFor="am"
                      className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer has-[:checked]:border-primary has-[:checked]:bg-primary/5 hover:bg-muted/50 transition-colors"
                    >
                      <RadioGroupItem value="AM" id="am" />
                      <div>
                        <div className="font-medium">AM Session</div>
                        <div className="text-sm text-muted-foreground">8:00 AM - 12:00 PM</div>
                      </div>
                    </Label>
                    <Label
                      htmlFor="pm"
                      className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer has-[:checked]:border-primary has-[:checked]:bg-primary/5 hover:bg-muted/50 transition-colors"
                    >
                      <RadioGroupItem value="PM" id="pm" />
                      <div>
                        <div className="font-medium">PM Session</div>
                        <div className="text-sm text-muted-foreground">1:00 PM - 5:00 PM</div>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button variant="outline" onClick={() => setStep("request")} className="flex-1">
                Back
              </Button>
              <Button
                className="flex-1"
                disabled={!canProceedToConfirm}
                onClick={() => setStep("confirm")}
              >
                Continue
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Confirm */}
      {step === "confirm" && (
        <Card>
          <CardHeader>
            <CardTitle>Confirm Appointment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-muted/50 rounded-lg p-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Document</span>
                <span className="font-medium">{selectedRequest?.documentType.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date</span>
                <span className="font-medium">
                  {selectedDate ? format(selectedDate, "EEEE, MMMM d, yyyy") : ""}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Time</span>
                <span className="font-medium">
                  {selectedTimeSlot === "AM" ? "AM Session (8:00 - 12:00)" : "PM Session (1:00 - 5:00)"}
                </span>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setStep("datetime")}
                className="flex-1"
                disabled={submitting}
              >
                Back
              </Button>
              <Button
                className="flex-1"
                onClick={handleConfirm}
                disabled={submitting}
              >
                {submitting ? "Booking..." : "Confirm Booking"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
```

---

### Task 4: Update RequestsList (Add "Book Appointment" Button)

**Files:**
- Modify: `src/app/(student)/dashboard/requests/RequestsList.tsx` (add Book Appointment button to Ready rows without existing appointment)

**Context:**
- The `Request` interface already has `appointment: { id, date, timeSlot, status } | null`
- Currently, the Appointment column shows "Not scheduled" when `request.appointment === null`
- Need to add a "Book Appointment" button only when `request.status === "Ready"` AND `request.appointment === null`
- Button links to `/dashboard/appointments/new?requestId=${request.id}`
- Use existing Button component and Link from next/link (already imported)

- [ ] **Step 1: Modify the Appointment cell to add "Book Appointment" button for eligible Ready requests**

Replace the Appointment table cell (lines 149-158):
```typescript
                      <TableCell>
                        {request.appointment ? (
                          <div className="text-sm">
                            <div>{format(new Date(request.appointment.date), "MMM d, yyyy")}</div>
                            <div className="text-xs text-muted-foreground">{request.appointment.timeSlot}</div>
                          </div>
                        ) : request.status === "Ready" ? (
                          <Button asChild variant="outline" size="sm">
                            <Link href={`/dashboard/appointments/new?requestId=${request.id}`}>
                              Book Appointment
                            </Link>
                          </Button>
                        ) : (
                          <span className="text-muted-foreground text-sm">Not scheduled</span>
                        )}
                      </TableCell>
```

---

### Task 5: Update Notifications Lib

**Files:**
- Modify: `src/lib/notifications.ts` (add appointment-related notification type handling)

**Context:**
- `getNotificationUrl` currently handles `document_request`, `verification`, and legacy types
- Need to add handling for `"appointment"` relatedEntityType → return `/dashboard/appointments`

- [ ] **Step 1: Add appointment handling to getNotificationUrl**

Replace the function body (lines 24-34):
```typescript
export function getNotificationUrl(notification: Pick<Notification, "relatedEntityType" | "type">): string {
  if (notification.relatedEntityType === "document_request") {
    return "/dashboard/requests";
  }
  if (notification.relatedEntityType === "verification") {
    return "/dashboard/verification";
  }
  if (notification.relatedEntityType === "appointment") {
    return "/dashboard/appointments";
  }
  if (["PROCESSING", "READY", "COMPLETED"].includes(notification.type)) {
    return "/dashboard/requests";
  }
  return "/dashboard/verification";
}
```

---

### Post-Implementation: Lint & Build Check

Run these commands after all tasks:
```bash
npm run lint
npm run build
```
