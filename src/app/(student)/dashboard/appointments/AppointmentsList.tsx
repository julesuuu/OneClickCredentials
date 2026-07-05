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
import { toast } from "sonner";
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
import { cancelAppointment, rescheduleAppointment } from "./actions";

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
  onReschedule,
  isCancelling,
}: {
  appointment: Appointment;
  onCancel: (id: string) => void;
  onReschedule?: (appointment: Appointment) => void;
  isCancelling?: boolean;
}) {
  const date = new Date(appointment.date);
  const config = statusConfig[appointment.status] ?? { variant: "outline" as const, label: appointment.status };
  const canCancel = appointment.status === "Scheduled" && date >= new Date(new Date().toDateString());

  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-4">
        <div className="flex flex-col items-center justify-center bg-muted rounded-lg px-3 py-2 min-w-[60px]">
          <span className="text-xs text-muted-foreground uppercase">
            {format(date, "EEE")}
          </span>
          <span className="text-xl font-bold leading-tight">
            {format(date, "d")}
          </span>
          <span className="text-xs text-muted-foreground uppercase">
            {format(date, "MMM")}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">
            {appointment.documentRequest.documentType.name}
          </p>
          <div className="flex items-center gap-1 text-sm text-muted-foreground mt-0.5">
            <Clock className="h-3.5 w-3.5" />
            <span>{getTimeSlotLabel(appointment.timeSlot)}</span>
          </div>
        </div>

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
      </CardContent>
    </Card>
  );
}

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
      await rescheduleAppointment(appointment.id, format(date, "yyyy-MM-dd"), timeSlot);
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
                <CalendarComponent
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

function EmptyState({
  title,
  description,
  showCta,
}: {
  title: string;
  description: string;
  showCta?: boolean;
}) {
  return (
    <Card>
      <CardContent className="pt-6 text-center py-10">
        <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-muted-foreground mt-2">{description}</p>
        {showCta && (
          <Button className="mt-4" asChild>
            <Link href="/dashboard/appointments/new">Book New Appointment</Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export function AppointmentsList({ appointments }: AppointmentsListProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming");

  const todayStart = new Date(new Date().toDateString());

  const upcoming = appointments.filter(
    (a) => a.status === "Scheduled" && new Date(a.date) >= todayStart
  );
  const past = appointments.filter(
    (a) => a.status !== "Scheduled" || new Date(a.date) < todayStart
  );

  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [rescheduling, setRescheduling] = useState<Appointment | null>(null);

  const handleCancel = async (id: string) => {
    setCancellingId(id);
    try {
      await cancelAppointment(id);
      toast.success("Appointment cancelled successfully");
      router.refresh();
    } catch {
      toast.error("Failed to cancel appointment");
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Appointments</h1>
          <p className="text-muted-foreground mt-1">
            View and manage your scheduled appointments
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/appointments/new">
            <Plus className="mr-2 h-4 w-4" />
            Book New Appointment
          </Link>
        </Button>
      </div>

      {appointments.length === 0 ? (
        <EmptyState
          title="No Appointments Yet"
          description="You haven't booked any appointments yet."
          showCta
        />
      ) : (
        <>
          <div className="flex gap-1 mb-6 bg-muted rounded-lg p-1 w-fit" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "upcoming"}
              onClick={() => setActiveTab("upcoming")}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === "upcoming"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Upcoming
              {upcoming.length > 0 && (
                <span className="ml-2 inline-flex items-center justify-center rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">
                  {upcoming.length}
                </span>
              )}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "past"}
              onClick={() => setActiveTab("past")}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === "past"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Past
              {past.length > 0 && (
                <span className="ml-2 inline-flex items-center justify-center rounded-full bg-muted-foreground px-2 py-0.5 text-xs font-semibold text-background">
                  {past.length}
                </span>
              )}
            </button>
          </div>

          {activeTab === "upcoming" ? (
            upcoming.length === 0 ? (
              <EmptyState
                title="No Upcoming Appointments"
                description="You don't have any upcoming appointments scheduled."
                showCta
              />
            ) : (
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
            )
          ) : past.length === 0 ? (
            <EmptyState
              title="No Past Appointments"
              description="You don't have any past appointments."
            />
          ) : (
            <div className="space-y-3">
              {past.map((appointment) => (
                <AppointmentCard
                  key={appointment.id}
                  appointment={appointment}
                  onCancel={handleCancel}
                  onReschedule={setRescheduling}
                  isCancelling={cancellingId === appointment.id}
                />
              ))}
            </div>
          )}
        </>
      )}

      <RescheduleDialog
        key={rescheduling?.id ?? "closed"}
        appointment={rescheduling}
        open={!!rescheduling}
        onOpenChange={(open) => {
          if (!open) setRescheduling(null);
        }}
      />
    </div>
  );
}
