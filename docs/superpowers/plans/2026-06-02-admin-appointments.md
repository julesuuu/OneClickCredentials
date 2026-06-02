# Admin Appointments Management — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `/admin/appointments` — a table + detail dialog that lets admins view, complete, flag as no-show, or cancel student pickup appointments. No schema changes; repurpose `Appointment.notes` for cancellation reasons.

**Architecture:** Mirror the existing `/admin/requests` pattern. Server actions in `actions.ts`, client manager component with `@tanstack/react-query`, shadcn/ui `Dialog` for the detail view with status-conditional action footer, `AlertDialog` for cancel-reason confirmation.

**Tech Stack:** Next.js 16 Server Actions, Prisma, @tanstack/react-query, date-fns, shadcn/ui (Dialog, AlertDialog, Table, Button, Badge, Card, Input, Label, Textarea, Skeleton), lucide-react, sonner

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `src/app/(admin)/admin/appointments/actions.ts` | Create | `getAllAppointments()`, `updateAppointmentStatus()`; `AppointmentWithRelations` type |
| `src/app/(admin)/admin/appointments/page.tsx` | Create | Server component shell that renders `<AppointmentsManager />` |
| `src/app/(admin)/admin/appointments/loading.tsx` | Create | Skeleton table while client fetches |
| `src/app/(admin)/admin/appointments/AppointmentsManager.tsx` | Create | Client component: status filter, search, table, overdue indicator, empty state, dialog trigger |
| `src/app/(admin)/admin/appointments/AppointmentDetailDialog.tsx` | Create | Client component: 3-section dialog with status-conditional action footer and cancel-reason AlertDialog |

No existing files are modified. Auth/role protection is inherited from `src/app/(admin)/admin/layout.tsx`.

---

## Task 1: Server actions — data fetch and status mutations

**Files:**
- Create: `src/app/(admin)/admin/appointments/actions.ts`

- [ ] **Step 1: Create the actions file with type and `getAllAppointments()`**

Create the file `src/app/(admin)/admin/appointments/actions.ts` with this exact content:

```ts
"use server";

import prisma from "@/lib/prisma";

export interface AppointmentWithRelations {
  id: string;
  date: Date;
  timeSlot: string;
  status: string;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  documentRequest: {
    id: string;
    documentType: { name: string };
    user: {
      email: string;
      studentProfile: {
        id: string;
        fullName: string;
        studentNumber: string;
        course: string;
        yearLevel: string;
      } | null;
    };
  };
}

export async function getAllAppointments(): Promise<AppointmentWithRelations[]> {
  const appointments = await prisma.appointment.findMany({
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
  return appointments;
}
```

- [ ] **Step 2: Add `updateAppointmentStatus()` with validation and notification transaction**

Append the following below `getAllAppointments` in the same file:

