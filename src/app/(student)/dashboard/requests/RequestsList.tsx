"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, FileText, Clock, CheckCircle, XCircle } from "lucide-react";
import { format } from "date-fns";

interface Request {
  id: string;
  quantity: number;
  totalPrice: number;
  status: string;
  notes: string | null;
  declineReason: string | null;
  createdAt: Date;
  updatedAt: Date;
  documentType: {
    name: string;
    description: string | null;
    price: number;
  };
  payment: {
    id: string;
    status: string;
    method: string;
  } | null;
  appointment: {
    id: string;
    date: Date;
    timeSlot: string;
    status: string;
  } | null;
}

interface RequestsListProps {
  requests: Request[];
}

const statusConfig: Record<string, { variant: "default" | "secondary" | "outline" | "destructive"; icon: typeof Clock }> = {
  Pending: { variant: "secondary", icon: Clock },
  Processing: { variant: "default", icon: Clock },
  Ready: { variant: "default", icon: CheckCircle },
  Completed: { variant: "default", icon: CheckCircle },
  Rejected: { variant: "destructive", icon: XCircle },
  Cancelled: { variant: "outline", icon: XCircle },
};

export function RequestsList({ requests }: RequestsListProps) {
  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Document Requests</h1>
          <p className="text-muted-foreground mt-1">Track and manage your document requests</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/requests/new">
            <Plus className="mr-2 h-4 w-4" />
            New Request
          </Link>
        </Button>
      </div>

      {requests.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center py-10">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No Requests Yet</h3>
            <p className="text-muted-foreground mt-2">You haven&apos;t made any document requests yet.</p>
            <Button className="mt-4" asChild>
              <Link href="/dashboard/requests/new">Make Your First Request</Link>
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
                  <TableHead>Quantity</TableHead>
                  <TableHead>Total Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Appointment</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request) => {
                  const StatusIcon = statusConfig[request.status]?.icon || Clock;
                  return (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium">
                        <div>{request.documentType.name}</div>
                        {request.notes && (
                          <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {request.notes}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>{request.quantity}</TableCell>
                      <TableCell>₱{Number(request.totalPrice).toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant={statusConfig[request.status]?.variant || "secondary"}>
                          <StatusIcon className="mr-1 h-3 w-3" />
                          {request.status}
                        </Badge>
                        {request.declineReason && (
                          <div className="text-xs text-destructive mt-1 max-w-[150px] truncate">
                            {request.declineReason}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{format(new Date(request.createdAt), "MMM d, yyyy")}</div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(request.createdAt), "h:mm a")}
                        </div>
                      </TableCell>
                      <TableCell>
                        {request.payment ? (
                          <Badge
                            variant={
                              request.payment.status === "Completed"
                                ? "default"
                                : request.payment.status === "Failed"
                                ? "destructive"
                                : "secondary"
                            }
                          >
                            {request.payment.method} - {request.payment.status}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">Not paid</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {request.appointment ? (
                          <div className="text-sm">
                            <div>{format(new Date(request.appointment.date), "MMM d, yyyy")}</div>
                            <div className="text-xs text-muted-foreground">{request.appointment.timeSlot}</div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">Not scheduled</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}