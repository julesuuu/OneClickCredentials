import { Button } from "@/components/ui/button";
import { Plus, CalendarPlus } from "lucide-react";
import Link from "next/link";

export function QuickActions() {
  return (
    <div className="flex gap-4 flex-wrap">
      <Button asChild size="lg" className="flex-1 min-w-50 bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-200">
        <Link href="/dashboard/requests/new">
          <Plus className="mr-2 h-5 w-5" />
          New Document Request
        </Link>
      </Button>
      <Button asChild size="lg" variant="outline" className="flex-1 min-w-50 border-slate-200 hover:border-slate-300">
        <Link href="/dashboard/appointments/new">
          <CalendarPlus className="mr-2 h-5 w-5" />
          Book Appointment
        </Link>
      </Button>
    </div>
  );
}
