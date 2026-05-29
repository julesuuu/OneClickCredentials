"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { NotificationItem } from "@/components/notifications/notification-item";
import { fetchNotifications, markAsRead, markAllAsRead, getNotificationUrl, type Notification } from "@/lib/notifications";

export default function NotificationsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const { data: notifications, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: fetchNotifications,
    refetchInterval: 30_000,
  });

  const unreadCount = notifications?.filter((n) => !n.isRead).length ?? 0;

  const filteredNotifications =
    filter === "unread"
      ? notifications?.filter((n) => !n.isRead)
      : notifications;

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      try {
        await markAsRead(notification.id);
        queryClient.invalidateQueries({ queryKey: ["notifications"] });
      } catch {
        // Silently fail
      }
    }

    router.push(getNotificationUrl(notification));
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Stay updated on your requests and verification status
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              try {
                await markAllAsRead();
                queryClient.invalidateQueries({ queryKey: ["notifications"] });
              } catch {
                // Silently fail
              }
            }}
          >
            Mark all as read
          </Button>
        )}
      </div>

      <div className="flex gap-1 rounded-lg bg-muted p-1 w-fit">
        <button
          onClick={() => setFilter("all")}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            filter === "all" ? "bg-background shadow-sm" : "hover:text-foreground/80 text-muted-foreground"
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilter("unread")}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            filter === "unread" ? "bg-background shadow-sm" : "hover:text-foreground/80 text-muted-foreground"
          }`}
        >
          Unread {unreadCount > 0 && `(${unreadCount})`}
        </button>
      </div>

      {isLoading ? (
        <div className="divide-y rounded-lg border">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="px-4 py-3 flex items-start gap-3">
              <Skeleton className="mt-1.5 h-2.5 w-2.5 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-72" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          ))}
        </div>
      ) : !filteredNotifications || filteredNotifications.length === 0 ? (
        <div className="rounded-lg border p-8 text-center text-muted-foreground">
          {filter === "unread" ? "No unread notifications" : "No notifications yet"}
        </div>
      ) : (
        <div className="divide-y rounded-lg border">
          {filteredNotifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onClick={handleNotificationClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}
