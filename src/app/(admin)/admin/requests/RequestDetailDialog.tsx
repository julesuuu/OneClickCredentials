"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import type { RequestWithRelations } from "./RequestsManager";

const statusBadge: Record<
  string,
  "default" | "secondary" | "outline" | "destructive"
> = {
  Pending: "secondary",
  Processing: "default",
  Ready: "outline",
  Completed: "default",
  Rejected: "destructive",
};

const nextActions: Record<
  string,
  { label: string; nextStatus: string; variant: "default" | "destructive"} | null
> = {
  Pending: { label: "Process", nextStatus: "Processing", variant: "default" },
  Processing: { label: "Mark Ready", nextStatus: "Ready", variant: "default" },
  Ready: { label: "Mark Completed", nextStatus: "Completed", variant: "default" },
  Completed: null,
  Rejected: null,
};

interface RequestDetailDialogProps {
  request: RequestWithRelations | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusUpdate: (id: string, status: string) => void;
  onReject: (id: string, reason: string) => void;
  isPending: boolean;
}

export function RequestDetailDialog({
  request,
  open,
  onOpenChange,
  onStatusUpdate,
  onReject,
  isPending,
}: RequestDetailDialogProps) {
  if (!request) return null;

  const action = nextActions[request.status];
  const statusSteps = ["Pending", "Processing", "Ready", "Completed"];
  const currentStepIndex = statusSteps.indexOf(request.status);
  const isRejected = request.status === "Rejected";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Request Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Student</p>
              <p className="font-medium">
                {request.user.studentProfile?.fullName ?? "Unknown"}
              </p>
              <p className="text-sm text-muted-foreground">
                {request.user.studentProfile?.studentNumber ?? "—"}
                {request.user.studentProfile?.course
                  ? ` • ${request.user.studentProfile.course}`
                  : ""}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Date Requested</p>
              <p className="font-medium">
                {format(new Date(request.createdAt), "MMM dd, yyyy")}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Document</p>
              <p className="font-medium">{request.documentType.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Quantity</p>
              <p className="font-medium">{request.quantity}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Price</p>
              <p className="font-medium">
                ₱{request.totalPrice.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge variant={statusBadge[request.status] ?? "secondary"}>
                {request.status}
              </Badge>
            </div>
          </div>

          {request.notes && (
            <div>
              <p className="text-sm text-muted-foreground">Notes</p>
              <p className="text-sm">{request.notes}</p>
            </div>
          )}

          {request.declineReason && (
            <div>
              <p className="text-sm text-muted-foreground">Rejection Reason</p>
              <p className="text-sm text-destructive">{request.declineReason}</p>
            </div>
          )}

          <div>
            <p className="text-sm text-muted-foreground mb-3">Timeline</p>
            <div className="space-y-2">
              {statusSteps.map((step, i) => {
                const isActive = i <= currentStepIndex;
                const isCurrent = i === currentStepIndex;
                return (
                  <div key={step} className="flex items-center gap-3 text-sm">
                    <div
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        isActive && !isRejected
                          ? "bg-primary"
                          : isRejected && isCurrent
                            ? "bg-destructive"
                            : "bg-muted-foreground/30"
                      }`}
                    />
                    <span
                      className={
                        isCurrent ? "font-medium" : "text-muted-foreground"
                      }
                    >
                      {step}
                      {isCurrent && !isRejected ? " — current" : ""}
                      {isRejected && isCurrent ? " — Rejected" : ""}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          {action ? (
            <>
              <Button
                variant="destructive"
                onClick={() => {
                  const textarea = document.getElementById(
                    `reject-${request.id}`
                  ) as HTMLTextAreaElement;
                  if (textarea) {
                    textarea.value = "";
                  }
                  const form = document.getElementById(
                    `reject-form-${request.id}`
                  );
                  form?.classList.toggle("hidden");
                }}
                disabled={isPending}
              >
                Reject
              </Button>
              <Button
                variant={action.variant}
                onClick={() => onStatusUpdate(request.id, action.nextStatus)}
                disabled={isPending}
              >
                {action.label}
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          )}
        </div>

        <form
          id={`reject-form-${request.id}`}
          className="hidden space-y-3 pt-2"
          onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const reason = formData.get("reason") as string;
            if (reason.trim()) {
              onReject(request.id, reason.trim());
            }
          }}
        >
          <Textarea
            id={`reject-${request.id}`}
            name="reason"
            placeholder="Enter rejection reason..."
            className="min-h-20"
            required
          />
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                const form = document.getElementById(
                  `reject-form-${request.id}`
                );
                form?.classList.add("hidden");
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="destructive"
              size="sm"
              disabled={isPending}
            >
              Confirm Reject
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
