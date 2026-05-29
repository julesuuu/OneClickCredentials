# Loading States & Skeletons

## Overview

Add loading states to all pages that currently have zero feedback during data fetching. Use Next.js `loading.tsx` for server component pages and upgrade existing text loaders to skeleton components in client pages.

## loading.tsx Files

Create at route segment level — covers all child routes on initial/hard navigation:

**`src/app/(student)/dashboard/loading.tsx`** — page-level skeleton with:
- Heading placeholder (2 lines, wider then narrower)
- Card grid placeholders (3 stat card shapes)
- Content area placeholder (wide block)

**`src/app/(admin)/admin/loading.tsx`** — admin dashboard skeleton with:
- Heading placeholder
- Stat card row placeholders (4 cards)
- Content table placeholder

## Client Page Upgrades

Replace text loading indicators with `Skeleton` components in:

| Page | Current | Replace with |
|------|---------|-------------|
| `/dashboard/notifications` | "Loading notifications..." | 4 skeleton notification list items |
| `/admin/students` | "Loading students..." | 5 skeleton table rows (avatar + 4 columns) |
| `/admin/requests` | "Loading requests..." | 5 skeleton table rows (4 columns) |
| `/admin/document-types` | "Loading..." | 5 skeleton table rows (3 columns + action buttons) |

## Files

| File | Action |
|------|--------|
| `src/app/(student)/dashboard/loading.tsx` | Create |
| `src/app/(admin)/admin/loading.tsx` | Create |
| `src/app/(student)/dashboard/notifications/page.tsx` | Modify — skeleton loader |
| `src/app/(admin)/admin/students/page.tsx` | Modify — skeleton loader |
| Admin requests page (client component) | Modify — skeleton loader |
| Admin document-types page (client component) | Modify — skeleton loader |

## Dependencies

- Existing `Skeleton` component from `@/components/ui/skeleton` (shadcn/ui)
