# Admin Document Request Processing

## Overview

Add an admin page to view and process student document requests. Currently, students can create requests (status: "Pending") but there's no admin interface to move them through the workflow. This spec adds a unified request queue with a detail dialog and status transition actions.

## Status Flow

```
Pending → Processing → Ready → Completed
                ↘ Rejected
```

| Current Status | Available Actions |
|---------------|------------------|
| Pending | Process, Reject |
| Processing | Mark Ready, Reject |
| Ready | Mark Completed |
| Completed | (none — terminal) |
| Rejected | (none — terminal) |

## New Files

### 1. `/admin/requests/page.tsx` (server component)

Fetches all `DocumentRequest` records with includes for:
- `user.studentProfile` (name, student number, course, year level)
- `documentType` (name, price)
- `payment` (method, status)
- `appointment` (date, time slot)

Passes data down to the client `RequestsManager`. Auth/role guard inherited from the parent admin layout.

### 2. `/admin/requests/RequestsManager.tsx` (client component)

Table-based UI following the same pattern as `/admin/students` page:

- **Search bar** — filters by student name and student number
- **Status filter dropdown** — All, Pending, Processing, Ready, Completed, Rejected
- **Table columns**: Student (name + student number), Document, Quantity, Total Price, Status (badge), Date Requested, Action (inline button)
- **Row click** — opens `RequestDetailDialog`

### 3. `/admin/requests/RequestDetailDialog.tsx` (client component)

Dialog overlaying the table with full request details:

- **Student info**: Name, student number, course, year level
- **Document info**: Type, quantity, total price, notes
- **Timeline**: Dots showing current status and past transitions
- **Action buttons**: Context-sensitive based on current status (Process / Mark Ready / Mark Complete / Reject)
- **Reject flow**: Clicking Reject shows a textarea for the reason, then confirms

### 4. `/admin/requests/actions.ts` (server actions)

| Action | Description | Side Effects |
|--------|-------------|-------------|
| `getAllRequests()` | Fetch all requests with full includes | — |
| `updateRequestStatus(requestId, status)` | Transition to next status | Creates `Notification` for student with title and message |
| `rejectRequest(requestId, reason)` | Set status to "Rejected" | Creates `Notification` for student with rejection reason |

## Notifications

Each status change creates a `Notification` record linked to the student's `StudentProfile`:

| Event | Notification Title | Notification Message |
|-------|-------------------|---------------------|
| Pending → Processing | Request Being Processed | "Your request for [DocumentType] is now being processed." |
| Processing → Ready | Ready for Pickup | "Your [DocumentType] request is ready for pickup." |
| Ready → Completed | Request Completed | "Your [DocumentType] request has been marked as completed." |
| → Rejected | Request Rejected | "Your request for [DocumentType] was rejected. Reason: [reason]" |

## Admin Sidebar Update

Add a "Requests" nav item to the `AdminSidebar` component at `/admin/requests` with a `ClipboardList` icon, placed between "Students" and "Document Types" in the Management group.

## Dependencies

- Uses existing shadcn/ui `Dialog`, `Table`, `Badge`, `Input`, `Select`, `Textarea` components (all already installed)
- `ClipboardList` icon from `lucide-react` (already a dependency, used in student sidebar)

## Files Changed

| File | Action |
|------|--------|
| `src/app/(admin)/admin/requests/page.tsx` | Create |
| `src/app/(admin)/admin/requests/RequestsManager.tsx` | Create |
| `src/app/(admin)/admin/requests/RequestDetailDialog.tsx` | Create |
| `src/app/(admin)/admin/requests/actions.ts` | Create |
| `src/components/admin-sidebar.tsx` | Modify (add Requests nav) |