```ts
type AppointmentTransitionStatus = "Completed" | "No-show" | "Cancelled";

interface UpdateAppointmentStatusOptions {
  reason?: string;
}

const DATE_FORMAT = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  month: "long",
  day: "numeric",
  year: "numeric",
});

export async function updateAppointmentStatus(
  id: string,
  status: AppointmentTransitionStatus,
  options: UpdateAppointmentStatusOptions = {}
) {
  const appointment = await prisma.appointment.findUnique({
    where: { id },
    include: {
      documentRequest: {
        select: {
          documentType: { select: { name: true } },
          user: {
            select: { studentProfile: { select: { id: true } } },
          },
        },
      },
    },
  });

  if (!appointment) {
    throw new Error("Appointment not found");
  }
  if (appointment.status !== "Scheduled") {
    throw new Error(`Cannot transition from ${appointment.status} to ${status}`);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const appointmentDate = new Date(appointment.date);
  appointmentDate.setHours(0, 0, 0, 0);

  if (status === "Completed" && appointmentDate > today) {
    throw new Error("Cannot mark a future appointment as completed");
  }
  if (status === "No-show" && appointmentDate >= today) {
    throw new Error("No-show can only be marked for past appointments");
  }

  const studentProfileId =
    appointment.documentRequest.user.studentProfile?.id;
  if (!studentProfileId) {
    throw new Error("Student profile not found");
  }

  const documentName = appointment.documentRequest.documentType.name;
  const dateLabel = DATE_FORMAT.format(appointment.date);

  const notificationContent: Record<
    AppointmentTransitionStatus,
    { title: string; message: string; type: string }
  > = {
    Completed: {
      title: "Appointment Completed",
      message: `Your appointment for ${documentName} on ${dateLabel} has been marked as completed.`,
      type: "APPOINTMENT_COMPLETED",
    },
    "No-show": {
      title: "Missed Appointment",
      message: `You missed your appointment for ${documentName} on ${dateLabel}. Please rebook.`,
      type: "APPOINTMENT_NO_SHOW",
    },
    Cancelled: {
      title: "Appointment Cancelled",
      message: `Your appointment for ${documentName} on ${dateLabel} was cancelled by an administrator.${
        options.reason ? ` Reason: ${options.reason}` : ""
      }`,
      type: "APPOINTMENT_CANCELLED_BY_ADMIN",
    },
  };

  const content = notificationContent[status];

  const notesUpdate =
    status === "Cancelled"
      ? `Cancelled by admin: ${options.reason ?? ""}`.trim()
      : undefined;

  await prisma.$transaction([
    prisma.appointment.update({
      where: { id },
      data: {
        status,
        ...(notesUpdate !== undefined ? { notes: notesUpdate } : {}),
      },
    }),
    prisma.notification.create({
      data: {
        studentProfileId,
        title: content.title,
        message: content.message,
        type: content.type,
        relatedEntityType: "appointment",
        relatedEntityId: id,
      },
    }),
  ]);

  return { success: true };
}
```

- [ ] **Step 3: Run lint**

```bash
npm run lint
```

Expected: no errors related to `src/app/(admin)/admin/appointments/actions.ts`.

- [ ] **Step 4: Commit**

```bash
git add src/app/\(admin\)/admin/appointments/actions.ts
git commit -m "feat(admin/appointments): add server actions for fetching and status transitions"
```

---

## Task 2: Page shell and loading skeleton

**Files:**
- Create: `src/app/(admin)/admin/appointments/page.tsx`
- Create: `src/app/(admin)/admin/appointments/loading.tsx`

- [ ] **Step 1: Create `page.tsx`**

Create `src/app/(admin)/admin/appointments/page.tsx` with this content:

```tsx
import AppointmentsManager from "./AppointmentsManager";

export default function AdminAppointmentsPage() {
  return <AppointmentsManager />;
}
```

- [ ] **Step 2: Create `loading.tsx`**

Create `src/app/(admin)/admin/appointments/loading.tsx` with this content:

```tsx
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminAppointmentsLoading() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-4 w-72 mt-2" />
      </div>
      <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
        <Skeleton className="h-10 w-96" />
        <Skeleton className="h-10 w-72" />
      </div>
      <div className="border rounded-lg">
        <div className="p-4 space-y-3">
          <Skeleton className="h-6 w-full" />
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Run lint**

```bash
npm run lint
```

Expected: no new errors. The `AppointmentsManager` import in `page.tsx` will produce a "module not found" error at this stage — **that is expected** because we have not created the manager yet. We resolve that in Task 3. If lint blocks the commit, you can run `npx tsc --noEmit` separately to confirm the only error is the missing module. The lint commit can proceed; the file references a module that will exist by the end of Task 3.

- [ ] **Step 4: Commit**

```bash
git add src/app/\(admin\)/admin/appointments/page.tsx src/app/\(admin\)/admin/appointments/loading.tsx
git commit -m "feat(admin/appointments): add page shell and loading skeleton"
```

---

## Task 3: AppointmentsManager — table, filter, search, overdue indicator

**Files:**
- Create: `src/app/(admin)/admin/appointments/AppointmentsManager.tsx`

- [ ] **Step 1: Create the manager file**

Create `src/app/(admin)/admin/appointments/AppointmentsManager.tsx` with this exact content:

```tsx
"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { AlertTriangle, Calendar, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getAllAppointments, type AppointmentWithRelations } from "./actions";
import { AppointmentDetailDialog } from "./AppointmentDetailDialog";

type StatusFilter =
  | "all"
  | "Scheduled"
  | "Overdue"
  | "Completed"
  | "No-show"
  | "Cancelled";

