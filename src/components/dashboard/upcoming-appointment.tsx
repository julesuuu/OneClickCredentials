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
    documentType: {
      name: string;
    };
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
          <p className="text-sm text-muted-foreground">
            No upcoming appointments
          </p>
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
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">
              {format(new Date(appointment.date), "EEEE, MMMM d, yyyy")}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{appointment.timeSlot}</span>
          </div>
          <div className="text-xs text-muted-foreground pt-1 border-t">
            For: {appointment.documentRequest.documentType.name}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
