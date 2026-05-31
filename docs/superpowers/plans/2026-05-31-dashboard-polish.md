# Student Dashboard Visual Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Polish the student dashboard with gradient accents, hover effects, enriched activity feed, and a premium look.

**Architecture:** Modify existing server action to return more data, update the server component page to pass new props, update 5 existing client components with enhanced styling, and create 1 new component.

**Tech Stack:** Next.js 16, Prisma, better-auth, Tailwind CSS, shadcn/ui, date-fns

---

### Task 1: Update Dashboard Data (actions.ts)

**Files:**
- Modify: `src/app/(student)/dashboard/actions.ts`

**Context:**
- Current `getDashboardData` returns: `userName, stats { total, pending, completed, declined }, recentRequests (5), upcomingAppointment, pendingAmount`
- Need to add: `requestsThisMonth` count, completion %, recent appointments (5), profile status (`isProfileComplete`, `isVerified`)
- The combined feed: fetch recent requests + recent appointments, sort by createdAt desc, take 5
- `recentRequests` currently only fetches document requests — keep this for individual component use, also create a combined `recentActivity` array
- Import `prisma` from `@/lib/prisma`, `auth` from `@/lib/auth`, `headers` from `next/headers`

- [ ] **Step 1: Update getDashboardData to return additional fields**

```typescript
"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function getDashboardData() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return null;
  }

  const userId = session.user.id;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalCount,
    pendingCount,
    completedCount,
    declinedCount,
    requestsThisMonth,
    recentRequests,
    recentAppointments,
    upcomingAppointment,
    pendingBalance,
    studentProfile,
  ] = await Promise.all([
    prisma.documentRequest.count({ where: { userId } }),
    prisma.documentRequest.count({
      where: { userId, status: { in: ["Pending", "Processing"] } },
    }),
    prisma.documentRequest.count({
      where: { userId, status: { in: ["Completed", "Ready"] } },
    }),
    prisma.documentRequest.count({
      where: { userId, status: { in: ["Rejected", "Cancelled"] } },
    }),
    prisma.documentRequest.count({
      where: { userId, createdAt: { gte: startOfMonth } },
    }),
    prisma.documentRequest.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        documentType: { select: { name: true } },
      },
    }),
    prisma.appointment.findMany({
      where: { documentRequest: { userId } },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        documentRequest: {
          select: { documentType: { select: { name: true } } },
        },
      },
    }),
    prisma.appointment.findFirst({
      where: {
        documentRequest: { userId },
        status: "Scheduled",
        date: { gte: now },
      },
      orderBy: { date: "asc" },
      include: {
        documentRequest: {
          include: { documentType: { select: { name: true } } },
        },
      },
    }),
    prisma.payment.aggregate({
      where: {
        documentRequest: { userId },
        status: "Pending",
      },
      _sum: { amount: true },
    }),
    prisma.studentProfile.findUnique({
      where: { userId },
      select: { isProfileComplete: true, isVerified: true },
    }),
  ]);

  // Combine requests and appointments into a recent activity feed
  const requestItems = recentRequests.map((r) => ({
    id: r.id,
    type: "request" as const,
    documentTypeName: r.documentType.name,
    status: r.status,
    declineReason: r.declineReason,
    createdAt: r.createdAt,
  }));

  const appointmentItems = recentAppointments.map((a) => ({
    id: a.id,
    type: "appointment" as const,
    documentTypeName: a.documentRequest.documentType.name,
    status: a.status,
    date: a.date,
    timeSlot: a.timeSlot,
    createdAt: a.createdAt,
  }));

  const recentActivity = [...requestItems, ...appointmentItems]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 5);

  const completionRate =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return {
    userName: session.user.name || "Student",
    userImage: session.user.image,
    stats: {
      total: totalCount,
      pending: pendingCount,
      completed: completedCount,
      declined: declinedCount,
    },
    requestsThisMonth,
    completionRate,
    recentRequests,
    recentActivity,
    upcomingAppointment,
    pendingAmount: pendingBalance._sum.amount ?? 0,
    profile: studentProfile ?? { isProfileComplete: false, isVerified: false },
  };
}
```

- [ ] **Step 2: Verify no type errors**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/app/(student)/dashboard/actions.ts
git commit -m "feat: extend dashboard data with activity feed and profile"
```

---

### Task 2: Update Dashboard Page and Create Account Status Widget

**Files:**
- Modify: `src/app/(student)/dashboard/page.tsx`
- Create: `src/components/dashboard/account-status.tsx`

**Context:**
- The page server component will now receive enriched data from the updated `getDashboardData()`
- `getDashboardData()` now returns: `userName, userImage, stats, requestsThisMonth, completionRate, recentRequests, recentActivity, upcomingAppointment, pendingAmount, profile`
- Need to pass `recentActivity` (typed union) to ActivityFeed instead of just `requests`
- Need `profile` data to AccountStatus component
- The `QuickActions` component currently takes no props — it stays unchanged

- [ ] **Step 1: Create AccountStatus component**

```typescript
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Clock } from "lucide-react";
import Link from "next/link";

