import type { Notification as PrismaNotification } from "@/generated/prisma/client";

export type Notification = Pick<
  PrismaNotification,
  "id" | "title" | "message" | "isRead" | "type" | "relatedEntityId" | "relatedEntityType" | "createdAt"
>;

export async function fetchNotifications(): Promise<Notification[]> {
  const res = await fetch("/api/notifications");
  if (!res.ok) throw new Error(`Failed to fetch notifications (${res.status})`);
  return res.json() as Promise<Notification[]>;
}

export async function markAsRead(id: string): Promise<void> {
  const res = await fetch(`/api/notifications/${id}`, { method: "PATCH" });
  if (!res.ok) throw new Error("Failed to mark notification as read");
}

export async function markAllAsRead(): Promise<void> {
  const res = await fetch("/api/notifications/read-all", { method: "PATCH" });
  if (!res.ok) throw new Error("Failed to mark all notifications as read");
}
