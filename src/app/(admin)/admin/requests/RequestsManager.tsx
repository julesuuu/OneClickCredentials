"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { format } from "date-fns";
import { getAllRequests, updateRequestStatus, rejectRequest } from "./actions";
import { RequestDetailDialog } from "./RequestDetailDialog";

export interface RequestWithRelations {
  id: string;
  quantity: number;
  totalPrice: number;
  status: string;
  notes: string | null;
  declineReason: string | null;
  createdAt: Date;
  user: {
    email: string;
    studentProfile: {
      fullName: string;
      studentNumber: string;
      course: string;
      yearLevel: string;
    } | null;
  };
  documentType: {
    name: string;
    price: number;
  };
  payment: {
    method: string;
    status: string;
  } | null;
  appointment: {
    date: Date;
    timeSlot: string;
    status: string;
  } | null;
}

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

const filterOptions = [
  { value: "all", label: "All" },
  { value: "Pending", label: "Pending" },
  { value: "Processing", label: "Processing" },
  { value: "Ready", label: "Ready" },
  { value: "Completed", label: "Completed" },
  { value: "Rejected", label: "Rejected" },
];

const nextActionLabel: Record<string, string> = {
  Pending: "Process",
  Processing: "Mark Ready",
  Ready: "Complete",
};

export default function RequestsManager() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedRequest, setSelectedRequest] =
    useState<RequestWithRelations | null>(null);
  const queryClient = useQueryClient();

  const { data: requests, isLoading } = useQuery({
    queryKey: ["admin-requests"],
    queryFn: getAllRequests,
  });

  const statusMutation = useMutation({
    mutationFn: ({
      requestId,
      status,
    }: {
      requestId: string;
      status: string;
    }) => updateRequestStatus(requestId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-requests"] });
      setSelectedRequest(null);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({
      requestId,
      reason,
    }: {
      requestId: string;
      reason: string;
    }) => rejectRequest(requestId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-requests"] });
      setSelectedRequest(null);
    },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto py-10 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  const filteredRequests = !requests
    ? []
    : requests.filter((r) => {
        if (filter !== "all" && r.status !== filter) return false;
        if (!search) return true;
        const q = search.toLowerCase();
        const name = r.user.studentProfile?.fullName ?? "";
        const num = r.user.studentProfile?.studentNumber ?? "";
        return name.toLowerCase().includes(q) || num.toLowerCase().includes(q);
      });

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold tracking-tight mb-6">
        Document Requests
      </h1>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by student name or number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {filterOptions.map(({ value, label }) => (
            <Button
              key={value}
              variant={filter === value ? "default" : "outline"}
              onClick={() => setFilter(value)}
              size="sm"
            >
              {label}
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
              <TableHead className="text-center">Qty</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-center">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRequests.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-24 text-center text-muted-foreground"
                >
                  No requests found.
                </TableCell>
              </TableRow>
            ) : (
              filteredRequests.map((request) => {
                const actionLabel = nextActionLabel[request.status];
                return (
                  <TableRow
                    key={request.id}
                    className="cursor-pointer"
                    onClick={() => setSelectedRequest(request)}
                  >
                    <TableCell>
                      <p className="font-medium">
                        {request.user.studentProfile?.fullName ?? "Unknown"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {request.user.studentProfile?.studentNumber ?? "—"}
                      </p>
                    </TableCell>
                    <TableCell>{request.documentType.name}</TableCell>
                    <TableCell className="text-center">
                      {request.quantity}
                    </TableCell>
                    <TableCell>
                      ₱{request.totalPrice.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={statusBadge[request.status] ?? "secondary"}
                      >
                        {request.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {format(new Date(request.createdAt), "MMM dd, yyyy")}
                    </TableCell>
                    <TableCell className="text-center">
                      {actionLabel ? (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedRequest(request);
                          }}
                        >
                          {actionLabel}
                        </Button>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          —
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <RequestDetailDialog
        request={selectedRequest}
        open={!!selectedRequest}
        onOpenChange={(open) => {
          if (!open) setSelectedRequest(null);
        }}
        onStatusUpdate={(id, status) =>
          statusMutation.mutate({ requestId: id, status })
        }
        onReject={(id, reason) =>
          rejectMutation.mutate({ requestId: id, reason })
        }
        isPending={statusMutation.isPending || rejectMutation.isPending}
      />
    </div>
  );
}
