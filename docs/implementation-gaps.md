# Implementation Gaps — What's Not Built Yet

> Audit of `todo.md` and the specs/plans against the actual codebase.
> Last updated: 2026-11-27

## 🔴 Not implemented (placeholder / missing entirely)

### 1. Payment system (Module 4) — implemented

- `/dashboard/payments` and `/admin/payments` are implemented.
- `Payment` rows are created with every request.
- Cash receipt upload and admin verification are wired.
- PayMongo Hosted Checkout covers GCash, Maya, cards, and QRPh.
- The webhook verifies signatures and the return page provides a fallback.
- Remaining: automated refunds.

### 2. `/admin/documents` page

- `src/app/(admin)/admin/documents/page.tsx` → `<p>Admin Documents</p>`
- Still linked in the admin sidebar (`Documents` → `/admin/documents`)

### 3. Admin notifications / announcements

- No `/admin/notifications` route
- No admin notification bell (`NotificationBell` is student-scoped only — noted
  as "future spec" in `docs/superpowers/specs/2026-05-21-admin-sidebar-design.md`)

### 4. Email notifications for status changes — implemented

- Resend + React Email templates are wired into document request updates/rejections, student verification, appointment status transitions, and payment events (`Paid`, `Failed`, `Refunded`).
- See [docs/email-notifications.md](./email-notifications.md) for triggers, templates, and env configuration.

## 🟡 Partially implemented

### 5. Appointments (Module 3.2 admin)

- Booking, reschedule, cancel, status transitions: ✅ done
- ❌ No daily slot limits / conflict prevention (only AM/PM + 30-day window)
- ❌ No date blocking (holidays/closures) — no `blockDate`/`blockedDate` model anywhere
- ❌ No calendar view (table + filters only)

### 6. Admin dashboard — implemented

- 7 linked summary cards: total students, pending verification, active
  requests, ready for pickup, today's appointments, payments pending review,
  and active document types.
- Recent Activity feed merges the latest 10 updates across document requests,
  payments, appointments, and student profiles.
- Requests-by-status breakdown retained below the feed.

### 7. Settings / profile re-upload

- Profile editing ✅, `profileImage` upload ✅, decline reason shown ✅
- Proof-of-enrollment re-upload lives on `/dashboard/verification` instead of
  Settings as specced in `docs/superpowers/specs/2026-05-23-student-settings-design.md`

## 🔵 Cleanup / infrastructure

| Item | Status |
|---|---|
| `requireAdmin()` / `requireStudent()` helpers | ✅ `src/lib/auth-guards.ts` (`requireAuth()` not separately added) |
| `error.tsx` / `not-found.tsx` boundaries | ❌ zero in the whole app |
| Loading skeletons | ⚠️ only 3 (`dashboard`, `admin`, `admin/appointments`) — other routes have none |
| `.env.example` (required by AGENTS.md) | ✅ `.env.example` present |
| Export CSV/PDF, bulk/batch actions (Module 6) | ❌ not started |
| Tests | ✅ Vitest configured (`npm test`) |
| `todo.md` accuracy | ⚠️ heavily stale — many `[ ]` items (layouts, dashboards, admin sub-pages) are actually done |

## Suggested priority

1. `/admin/documents` placeholder (or remove it from the sidebar if it's
   redundant with `/admin/requests`)
2. `error.tsx` / `not-found.tsx` boundaries (small, high value)
3. Admin announcements + status-change emails
4. Appointment slot limits and date blocking
5. Refresh `todo.md` to match reality
