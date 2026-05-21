# Admin Sidebar & Navigation Chrome

## Overview

Add a sidebar navigation and top header bar to the admin section, mirroring the existing student dashboard layout. Currently, admin pages render with no navigation chrome — just a bare `<main>` wrapper. This spec adds the sidebar + header to give admins a consistent navigation experience.

## Components

### 1. AdminSidebar (new)

Location: `src/components/admin-sidebar.tsx`

A client component using shadcn/ui's `Sidebar` system (`collapsible="icon"`, `variant="floating"`), structurally identical to the existing `AppSidebar` but with admin navigation items.

**Imports needed:**
- `usePathname` from `next/navigation`
- `useSidebar` from `@/components/ui/sidebar` (for UserButton sizing)
- `SignedIn`, `UserButton` from `@daveyplate/better-auth-ui` (but NOT `RedirectToSignIn` — the admin layout already has a server-side auth guard, so it's not needed)
- Sidebar subcomponents from `@/components/ui/sidebar`
- Icons from `lucide-react`: `LayoutDashboard`, `GraduationCap`, `FileText`, `CreditCard`, `Calendar`, `Folder`, `Lock`, `Scale`, `ShieldCheck`
- `Image` from `next/image`, `Link` from `next/link`

**Header:** Logo + "OneClick Credentials" brand text (same as student sidebar).

**SidebarGroup label:** Main nav items are grouped under label `"Management"`. Legal nav items are grouped under label `"Legal"` (matching the student sidebar).

**Main navigation items (group: "Management"):**

| Item | URL | Icon |
|------|-----|------|
| Dashboard | `/admin` | `LayoutDashboard` |
| Students | `/admin/students` | `GraduationCap` |
| Document Types | `/admin/document-types` | `FileText` |
| Payments | `/admin/payments` | `CreditCard` |
| Appointments | `/admin/appointments` | `Calendar` |
| Documents | `/admin/documents` | `Folder` |

**Legal navigation items (group: "Legal"):**

| Item | URL | Icon |
|------|-----|------|
| Privacy Policy | `/privacy-policy` | `Lock` |
| Terms of Service | `/terms-of-service` | `Scale` |
| Data Protection | `/data-protection` | `ShieldCheck` |

**Footer:** `UserButton` from `@daveyplate/better-auth-ui`, sized based on sidebar collapse state via `useSidebar()` (`size={isCollapsed ? "icon" : "default"}`), matching the student sidebar behavior.

**Active state:** Uses strict equality (`pathname === item.url`) via `usePathname()`, matching the student sidebar pattern. `/admin` matches only the Dashboard item; sub-routes like `/admin/students` match their specific item.

### 2. AdminHeader (new)

Location: `src/components/admin-header.tsx`

A client component mirroring the student `DashboardHeader`. Sticky top bar with:

- `SidebarTrigger` (hamburger to toggle collapse)
- Separator
- Breadcrumb (root: "Admin" → current page label)
- Theme toggle
- `UserButton` (icon variant)

**Note:** `NotificationBell` is deliberately omitted. The existing `NotificationBell` fetches student-scoped notifications. Admin notifications are not yet implemented and can be added in a future spec.

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
- New icon imports from `lucide-react`: `GraduationCap`, `CreditCard`, `Folder` (already installed as a dependency)

## Files Changed

| File | Action |
|------|--------|
| `src/components/admin-sidebar.tsx` | Create |
| `src/components/admin-header.tsx` | Create |
| `src/app/(admin)/admin/layout.tsx` | Modify |
