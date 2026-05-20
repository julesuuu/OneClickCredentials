import { format } from "date-fns";
import { getDashboardData } from "./actions";
import { StatCard } from "@/components/dashboard/stat-card";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { UpcomingAppointment } from "@/components/dashboard/upcoming-appointment";
import { BalanceCard } from "@/components/dashboard/balance-card";
import { FileText, Clock, CheckCircle, XCircle } from "lucide-react";

export default async function DashboardPage() {
  const data = await getDashboardData();

  if (!data) return null;

  const today = format(new Date(), "EEEE, MMMM d, yyyy");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back, {data.userName}
        </h1>
        <p className="text-muted-foreground mt-1">{today}</p>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Requests"
          value={data.stats.total}
          icon={FileText}
          colorVariant="blue"
        />
        <StatCard
          label="Pending"
          value={data.stats.pending}
          icon={Clock}
          colorVariant="yellow"
        />
        <StatCard
          label="Completed"
          value={data.stats.completed}
          icon={CheckCircle}
          colorVariant="green"
        />
        <StatCard
          label="Declined"
          value={data.stats.declined}
          icon={XCircle}
          colorVariant="red"
        />
      </div>

      <QuickActions />

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        <ActivityFeed requests={data.recentRequests} />
        <div className="space-y-6">
          <UpcomingAppointment
            appointment={
              data.upcomingAppointment
                ? {
                    id: data.upcomingAppointment.id,
                    date: data.upcomingAppointment.date,
                    timeSlot: data.upcomingAppointment.timeSlot,
                    documentRequest: {
                      documentType: {
                        name: data.upcomingAppointment.documentRequest.documentType.name,
                      },
                    },
                  }
                : null
            }
          />
          <BalanceCard pendingAmount={data.pendingAmount} />
        </div>
      </div>
    </div>
  );
}
