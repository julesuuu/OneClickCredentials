"use client";

import { type Notification } from "@/lib/notifications";
import { formatDistanceToNow } from "date-fns";

interface NotificationItemProps {
  notification: Notification;
  onClick: (notification: Notification) => void;
}

export function NotificationItem({ notification, onClick }: NotificationItemProps) {
  return (
    <div
      onClick={() => onClick(notification)}
      className={`px-4 py-3 hover:bg-muted/50 cursor-pointer ${
        !notification.isRead ? "bg-muted/30" : ""
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${
            !notification.isRead ? "bg-primary" : "border border-muted-foreground/30"
          }`}
        />
        <div className="min-w-0 flex-1">
          <p
            className={`text-sm ${
              !notification.isRead ? "font-medium" : "text-muted-foreground"
            }`}
          >
            {notification.title}
          </p>
          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
            {notification.message}
          </p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            {formatDistanceToNow(new Date(notification.createdAt), {
              addSuffix: true,
            })}
          </p>
        </div>
      </div>
    </div>
  );
}
