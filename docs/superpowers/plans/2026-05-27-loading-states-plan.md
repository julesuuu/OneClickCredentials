# Loading States & Skeletons — Implementation Plan

**Goal:** Add loading states to all pages that lack feedback during data fetching.

**Architecture:** Next.js `loading.tsx` for server pages, shadcn `Skeleton` component for client page loaders.

---

## File Structure

| File | Action |
|------|--------|
| `src/app/(student)/dashboard/loading.tsx` | Create |
| `src/app/(admin)/admin/loading.tsx` | Create |
| `src/app/(student)/dashboard/notifications/page.tsx` | Modify |
| `src/app/(admin)/admin/students/page.tsx` | Modify |
| `src/app/(admin)/admin/requests/RequestsManager.tsx` | Modify |
| `src/app/(admin)/admin/document-types/DocumentTypesManager.tsx` | Modify |

---

### Task 1: Create loading.tsx files

- [ ] **Create `(student)/dashboard/loading.tsx`**

```tsx
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-48" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    </div>
  );
}
```

- [ ] **Create `(admin)/admin/loading.tsx`**

```tsx
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-72 rounded-xl" />
    </div>
  );
}
```

- [ ] **Commit**

```bash
git add src/app/\(student\)/dashboard/loading.tsx src/app/\(admin\)/admin/loading.tsx
git commit -m "feat(loading): add loading.tsx for student dashboard and admin route groups"
```

---

### Task 2: Upgrade client page loaders to skeletons

- [ ] **Upgrade `/dashboard/notifications` loader**

In `src/app/(student)/dashboard/notifications/page.tsx`, replace the inline `"Loading notifications..."` text with skeleton items:

```tsx
import { Skeleton } from "@/components/ui/skeleton";
```

Replace:
```tsx
{isLoading ? (
  <div className="rounded-lg border p-8 text-center text-muted-foreground">
    Loading notifications...
  </div>
) : ...}
```

With:
```tsx
{isLoading ? (
  <div className="divide-y rounded-lg border">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="px-4 py-3 flex items-start gap-3">
        <Skeleton className="mt-1.5 h-2.5 w-2.5 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-3 w-72" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
    ))}
  </div>
) : ...}
```

- [ ] **Upgrade `/admin/students` loader**

In `src/app/(admin)/admin/students/page.tsx`, replace `"Loading students..."` with skeleton table:

```tsx
import { Skeleton } from "@/components/ui/skeleton";
```

Replace the loading block with skeleton rows.

- [ ] **Upgrade `/admin/requests` loader**

In `RequestsManager.tsx`, replace `"Loading requests..."` with skeleton table.

- [ ] **Upgrade `/admin/document-types` loader**

In `DocumentTypesManager.tsx`, replace `"Loading..."` with skeleton table.

- [ ] **Commit**

```bash
git add src/app/\(student\)/dashboard/notifications/page.tsx src/app/\(admin\)/admin/students/page.tsx src/app/\(admin\)/admin/requests/RequestsManager.tsx src/app/\(admin\)/admin/document-types/DocumentTypesManager.tsx
git commit -m "feat(loading): replace text loaders with skeleton components in client pages"
```