interface AccountStatusProps {
  isProfileComplete: boolean;
  isVerified: boolean;
}

export function AccountStatus({ isProfileComplete, isVerified }: AccountStatusProps) {
  return (
    <Card>
      <CardContent className="p-5">
        <h3 className="text-sm font-semibold mb-3">Account Status</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Profile</span>
            {isProfileComplete ? (
              <Badge variant="default" className="bg-green-50 text-green-700 hover:bg-green-50 border-0 gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Complete
              </Badge>
            ) : (
              <Badge variant="outline" className="gap-1">
                <XCircle className="h-3 w-3" />
                Incomplete
              </Badge>
            )}
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Verification</span>
            {isVerified ? (
              <Badge variant="default" className="bg-green-50 text-green-700 hover:bg-green-50 border-0 gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Verified
              </Badge>
            ) : (
              <Badge variant="secondary" className="gap-1">
                <Clock className="h-3 w-3" />
                {isProfileComplete ? "Pending" : "Not Submitted"}
              </Badge>
            )}
          </div>
        </div>
        {(!isProfileComplete || !isVerified) && (
          <Link
            href="/dashboard/settings/profile"
            className="mt-3 block w-full text-center text-xs font-medium text-indigo-600 hover:text-indigo-700 border border-indigo-200 hover:border-indigo-300 rounded-lg px-4 py-2 transition-colors"
          >
            Complete Your Profile
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: Update page.tsx**

```typescript
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
            Welcome back, <span className="text-indigo-600">{data.userName}</span>
          </h1>
          <p className="text-muted-foreground mt-1">{today}</p>
        </div>
        {data.userImage && (
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-border">
            <img
              src={data.userImage}
              alt={data.userName}
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
```

- [ ] **Step 3: Verify no type errors**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add src/app/(student)/dashboard/page.tsx src/components/dashboard/account-status.tsx
git commit -m "feat: update dashboard page layout and add account status widget"
```

---

### Task 3: Update Stat Card Component

**Files:**
- Modify: `src/components/dashboard/stat-card.tsx`

**Context:**
- Current: solid color icon bg, no subtitle, no hover, no link
- New: gradient icon bg by variant, hover lift + shadow, subtitle line below value, entire card clickable via Link
- Import `Link` from `next/link`, `cn` from `@/lib/utils`
- Color variants stay as blue/yellow/green/red but use gradient backgrounds instead of solid
- Subtitle uses `text-xs` muted text
- Hover: `transition-all hover:-translate-y-0.5 hover:shadow-md`

- [ ] **Step 1: Rewrite StatCard with enhancements**

```typescript
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { type LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
  colorVariant?: "blue" | "yellow" | "green" | "red";
  subtitle?: string;
  href?: string;
}

const gradientMap = {
  blue: {
    bg: "bg-gradient-to-br from-blue-50 to-blue-100",
    icon: "text-blue-600",
  },
  yellow: {
    bg: "bg-gradient-to-br from-yellow-50 to-yellow-100",
    icon: "text-yellow-600",
  },
  green: {
    bg: "bg-gradient-to-br from-green-50 to-green-100",
    icon: "text-green-600",
  },
  red: {
    bg: "bg-gradient-to-br from-red-50 to-red-100",
    icon: "text-red-600",
  },
};

export function StatCard({
  label,
  value,
  icon: Icon,
  colorVariant = "blue",
  subtitle,
  href,
}: StatCardProps) {
  const colors = gradientMap[colorVariant];
  const content = (
    <Card
      className={cn(
        "transition-all hover:-translate-y-0.5 hover:shadow-md cursor-pointer",
        !href && "cursor-default"
      )}
    >
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <p className="text-3xl font-bold mt-1 tabular-nums">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
            )}
          </div>
          <div className={cn("rounded-xl p-3", colors.bg)}>
            <Icon className={cn("h-5 w-5", colors.icon)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}
```

- [ ] **Step 2: Verify no type errors**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/components/dashboard/stat-card.tsx
git commit -m "feat: enhance stat card with gradients, hover, subtitle, links"
```

---

### Task 4: Update Activity Feed Component

**Files:**
- Modify: `src/components/dashboard/activity-feed.tsx`

**Context:**
- Currently accepts `requests: Request[]` — array of DocumentRequest with `{ id, status, createdAt, documentType: { name } }`
- Now also accepts `items: ActivityItem[]` — a combined feed of requests + appointments
- Need to update props interface to accept both, and update rendering

**ActivityItem type (from actions.ts):**
```typescript
{ id: string; type: "request"; documentTypeName: string; status: string; declineReason: string | null; createdAt: Date }
| { id: string; type: "appointment"; documentTypeName: string; status: string; date: Date; timeSlot: string; createdAt: Date }
```

**Visual updates:**
- Each item gets a 3px left border colored by status
- Icon rendered in a small colored rounded container
- Subtitle line (not just relative time)
- Hover highlight on rows
- "View all →" link in the card header
- When `items` is provided, use it instead of `requests` for the feed display

- [ ] **Step 1: Rewrite ActivityFeed with enhanced styling**

```typescript
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Clock, CheckCircle, XCircle, Calendar } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import Link from "next/link";

interface ActivityRequest {
  id: string;
  status: string;
  createdAt: Date;
  declineReason: string | null;
  documentType: { name: string };
}

type ActivityItem =
  | {
      id: string;
      type: "request";
      documentTypeName: string;
      status: string;
      declineReason: string | null;
      createdAt: Date;
    }
  | {
      id: string;
      type: "appointment";
      documentTypeName: string;
      status: string;
      date: Date;
      timeSlot: string;
      createdAt: Date;
    };

interface ActivityFeedProps {
  items: ActivityItem[];
  requests: ActivityRequest[];
}

const statusBorder: Record<string, string> = {
  Pending: "border-l-amber-400",
  Processing: "border-l-blue-400",
  Ready: "border-l-green-400",
  Completed: "border-l-green-600",
  Rejected: "border-l-red-400",
  Cancelled: "border-l-gray-400",
  Scheduled: "border-l-blue-400",
  "No-show": "border-l-red-400",
};

const statusBadgeVariant: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  Pending: "secondary",
  Processing: "default",
  Ready: "default",
  Completed: "default",
  Rejected: "destructive",
  Cancelled: "outline",
  Scheduled: "default",
  "No-show": "destructive",
};

function getStatusIcon(status: string, type: "request" | "appointment") {
  if (type === "appointment") return Calendar;
  switch (status) {
    case "Ready":
    case "Completed":
      return CheckCircle;
    case "Rejected":
    case "Cancelled":
      return XCircle;
    default:
      return Clock;
  }
}

function getIconBgColor(status: string, type: "request" | "appointment") {
  if (type === "appointment") return "bg-blue-50 text-blue-600";
  switch (status) {
    case "Ready":
    case "Completed":
      return "bg-green-50 text-green-600";
    case "Rejected":
      return "bg-red-50 text-red-600";
    case "Cancelled":
      return "bg-gray-50 text-gray-600";
    case "Pending":
      return "bg-amber-50 text-amber-600";
    default:
      return "bg-blue-50 text-blue-600";
  }
}

function getSubtitle(item: ActivityItem): string {
  if (item.type === "appointment") {
    return `${format(new Date(item.date), "MMM d, yyyy")} — ${item.timeSlot === "AM" ? "AM Session" : "PM Session"}`;
  }
  switch (item.status) {
    case "Pending":
      return "Awaiting admin review";
    case "Processing":
      return "Being processed";
    case "Ready":
      return "Ready for pickup";
    case "Completed":
      return "Completed";
    case "Rejected":
      return item.declineReason || "Incomplete requirements";
    case "Cancelled":
      return "Cancelled";
    default:
      return formatDistanceToNow(new Date(item.createdAt), { addSuffix: true });
  }
}

export function ActivityFeed({ items, requests }: ActivityFeedProps) {
  const displayItems = items.length > 0 ? items : requests;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Recent Activity</CardTitle>
        <Link
          href="/dashboard/requests"
          className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
        >
          View all &rarr;
        </Link>
      </CardHeader>
      <CardContent className="pt-0">
        {displayItems.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">No recent activity</p>
            <Link
              href="/dashboard/requests/new"
              className="mt-2 inline-block text-sm text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Make your first request
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {displayItems.map((item) => {
              const border = statusBorder[item.status] || "border-l-gray-400";
              const StatusIcon = getStatusIcon(item.status, item.type);
              const iconColor = getIconBgColor(item.status, item.type);

              return (
                <div
                  key={`${item.type}-${item.id}`}
                  className={`flex items-center gap-4 py-3 pl-3 border-l-3 ${border} hover:bg-muted/50 transition-colors rounded-r-lg`}
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${iconColor}`}>
                    <StatusIcon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">
                      {item.type === "appointment" ? `Appointment: ${item.documentTypeName}` : item.documentTypeName}
                    </p>
                    <p className="text-xs text-muted-foreground">{getSubtitle(item)}</p>
                  </div>
                  <Badge variant={statusBadgeVariant[item.status] || "secondary"}>
                    {item.status}
                  </Badge>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: Verify no type errors**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/components/dashboard/activity-feed.tsx
git commit -m "feat: enhance activity feed with borders, icons, appointments"
```

---

### Task 5: Update Remaining Components (Quick Actions, Upcoming Appointment, Balance Card)

**Files:**
- Modify: `src/components/dashboard/quick-actions.tsx`
- Modify: `src/components/dashboard/upcoming-appointment.tsx`
- Modify: `src/components/dashboard/balance-card.tsx`

- [ ] **Step 1: Update QuickActions**

```typescript
import { Button } from "@/components/ui/button";
import { Plus, CalendarPlus } from "lucide-react";
import Link from "next/link";

export function QuickActions() {
  return (
    <div className="flex gap-4 flex-wrap">
      <Button asChild size="lg" className="flex-1 min-w-50 bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-200">
        <Link href="/dashboard/requests/new">
          <Plus className="mr-2 h-5 w-5" />
          New Document Request
        </Link>
      </Button>
      <Button asChild size="lg" variant="outline" className="flex-1 min-w-50 border-slate-200 hover:border-slate-300">
        <Link href="/dashboard/appointments/new">
          <CalendarPlus className="mr-2 h-5 w-5" />
          Book Appointment
        </Link>
      </Button>
    </div>
  );
}
```

- [ ] **Step 2: Update UpcomingAppointment**

```typescript
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface Appointment {
  id: string;
  date: Date;
  timeSlot: string;
  documentRequest: {
    documentType: { name: string };
  };
}

interface UpcomingAppointmentProps {
  appointment: Appointment | null;
}

export function UpcomingAppointment({ appointment }: UpcomingAppointmentProps) {
  if (!appointment) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Upcoming Appointment</CardTitle>
        </CardHeader>
        <CardContent className="pt-0 text-center py-6">
          <Calendar className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">
            No upcoming appointments
          </p>
          <Button asChild variant="link" className="mt-1">
            <Link href="/dashboard/appointments/new">Book one now</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Upcoming Appointment</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center">
            <Calendar className="h-6 w-6 text-indigo-600" />
          </div>
          <div>
            <p className="text-sm font-semibold">
              {format(new Date(appointment.date), "EEEE, MMMM d, yyyy")}
            </p>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{appointment.timeSlot === "AM" ? "AM Session (8:00 - 12:00)" : "PM Session (1:00 - 5:00)"}</span>
            </div>
          </div>
        </div>
        <div className="bg-muted/50 rounded-lg px-3 py-2 text-xs text-muted-foreground">
          For: <span className="font-medium text-foreground">{appointment.documentRequest.documentType.name}</span>
        </div>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 3: Update BalanceCard**

```typescript
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard } from "lucide-react";
import Link from "next/link";

interface BalanceCardProps {
  pendingAmount: number;
}

export function BalanceCard({ pendingAmount }: BalanceCardProps) {
  return (
    <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-0">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base text-slate-300">Pending Balance</CardTitle>
          <CreditCard className="h-5 w-5 text-slate-400" />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {pendingAmount > 0 ? (
          <div className="space-y-3">
            <p className="text-3xl font-bold text-white tabular-nums">₱{pendingAmount.toLocaleString()}</p>
            <Link
              href="/dashboard/payments"
              className="block w-full text-center text-sm font-medium text-white/80 hover:text-white border border-white/20 hover:border-white/40 rounded-lg px-4 py-2.5 transition-colors"
            >
              View Payments &rarr;
            </Link>
          </div>
        ) : (
          <div className="text-center py-4">
            <CreditCard className="mx-auto h-8 w-8 text-slate-500 mb-2" />
            <p className="text-sm text-slate-400">No pending payments</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 4: Verify no type errors**

```bash
npx tsc --noEmit
```

- [ ] **Step 5: Lint and commit all three files**

```bash
npm run lint
git add src/components/dashboard/quick-actions.tsx src/components/dashboard/upcoming-appointment.tsx src/components/dashboard/balance-card.tsx
git commit -m "feat: polish quick actions, appointment card, and balance card"
```

---

### Post-Implementation: Build Check

```bash
npm run build
```
