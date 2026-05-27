# Notification System Improvements — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add mark-as-read, a dedicated notifications page, smarter click navigation, and real-time polling to the student notification system.

**Architecture:** Extend existing API routes (GET → add PATCH for mark-as-read), update notification creation sites to populate `relatedEntityId`/`relatedEntityType`, extract shared fetch logic + components, add sidebar link and full notifications page.

**Tech Stack:** Next.js 16 API routes, Prisma, @tanstack/react-query, date-fns, shadcn/ui

---

## File Structure

| File | Action | Responsibility |
|------|--------|---------------|
| `src/lib/notifications.ts` | Create | Shared `Notification` type, `fetchNotifications()` |
| `src/components/notifications/notification-item.tsx` | Create | Reusable notification list item |
| `src/components/notifications/notification-bell.tsx` | Modify | Mark-as-read on click, mark-all button, polling |
| `src/app/api/notifications/route.ts` | No change | |
| `src/app/api/notifications/[id]/route.ts` | Create | PATCH — mark single notification as read |
| `src/app/api/notifications/read-all/route.ts` | Create | PATCH — mark all as read |
| `src/app/(student)/dashboard/notifications/page.tsx` | Create | Full notifications list page |
| `src/components/app-sidebar.tsx` | Modify | Add "Notifications" nav link |
| `src/app/(admin)/admin/requests/actions.ts` | Modify | Add `relatedEntityId`/`relatedEntityType` to notifications |
| `src/app/(admin)/admin/students/actions.ts` | Modify | Add `relatedEntityId`/`relatedEntityType` to notifications |
| `src/app/(student)/dashboard/verification/_components/actions.ts` | Modify | Add `relatedEntityId`/`relatedEntityType` to notifications |

---

### Task 1: Create shared notification lib

**Files:**
- Create: `src/lib/notifications.ts`

Move the shared `Notification` type and fetch function out of `notification-bell.tsx` into a shared library so both the bell and the notifications page use the same query.

- [ ] **Create `src/lib/notifications.ts`**

```ts
import type { Notification as PrismaNotification } from "@prisma/client";

export type Notification = Pick<
  PrismaNotification,
  "id" | "title" | "message" | "isRead" | "type" | "relatedEntityId" | "relatedEntityType" | "createdAt"
>;

export async function fetchNotifications(): Promise<Notification[]> {
  const res = await fetch("/api/notifications");
  if (!res.ok) throw new Error("Failed to fetch notifications");
  return res.json();
}

export async function markAsRead(id: string): Promise<void> {
  const res = await fetch(`/api/notifications/${id}`, { method: "PATCH" });
  if (!res.ok) throw new Error("Failed to mark notification as read");
}

export async function markAllAsRead(): Promise<void> {
  const res = await fetch("/api/notifications/read-all", { method: "PATCH" });
  if (!res.ok) throw new Error("Failed to mark all notifications as read");
}
```

- [ ] **Commit**

```bash
git add src/lib/notifications.ts
git commit -m "feat(notifications): add shared notification lib with types and API helpers"
```

---

### Task 2: Update notification creation sites with relatedEntity fields

**Files:**
- Modify: `src/app/(admin)/admin/requests/actions.ts`
- Modify: `src/app/(admin)/admin/students/actions.ts`
- Modify: `src/app/(student)/dashboard/verification/_components/actions.ts`

Each `prisma.notification.create` call gets `relatedEntityId` and `relatedEntityType`.

- [ ] **Update `admin/requests/actions.ts` — `updateRequestStatus`**: Add `relatedEntityType: "document_request"` and `relatedEntityId: requestId` to the notification create data (line ~89-98).

```ts
prisma.notification.create({
  data: {
    studentProfileId,
    title: notificationData[status]?.title ?? "Status Updated",
    message:
      notificationData[status]?.message ??
      `Your request status has been updated to ${status}.`,
    type: status.toUpperCase(),
    relatedEntityType: "document_request",
    relatedEntityId: requestId,
  },
}),
```

