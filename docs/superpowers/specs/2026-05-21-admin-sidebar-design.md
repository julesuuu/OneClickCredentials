# Admin Sidebar & Navigation Chrome

## Overview

Add a sidebar navigation and top header bar to the admin section, mirroring the existing student dashboard layout. Currently, admin pages render with no navigation chrome — just a bare `<main>` wrapper. This spec adds the sidebar + header to give admins a consistent navigation experience.

## Components

### 1. AdminSidebar (new)

Location: `src/components/admin-sidebar.tsx`

A client component using shadcn/ui's `Sidebar` system (`collapsible="icon"`, `variant="floating"`), structurally identical to the existing `AppSidebar` but with admin navigation items.

**Header:** Logo + "OneClick Credentials" brand text (same as student sidebar).

**Main navigation items:**

| Item | URL | Icon |
|------|-----|------|
| Dashboard | `/admin` | `LayoutDashboard` |
| Students | `/admin/students` | `GraduationCap` |
| Document Types | `/admin/document-types` | `FileText` |
| Payments | `/admin/payments` | `CreditCard` |
| Appointments | `/admin/appointments` | `Calendar` |
| Documents | `/admin/documents` | `Folder` |

**Legal navigation items** (shared with student sidebar):

| Item | URL | Icon |
|------|-----|------|
| Privacy Policy | `/privacy-policy` | `Lock` |
| Terms of Service | `/terms-of-service` | `Scale` |
| Data Protection | `/data-protection` | `ShieldCheck` |

**Footer:** `UserButton` from `@daveyplate/better-auth-ui`, same behavior as student sidebar (shows full button when expanded, icon only when collapsed).

**Active state:** Highlights the nav item matching the current pathname via `usePathname()`.

### 2. AdminHeader (new)

Location: `src/components/admin-header.tsx`

A client component mirroring the student `DashboardHeader`. Sticky top bar with:

- `SidebarTrigger` (hamburger to toggle collapse)
- Separator
- Breadcrumb (root: "Admin" → current page label)
- Theme toggle
- `UserButton` (icon variant)

**Breadcrumb route label mapping:**

| Segment | Label |
|---------|-------|
| (root) | Admin |
| students | Students |
| document-types | Document Types |
| payments | Payments |
| appointments | Appointments |
| documents | Documents |

### 3. Admin Layout (modify)

Location: `src/app/(admin)/admin/layout.tsx`

Wrap children with the same pattern as the student dashboard layout:

```tsx
<SidebarProvider defaultOpen={true}>
  <AdminSidebar />
  <div className="flex flex-1 flex-col overflow-hidden min-w-0">
    <AdminHeader />
    <main className="flex-1 overflow-auto p-6">{children}</main>
  </div>
</SidebarProvider>
```

The existing auth/role checks remain untouched (redirect unauthenticated to sign-in, non-admin to `/dashboard`).

## Dependencies

- Uses existing shadcn/ui `Sidebar` components (already installed)
- Uses existing `ThemeToggle`, `Breadcrumb`, `Separator` components
- `GraduationCap`, `CreditCard`, `Folder` icons from `lucide-react` (may need to be added to imports; `lucide-react` is already a dependency)

## Files Changed

| File | Action |
|------|--------|
| `src/components/admin-sidebar.tsx` | Create |
| `src/components/admin-header.tsx` | Create |
| `src/app/(admin)/admin/layout.tsx` | Modify |
