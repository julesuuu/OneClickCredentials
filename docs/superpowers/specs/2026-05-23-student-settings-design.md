# Student Settings / Profile Page

## Overview

Replace the placeholder profile settings page with a form that lets students view and edit their profile information. Read-only fields (LRN, student number) are displayed but disabled. The page follows the existing pattern of server-side data fetching with a client-side form.

## Layout

- **Profile header**: Avatar initials, full name, email, verification badge, student number
- **Editable fields** (2-column grid): Full Name, Phone Number, Gender (select), Birth Date (date picker), Course (select), Year Level (select)
- **Read-only fields**: LRN, Student Number (disabled inputs)
- **Actions**: Cancel and Save Changes buttons

## Fields

| Field | Type | Editable |
|-------|------|----------|
| Full Name | Text input | Yes |
| Phone Number | Text input (PH format) | Yes |
| Gender | Select (Male/Female/Non-Binary/Prefer Not to Say/Other) | Yes |
| Birth Date | Date input | Yes |
| Course | Select (BSIT/BSHM/BSBA/BEED/BSED/BSCRIM) | Yes |
| Year Level | Select (First-Fifth Year/ Graduate/Irregular) | Yes |
| LRN | Text input (disabled) | No |
| Student Number | Text input (disabled) | No |

## Implementation

### Files

| File | Action |
|------|--------|
| `src/app/(student)/dashboard/settings/profile/actions.ts` | Create |
| `src/app/(student)/dashboard/settings/profile/ProfileForm.tsx` | Create |
| `src/app/(student)/dashboard/settings/profile/page.tsx` | Modify |

### Server Actions (`actions.ts`)

- `getProfile()` — Fetch the student's `StudentProfile` + user email
- `updateProfile(formData)` — Validate and update editable fields (name, phone, gender, birthDate, course, yearLevel). Fields like LRN and student number are excluded from updates.

### Components

**page.tsx** — Server component that calls `getProfile()`, renders `ProfileForm` with initial data.

**ProfileForm.tsx** — Client component with form fields, Zod validation (reuse schemas from onboarding), and server action submission. Shows toast on success/error.

## Dependencies

- Reuses Zod schemas from `@/app/(student)/dashboard/onboarding/types.ts`
- Reuses course/year/gender options from `@/app/(student)/dashboard/onboarding/data.ts`
- Uses existing `Input`, `Select`, `Button`, `Card`, `Badge` components
- `sonner` for toast notifications
