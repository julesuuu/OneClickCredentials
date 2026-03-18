# Sidebar on All Authenticated Pages - Design

## Problem

The sidebar currently only appears in the `(application)` route group. Legal pages (`/terms-of-service`, `/privacy-policy`, `/data-protection`) and account pages (`/account/*`) lack the sidebar when users are signed in.

## Solution

Move sidebar from `(application)/layout.tsx` to the root `layout.tsx`, wrapped in `<SignedIn>` from better-auth-ui. This ensures:

- Sidebar appears on all pages when authenticated
- Sidebar hidden when not authenticated (e.g., on auth pages)
- Single source of truth in root layout

## Changes

### 1. Root `src/app/layout.tsx`

Add sidebar components. Note: `<SidebarTrigger>` must be inside `<SignedIn>` so it only renders when sidebar is present.

```tsx
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { SignedIn } from "@daveyplate/better-auth-ui";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider ...>
          <SidebarProvider>
            <SignedIn>
              <AppSidebar />
              <SidebarTrigger />
            </SignedIn>
            <main>{children}</main>
          </SidebarProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
```

### 2. Remove from `src/app/(application)/layout.tsx`

Delete sidebar-related imports and components, keeping only:

```tsx
export default function Layout({ children }: { children: React.ReactNode }) {
  return <main>{children}</main>;
}
```

### 3. PublicHeader already handles signed-in state

The `<PublicHeader>` component already wraps content in `<SignedOut>`, so it auto-hides when signed in. No changes needed for legal pages.

## Notes

- `<SidebarTrigger>` is placed inside `<SignedIn>` but outside `<main>` - this matches the current `(application)/layout.tsx` behavior where the trigger sits alongside the sidebar.
- Account pages (`/account/*`) don't have their own layout, so they'll inherit the root layout with sidebar when signed in.
- The `SidebarTrigger` appears everywhere. Users can collapse/expand the sidebar on any authenticated page.
- Auth pages (`/sign-in`, `/sign-up`) naturally won't show the sidebar since users aren't signed in there.
- The sidebar's navigation links already handle routing between sections.
