import { Button } from "@/components/ui/button";
import { FilePlus, CalendarPlus } from "lucide-react";
import Link from "next/link";

export function QuickActions() {
  return (
    <div className="flex gap-4 flex-wrap">
      <Button asChild size="lg" className="flex-1 min-w-50">
        <Link href="/dashboard/requests/new">
          <FilePlus className="mr-2 h-5 w-5" />
          New Document Request
        </Link>
      </Button>
      <Button asChild size="lg" variant="outline" className="flex-1 min-w-50">
        <Link href="/dashboard/appointments/new">
          <CalendarPlus className="mr-2 h-5 w-5" />
          Book Appointment
        </Link>
      </Button>
    </div>
  );
}
