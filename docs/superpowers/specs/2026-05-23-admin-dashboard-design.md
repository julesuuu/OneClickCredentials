# Admin Dashboard

## Overview

The admin dashboard is an overview page showing key stats and recent activity. It follows the same pattern as the student dashboard — server action data fetching with stat cards and an activity feed.

## Layout

### Summary Cards — 7

Responsive grid: 1 column on mobile, 2 on small screens, 3 on large, 4 on
extra-large.

| Card | Data Source | Link |
|------|-------------|------|
| Total Students | Count of all `StudentProfile` records, plus count created this month | `/admin/students` |
| Pending Verification | Count of `StudentProfile` where `isVerified = false` and `declineReason = null` | `/admin/students` |
| Active Requests | Count of `DocumentRequest` where `status` is "Pending" or "Processing" | `/admin/requests` |
| Ready for Pickup | Count of `DocumentRequest` where `status` is "Ready" | `/admin/requests` |
| Today's Appointments | Count of `Appointment` scheduled today, plus the next scheduled appointment | `/admin/appointments` |
| Payments Pending Review | Count of `Payment` where `status = "Pending"`, plus the pending amount | `/admin/payments` |
| Document Types | Count of active `DocumentType` records, plus inactive count | `/admin/document-types` |

### Bottom Row — 2 Panels

- **Recent Activity** — Latest 10 updates across `DocumentRequest`, `Payment`,
  `Appointment`, and `StudentProfile`, sorted by `updatedAt` descending. Each
  row shows an icon, description, status badge, and relative timestamp.
- **Requests by Status** — Bar breakdown showing count per status (Pending,
  Processing, Ready, Completed).

## Implementation

### Server Action

`src/app/(admin)/admin/actions.ts`

```ts
export async function getAdminDashboardData()
```

Returns:

- `totalStudents` / `newStudentsThisMonth`
- `pendingVerifications`
- `activeRequests`
- `readyForPickup`
- `todaysAppointments` / `nextAppointment`
- `pendingPayments` / `pendingPaymentTotal`
- `activeDocumentTypes` / `inactiveDocumentTypes`
- `statusBreakdown`
- `recentActivity` (last 10 cross-module items)

The action calls `requireAdmin()` before querying.

### Page

`src/app/(admin)/admin/page.tsx` is a server component that calls
`getAdminDashboardData()` and renders the summary cards, activity feed, and
status breakdown.

### Components

- `src/components/dashboard/stat-card.tsx` — optional `href` and `subtitle`
  props for linked cards.
- `src/app/(admin)/admin/AdminActivityFeed.tsx` — cross-module activity list.
- Existing `Badge`, `Card`, and icon components.

## Dependencies

- Uses existing components and `date-fns`.
- No new dependencies.

## Files Changed

| File | Action |
|------|--------|
| `src/app/(admin)/admin/actions.ts` | Modify |
| `src/app/(admin)/admin/page.tsx` | Modify |
| `src/app/(admin)/admin/AdminActivityFeed.tsx` | Create |
| `src/app/(admin)/admin/loading.tsx` | Modify |
| `src/components/dashboard/stat-card.tsx` | Modify |