const filterOptions: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "Scheduled", label: "Scheduled" },
  { value: "Overdue", label: "Overdue" },
  { value: "Completed", label: "Completed" },
  { value: "No-show", label: "No-show" },
  { value: "Cancelled", label: "Cancelled" },
];

const statusBadgeVariant: Record<
  string,
  "default" | "secondary" | "outline" | "destructive"
> = {
  Scheduled: "default",
  Completed: "secondary",
  "No-show": "destructive",
  Cancelled: "outline",
};

function isOverdue(appointment: AppointmentWithRelations): boolean {
  if (appointment.status !== "Scheduled") return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const date = new Date(appointment.date);
  date.setHours(0, 0, 0, 0);
  return date < today;
}

function AppointmentsTableSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <Card>
      <CardContent className="pt-6 text-center py-10">
        <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold">No appointments yet</h3>
        <p className="text-muted-foreground mt-2">
          When students book pickup appointments, they&apos;ll appear here.
        </p>
      </CardContent>
    </Card>
  );
}

function NoMatchesState({ onClear }: { onClear: () => void }) {
  return (
    <Card>
      <CardContent className="pt-6 text-center py-10">
        <p className="text-muted-foreground">
          No appointments match the current filters.
        </p>
        <Button variant="outline" className="mt-4" onClick={onClear}>
          Clear filters
        </Button>
      </CardContent>
    </Card>
  );
}

