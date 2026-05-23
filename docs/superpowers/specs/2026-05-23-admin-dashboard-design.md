# Admin Dashboard

## Overview

Replace the placeholder admin dashboard (`<p>Admin Dashboard</p>`) with a real overview page showing key stats and recent activity. The dashboard follows the same pattern as the student dashboard — server action data fetching with stat cards and activity feed components.

## Layout

### Top Row — 4 Stat Cards

| Card | Data Source | Color |
|------|-------------|-------|
| Total Students | Count of all `StudentProfile` records, plus count created this month | Default |
| Pending Verifications | Count of `StudentProfile` where `isVerified = false` and `declineReason = null` | Amber |
| Active Requests | Count of `DocumentRequest` where `status` is "Pending" or "Processing" | Blue |
| Ready for Pickup | Count of `DocumentRequest` where `status` is "Ready" | Green |

### Bottom Row — 2 Panels

- **Recent Requests** — Last 5 `DocumentRequest` records with student name, document type, quantity, and status badge
- **Requests by Status** — Bar breakdown showing count per status (Pending, Processing, Ready, Completed)

## Implementation

### Server Action

New file: `src/app/(admin)/admin/actions.ts`

```ts
export async function getAdminDashboardData()
```

Returns:
- `totalStudents` / `newStudentsThisMonth`
- `pendingVerifications`
- `activeRequests` (Pending + Processing)
- `readyForPickup`
- `recentRequests` (last 5 with includes)
- `requestsByStatus` (count per status group)

### Page

Modify: `src/app/(admin)/admin/page.tsx`

Replace placeholder with a server component that calls `getAdminDashboardData()` and renders the stat cards + panels.

### Components

Use existing `StatCard` from `@/components/dashboard/stat-card.tsx` (already created for student dashboard). The activity feed and quick actions components from the student dashboard can serve as reference, but the admin dashboard keeps things simpler — just cards + recent list + breakdown.

## Dependencies

- Uses existing `StatCard`, `Badge`, `Card` components (all already installed)
- No new dependencies

## Files Changed

| File | Action |
|------|--------|
| `src/app/(admin)/admin/actions.ts` | Create |
| `src/app/(admin)/admin/page.tsx` | Modify |
