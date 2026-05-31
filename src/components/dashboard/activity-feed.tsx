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
  createdAt: Date;
  date?: Date;
  timeSlot?: string;
}

interface ActivityFeedProps {
  requests: Request[];
  items?: ActivityItem[];
}

const statusConfig: Record<
  string,
  {
    variant: "default" | "secondary" | "outline" | "destructive";
    icon: typeof Clock;
  }
> = {
  Pending: { variant: "secondary", icon: Clock },
  Processing: { variant: "secondary", icon: Clock },
  Ready: { variant: "default", icon: CheckCircle },
  Completed: { variant: "default", icon: CheckCircle },
  Rejected: { variant: "destructive", icon: XCircle },
  Cancelled: { variant: "outline", icon: XCircle },
};

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
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {(displayItems as Array<Request | ActivityItem>).map((item) => {
            const isActivityItem = "type" in item;
            const isAppointment = isActivityItem && item.type === "appointment";
            const status = item.status;
            const config = statusConfig[status] || {
              variant: "secondary" as const,
              icon: Clock,
            };
            const StatusIcon = config.icon;

            const displayName = isActivityItem
              ? isAppointment
                ? "Appointment"
                : (item as ActivityItem).documentTypeName
              : (item as Request).documentType.name;

            return (
              <div
                key={item.id}
                className="flex items-center justify-between py-2 border-b last:border-0"
              >
                <div className="flex items-center gap-3">
                  {isAppointment ? (
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  )}
                  <div>
                    <p className="text-sm font-medium">
                      {displayName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(item.createdAt))} ago
                    </p>
                  </div>
                </div>
                <Badge variant={config.variant}>
                  <StatusIcon className="mr-1 h-3 w-3" />
                  {status}
                </Badge>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
