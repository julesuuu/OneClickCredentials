import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/dashboard/stat-card";
import { getAdminDashboardData } from "./actions";
import {
  Users,
  AlertTriangle,
  FileText,
  Package,
} from "lucide-react";
import { format } from "date-fns";

const statusBadge: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  Pending: "secondary",
  Processing: "default",
  Ready: "outline",
  Completed: "default",
  Rejected: "destructive",
};

export default async function AdminDashboardPage() {
  const data = await getAdminDashboardData();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          {format(new Date(), "EEEE, MMMM d, yyyy")}
        </p>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <StatCard
            label="Total Students"
            value={data.totalStudents}
            icon={Users}
            colorVariant="blue"
          />
          <p className="text-xs text-muted-foreground mt-1 text-center">
            {data.newStudentsThisMonth} new this month
          </p>
        </div>
        <StatCard
          label="Pending Verification"
          value={data.pendingVerifications}
          icon={AlertTriangle}
          colorVariant="yellow"
        />
        <StatCard
          label="Active Requests"
          value={data.activeRequests}
          icon={FileText}
          colorVariant="blue"
        />
        <StatCard
          label="Ready for Pickup"
          value={data.readyForPickup}
          icon={Package}
          colorVariant="green"
        />
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold mb-4">Recent Requests</h2>
            <div className="space-y-3">
              {data.recentRequests.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No requests yet.
                </p>
              ) : (
                data.recentRequests.map((req) => (
                  <div
                    key={req.id}
                    className="flex items-center justify-between"
                  >
                    <div className="text-sm">
                      <span className="font-medium">
                        {req.user.studentProfile?.fullName ?? "Unknown"}
                      </span>
                      <span className="text-muted-foreground ml-1">
                        {req.documentType.name}
                        {req.quantity > 1 ? ` x${req.quantity}` : ""}
                      </span>
                    </div>
                    <Badge variant={statusBadge[req.status] ?? "secondary"}>
                      {req.status}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold mb-4">
              Requests by Status
            </h2>
            <div className="space-y-4">
              {["Pending", "Processing", "Ready", "Completed"].map(
                (status) => {
                  const count =
                    data.statusBreakdown[status] ?? 0;
                  const total = ["Pending", "Processing", "Ready", "Completed"].reduce(
                    (sum, s) => sum + (data.statusBreakdown[s] ?? 0),
                    0
                  );
                  const pct = total > 0 ? (count / total) * 100 : 0;
                  return (
                    <div key={status}>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{status}</span>
                        <span className="text-muted-foreground">{count}</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${pct}%`,
                            backgroundColor:
                              status === "Pending"
                                ? "var(--color-warning, #f59e0b)"
                                : status === "Processing"
                                  ? "var(--color-info, #3b82f6)"
                                  : status === "Ready"
                                    ? "var(--color-success, #22c55e)"
                                    : "var(--color-muted-foreground, #6b7280)",
                          }}
                        />
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
