"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { NotificationItem } from "@/components/notifications/notification-item";
import { fetchNotifications, markAsRead, markAllAsRead, getNotificationUrl, type Notification } from "@/lib/notifications";

export function NotificationBell() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: notifications, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: fetchNotifications,
    refetchInterval: 30_000,
  });

  const unreadCount = notifications?.filter((n) => !n.isRead).length ?? 0;

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      try {
        await markAsRead(notification.id);
        queryClient.invalidateQueries({ queryKey: ["notifications"] });
      } catch {
        // Silently fail — navigation still works
      }
    }
    router.push(getNotificationUrl(notification));
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    } catch {
      // Silently fail
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-xs text-white flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h4 className="font-medium">Notifications</h4>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto px-2 py-1 text-xs"
              onClick={handleMarkAllAsRead}
            >
              Mark all as read
            </Button>
          )}
        </div>
        <ScrollArea className="h-[300px]">
          {isLoading ? (
            <div className="p-4 text-center text-muted-foreground text-sm">
              Loading...
            </div>
          ) : notifications?.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground text-sm">
              No notifications
            </div>
          ) : (
            <div className="divide-y">
              {notifications?.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onClick={handleNotificationClick}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
