import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Calendar, Clock, CheckCircle, XCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface Request {
  id: string;
  status: string;
  createdAt: Date;
  documentType: {
    name: string;
  };
}

interface ActivityItem {
  id: string;
  type: "request" | "appointment";
  documentTypeName: string;
  status: string;
  declineReason?: string | null;
  createdAt: Date;
  date?: Date;
  timeSlot?: string;
}

interface ActivityFeedProps {
  requests: Request[];
  items?: ActivityItem[];
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

const statusConfig: Record<
  string,
  {
    variant: "default" | "secondary" | "outline" | "destructive";
  }
> = {
  Pending: { variant: "secondary" },
  Processing: { variant: "secondary" },
  Ready: { variant: "default" },
  Completed: { variant: "default" },
  Rejected: { variant: "destructive" },
  Cancelled: { variant: "outline" },
};

function getIconStyling(
  status: string,
  type: "request" | "appointment"
): { bg: string; Icon: typeof Clock } {
  if (type === "appointment") {
    return { bg: "bg-blue-50 text-blue-600", Icon: Calendar };
  }
  switch (status) {
    case "Ready":
    case "Completed":
      return { bg: "bg-green-50 text-green-600", Icon: CheckCircle };
    case "Rejected":
      return { bg: "bg-red-50 text-red-600", Icon: XCircle };
    case "Cancelled":
      return { bg: "bg-gray-50 text-gray-600", Icon: XCircle };
    case "Pending":
      return { bg: "bg-amber-50 text-amber-600", Icon: Clock };
    default:
      return { bg: "bg-blue-50 text-blue-600", Icon: Clock };
  }
}

function getSubtitle(item: ActivityItem): string {
  if (item.type === "appointment") {
    return item.date
      ? `${new Date(item.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} — ${item.timeSlot === "AM" ? "AM Session" : "PM Session"}`
      : "";
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
      return "";
  }
}

export function ActivityFeed({ requests, items }: ActivityFeedProps) {
  const displayItems = items ?? requests;

  if (displayItems.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="pt-0 text-center py-8">
          <FileText className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">No recent activity</p>
          <Button asChild variant="link" className="mt-2">
            <Link href="/dashboard/requests/new">Make your first request</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

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
        <div className="space-y-0">
          {(displayItems as Array<Request | ActivityItem>).map((item) => {
            const isActivityItem = "type" in item;
            const isAppointment = isActivityItem && item.type === "appointment";
            const status = item.status;
            const config = statusConfig[status] || {
              variant: "secondary" as const,
            };
            const borderClass = statusBorder[status] || "border-l-gray-400";

            const { bg: iconBg, Icon: StatusIcon } = isActivityItem
              ? getIconStyling(
                  status,
                  (item as ActivityItem).type
                )
              : getIconStyling(status, "request");

            const displayName = isActivityItem
              ? isAppointment
                ? "Appointment"
                : (item as ActivityItem).documentTypeName
              : (item as Request).documentType.name;

            const subtitle = isActivityItem
              ? getSubtitle(item as ActivityItem)
              : "";

            return (
              <div
                key={item.id}
                className={`flex items-center gap-3 py-3 border-b last:border-0 border-l-[3px] ${borderClass} hover:bg-muted/50 transition-colors pl-3`}
              >
                <div
                  className={`flex items-center justify-center h-8 w-8 rounded-md ${iconBg}`}
                >
                  <StatusIcon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{displayName}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {subtitle}
                  </p>
                </div>
                <Badge variant={config.variant}>
                  {status}
                </Badge>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatDistanceToNow(new Date(item.createdAt))} ago
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
