# Notification System Improvements

## Overview

Improve the student notification system with mark-as-read functionality, a dedicated notifications page, smarter click navigation, and real-time polling. Scope is student-only (no admin broadcast features).

## Schema

No schema changes. The existing `relatedEntityId` and `relatedEntityType` fields on the Notification model will be populated at creation time.

| Field | Purpose |
|-------|---------|
| `relatedEntityType` | `"verification"` or `"document_request"` |
| `relatedEntityId` | The ID of the StudentProfile (verification) or DocumentRequest (document request) |

## API Routes

Extend existing pattern. Auth: session → studentProfile lookup (same as GET).

### PATCH `/api/notifications/[id]`

Mark a single notification as read. Returns the updated notification.

### PATCH `/api/notifications/read-all`

Mark all unread notifications for the current student profile as read. Returns `{ count: number }`.

### GET `/api/notifications` (unchanged)

Returns 20 most recent notifications, ordered by createdAt desc.

## Notification Creation Updates

Three files need `relatedEntityId` and `relatedEntityType` added to existing `prisma.notification.create` calls:

| File | Type | Entity ID |
|------|------|-----------|
| `admin/requests/actions.ts` (updateRequestStatus) | `"document_request"` | `requestId` |
| `admin/requests/actions.ts` (rejectRequest) | `"document_request"` | `requestId` |
| `admin/students/actions.ts` (verifyStudent) | `"verification"` | `studentId` (the StudentProfile ID) |
| `dashboard/verification/_components/actions.ts` (submitVerificationAction) | `"verification"` | `studentProfile.id` |

## Bell Component Updates

**File:** `src/components/notifications/notification-bell.tsx`

- **Mark-as-read on click**: Clicking a notification calls `PATCH /api/notifications/[id]` to mark it read, invalidates the query, then navigates based on `relatedEntityType`:
  - `"verification"` → `/dashboard/verification`
  - `"document_request"` → `/dashboard/requests`
  - `null` (legacy) → `/dashboard/verification` (current fallback)
- **Mark all as read**: Button in popover header (visible when unread > 0). Calls `PATCH /api/notifications/read-all`, invalidates query.
- **Polling**: Add `refetchInterval: 30000` to the existing `useQuery` call for badge count updates.

## Notifications Page

**New file:** `src/app/(student)/dashboard/notifications/page.tsx` (client component)

### Layout

- Header: "Notifications" title with **All / Unread toggle** (pill-shaped) and **"Mark all as read"** button
- List of notification items, each showing:
  - Blue dot indicator (unread) or empty circle (read)
  - Title (bold if unread, normal weight if read)
  - Message text (secondary color, max 2 lines)
  - Relative timestamp
- Click behavior: same as bell — mark as read + navigate
- Empty states: "No notifications" when none exist, "No unread notifications" when filter shows nothing

### Shared Code

Extract from `notification-bell.tsx`:

- `getNotifications()` → move to `@/lib/notifications.ts`
- Notification item rendering → extract as `NotificationItem` shared component in `@/components/notifications/notification-item.tsx`

## Files Summary

| File | Action |
|------|--------|
| `src/lib/notifications.ts` | Create — shared fetch function |
| `src/components/notifications/notification-item.tsx` | Create — shared notification item component |
| `src/components/notifications/notification-bell.tsx` | Modify — add mark-as-read, mark-all, polling |
| `src/app/(student)/dashboard/notifications/page.tsx` | Create — notifications list page |
| `src/app/api/notifications/[id]/route.ts` | Create — PATCH single mark-as-read |
| `src/app/api/notifications/read-all/route.ts` | Create — PATCH mark all as read |
| `admin/requests/actions.ts` | Modify — add relatedEntity fields |
| `admin/students/actions.ts` | Modify — add relatedEntity fields |
| `dashboard/verification/_components/actions.ts` | Modify — add relatedEntity fields |

## Dependencies

- Uses existing `Popover`, `ScrollArea`, `Button`, `Badge` components
- `@tanstack/react-query` for data fetching and cache invalidation
- `date-fns` for relative timestamps (already used)
- `sonner` for toast on errors
