"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { Calendar, Clock, Plus } from "lucide-react";
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
  const date = new Date(appointment.date);
  const config = statusConfig[appointment.status] ?? { variant: "outline" as const, label: appointment.status };

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
          {appointment.status === "Scheduled" && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm">
                  Cancel
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
          )}
        </div>
      </CardContent>
    </Card>
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

  const handleCancel = async (id: string) => {
    try {
      await cancelAppointment(id);
      toast.success("Appointment cancelled successfully");
      router.refresh();
    } catch {
      toast.error("Failed to cancel appointment");
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
          <div className="flex gap-1 mb-6 bg-muted rounded-lg p-1 w-fit">
            <button
              type="button"
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
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
