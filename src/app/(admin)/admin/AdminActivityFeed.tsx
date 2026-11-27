import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";
import {
  Calendar,
  CreditCard,
  FileText,
  GraduationCap,
  Inbox,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type {
  AdminActivityItem,
  AdminActivityType,
} from "./activity";

const typeConfig: Record<
  AdminActivityType,
  { icon: LucideIcon; label: string }
> = {
  request: { icon: FileText, label: "Request" },
  payment: { icon: CreditCard, label: "Payment" },
  appointment: { icon: Calendar, label: "Appointment" },
  student: { icon: GraduationCap, label: "Student" },
};

const statusVariant: Record<
  string,
  "default" | "secondary" | "outline" | "destructive"
> = {
  Pending: "secondary",
  Processing: "default",
  Ready: "outline",
  Completed: "default",
  Rejected: "destructive",
  Cancelled: "outline",
  Paid: "default",
  Failed: "destructive",
  Refunded: "outline",
  Scheduled: "secondary",
  "No-show": "destructive",
  Verified: "default",
  Declined: "destructive",
};

export function AdminActivityFeed({ items }: { items: AdminActivityItem[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {items.length === 0 ? (
          <div className="py-8 text-center">
            <Inbox className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No recent activity yet.
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {items.map((item) => {
              const config = typeConfig[item.type];
              const Icon = config.icon;

              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className="-mx-2 flex items-center justify-between gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-muted/40"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="shrink-0 rounded-full bg-muted p-2">
                      <Icon
                        className="h-4 w-4 text-muted-foreground"
                        aria-hidden="true"
                      />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {item.title}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {config.label} • {item.description}
                      </p>
                      <p
                        className="text-xs text-muted-foreground"
                        title={format(new Date(item.timestamp), "PPpp")}
                      >
                        {formatDistanceToNow(new Date(item.timestamp), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={statusVariant[item.status] ?? "secondary"}
                    className="shrink-0"
                  >
                    {item.status}
                  </Badge>
                </Link>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