- [ ] **Update `admin/requests/actions.ts` — `rejectRequest`**: Same fields around line ~127-134.

```ts
prisma.notification.create({
  data: {
    studentProfileId,
    title: "Request Rejected",
    message: `Your request for ${request.documentType.name} was rejected. Reason: ${reason}`,
    type: "REJECTED",
    relatedEntityType: "document_request",
    relatedEntityId: requestId,
  },
}),
```

- [ ] **Update `admin/students/actions.ts`**: Add relatedEntity fields to both notification creates (lines ~36-43 and ~46-54).

```ts
// Rejection (line ~36-43):
await prisma.notification.create({
  data: {
    studentProfileId: studentId,
    title: "Verification Rejected",
    message: `Your verification was rejected. Reason: ${declineReason}. Please re-upload your proof of enrollment.`,
    type: "REJECTED",
    relatedEntityType: "verification",
    relatedEntityId: studentId,
  },
});

// Approval (line ~46-54):
await prisma.notification.create({
  data: {
    studentProfileId: studentId,
    title: "Verification Approved",
    message: "Congratulations! Your verification has been approved.",
    type: "VERIFIED",
    relatedEntityType: "verification",
    relatedEntityId: studentId,
  },
});
```

- [ ] **Update `dashboard/verification/_components/actions.ts`**: Add relatedEntity fields (lines ~44-51).

```ts
await prisma.notification.create({
  data: {
    studentProfileId: studentProfile.id,
    title: "Verification Resubmitted",
    message: "Your verification has been resubmitted for review. We'll notify you once processed.",
    type: "PENDING",
    relatedEntityType: "verification",
    relatedEntityId: studentProfile.id,
  },
});
```

- [ ] **Commit**

```bash
git add src/app/\(admin\)/admin/requests/actions.ts src/app/\(admin\)/admin/students/actions.ts src/app/\(student\)/dashboard/verification/_components/actions.ts
git commit -m "feat(notifications): populate relatedEntityId and relatedEntityType on creation"
```

---

### Task 3: Create PATCH `/api/notifications/[id]` route

**Files:**
- Create: `src/app/api/notifications/[id]/route.ts`

- [ ] **Create `src/app/api/notifications/[id]/route.ts`**

```ts
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const studentProfile = await prisma.studentProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  if (!studentProfile) {
    return NextResponse.json({ error: "Student profile not found" }, { status: 404 });
  }

  const { id } = await params;

  const notification = await prisma.notification.findFirst({
    where: { id, studentProfileId: studentProfile.id },
  });

  if (!notification) {
    return NextResponse.json({ error: "Notification not found" }, { status: 404 });
  }

  const updated = await prisma.notification.update({
    where: { id },
    data: { isRead: true },
  });

  return NextResponse.json(updated);
}
```

- [ ] **Commit**

```bash
git add src/app/api/notifications/\[id\]/route.ts
git commit -m "feat(notifications): add PATCH endpoint for marking single notification as read"
```

---

### Task 4: Create PATCH `/api/notifications/read-all` route

**Files:**
- Create: `src/app/api/notifications/read-all/route.ts`

- [ ] **Create `src/app/api/notifications/read-all/route.ts`**

```ts
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PATCH() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const studentProfile = await prisma.studentProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  if (!studentProfile) {
    return NextResponse.json({ error: "Student profile not found" }, { status: 404 });
  }

  const result = await prisma.notification.updateMany({
    where: { studentProfileId: studentProfile.id, isRead: false },
    data: { isRead: true },
  });

  return NextResponse.json({ count: result.count });
}
```

- [ ] **Commit**

```bash
git add src/app/api/notifications/read-all/route.ts
git commit -m "feat(notifications): add PATCH endpoint for marking all notifications as read"
```

---

### Task 5: Create shared NotificationItem component