export default function AppointmentsManager() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [selected, setSelected] = useState<AppointmentWithRelations | null>(
    null
  );

  const { data: appointments, isLoading } = useQuery({
    queryKey: ["admin-appointments"],
    queryFn: getAllAppointments,
  });

  const filtered = useMemo(() => {
    if (!appointments) return [];
    const searchLower = search.toLowerCase();
    return appointments.filter((a) => {
      const profile = a.documentRequest.user.studentProfile;
      const name = profile?.fullName?.toLowerCase() ?? "";
      const number = profile?.studentNumber?.toLowerCase() ?? "";
      const matchesSearch =
        !search || name.includes(searchLower) || number.includes(searchLower);
      if (!matchesSearch) return false;
      if (filter === "all") return true;
      if (filter === "Overdue") return isOverdue(a);
      return a.status === filter;
    });
  }, [appointments, search, filter]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Appointments</h1>
        <p className="text-muted-foreground mt-1">
          Manage scheduled pickup appointments
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
        <div
          className="flex flex-wrap gap-1 bg-muted rounded-lg p-1"
          role="tablist"
          aria-label="Filter by status"
        >
          {filterOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              role="tab"
              aria-selected={filter === opt.value}
              onClick={() => setFilter(opt.value)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                filter === opt.value
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or student number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {isLoading ? (
        <AppointmentsTableSkeleton />
      ) : !appointments || appointments.length === 0 ? (
        <EmptyState />
      ) : filtered.length === 0 ? (
        <NoMatchesState
          onClear={() => {
            setSearch("");
            setFilter("all");
          }}
        />
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Document</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((a) => {
                const overdue = isOverdue(a);
                const profile = a.documentRequest.user.studentProfile;
                return (
                  <TableRow
                    key={a.id}
                    onClick={() => setSelected(a)}
                    className={`cursor-pointer ${
                      overdue ? "border-l-4 border-l-destructive" : ""
                    }`}
                  >
                    <TableCell className="font-medium">
                      {format(new Date(a.date), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {a.timeSlot === "AM" ? "AM" : "PM"}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {profile?.fullName ?? "—"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {profile?.studentNumber ??
                          a.documentRequest.user.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      {a.documentRequest.documentType.name}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            statusBadgeVariant[a.status] ?? "secondary"
                          }
                        >
                          {a.status}
                        </Badge>
                        {overdue && (
                          <Badge
                            variant="destructive"
                            className="gap-1"
                            aria-label="Overdue"
                          >
                            <AlertTriangle className="h-3 w-3" />
                            Overdue
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <AppointmentDetailDialog
        appointment={selected}
        open={!!selected}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      />
    </div>
  );
}
```

- [ ] **Step 2: Manual verification — table renders with filter + search**

Run the dev server:

```bash
npm run dev
```

Then verify:

1. Navigate to `http://localhost:3000/auth/sign-in` and sign in as an admin user.
2. Navigate to `http://localhost:3000/admin/appointments`.
3. Expected: a "No appointments yet" empty state. (We have not seeded data yet; that's fine — we'll create test data in Task 5.)
4. Create a temporary appointment directly in the database to verify the table renders. From a Node REPL or `prisma studio`:
   ```ts
   // Pick a StudentProfile.user.documentRequest id, create an Appointment for it
   const req = await prisma.documentRequest.findFirst({
     where: { appointment: null, status: "Ready" },
     include: { user: true },
   });
   await prisma.appointment.create({
     data: {
       documentRequestId: req.id,
       date: new Date("2025-06-05"),
       timeSlot: "AM",
       status: "Scheduled",
     },
   });
   ```
5. Reload `/admin/appointments`. The row should appear with date, time, student, document, and a "Scheduled" badge.
6. Type a student name in the search box. The row should filter.
7. Click the "Overdue" filter. Create another appointment with `date: new Date("2025-05-01")` to trigger the overdue path; the row should show a `⚠ Overdue` badge and a destructive-color left border.
8. Click a row. The detail dialog should open (we have not built it yet — Task 4 — so the import will fail). **This is expected.** We verify the dialog in Task 4.

- [ ] **Step 3: Clean up the temporary seed data**

Delete the test appointments created in Step 2 so they don't leak into the final smoke test:

```ts
await prisma.appointment.deleteMany({
  where: { date: { in: [new Date("2025-06-05"), new Date("2025-05-01")] } },
});
```

- [ ] **Step 4: Run lint**

```bash
npm run lint
```

Expected: no errors in `AppointmentsManager.tsx`. (There will still be a missing-module error for `AppointmentDetailDialog` until Task 4 finishes.)

- [ ] **Step 5: Commit**

```bash
git add src/app/\(admin\)/admin/appointments/AppointmentsManager.tsx
git commit -m "feat(admin/appointments): add manager with filter, search, and overdue indicator"
```

---

## Task 4: AppointmentDetailDialog — view + actions + cancel confirmation

**Files:**
- Create: `src/app/(admin)/admin/appointments/AppointmentDetailDialog.tsx`

- [ ] **Step 1: Create the dialog file**

Create `src/app/(admin)/admin/appointments/AppointmentDetailDialog.tsx` with this exact content:

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { updateAppointmentStatus, type AppointmentWithRelations } from "./actions";

interface AppointmentDetailDialogProps {
  appointment: AppointmentWithRelations | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type TransitionStatus = "Completed" | "No-show" | "Cancelled";

const statusBadgeVariant: Record<
  string,
  "default" | "secondary" | "outline" | "destructive"
> = {
  Scheduled: "default",
  Completed: "secondary",
  "No-show": "destructive",
  Cancelled: "outline",
};

function getTimeSlotLabel(timeSlot: string): string {
  return timeSlot === "AM"
    ? "AM Session (8:00 - 12:00)"
    : "PM Session (1:00 - 5:00)";
}

export function AppointmentDetailDialog({
  appointment,
  open,
  onOpenChange,
}: AppointmentDetailDialogProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  const mutation = useMutation({
    mutationFn: ({
      status,
      reason,
    }: {
      status: TransitionStatus;
      reason?: string;
    }) => {
      if (!appointment) throw new Error("No appointment selected");
      return updateAppointmentStatus(appointment.id, status, { reason });
    },
    onSuccess: (_, variables) => {
      const labelMap: Record<TransitionStatus, string> = {
        Completed: "marked as completed",
        "No-show": "marked as no-show",
        Cancelled: "cancelled",
      };
      toast.success(`Appointment ${labelMap[variables.status]}`);
      queryClient.invalidateQueries({ queryKey: ["admin-appointments"] });
      onOpenChange(false);
      setCancelDialogOpen(false);
      setCancelReason("");
      router.refresh();
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  if (!appointment) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const date = new Date(appointment.date);
  date.setHours(0, 0, 0, 0);
  const isScheduled = appointment.status === "Scheduled";
  const canComplete = isScheduled && date <= today;
  const canMarkNoShow = isScheduled && date < today;
  const profile = appointment.documentRequest.user.studentProfile;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{format(date, "EEEE, MMMM d, yyyy")}</DialogTitle>
            <DialogDescription>
              {getTimeSlotLabel(appointment.timeSlot)}
            </DialogDescription>
            <div className="pt-1">
              <Badge
                variant={statusBadgeVariant[appointment.status] ?? "secondary"}
              >
                {appointment.status}
              </Badge>
            </div>
          </DialogHeader>

          <div className="space-y-4">
            <Card>
              <CardContent className="p-4 space-y-2">
                <h3 className="font-semibold text-sm text-muted-foreground">
                  Student
                </h3>
                <div>
                  <p className="font-medium">{profile?.fullName ?? "—"}</p>
                  <p className="text-sm text-muted-foreground">
                    {profile?.studentNumber ?? "—"} · {profile?.course ?? "—"}{" "}
                    · {profile?.yearLevel ?? "—"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {appointment.documentRequest.user.email}
                  </p>
                </div>
                <div className="pt-2">
                  <a
                    href="/admin/requests"
                    className="text-sm text-primary hover:underline"
                  >
                    View request →
                  </a>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 space-y-2">
                <h3 className="font-semibold text-sm text-muted-foreground">
                  Appointment Details
                </h3>
                <dl className="grid grid-cols-2 gap-2 text-sm">
                  <dt className="text-muted-foreground">Document</dt>
                  <dd>{appointment.documentRequest.documentType.name}</dd>
                  <dt className="text-muted-foreground">Created</dt>
                  <dd>
                    {format(
                      new Date(appointment.createdAt),
                      "MMM d, yyyy 'at' h:mm a"
                    )}
                  </dd>
                  <dt className="text-muted-foreground">Last updated</dt>
                  <dd>
                    {format(
                      new Date(appointment.updatedAt),
                      "MMM d, yyyy 'at' h:mm a"
                    )}
                  </dd>
                </dl>
              </CardContent>
            </Card>

            {appointment.notes && (
              <Card>
                <CardContent className="p-4 space-y-2">
                  <h3 className="font-semibold text-sm text-muted-foreground">
                    Notes
                  </h3>
                  <p className="text-sm whitespace-pre-wrap">
                    {appointment.notes}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            {isScheduled ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => mutation.mutate({ status: "No-show" })}
                  disabled={!canMarkNoShow || mutation.isPending}
                >
                  Mark No-show
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setCancelDialogOpen(true)}
                  disabled={mutation.isPending}
                >
                  Cancel Appointment
                </Button>
                <Button
                  onClick={() => mutation.mutate({ status: "Completed" })}
                  disabled={!canComplete || mutation.isPending}
                >
                  Mark Completed
                </Button>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                This appointment is closed.
              </p>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Appointment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel the appointment for{" "}
              {profile?.fullName ?? "this student"} on{" "}
              {format(date, "EEEE, MMMM d, yyyy")}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <Label htmlFor="cancel-reason">Reason (optional)</Label>
            <Textarea
              id="cancel-reason"
              placeholder="e.g. Office closure, scheduling conflict..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={3}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={mutation.isPending}>
              Keep Appointment
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                mutation.mutate({
                  status: "Cancelled",
                  reason: cancelReason.trim() || undefined,
                })
              }
              disabled={mutation.isPending}
            >
              Yes, Cancel
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
```

- [ ] **Step 2: Manual verification — full action flow**

With the dev server still running:

1. Re-create a test appointment (any future or past date you prefer). Use the same `prisma.appointment.create` snippet from Task 3.
2. Navigate to `/admin/appointments`. The row should appear.
3. Click the row. The detail dialog should open with the student's full info, document name, dates, and three action buttons in the footer.
4. If the appointment is in the **future**: the "Mark Completed" and "Mark No-show" buttons should be disabled. Only "Cancel Appointment" should be clickable. Click it; enter a reason; confirm.
5. After the toast appears, reload the page. The row should now show "Cancelled" status. The `Notes` field in the dialog (re-open it) should read `Cancelled by admin: <your reason>`.
6. Sign out, sign in as the student who owns that request. Navigate to `/dashboard/notifications`. A new notification "Appointment Cancelled" should be present.
7. Create a **past** `Scheduled` appointment (date = yesterday). Open the dialog. "Mark No-show" should be enabled. Click it. Verify the row updates to "No-show" and the student gets a "Missed Appointment" notification.
8. Create an appointment for **today**. Open the dialog. "Mark Completed" should be enabled. "Mark No-show" should be disabled (today is not strictly in the past). Click "Mark Completed". Verify status change and "Appointment Completed" notification.
9. Open the dialog for a `Completed` / `Cancelled` / `No-show` appointment. The footer should show "This appointment is closed." with no action buttons.

- [ ] **Step 3: Run lint**

```bash
npm run lint
```

Expected: no errors anywhere in `src/app/(admin)/admin/appointments/`.

- [ ] **Step 4: Commit**

```bash
git add src/app/\(admin\)/admin/appointments/AppointmentDetailDialog.tsx
git commit -m "feat(admin/appointments): add detail dialog with status actions and cancel flow"
```

---

## Task 5: End-to-end smoke test and final verification

**Files:** none modified. This is a verification-only task.

- [ ] **Step 1: Clean up any test data**

```ts
// In prisma studio or a one-off script:
await prisma.appointment.deleteMany({
  where: { notes: { contains: "Cancelled by admin" } },
});
// Optionally remove test appointments created in Task 4 verification
```

- [ ] **Step 2: Run the full role-based flow**

With the dev server running:

1. As a **student** (use a verified student account that has a `Ready` document request without an appointment):
   - Navigate to `/dashboard/appointments/new`.
   - Book a new appointment for **tomorrow**, AM slot.
2. As an **admin**:
   - Navigate to `/admin/appointments`. The new row should appear at the top.
   - Click the row. Verify the student details, document name, and tomorrow's date are correct.
3. As the **admin**, mark the appointment as **Completed**. The future-date guard should block this — you should see a "Cannot mark a future appointment as completed" error toast. The status should NOT change.
4. As the **admin**, click **Cancel Appointment**, enter "Test smoke cancel", confirm.
5. Verify the appointment row now shows "Cancelled" and the notes contain the reason.
6. As the **student**, open the notification bell. A new "Appointment Cancelled" notification should be at the top.
7. Click the notification. It should navigate to `/dashboard/appointments` and the cancelled appointment should appear in the student's list.

- [ ] **Step 3: Verify overdue path**

1. As the **admin**, directly create a past-dated appointment (e.g., 2 days ago) in the database.
2. Reload `/admin/appointments`. The row should have a `⚠ Overdue` badge and a destructive left border.
3. Click the row. Click "Mark No-show". Verify status change and the "Missed Appointment" notification on the student side.

- [ ] **Step 4: Run final lint**

```bash
npm run lint
```

Expected: zero errors.

- [ ] **Step 5: Run TypeScript typecheck**

```bash
npx tsc --noEmit
```

Expected: zero errors. (If your project has a `typecheck` script, prefer `npm run typecheck`.)

- [ ] **Step 6: Verify no other files were modified**

```bash
git status
```

Expected: working tree clean (other than untracked test data, which is in the database not the filesystem). All five new files are committed.

- [ ] **Step 7: Final summary commit (only if Step 6 revealed uncommitted edits)**

```bash
git add -A
git commit -m "chore(admin/appointments): end-to-end smoke test cleanup"
```

---

## Acceptance Criteria

A reviewer should be able to:

1. Sign in as admin, navigate to `/admin/appointments`, and see a table of all student appointments.
2. Filter by status (All / Scheduled / Overdue / Completed / No-show / Cancelled) and search by student name/number.
3. See past-but-still-Scheduled rows highlighted with an "Overdue" badge.
4. Click a row to open a detail dialog with student info, document, dates, and (if cancelled) the reason.
5. Mark a past appointment as Completed or No-show; receive a success toast; see the status change; see the corresponding student notification.
6. Cancel any Scheduled appointment with an optional reason; see the reason stored in the notes field; see the "Appointment Cancelled" notification on the student side.
7. Future-dated Scheduled appointments cannot be Completed or marked No-show (buttons disabled, server enforces).
8. `npm run lint` and `npx tsc --noEmit` both pass with zero errors.
