import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface Appointment {
  id: string;
  date: Date;
  timeSlot: string;
  documentRequest: {
    documentType: { name: string };
  };
}

interface UpcomingAppointmentProps {
  appointment: Appointment | null;
}

export function UpcomingAppointment({ appointment }: UpcomingAppointmentProps) {
  if (!appointment) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Upcoming Appointment</CardTitle>
        </CardHeader>
        <CardContent className="pt-0 text-center py-6">
          <Calendar className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">No upcoming appointments</p>
          <Button asChild variant="link" className="mt-1">
            <Link href="/dashboard/appointments/new">Book one now</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Upcoming Appointment</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center">
            <Calendar className="h-6 w-6 text-indigo-600" />
          </div>
          <div>
            <p className="text-sm font-semibold">
              {format(new Date(appointment.date), "EEEE, MMMM d, yyyy")}
            </p>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
              <Clock className="h-3 w-3" />
              <span>{appointment.timeSlot === "AM" ? "AM Session (8:00 - 12:00)" : "PM Session (1:00 - 5:00)"}</span>
            </div>
          </div>
        </div>
        <div className="bg-muted/50 rounded-lg px-3 py-2 text-xs text-muted-foreground">
          For: <span className="font-medium text-foreground">{appointment.documentRequest.documentType.name}</span>
        </div>
      </CardContent>
    </Card>
  );
}
