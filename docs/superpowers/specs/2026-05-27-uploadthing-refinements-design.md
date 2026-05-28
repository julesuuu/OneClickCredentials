# UploadThing Refinements

## Overview

Add a profile image upload to the settings page and clean up dead code in the existing UploadThing integration.

## Profile Image Upload

**Location**: Top of `/dashboard/settings`, before the editable form fields — a profile header section showing the current avatar (or initials fallback), name, email, and an upload button.

**Flow**: User clicks upload → selects image → UploadThing uploads → URL saved to `user.image` → header/user button updates immediately (no page refresh needed since the image is served from the URL).

**Files**:
| File | Action |
|------|--------|
| `src/app/(student)/dashboard/settings/page.tsx` | Modify — add profile header with avatar and upload |
| `src/lib/actions/settings.ts` | Create — server action to update user image |

**Implementation details**:
- Use `UploadWithUrl` with `endpoint="profileImage"`
- On upload complete, call a server action to update `user.image` with the returned URL
- Show current image as a round avatar, or fallback to initials
- Upload button appears on hover/click of the avatar area

## Cleanup

### Remove unused props from UploadWithUrl

`studentProfileId` and `paymentId` are destructured but never referenced in the component body or used by the UploadThing button. The middleware handles auth lookup independently.

**Files**:
| File | Action |
|------|--------|
| `src/components/upload/upload-with-url.types.ts` | Modify — remove `studentProfileId` and `paymentId` from props |
| `src/components/upload/upload-with-url.tsx` | Modify — remove destructured props |
| `src/app/(student)/dashboard/onboarding/_components/OnboardingStep2.tsx` | Modify — remove `studentProfileId` prop |

### Fix onboarding preview image

The preview dialog in OnboardingStep2 uses `<img>` for image previews. Replace with Next.js `<Image>` with `unoptimized` (for external URLs).

**Files**:
| File | Action |
|------|--------|
| `src/app/(student)/dashboard/onboarding/_components/OnboardingStep2.tsx` | Modify — replace `<img>` with `<Image>` |

## Dependencies

- `next/image` (already used in codebase)
- `@uploadthing/react` (already installed)
- Existing `UploadWithUrl` component
