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
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full gap-2">
                <span className="text-sm text-muted-foreground">
                  Last updated:{" "}
                  {format(new Date(appointment.updatedAt), "MMM d, yyyy 'at' h:mm a")}
                </span>
                <span className="text-sm font-medium text-muted-foreground">
                  Closed
                </span>
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={cancelDialogOpen}
        onOpenChange={(open) => {
          setCancelDialogOpen(open);
          if (!open) setCancelReason("");
        }}
      >
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
