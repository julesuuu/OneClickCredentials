"use client";

import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { AdminPayment } from "./PaymentsManager";

interface PaymentDetailDialogProps {
  payment: AdminPayment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMarkPaid: (paymentId: string) => void;
  onRefund: (paymentId: string) => void;
  isPending: boolean;
}

const statusVariant: Record<
  string,
  "default" | "secondary" | "outline" | "destructive"
> = {
  Pending: "secondary",
  Paid: "default",
  Failed: "destructive",
  Refunded: "outline",
  Cancelled: "outline",
};

const eventLabels: Record<string, string> = {
  CREATED: "Payment created",
  CHECKOUT_STARTED: "Checkout started",
  PAID: "Payment paid",
  FAILED: "Payment failed",
  REFUNDED: "Payment refunded",
  CANCELLED: "Payment cancelled",
  AMOUNT_MISMATCH: "Amount mismatch",
};

export function PaymentDetailDialog({
  payment,
  open,
  onOpenChange,
  onMarkPaid,
  onRefund,
  isPending,
}: PaymentDetailDialogProps) {
  if (!payment) return null;

  const canMarkPaid =
    payment.status === "Pending" || payment.status === "Failed";
  const canRefund = payment.status === "Paid";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Payment Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Student</p>
              <p className="font-medium">
                {payment.documentRequest.user.studentProfile?.fullName ??
                  "Unknown"}
              </p>
              <p className="text-sm text-muted-foreground">
                {payment.documentRequest.user.studentProfile?.studentNumber ??
                  "—"}
              </p>
              <p className="text-sm text-muted-foreground">
                {payment.documentRequest.user.email}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge
                variant={statusVariant[payment.status] ?? "secondary"}
              >
                {payment.status}
              </Badge>
              <p className="mt-2 text-sm text-muted-foreground">
                {payment.method}
                {payment.paymentMethodType
                  ? ` • ${payment.paymentMethodType}`
                  : ""}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Amount</p>
              <p className="font-medium">
                ₱{payment.amount.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Reference</p>
              <p className="font-medium">
                {payment.referenceNumber ?? "—"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Document</p>
              <p className="font-medium">
                {payment.documentRequest.documentType.name}
              </p>
              <p className="text-sm text-muted-foreground">
                Qty {payment.documentRequest.quantity} • Request{" "}
                {payment.documentRequest.status}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Created</p>
              <p className="font-medium">
                {format(new Date(payment.createdAt), "MMM dd, yyyy")}
              </p>
              {payment.paidAt && (
                <p className="text-sm text-muted-foreground">
                  Paid {format(new Date(payment.paidAt), "MMM dd, yyyy")}
                </p>
              )}
            </div>
          </div>

          {payment.failureReason && (
            <div>
              <p className="text-sm text-muted-foreground">Failure Reason</p>
              <p className="text-sm text-destructive">
                {payment.failureReason}
              </p>
            </div>
          )}

          <div>
            <p className="mb-2 text-sm text-muted-foreground">Proof</p>
            {payment.uploads.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No receipt uploaded.
              </p>
            ) : (
              <ul className="space-y-2">
                {payment.uploads.map((upload) => (
                  <li key={upload.id}>
                    <a
                      href={upload.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      {upload.name}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <p className="mb-2 text-sm text-muted-foreground">History</p>
            {payment.events.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No history recorded.
              </p>
            ) : (
              <ul className="max-h-64 space-y-3 overflow-y-auto border-l pl-4">
                {payment.events.map((event) => (
                  <li key={event.id} className="relative">
                    <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-border" />
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium">
                        {eventLabels[event.type] ?? event.type}
                      </p>
                      {event.toStatus && (
                        <span className="text-xs text-muted-foreground">
                          {event.fromStatus ?? "—"} → {event.toStatus}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {event.actorName ?? event.actorType} •{" "}
                      {format(
                        new Date(event.createdAt),
                        "MMM dd, yyyy • h:mm a",
                      )}
                    </p>
                    {event.message && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {event.message}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t pt-4">
          {canMarkPaid && (
            <Button
              onClick={() => onMarkPaid(payment.id)}
              disabled={isPending}
            >
              Mark as Paid
            </Button>
          )}

          {canRefund && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={isPending}>
                  Mark as Refunded
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Mark this payment refunded?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    Refund the transaction in the PayMongo dashboard first,
                    then record it here. This does not move money by itself.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onRefund(payment.id)}>
                    Record refund
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}

          {!canMarkPaid && !canRefund && (
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
