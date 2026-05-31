# Student Dashboard Visual Polish

## Overview

Enhance the student dashboard with refined visual styling while keeping the existing layout and functionality intact. Focus on gradient accents, hover effects, improved typography, enriched content, and a premium feel that suits a school credentials system.

## Changes

### Stat Cards (`src/components/dashboard/stat-card.tsx`)

- Replace solid-color icon backgrounds with gradient backgrounds:
  - blue → `linear-gradient(135deg, #eff6ff, #dbeafe)`
  - yellow → `linear-gradient(135deg, #fefce8, #fef08a)`
  - green → `linear-gradient(135deg, #f0fdf4, #bbf7d0)`
  - red → `linear-gradient(135deg, #fef2f2, #fecaca)`
- Add hover effect: `transform: translateY(-2px)` + enhanced shadow
- Add a subtitle line below each value:
  - Total: "↑ {count} this month" (requests created this month)
  - Pending: "Awaiting admin review"
  - Completed: "{percentage}% completion rate"
  - Declined/Rejected: "Review and resubmit"
- Use `tabular-nums` font variant for number alignment
- Make cards clickable: link to `/dashboard/requests` with status filter (e.g. `/dashboard/requests?status=Pending`)

### Activity Feed (`src/components/dashboard/activity-feed.tsx`)

- Add color-coded left border (3px) by status:
  - Pending → amber/yellow
  - Processing → blue
  - Ready → green
  - Completed → green-600 (#16a34a)
  - Rejected/Declined → red
  - Cancelled → gray
- Replace `FileText` icon with status-specific colored icon in a rounded container:
  - Pending/Processing → Clock icon in amber/blue bg
  - Ready/Completed → CheckCircle icon in green bg
  - Rejected → XCircle icon in red bg
  - Cancelled → XCircle icon in gray bg
- Add hover row highlight (`bg-slate-50`)
- Add "View all →" link in the card header pointing to `/dashboard/requests`
- Show subtitle text instead of just "X ago":
  - Pending: "Awaiting admin review"
  - Processing: "Being processed"
  - Ready: "Ready for pickup"
  - Completed: "Completed"
  - Rejected: show `declineReason` or "Incomplete requirements"
  - Cancelled: "Cancelled"
- Include appointments in the feed alongside requests, showing:
  - Calendar icon in blue bg
  - Title: "Appointment: {documentType.name}"
  - Subtitle: "{formatted date} — {timeSlot label}"
  - Badge: "Scheduled"
  - Left border: blue

### Dashboard Data (`src/app/(student)/dashboard/actions.ts`)

- Return `requestsThisMonth` count (requests created this month) for the Total card subtitle
- Calculate completion percentage: `(completed / total) * 100`
- Return appointments for the activity feed alongside requests — include the last 5 appointments sorted by createdAt desc, combined with requests, then sort combined list by createdAt desc and take 5
- Return user's `isProfileComplete` and `isVerified` status for the account status widget

### Dashboard Page (`src/app/(student)/dashboard/page.tsx`)

- Change `Welcome back, {name}` to highlight the name with `text-indigo-600`
- Add avatar (user image from session, fallback to initials avatar) next to the greeting. The notification bell is already in the layout via the existing `notification-bell.tsx` component — not new work.
- Pass appointment data to ActivityFeed
- Pass profile status to a new AccountStatus component or to the page
- Add `tablular-nums` class on stat numbers

### Quick Actions (`src/components/dashboard/quick-actions.tsx`)

- Primary button: indigo-600 background with subtle indigo shadow (`shadow-sm shadow-indigo-200`)
- Outline button: white bg with border, hover border-darken
- Both: rounded-xl, larger padding, `card-hover` hover lift effect
- Update icon: use `Plus` for new request (instead of `FilePlus`), keep `CalendarPlus` for appointment

### Upcoming Appointment (`src/components/dashboard/upcoming-appointment.tsx`)

- Replace simple Calendar icon with a larger icon in an indigo-50 rounded container
- Refine typography spacing

### Balance Card (`src/components/dashboard/balance-card.tsx`)

- Dark gradient background: `linear-gradient(135deg, #1e293b, #334155)`
- White text
- "View Payments" link as a border-only button (`border-white/20 hover:border-white/40`)

### New: Account Status Widget (`src/components/dashboard/account-status.tsx`)

Small card showing:
- Profile status: "Complete" (green check) or "Incomplete" (red X)
- Verification status: "Verified" (green check) or "Pending" (amber clock) or "Declined" (red X)
- Links to `/dashboard/settings/profile` if incomplete

## Files Modified

| File | Changes |
|------|---------|
| `src/app/(student)/dashboard/actions.ts` | Add thisMonthCount, completion %, appointments for feed, profile status |
| `src/app/(student)/dashboard/page.tsx` | Layout with avatar/bell header, updated props, account status widget |
| `src/components/dashboard/stat-card.tsx` | Gradient backgrounds, hover effects, subtitle, clickable |
| `src/components/dashboard/activity-feed.tsx` | Left border, colored icons, view all link, subtitles, appointments |
| `src/components/dashboard/quick-actions.tsx` | Styling, indigo primary, rounded-xl |
| `src/components/dashboard/upcoming-appointment.tsx` | Visual refinements |
| `src/components/dashboard/balance-card.tsx` | Dark gradient background |

## Files Created

| File | Purpose |
|------|---------|
| `src/components/dashboard/account-status.tsx` | Profile + verification status summary |

## Not Modified

- No server actions beyond `getDashboardData`
- No API routes
- No database schema changes
- No new dependencies
