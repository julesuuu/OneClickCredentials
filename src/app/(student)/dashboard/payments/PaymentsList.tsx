"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { CreditCard } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PaymentActions } from "./PaymentActions";

export interface PaymentListItem {
  id: string;
  amount: number;
  method: string;
  status: string;
  referenceNumber: string | null;
  failureReason: string | null;
  createdAt: Date;
  paidAt: Date | null;
  documentRequest: {
    id: string;
    quantity: number;
    totalPrice: number;
    status: string;
    documentType: { name: string };
  };
  uploads: Array<{
    id: string;
    url: string;
    name: string;
    fileType: string;
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
  { value: "all", label: "All" },
  { value: "outstanding", label: "Outstanding" },
  { value: "paid", label: "Paid" },
] as const;

type Filter = (typeof filters)[number]["value"];

interface PaymentsListProps {
  payments: PaymentListItem[];
  canceled: boolean;
}

export function PaymentsList({ payments, canceled }: PaymentsListProps) {
  const [filter, setFilter] = useState<Filter>("all");

  const outstanding = payments
    .filter((p) => p.status === "Pending" || p.status === "Failed")
    .reduce((sum, p) => sum + p.amount, 0);

  const collected = payments
    .filter((p) => p.status === "Paid")
    .reduce((sum, p) => sum + p.amount, 0);

  const filtered = useMemo(() => {
    if (filter === "outstanding") {
      return payments.filter(
        (p) => p.status === "Pending" || p.status === "Failed",
      );
    }
    if (filter === "paid") {
      return payments.filter((p) => p.status === "Paid");
    }
    return payments;
  }, [filter, payments]);

  return (
    <div className="space-y-6">
      {canceled && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm">
          Checkout canceled — no payment was taken.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Outstanding Balance</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-2xl font-bold">
              ₱{outstanding.toLocaleString()}
            </p>
            <p className="text-sm text-muted-foreground">
              Pending or failed payments
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Paid</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-2xl font-bold">
              ₱{collected.toLocaleString()}
            </p>
            <p className="text-sm text-muted-foreground">
              Confirmed payments
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-2">
        {filters.map(({ value, label }) => (
          <Button
            key={value}
            size="sm"
            variant={filter === value ? "default" : "outline"}
            onClick={() => setFilter(value)}
          >
            {label}
          </Button>
        ))}
      </div>

      {payments.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <CreditCard className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="text-lg font-semibold">No payments yet</h3>
            <p className="mt-2 text-muted-foreground">
              Create a document request to get started.
            </p>
            <Button className="mt-4" asChild>
              <Link href="/dashboard/requests/new">New Request</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Document</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="h-24 text-center text-muted-foreground"
                    >
                      No payments match this filter.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>
                        <div className="font-medium">
                          {payment.documentRequest.documentType.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {payment.documentRequest.quantity > 1
                            ? `Quantity: ${payment.documentRequest.quantity}`
                            : "Single copy"}
                        </div>
                        {payment.failureReason && (
                          <div className="text-xs text-destructive">
                            {payment.failureReason}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        ₱{payment.amount.toLocaleString()}
                      </TableCell>
                      <TableCell>{payment.method}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            statusVariant[payment.status] ?? "secondary"
                          }
                        >
                          {payment.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(payment.createdAt), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="text-right">
                        <PaymentActions
                          paymentId={payment.id}
                          canPay={
                            payment.status === "Pending" ||
                            payment.status === "Failed"
                          }
                          hasReceipt={payment.uploads.length > 0}
                          receiptUrl={payment.uploads[0]?.url}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
