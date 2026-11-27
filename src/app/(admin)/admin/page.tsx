import { format } from "date-fns";
import {
  AlertTriangle,
  Calendar,
  CreditCard,
  FileText,
  Package,
  Tags,
  Users,
} from "lucide-react";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardContent } from "@/components/ui/card";
import { AdminActivityFeed } from "./AdminActivityFeed";
import { getAdminDashboardData } from "./actions";

const requestStatuses = [
  "Pending",
  "Processing",
  "Ready",
  "Completed",
] as const;

export default async function AdminDashboardPage() {
  const data = await getAdminDashboardData();

  const statusTotal = requestStatuses.reduce(
    (sum, status) => sum + (data.statusBreakdown[status] ?? 0),
    0,
  );

  const nextAppointmentLabel = data.nextAppointment
    ? `Next: ${format(new Date(data.nextAppointment.date), "MMM d")} • ${
        data.nextAppointment.documentRequest.documentType.name
      }`
    : "No upcoming appointments";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          {format(new Date(), "EEEE, MMMM d, yyyy")}
        </p>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <StatCard
          label="Total Students"
          value={data.totalStudents}
          subtitle={`${data.newStudentsThisMonth} new this month`}
          icon={Users}
          colorVariant="blue"
          href="/admin/students"
        />
        <StatCard
          label="Pending Verification"
          value={data.pendingVerifications}
          subtitle="Awaiting review"
          icon={AlertTriangle}
          colorVariant="yellow"
          href="/admin/students"
        />
        <StatCard
          label="Active Requests"
          value={data.activeRequests}
          subtitle="Pending or processing"
          icon={FileText}
          colorVariant="blue"
          href="/admin/requests"
        />
        <StatCard
          label="Ready for Pickup"
          value={data.readyForPickup}
          subtitle="Ready to collect"
          icon={Package}
          colorVariant="green"
          href="/admin/requests"
        />
        <StatCard
          label="Today's Appointments"
          value={data.todaysAppointments}
          subtitle={nextAppointmentLabel}
          icon={Calendar}
          colorVariant="blue"
          href="/admin/appointments"
        />
        <StatCard
          label="Payments Pending Review"
          value={data.pendingPayments}
          subtitle={`₱${data.pendingPaymentTotal.toLocaleString()} awaiting review`}
          icon={CreditCard}
          colorVariant="yellow"
          href="/admin/payments"
        />
        <StatCard
          label="Document Types"
          value={data.activeDocumentTypes}
          subtitle={`${data.inactiveDocumentTypes} inactive`}
          icon={Tags}
          colorVariant="green"
          href="/admin/document-types"
        />
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        <AdminActivityFeed items={data.recentActivity} />

        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold mb-4">
              Requests by Status
            </h2>
            <div className="space-y-4">
              {requestStatuses.map((status) => {
                const count = data.statusBreakdown[status] ?? 0;
                const pct = statusTotal > 0 ? (count / statusTotal) * 100 : 0;

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
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
