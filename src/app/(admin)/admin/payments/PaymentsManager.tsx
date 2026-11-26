"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Search } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PaymentDetailDialog } from "./PaymentDetailDialog";
import {
  adminMarkPaymentPaid,
  adminMarkPaymentRefunded,
} from "./actions";

export interface AdminPayment {
  id: string;
  amount: number;
  method: string;
  status: string;
  referenceNumber: string | null;
  paymentMethodType: string | null;
  failureReason: string | null;
  createdAt: Date;
  paidAt: Date | null;
  documentRequest: {
    id: string;
    quantity: number;
    totalPrice: number;
    status: string;
    documentType: { name: string };
    user: {
      email: string;
      studentProfile: {
        fullName: string;
        studentNumber: string;
      } | null;
    };
  };
  uploads: Array<{
    id: string;
    name: string;
    url: string;
    fileType: string;
  }>;
  events: Array<{
    id: string;
    type: string;
    fromStatus: string | null;
    toStatus: string | null;
    amount: number | null;
    actorType: string;
    actorName: string | null;
    message: string | null;
    createdAt: Date;
  }>;
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

const filters = [
  "all",
  "Pending",
  "Paid",
  "Failed",
  "Refunded",
  "Cancelled",
] as const;

type Filter = (typeof filters)[number];

interface PaymentsManagerProps {
  payments: AdminPayment[];
}

export function PaymentsManager({ payments }: PaymentsManagerProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [selected, setSelected] = useState<AdminPayment | null>(null);
  const [isPending, startTransition] = useTransition();

  const outstanding = payments.filter(
    (p) => p.status === "Pending" || p.status === "Failed",
  );
  const outstandingAmount = outstanding.reduce((sum, p) => sum + p.amount, 0);
  const collected = payments
    .filter((p) => p.status === "Paid")
    .reduce((sum, p) => sum + p.amount, 0);

  const filtered = useMemo(() => {
    return payments.filter((payment) => {
      if (filter !== "all" && payment.status !== filter) return false;
      if (!search) return true;

      const query = search.toLowerCase();
      const name =
        payment.documentRequest.user.studentProfile?.fullName ?? "";
      const number =
        payment.documentRequest.user.studentProfile?.studentNumber ?? "";
      const reference = payment.referenceNumber ?? "";

      return (
        name.toLowerCase().includes(query) ||
        number.toLowerCase().includes(query) ||
        reference.toLowerCase().includes(query)
      );
    });
  }, [filter, payments, search]);

  const handleMarkPaid = (paymentId: string) => {
    startTransition(async () => {
      try {
        await adminMarkPaymentPaid(paymentId);
        toast.success("Payment marked as paid.");
        setSelected(null);
        router.refresh();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Could not update payment.",
        );
      }
    });
  };

  const handleRefund = (paymentId: string) => {
    startTransition(async () => {
      try {
        await adminMarkPaymentRefunded(paymentId);
        toast.success("Payment marked as refunded.");
        setSelected(null);
        router.refresh();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Could not update payment.",
        );
      }
    });
  };

  return (
    <div className="container mx-auto py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Payments</h1>
        <p className="mt-1 text-muted-foreground">
          Review payments and verify cash receipts.
        </p>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Outstanding</p>
          <p className="text-2xl font-bold">
            ₱{outstandingAmount.toLocaleString()}
          </p>
          <p className="text-sm text-muted-foreground">
            {outstanding.length} pending or failed
          </p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Collected</p>
          <p className="text-2xl font-bold">₱{collected.toLocaleString()}</p>
          <p className="text-sm text-muted-foreground">
            {payments.filter((p) => p.status === "Paid").length} paid
          </p>
        </div>
      </div>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by student name, number, or reference..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {filters.map((value) => (
            <Button
              key={value}
              size="sm"
              variant={filter === value ? "default" : "outline"}
              onClick={() => setFilter(value)}
            >
              {value === "all" ? "All" : value}
            </Button>
          ))}
        </div>
      </div>

      <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Document</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Proof</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-24 text-center text-muted-foreground"
                >
                  No payments found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((payment) => (
                <TableRow
                  key={payment.id}
                  className="cursor-pointer"
                  onClick={() => setSelected(payment)}
                >
                  <TableCell>
                    <p className="font-medium">
                      {payment.documentRequest.user.studentProfile?.fullName ??
                        "Unknown"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {payment.documentRequest.user.studentProfile
                        ?.studentNumber ?? "—"}
                    </p>
                  </TableCell>
                  <TableCell>
                    {payment.documentRequest.documentType.name}
                  </TableCell>
                  <TableCell>
                    ₱{payment.amount.toLocaleString()}
                  </TableCell>
                  <TableCell>{payment.method}</TableCell>
                  <TableCell>
                    <Badge
                      variant={statusVariant[payment.status] ?? "secondary"}
                    >
                      {payment.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {payment.uploads.length > 0
                      ? `${payment.uploads.length} file(s)`
                      : "—"}
                  </TableCell>
                  <TableCell>
                    {format(new Date(payment.createdAt), "MMM d, yyyy")}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <PaymentDetailDialog
        payment={selected}
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
        onMarkPaid={handleMarkPaid}
        onRefund={handleRefund}
        isPending={isPending}
      />
    </div>
  );
}