**Files:**
- Create: `src/components/notifications/notification-item.tsx`

- [ ] **Create `src/components/notifications/notification-item.tsx`**

```tsx
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
```

- [ ] **Commit**

```bash
git add src/components/notifications/notification-item.tsx
git commit -m "feat(notifications): create shared NotificationItem component"
```

---

### Task 6: Update NotificationBell with mark-as-read, mark-all, polling

**Files:**
- Modify: `src/components/notifications/notification-bell.tsx`

Replace the entire file content.

- [ ] **Rewrite `src/components/notifications/notification-bell.tsx`**

```tsx
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
import { fetchNotifications, markAsRead, markAllAsRead, type Notification } from "@/lib/notifications";

function getNotificationUrl(notification: Notification): string {
  if (notification.relatedEntityType === "document_request") {
    return "/dashboard/requests";
  }
  return "/dashboard/verification";
}

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
```

- [ ] **Commit**

```bash
git add src/components/notifications/notification-bell.tsx
git commit -m "feat(notifications): add mark-as-read, mark-all, and polling to notification bell"
```

---

### Task 7: Create notifications page

**Files:**
- Create: `src/app/(student)/dashboard/notifications/page.tsx`

- [ ] **Create `src/app/(student)/dashboard/notifications/page.tsx`**

```tsx
"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { NotificationItem } from "@/components/notifications/notification-item";
import { fetchNotifications, markAsRead, markAllAsRead } from "@/lib/notifications";

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

  const handleNotificationClick = async (notification: {
    id: string;
    isRead: boolean;
    relatedEntityType: string | null;
  }) => {
    if (!notification.isRead) {
      try {
        await markAsRead(notification.id);
        queryClient.invalidateQueries({ queryKey: ["notifications"] });
      } catch {
        // Silently fail
      }
    }

    const url =
      notification.relatedEntityType === "document_request"
        ? "/dashboard/requests"
        : "/dashboard/verification";
    router.push(url);
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
        <div className="rounded-lg border p-8 text-center text-muted-foreground">
          Loading notifications...
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
```

- [ ] **Commit**

```bash
git add src/app/\(student\)/dashboard/notifications/page.tsx
git commit -m "feat(notifications): create dedicated notifications page with filter and mark-all"
```

---

### Task 8: Add Notifications link to sidebar

**Files:**
- Modify: `src/components/app-sidebar.tsx`

- [ ] **Add Notifications to `app-sidebar.tsx`**

Import `Bell` icon from lucide-react and add a "Notifications" item to the main navigation after "Appointment".

```tsx
import { Bell } from "lucide-react";
// ...existing imports

const mainNavigation = [
  {
    title: "Application",
    items: [
      // ...existing items
      {
        title: "Notifications",
        url: "/dashboard/notifications",
        icon: Bell,
      },
    ],
  },
];
```

- [ ] **Commit**

```bash
git add src/components/app-sidebar.tsx
git commit -m "feat(notifications): add notifications link to student sidebar"
```

---

## Self-Review

**1. Spec coverage:**
- [x] Mark-as-read (individual) — Task 3 (API) + Task 6 (bell) + Task 7 (page)
- [x] Mark-all-as-read — Task 4 (API) + Task 6 (bell) + Task 7 (page)
- [x] `/dashboard/notifications` page — Task 7
- [x] Smarter navigation via `relatedEntityType` — Task 2 (creation) + Task 6 & 7 (navigation)
- [x] Real-time polling — Task 6 & 7 (`refetchInterval: 30_000`)
- [x] Shared code extraction — Task 1 (lib) + Task 5 (component)
- [x] Sidebar link — Task 8

**2. Placeholder scan:** No TODOs, TBDs, "implement later", or vague instructions. All steps contain complete code.

**3. Type consistency:** `Notification` type defined in Task 1, used in Tasks 5, 6, 7. Function names match across files.
