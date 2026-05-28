# UploadThing Refinements — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add profile image upload to the settings page and clean up dead code in the UploadThing integration.

**Architecture:** Modify existing components to remove unused props, fix image rendering, and add profile image upload with `UploadWithUrl` using the existing `profileImage` endpoint.

**Tech Stack:** Next.js 16, UploadThing, @uploadthing/react, next/image

---

## File Structure

| File | Action | Responsibility |
|------|--------|---------------|
| `src/components/upload/upload-with-url.types.ts` | Modify | Remove `studentProfileId` and `paymentId` props |
| `src/components/upload/upload-with-url.tsx` | Modify | Remove destructured unused props |
| `src/app/(student)/dashboard/onboarding/_components/OnboardingStep2.tsx` | Modify | Remove `studentProfileId` prop, fix `<img>` → `<Image>` |
| `src/app/(student)/dashboard/settings/page.tsx` | Modify | Add profile header with avatar upload |
| `src/app/(student)/dashboard/settings/actions.ts` | Create | Server action to update user image |

---

### Task 1: Remove unused props from UploadWithUrl

**Files:**
- Modify: `src/components/upload/upload-with-url.types.ts`
- Modify: `src/components/upload/upload-with-url.tsx`

- [ ] **Remove `studentProfileId` and `paymentId` from types**

In `upload-with-url.types.ts`, remove `studentProfileId` and `paymentId` from the `UploadWithUrlProps` interface.

```ts
export interface UploadWithUrlProps {
  endpoint: UploadEndpoint;
  field: {
    state: {
      value: string;
    };
    handleChange: (value: string) => void;
  };
  label?: string;
  description?: React.ReactNode;
  existingUrl?: string;
  onUploadComplete?: (url: string) => void;
  onUploadIdComplete?: (uploadId: string) => void;
  onPreview?: (url: string) => void;
  className?: string;
}
```

- [ ] **Remove unused props from component**

In `upload-with-url.tsx`, remove `studentProfileId` and `paymentId` from the destructured props.

```tsx
export function UploadWithUrl({
  endpoint,
  field,
  label,
  description,
  existingUrl,
  onUploadComplete,
  onUploadIdComplete,
  onPreview,
  className,
}: UploadWithUrlProps) {
```

- [ ] **Commit**

```bash
git add src/components/upload/upload-with-url.types.ts src/components/upload/upload-with-url.tsx
git commit -m "refactor(upload): remove unused studentProfileId and paymentId props from UploadWithUrl"
```

---

### Task 2: Fix OnboardingStep2 — remove unused prop and fix image

**Files:**
- Modify: `src/app/(student)/dashboard/onboarding/_components/OnboardingStep2.tsx`

- [ ] **Remove `studentProfileId` prop and fix `<img>` → `<Image>`**

Remove the `studentProfileId` prop from the `OnboardingStep2` component (both the interface and the `UploadWithUrl` call site). Replace `<img>` with Next.js `<Image unoptimized>` in the preview dialog.

Changes in `OnboardingStep2.tsx`:

1. Remove `studentProfileId` from the `OnboardingStep2Props` interface
2. Remove `studentProfileId` from the destructured props
3. Remove `studentProfileId={studentProfileId}` from the `UploadWithUrl` usage
4. Add `import Image from "next/image";` at the top
5. Replace:
```tsx
<img
  src={previewUrl}
  alt="Proof of Enrollment"
  className="w-full h-auto object-contain max-h-[70vh]"
/>
```
with:
```tsx
<Image
  src={previewUrl}
  alt="Proof of Enrollment"
  width={800}
  height={600}
  className="w-full h-auto object-contain max-h-[70vh]"
  unoptimized
/>
```

- [ ] **Commit**

```bash
git add src/app/\(student\)/dashboard/onboarding/_components/OnboardingStep2.tsx
git commit -m "refactor(onboarding): remove unused studentProfileId prop and fix img to Image"
```

---

### Task 3: Add profile image upload to settings page

**Files:**
- Modify: `src/app/(student)/dashboard/settings/page.tsx`
- Create: `src/app/(student)/dashboard/settings/actions.ts`

- [ ] **Create server action for updating user image**

Create `src/app/(student)/dashboard/settings/actions.ts`:

```ts
"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function updateProfileImage(imageUrl: string) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { image: imageUrl },
  });

  return { success: true };
}
```

- [ ] **Add profile header to settings page**

Read the current settings page at `src/app/(student)/dashboard/settings/page.tsx`. Add a profile header section at the top with:
- Current avatar (user.image as round image, or initials fallback from user.name)
- User name and email
- `UploadWithUrl` with `endpoint="profileImage"` (hidden until user clicks avatar area)

The component will need to be converted to a client component (or the profile header extracted as a client component) since `UploadWithUrl` is a client component.

Example structure to add at the top of the page:

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { UploadWithUrl } from "@/components/upload/upload-with-url";
import { updateProfileImage } from "./actions";

interface ProfileHeaderProps {
  name: string;
  email: string;
  image: string | null;
}

function ProfileHeader({ name, email, image }: ProfileHeaderProps) {
  const router = useRouter();
  const [showUpload, setShowUpload] = useState(false);
  const initials = name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex items-center gap-6 pb-6 mb-6 border-b">
      <div
        className="relative size-20 shrink-0 cursor-pointer group"
        onClick={() => setShowUpload(!showUpload)}
      >
        {image ? (
          <Image
            src={image}
            alt={name ?? "Avatar"}
            width={80}
            height={80}
            className="size-20 rounded-full object-cover"
            unoptimized
          />
        ) : (
          <div className="size-20 rounded-full bg-primary/10 flex items-center justify-center text-xl font-bold text-primary">
            {initials}
          </div>
        )}
        <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-xs text-white font-medium">Change</span>
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <h2 className="text-xl font-semibold truncate">{name}</h2>
        <p className="text-sm text-muted-foreground truncate">{email}</p>
      </div>
      {showUpload && (
        <div className="absolute top-24 left-0 z-10 w-64">
          <UploadWithUrl
            endpoint="profileImage"
            field={{
              state: { value: "" },
              handleChange: () => {},
            }}
            onUploadComplete={async (url) => {
              await updateProfileImage(url);
              setShowUpload(false);
              router.refresh();
            }}
          />
        </div>
      )}
    </div>
  );
}
```

Integrate this header into the settings page, passing the user's name, email, and image from the server component data.

- [ ] **Commit**

```bash
git add src/app/\(student\)/dashboard/settings/actions.ts src/app/\(student\)/dashboard/settings/page.tsx
git commit -m "feat(settings): add profile image upload with avatar display"
```

---

## Self-Review

**1. Spec coverage:**
- [x] Remove unused `studentProfileId` and `paymentId` from UploadWithUrl — Task 1
- [x] Fix `<img>` → `<Image>` in onboarding preview — Task 2
- [x] Remove `studentProfileId` prop from OnboardingStep2 — Task 2
- [x] Add profile image upload to settings page — Task 3

**2. Placeholder scan:** No TODOs, TBDs, or vague instructions. All steps contain complete code.

**3. Type consistency:** `updateProfileImage` server action signature matches the call site. Component props match after removal in Task 1.
