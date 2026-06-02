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
