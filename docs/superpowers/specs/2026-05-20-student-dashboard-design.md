# Student Dashboard Design

## Overview

Implement the main student dashboard page (`/dashboard`) with stat cards, recent activity feed, quick actions, upcoming appointment card, and balance card. Also create shared reusable dashboard components.

## Architecture

- **Page type**: Server Component (`src/app/(student)/dashboard/page.tsx`)
- **Data fetching**: Direct Prisma queries in the page component, parallelized via `Promise.all()`
- **No API routes**: Dashboard data fetched server-side, no client-side fetching for initial load
- **Session**: `auth.api.getSession()` provides `userId` for scoped queries

## Data Queries

All queries scoped to the authenticated user's `userId`:

| Query | Purpose |
|-------|---------|
| `count(DocumentRequest)` | Total request count |
| `count(DocumentRequest where status=Pending OR status=Processing)` | Pending count |
| `count(DocumentRequest where status=Completed OR status=Ready)` | Completed count |
| `count(DocumentRequest where status=Rejected OR status=Cancelled)` | Declined count |
| `findMany(DocumentRequest, orderBy=createdAt DESC, take=5, include=documentType)` | Recent activity feed |
| `findFirst(Appointment where status=Scheduled AND date>=now, include=documentRequest.documentType)` via DocumentRequest relation | Next upcoming appointment |
| `aggregate(Payment where status=Pending, sum=amount)` via DocumentRequest relation | Pending balance total |

## UI Layout

Top-to-bottom order:

1. **Greeting** — "Welcome back, {name}" with today's date
2. **Stat Cards** — 4-column responsive grid: Total | Pending | Completed | Declined
3. **Quick Actions** — Two buttons: "New Document Request" → `/dashboard/requests/new`, "Book Appointment" → `/dashboard/appointments/new`
4. **Two-column section** (stacks on mobile):
   - Left: Recent Activity (last 5 requests)
   - Right: Upcoming Appointment card + Balance card (stacked)

## Components

### Shared Components (`src/components/dashboard/`)

**`stat-card.tsx`**
- Props: `label`, `value`, `icon`, `colorVariant`
- Uses shadcn `Card`
- Color variants: blue (total), yellow (pending), green (completed), red (declined)

**`activity-feed.tsx`**
- Props: `requests` (array of DocumentRequest with documentType)
- Each item: icon, document type name, status badge, relative date
- Empty state: "No recent activity" with link to create first request

**`upcoming-appointment.tsx`**
- Props: `appointment` (with documentRequest) or `null`
- Shows date, time slot, linked document name
- Empty state: "No upcoming appointments" with link to book

**`balance-card.tsx`**
- Props: `pendingAmount` (number)
- Shows total pending amount in PHP
- Links to `/dashboard/payments`

## Edge Cases

- New user with no profile → redirect handled by layout
- No requests → stat cards show 0, activity shows empty state
- No upcoming appointment → placeholder message
- No pending payments → balance shows ₱0
- Prisma errors → caught at page level, error message with retry option

## Component Tree

```
src/app/(student)/dashboard/page.tsx
├── src/components/dashboard/stat-card.tsx (x4)
├── src/components/dashboard/quick-actions.tsx
├── src/components/dashboard/activity-feed.tsx
├── src/components/dashboard/upcoming-appointment.tsx
└── src/components/dashboard/balance-card.tsx
```

## Acceptance Criteria

1. Greeting displays user's name
2. Stat cards show accurate counts from database
3. Quick action buttons navigate to correct pages
4. Activity feed shows last 5 requests with status badges
5. Upcoming appointment shows next scheduled appointment or empty state
6. Balance card shows sum of pending payments or zero
7. Layout is responsive (single column mobile, multi-column desktop)
8. Error states handled gracefully
