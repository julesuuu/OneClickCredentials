import { format } from "date-fns";
import { getDashboardData } from "./actions";
import { StatCard } from "@/components/dashboard/stat-card";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { UpcomingAppointment } from "@/components/dashboard/upcoming-appointment";
import { BalanceCard } from "@/components/dashboard/balance-card";
import { AccountStatus } from "@/components/dashboard/account-status";
import { FileText, Clock, CheckCircle, XCircle } from "lucide-react";

export default async function DashboardPage() {
  const data = await getDashboardData();

  if (!data) return null;

  const today = format(new Date(), "EEEE, MMMM d, yyyy");

  return (
    <div className="space-y-8">
      {/* Header with greeting and avatar */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back, <span className="text-indigo-600">{data.userName || "Student"}</span>
          </h1>
          <p className="text-muted-foreground mt-1">{today}</p>
        </div>
        {data.userImage && (
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-border">
            <img
              src={data.userImage}
              alt={data.userName || "Student"}
              className="w-full h-full object-cover"
            />
          </div>
        )}
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Requests"
          value={data.stats.total}
          icon={FileText}
          colorVariant="blue"
          subtitle={`↑ ${data.requestsThisMonth} this month`}
          href="/dashboard/requests"
        />
        <StatCard
          label="Pending"
          value={data.stats.pending}
          icon={Clock}
          colorVariant="yellow"
          subtitle="Awaiting admin review"
          href="/dashboard/requests?status=Pending"
        />
        <StatCard
          label="Completed"
          value={data.stats.completed}
          icon={CheckCircle}
          colorVariant="green"
          subtitle={`${data.completionRate}% completion rate`}
          href="/dashboard/requests?status=Completed"
        />
        <StatCard
          label="Declined"
          value={data.stats.declined}
          icon={XCircle}
          colorVariant="red"
          subtitle="Review and resubmit"
          href="/dashboard/requests?status=Rejected"
        />
      </div>

      <QuickActions />

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ActivityFeed
            items={data.recentActivity}
            requests={data.recentRequests}
          />
        </div>
        <div className="space-y-5">
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
          <AccountStatus
            isProfileComplete={data.profile.isProfileComplete}
            isVerified={data.profile.isVerified}
          />
        </div>
      </div>
    </div>
  );
}
