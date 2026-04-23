# TODO - OneClickCredentials Roadmap

---

## 🏠 Dashboard Implementation (Current Sprint)

### Route Structure

- [ ] Create `src/app/(student)/` route group
- [ ] Create `src/app/(admin)/` route group
- [ ] Move existing `/(application)/dashboard/` into `/(student)/dashboard/`
- [ ] Create admin layout: `src/app/(admin)/layout.tsx`
- [ ] Create student layout: `src/app/(student)/layout.tsx`
- [ ] Create admin sidebar component: `src/components/admin-sidebar.tsx`
- [ ] Role check: `user.role === "admin"` in admin layout (server component)
- [ ] Redirect non-admin from `/admin/*` → `/dashboard` with toast

### Student Dashboard (`/dashboard` page)

- [ ] Greeting section ("Welcome back, [Name]")
- [ ] Recent Activity feed — last 5 requests + appointments with status badges
- [ ] Quick Action buttons — "New Request" + "Book Appointment"
- [ ] Stat Cards — Total / Pending / Completed / Declined request counts
- [ ] Upcoming Appointment card — next scheduled appointment details
- [ ] Balance card — sum of pending payments

### Admin Dashboard (`/admin` page)

- [ ] Summary Card: Student Verification (count → links to `/admin/students`)
- [ ] Summary Card: Document Requests (counts by status → links to `/admin/documents`)
- [ ] Summary Card: Appointments (today's count → links to `/admin/appointments`)
- [ ] Summary Card: Payments (pending review count → links to `/admin/payments`)
- [ ] Summary Card: Document Types (active count → links to `/admin/document-types`)
- [ ] Recent Activity Feed — latest system events across all modules

### Admin Sub-Pages (Placeholders — built out later)

- [ ] `/admin/students` — Student verification page (Module 1.3)
- [ ] `/admin/documents` — Document request management (Module 2)
- [ ] `/admin/appointments` — Appointment calendar (Module 3.2)
- [ ] `/admin/payments` — Payment proof review (Module 4)
- [ ] `/admin/document-types` — Document type CRUD (Module 2.1)

### Shared Infrastructure

- [ ] Helper function: `requireAdmin()` — session + role check
- [ ] Helper function: `requireAuth()` — session check only
- [ ] Shared stat card component: `src/components/dashboard/stat-card.tsx`
- [ ] Shared activity feed component: `src/components/dashboard/activity-feed.tsx`

---

## 📐 Dashboard Design Spec

### Architecture Decision

**Separate route groups** with dedicated layouts:

- `/(student)/` — Student-facing pages at `/dashboard/*`
- `/(admin)/` — Admin-only pages at `/admin/*`
- Each has its own `layout.tsx` with its own sidebar provider
- No shared layout between student and admin

### URL Map

| URL                       | Route                                       | Who Sees It             |
| ------------------------- | ------------------------------------------- | ----------------------- |
| `/dashboard`              | `(student)/dashboard/page.tsx`              | All authenticated users |
| `/dashboard/documents`    | `(student)/dashboard/documents/page.tsx`    | Students                |
| `/dashboard/requests`     | `(student)/dashboard/requests/page.tsx`     | Students                |
| `/dashboard/appointments` | `(student)/dashboard/appointments/page.tsx` | Students                |
| `/dashboard/payments`     | `(student)/dashboard/payments/page.tsx`     | Students                |
| `/dashboard/settings`     | `(student)/dashboard/settings/page.tsx`     | Students                |
| `/admin`                  | `(admin)/page.tsx`                          | Admins only             |
| `/admin/students`         | `(admin)/students/page.tsx`                 | Admins only             |
| `/admin/documents`        | `(admin)/documents/page.tsx`                | Admins only             |
| `/admin/appointments`     | `(admin)/appointments/page.tsx`             | Admins only             |
| `/admin/payments`         | `(admin)/payments/page.tsx`                 | Admins only             |
| `/admin/document-types`   | `(admin)/document-types/page.tsx`           | Admins only             |

### Role Protection

- **Student layout** (`(student)/layout.tsx`): Server component. Checks `auth.api.getSession()`. No session → redirect `/auth/sign-in`.
- **Admin layout** (`(admin)/layout.tsx`): Server component. Checks session AND `user.role === "admin"`. No session → `/auth/sign-in`. Session but not admin → `/dashboard` with toast "Access denied."
- **Important:** Any role comparison must only occur after validating the server-side session using `auth.api.getSession()`. The `user.role` value must be treated as trusted only because it was obtained from the verified server session store. Reference the server layouts (`(student)/layout.tsx` and `(admin)/layout.tsx`) for implementation examples. Never use client-supplied role values for access decisions.
- Role check is a simple string comparison. No middleware needed — handled at the server component level.

### Student Dashboard Layout (`/dashboard`)

Order top-to-bottom:

1. **Greeting** — "Welcome back, {name}"
2. **Recent Activity** — Last 5 records combining `DocumentRequest` + `Appointment`, sorted by `createdAt` DESC. Each row shows: icon (📄 or 📅), title, status badge (In Progress / Scheduled / Completed / Declined).
3. **Quick Actions** — Two buttons side by side: "New Request" → `/dashboard/documents/request`, "Book Appointment" → `/dashboard/appointments`.
4. **Stat Cards** — 4-column grid: Total | Pending | Completed | Declined. Each shows count from `DocumentRequest` filtered by `status`.
5. **Upcoming Appointment** — Single card showing next `Appointment` where `status = "Scheduled"` and `date >= now`. Shows date, time slot, and linked document request name.
6. **Balance** — Sum of all `Payment.amount` where `status = "Pending"` across user's requests.

### Admin Dashboard Layout (`/admin`)

Grid of summary cards (responsive: 1 col mobile → 3 col desktop):

| Card                       | Query                                                                                 | Link                    |
| -------------------------- | ------------------------------------------------------------------------------------- | ----------------------- |
| 🎓 Student Verification    | `count(StudentProfile where isVerified=false)`                                        | `/admin/students`       |
| 📄 Document Requests       | `count(DocumentRequest groupBy status)` — shows Pending / Approved / Ready / Declined | `/admin/documents`      |
| 📅 Today's Appointments    | `count(Appointment where date=today AND status=Scheduled)` + next appointment name    | `/admin/appointments`   |
| 💳 Payments Pending Review | `count(Payment where status=Pending)` + `sum(amount where status=Pending)`            | `/admin/payments`       |
| 🏷️ Document Types          | `count(DocumentType where isActive=true)` + `count(isActive=false)`                   | `/admin/document-types` |

Below cards: **Recent Activity Feed** — last 10 events from `DocumentRequest`, `Payment`, `Appointment`, `StudentProfile` changes, sorted by `createdAt` DESC. Each row shows timestamp, icon, description.

### Data Fetching Approach

All dashboard pages are **Server Components**. Data fetched directly via `prisma` calls in the page component. No API routes needed for dashboard data.

```tsx
// Student dashboard example
const requests = await prisma.documentRequest.findMany({
  where: { userId: user.id },
  orderBy: { createdAt: "desc" },
  take: 5,
  include: { documentType: true },
});
```

**Note:** Obtain `user.id` from a validated session (via `auth.api.getSession`). Guard against missing/invalid sessions before calling `prisma.documentRequest.findMany`. Wrap the database call in try/catch to handle query errors. Use loading states and error boundaries for production dashboards.

### Component Tree

```
src/components/dashboard/
├── stat-card.tsx           // Reusable: label, value, icon
├── activity-feed.tsx       // Recent activity list item
├── quick-actions.tsx       // Button pair component
├── upcoming-appointment.tsx
└── balance-card.tsx

src/components/admin/
├── admin-sidebar.tsx       // Dedicated admin nav
├── summary-card.tsx        // Admin dashboard card with count + link
└── activity-feed.tsx       // Admin-specific activity feed
```

### Student Sidebar Items (existing, updated)

| Label        | Icon            | Path                      |
| ------------ | --------------- | ------------------------- |
| Dashboard    | LayoutDashboard | `/dashboard`              |
| Documents    | FileText        | `/dashboard/documents`    |
| Requests     | ClipboardList   | `/dashboard/requests`     |
| Appointments | Calendar        | `/dashboard/appointments` |
| Payments     | CreditCard      | `/dashboard/payments`     |
| Settings     | Settings        | `/dashboard/settings`     |

### Admin Sidebar Items (new)

| Label        | Icon            | Path                    |
| ------------ | --------------- | ----------------------- |
| Dashboard    | LayoutDashboard | `/admin`                |
| Students     | GraduationCap   | `/admin/students`       |
| Documents    | FileText        | `/admin/documents`      |
| Appointments | Calendar        | `/admin/appointments`   |
| Payments     | CreditCard      | `/admin/payments`       |
| Doc Types    | Tag             | `/admin/document-types` |

### Admin Sub-Page Details (Placeholders for Now)

Each admin sub-page starts as a placeholder (`<p>PageName</p>`) matching the existing pattern. Full implementation comes in later sprints per the module roadmap. The dashboard page is the only one with real data — the sub-pages just need routing set up.

---

## ✅ Completed

- ✅ Domain name configuration in Resend
- ✅ Email OTP logic implementation
- ✅ Email OTP address fix

---

## 📋 Feature Overview

**User Journey:**

```
User Signs Up → Email Verification → Login
  ↓
Check StudentProfile Exists?
  ↓
NO → Redirect to Onboarding → Fill Profile → Upload Proof
  ↓
YES → Check isProfileComplete
  ↓
false → Redirect to Onboarding
  ↓
true → Access Dashboard → Request Documents
  ↓
Admin Reviews → Approve/Decline
  ↓
If Approved → Payment Unlocks → Appointment Booking
  ↓
Pickup Documents
```

**Status States:**

```
┌──────────────────────┬─────────────┬──────────────┬──────────────────┐
│ State                │ isComplete  │ isVerified   │ Can Request?     │
├──────────────────────┼─────────────┼──────────────┼──────────────────┤
│ New User             │ false       │ false        │ ❌ No            │
│ Profile Submitted    │ true        │ false        │ ⚠️ Yes (pending) │
│ Verified Student     │ true        │ true         │ ✅ Yes           │
│ Declined Proof       │ true        │ false        │ ⚠️ Yes (retry)   │
└──────────────────────┴─────────────┴──────────────┴──────────────────┘
```

---

## Module 1: Student Profile System

### 1.0 UploadThing Refactoring (New)

**Goal**: Create reusable upload component to replace basic file inputs across the app.

**Why Refactor:**
- Current `ImageUploader.tsx` exists but is unused in `OnboardingStep2.tsx`
- `OnboardingStep2.tsx` uses basic `<Input type="file">` that doesn't upload to UploadThing
- Need upload functionality in multiple places: onboarding, payments, settings
- Repeated code if we implement separately

**Tasks:**

- [ ] **Create reusable upload component**
    - [ ] Create `src/components/upload/upload-with-url.tsx`
    - [ ] Create `src/components/upload/upload-with-url.types.ts` with interfaces:
        - `UploadEndpoint` type from `OurFileRouter`
        - `UploadWithUrlProps` interface (endpoint, field, label, description, existingUrl, onUploadComplete)
    - [ ] Component features:
        - Accepts `endpoint` prop to specify UploadThing route
        - Integrates with TanStack Form via `field` prop
        - Shows file preview (image or link) after upload
        - "Replace" button to re-upload
        - Loading/error states
        - Uses `UploadButton` or `UploadDropzone` from UploadThing

- [ ] **Update UploadThing file router** (`src/app/api/uploadthing/core.ts`)
    - [ ] Add `proofOfEnrollment` endpoint (image + pdf, 5MB limit)
    - [ ] Add `paymentProof` endpoint (image + pdf, 5MB limit)
    - [ ] Add `profileImage` endpoint (image only, 4MB limit, optional)
    - [ ] Add middleware for auth checks (TODO)
    - [ ] Return `{ url: file.ufsUrl }` on upload complete

- [ ] **Update OnboardingStep2** to use new component
    - [ ] Replace basic `<Input type="file">` with `<UploadWithUrl>` component
    - [ ] Pass `endpoint="proofOfEnrollment"` prop
    - [ ] Integrate with TanStack Form field
    - [ ] Update validation schema if needed

- [ ] **Cleanup tasks**
    - [ ] Delete unused `src/app/(student)/dashboard/onboarding/_components/ImageUploader.tsx`
    - [ ] Remove unused import in `src/app/(student)/dashboard/onboarding/page.tsx` (line 11)
    - [ ] Verify no other references to old component

- [ ] **Environment setup**
    - [ ] Get `UPLOADTHING_TOKEN` from https://uploadthing.com/dashboard
    - [ ] Add `UPLOADTHING_TOKEN` to `.env`
    - [ ] Add `UPLOADTHING_TOKEN` to `.env.local`

- [ ] **Future usage preparation**
    - [ ] Document usage in Payments page (`endpoint="paymentProof"`)
    - [ ] Document usage in Settings page (re-upload with `existingUrl` prop)

---

### 1.1 Student Onboarding (In Progress)

**Goal**: Collect student information from first-time users using a 3-step form.

**Steps:**
- [x] Phase 1: Refine Zod schemas & types (Split Step 1/2, Merge for Step 3)
- [ ] Phase 2: Implement main form logic in `page.tsx` (TanStack Form + Step state)
- [ ] Phase 3: Create/Refactor step components:
    - [ ] `OnboardingStep1.tsx` (Personal Info)
    - [ ] `OnboardingStep2.tsx` (Student Info + Proof Upload) - *Use UploadWithUrl component after 1.0*
    - [ ] `OnboardingStep3.tsx` (Review & Confirm)

**Fields** (all required):

- Full name
- Gender
- Birthdate
- Phone number
- LRN (Learner Reference Number)
- Student number
- Course/Program
- Year level
- Proof of enrollment (file upload via UploadThing - *Use reusable component from 1.0*)

**Flow:**

```
User signs up → No StudentProfile exists
  ↓
Redirect to /dashboard/onboarding
  ↓
Fill form (9 fields) + Upload proof of enrollment (via UploadWithUrl)
  ↓
Create StudentProfile record
  ↓
Set: isProfileComplete = true, isVerified = false
  ↓
User can now request documents (pending admin verification)
```

**Technical considerations:**

- Add `StudentProfile` model to Prisma schema
- ~~Integrate UploadThing for file uploads~~ → *Done in section 1.0*
- Create onboarding page/form (redirect if no profile exists)
- Form validation with Zod (all fields required)
- Unique constraint validation: LRN and student number must be unique
- File type restrictions: PDF, JPG, PNG only
- File size limit: max 5MB

### 1.2 Profile Management (Settings)

**Goal**: Allow users to edit their profile and re-upload proof if needed

**Features:**

- View current profile information
- Edit any field (updates don't reset `isProfileComplete`)
- Re-upload proof of enrollment if declined by admin
- View verification status (`isVerified` boolean)
- View decline reason if proof was rejected

**Pages:**

- `/dashboard/settings/profile` - Edit profile page

### 1.3 Admin Verification

**Goal**: Admin reviews and verifies student proof of enrollment

**Admin Verification Flow:**

```
Admin Dashboard → Student Profiles → Review Pending
  ↓
View student info + proof of enrollment image
  ↓
Choose action:
  ├─ ✅ Verify → isVerified = true
  └─ ❌ Decline → isVerified = false + add declineReason
  ↓
If declined:
  - User receives notification
  - Can re-upload proof in Settings
  - Admin reviews again
```

**Admin Actions:**

- ✅ **Verify** → Set `isVerified = true`
- ❌ **Decline** → Set `isVerified = false` + add `declineReason`

**User Actions:**

- View verification status in Settings
- Re-upload proof if declined
- Can still request documents while pending (but may be declined by admin)

**Pages:**

- `/admin/student-profiles` - Admin verification dashboard

**Technical considerations:**

- Add `isVerified` boolean field (default: false)
- Add `declineReason` string field (nullable)
- Admin-only access control
- Notification trigger on status change
- Image preview for proof of enrollment

---

## Module 2: Document Request System

### 2.1 Document Types (Admin)

**Goal**: Admin defines available document types and pricing

**Document Type Schema:**

- Document name (e.g., Transcript, Diploma, Certificate of Enrollment)
- Description
- Price per copy
- Active/inactive status

**Pages:**

- `/admin/document-types` - CRUD for document types

**Technical considerations:**

- Add `DocumentType` model to Prisma
- Admin CRUD operations
- Soft delete (inactive status instead of hard delete)

### 2.2 Document Requests (User)

**Goal**: Students can request academic documents

**Request Flow:**

```
User clicks "Request Document"
  ↓
Check: isProfileComplete = true?
  ↓
NO → Redirect to onboarding
YES → Show request form
  ↓
Select document type + quantity
  ↓
Auto-calculate total price
  ↓
Add special instructions (optional)
  ↓
Submit → Status: Pending
  ↓
Admin reviews request
  ↓
Approve → Status: Approved/Ready
Decline → Status: Declined + declineReason
```

**Document Request Schema:**

- User ID (relation)
- Document type ID (relation)
- Quantity
- Total price (auto-calculated)
- Status: Pending → Approved → Ready → Claimed
- Special instructions/notes
- Decline reason (if declined by admin)

**Pages:**

- `/dashboard/documents` - List available document types (read-only)
- `/dashboard/documents/request` - Request form (requires isProfileComplete = true)
- `/dashboard/documents/history` - Request history with status tracking

**Technical considerations:**

- Add `DocumentRequest` model to Prisma
- Add `declineReason` field for admin declines
- Profile completion check middleware
- Auto-calculate total price on frontend
- Status workflow enforcement

---

## Module 3: Appointment System

### 3.1 Appointment Booking

**Goal**: Students book appointments for document pickup

**Booking Flow:**

```
Request Status = Approved/Ready
  ↓
Appointment booking unlocks
  ↓
Select date + time slot (AM/PM only)
  ↓
Check availability (limit slots per day)
  ↓
Confirm appointment → Status: Scheduled
  ↓
Receive notification (email + in-app)
  ↓
Show up on appointment day → Pick up documents
  ↓
Admin marks as Completed
```

**Appointment Schema:**

- User ID (relation)
- Document request ID (relation)
- Selected date
- Time slot: AM or PM (no specific hour)
- Status: Scheduled → Completed (or Cancelled/No-show)
- Notes (optional)

**Pages:**

- `/dashboard/appointments` - Book appointment (unlocks when request is `Approved`/`Ready`)
- `/dashboard/appointments/my-appointments` - View scheduled appointments

**Technical considerations:**

- Add `Appointment` model to Prisma
- Availability management (admin can block dates)
- Conflict prevention (limit appointments per day)
- Date validation (cannot book past dates)
- Email reminders (optional, via Resend)

### 3.2 Appointment Management (Admin)

**Goal**: Admin manages appointment calendar and slots

**Features:**

- Calendar view of all appointments
- Block specific dates (holidays, closures)
- Set daily slot limits
- Mark appointments as Completed/No-show
- Cancel appointments with reason

**Pages:**

- `/admin/appointments` - Calendar view and management

---

## Module 4: Payment System

### 4.1 Payment Flow

**Goal**: Handle payments for document requests

**Payment Flow:**

```
Timeline: Request creation → Admin approval/mark Ready → User prompt/unlock payment toggle → If user paid cash onsite, prompt "Upload receipt" immediately or after pickup → Admin verifies and marks Paid

1. During Request:
   Payment method defaults to "Cash" (locked, not selectable)

2. After Admin marks as "Approved"/"Ready":
   - User receives notification (bell icon)
   - Payment method toggle unlocks in Payments page
   - Appointment booking unlocks

3. Payment Proof Upload:
   - Online payment: User uploads screenshot/proof (GCash, Maya) BEFORE Admin approval (required for online payments)
   - Cash payment: User uploads receipt photo AFTER paying on-site or after pickup (required for cash payments)
   - Trigger: When Admin marks request status to "Ready" or when appointment status becomes "Completed"
   - Admin verifies uploads and marks payment as "Paid"
```

**Payment Methods:**

- Cash on pickup (default)
- Online payment via Payrex (GCash, Maya, Cards, QRPh)

**Payment Schema:**

- User ID (relation)
- Document request ID (relation)
- Payment method: cash | online
- Reference number (for online payments)
- Amount
- Status: Pending → Paid (or Failed/Refunded)
- Proof image URL (both cash and online)
- Created/Updated timestamps

**Pages:**

- `/dashboard/payments` - Payment page with method toggle (unlocks after approval)
- `/dashboard/payments/history` - Payment history with upload proof
- `/dashboard/payments/upload-proof` - Upload payment proof

**Technical considerations:**

- Add `Payment` model to Prisma
- Payment method toggle (unlocks after request approval)
- UploadThing integration for payment proof uploads
- Admin verification workflow
- Payrex SDK integration for online payments

### 4.2 Payrex Integration

**Payment Gateway**: Payrex

**Why Payrex for Capstone:**

- ✅ No business verification required for test mode
- ✅ Developer-focused platform (built for startups/SMEs)
- ✅ Fast integration (~10 minutes claimed)
- ✅ Supports GCash, Maya, Cards, QRPh (perfect for students)
- ✅ Lower card fees (2.9% vs 3.5% compared to competitors)
- ✅ Modern API with unified Payment Intents
- ✅ Sandbox environment with test payment methods

**Integration Tasks:**

- Install Payrex SDK or use REST API
- Configure test mode API keys (no business verification required for sandbox)
- Implement Payment Intents API for GCash, Maya, Cards
- Handle webhooks for payment status callbacks
- Test with Payrex sandbox (test cards, e-wallets, QRPh)

**For Production:**

- Complete business verification (DTI/SEC, BIR 2303, Valid ID)
- Alternative: Partner with school as merchant of record

---

## Module 5: Notification System

### 5.1 In-App Notifications

**Goal**: Notify users of important status changes

**Notification Triggers:**

- Document request status changed (Pending → Approved → Ready)
- Payment status updated
- Appointment confirmed/reminded
- Admin announcements
- Profile verification status changed

**Notification Schema:**

- User ID (relation)
- Title
- Message
- Type: status_update | payment | appointment | announcement
- Read status (boolean)
- Link (optional, navigate to related page)
- Created timestamp

**Features:**

- Notification bell component in header (with unread count badge)
- Mark as read/unread functionality
- Click notification → navigate to related page
- Real-time updates (polling or WebSocket)
- Email notifications (optional, via Resend)

**Pages:**

- Notification bell component (shared layout)
- `/dashboard/notifications` - Notification list with read/unread toggle

**Technical considerations:**

- Add `Notification` model to Prisma
- Polling mechanism for real-time updates (or WebSocket)
- Unread count badge in header
- Email integration via Resend (optional)

---

## Module 6: Admin Dashboard

### 6.1 Admin Overview

**Goal**: Admin interface for managing all operations

**Admin Pages:**

- `/admin/student-profiles` - Review and verify student profiles
- `/admin/document-types` - CRUD for document types and pricing
- `/admin/requests` - Manage all requests (approve, mark ready, decline)
- `/admin/appointments` - Calendar view, manage slots
- `/admin/payments` - Verify payment proofs
- `/admin/notifications` - Send announcements

**Features:**

- Role-based access control (admin vs user)
- better-auth admin plugin integration
- Bulk actions (approve multiple, batch notifications)
- Search and filter functionality
- Export data (CSV/PDF)

**Technical considerations:**

- Admin role check middleware on all `/admin/*` routes
- better-auth admin plugin for user management
- DataTable components for lists (TanStack Table)
- Batch operations support

---

## 🗂️ Database Schema

```prisma
model User {
  id               String          @id
  name             String
  email            String          @unique
  emailVerified    Boolean         @default(false)
  image            String?
  createdAt        DateTime        @default(now())
  updatedAt        DateTime        @updatedAt
  role             String?
  banned           Boolean?        @default(false)
  banReason        String?
  banExpires       DateTime?
  twoFactorEnabled Boolean?        @default(false)
  studentProfile   StudentProfile?
  documentRequests DocumentRequest[]
  accounts         Account[]
  sessions         Session[]
  twofactors       TwoFactor[]

  @@map("user")
}

model StudentProfile {
  id                    String   @id @default(cuid())
  userId                String   @unique
  user                  User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Student Information (all required)
  gender                String
  birthdate             DateTime
  phoneNumber           String
  lrn                   String   @unique
  studentNumber         String   @unique
  course                String
  yearLevel             Int
  proofOfEnrollmentUrl  String

  // Status Tracking
  isProfileComplete     Boolean  @default(false)  // User completed form
  isVerified            Boolean  @default(false)  // Admin verified proof
  declineReason         String?

  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  @@index([userId])
  @@map("studentProfile")
}

model DocumentType {
  id            String    @id @default(cuid())
  name          String
  description   String?
  price         Decimal
  isActive      Boolean   @default(true)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  requests      DocumentRequest[]

  @@map("documentType")
}

model DocumentRequest {
  id              String   @id @default(cuid())
  userId          String
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  documentTypeId  String
  documentType    DocumentType @relation(fields: [documentTypeId], references: [id])
  quantity        Int
  totalPrice      Decimal
  status          String   // Pending, Approved, Ready, Claimed, Declined
  notes           String?
  declineReason   String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  paymentId       String?  @unique
  payment         Payment? @relation(fields: [paymentId], references: [id])
  appointmentId   String?  @unique
  appointment     Appointment? @relation(fields: [appointmentId], references: [id])

  @@index([userId])
  @@map("documentRequest")
}

model Payment {
  id                String   @id @default(cuid())
  documentRequestId String   @unique
  documentRequest   DocumentRequest @relation(fields: [documentRequestId], references: [id], onDelete: Cascade)
  method            String   // cash, online
  referenceNumber   String?
  amount            Decimal
  status            String   // Pending, Paid, Failed, Refunded
  proofImageUrl     String?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@map("payment")
}

model Appointment {
  id                String   @id @default(cuid())
  documentRequestId String   @unique
  documentRequest   DocumentRequest @relation(fields: [documentRequestId], references: [id], onDelete: Cascade)
  date              DateTime
  timeSlot          String   // AM or PM
  status            String   // Scheduled, Completed, Cancelled, No-show
  notes             String?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@map("appointment")
}

model Notification {
  id          String   @id @default(cuid())
  userId      String
  title       String
  message     String
  type        String   // status_update, payment, appointment, announcement
  read        Boolean  @default(false)
  link        String?  // Optional link to related page
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@map("notification")
}
```

---

## 📁 Pages to Create

### Module 1: Student Profile

- [ ] `/dashboard/onboarding` - Student info form (first-time users)
- [ ] `/dashboard/settings/profile` - Edit student info, view verification status

### Module 2: Documents

- [ ] `/dashboard/documents` - List available document types (read-only view)
- [ ] `/dashboard/documents/request` - Request form (requires isProfileComplete = true)
- [ ] `/dashboard/documents/history` - Request history with status

### Module 3: Appointments

- [ ] `/dashboard/appointments` - Book appointment (unlocks when request is `Approved`/`Ready`)
- [ ] `/dashboard/appointments/my-appointments` - View scheduled appointments

### Module 4: Payments

- [ ] `/dashboard/payments` - Payment page with method toggle (unlocks after approval)
- [ ] `/dashboard/payments/history` - Payment history with upload proof
- [ ] `/dashboard/payments/upload-proof` - Upload payment proof

### Module 5: Notifications

- [ ] Notification bell component in header (shared layout)
- [ ] `/dashboard/notifications` - Notification list with read/unread toggle

### Module 6: Admin

- [ ] `/admin/student-profiles` - Review submitted profiles (verify/decline)
- [ ] `/admin/document-types` - CRUD for document types
- [ ] `/admin/requests` - Manage all requests (approve, mark ready, decline)
- [ ] `/admin/appointments` - Calendar view, manage slots
- [ ] `/admin/payments` - Verify payments
- [ ] `/admin/notifications` - Send announcements

---

## 🔧 Technical Setup

### File Upload Integration

**Decision**: UploadThing

**Why UploadThing over Cloudinary:**

- ✅ Built for Next.js App Router (server actions ready)
- ✅ Better TypeScript types out of the box
- ✅ Simpler pricing (free tier: 10GB storage, unlimited uploads)
- ✅ No need to manage cloud credentials separately
- ✅ Direct upload from client (faster, less server load)

**Configuration:**

- File types: PDF, JPG, PNG (for proofs and documents)
- Max file size: 5MB
- Routes: `/api/uploadthing`

### Role Management

- Roles: `user`, `admin`
- better-auth admin plugin for role-based access control
- Protect all `/admin/*` routes with admin role check
- Middleware for profile completion check on document request routes

### Validation

- Form validation with Zod schemas
- Server-side validation for all API routes
- Unique constraint checks (LRN, student number)
- File type and size validation for uploads

### Payment Integration (Payrex)

- Install `payrex-node` SDK or use REST API
- Test mode API keys (no business verification required)
- Payment Intents API for GCash, Maya, Cards
- Webhook handler for payment status callbacks
- Sandbox testing with test cards and e-wallets

---

## 🎯 Implementation Priority

1. **Student Profile** - Foundation (schema, onboarding, admin verification)
2. **Document Types** - Admin defines available documents
3. **Document Requests** - Core functionality with profile checks
4. **Notification System** - Enables status update alerts
5. **Appointments** - Unlocks when request is `Approved`/`Ready`
6. **Payments** - Payment method toggle + proof upload + Payrex integration
7. **Admin Dashboard** - Manage all operations

---

## 💡 Key Design Decisions

### Student Profile System

**Two-Boolean Status Tracking:**

- `isProfileComplete` (user-controlled): Set to true when user submits form
- `isVerified` (admin-controlled): Set to true when admin approves proof

**Editing Behavior:**

- Users can edit profile after completion
- Editing does NOT reset `isProfileComplete` to false
- Admin must re-verify if proof is re-uploaded

**Document Request Access:**

- Requires `isProfileComplete = true`
- Does NOT require `isVerified = true` (but admin can decline if not verified)

### Payment Flow

- **During request**: Payment method locked to "Cash" (default)
- **After approval**: User can toggle between Cash/Online in Payments page
- **Proof upload**: Both payment types can upload proof (receipt or screenshot)
- **Verification**: Admin marks payment as `Paid` after verifying proof

### Status-Based Unlocking

- Documents/Requests pages: Always visible, actions locked by profile completion
- Appointments: Unlocks when request status = `Approved` or `Ready`
- Payment method toggle: Unlocks when request status = `Approved` or `Ready`
- Payment proof upload: Available after payment method is selected

### Notifications

- Triggered by admin actions (status changes, payment verification, profile verification)
- Bell icon in header with unread count badge
- Click notification → navigate to related page
- Real-time updates via polling (or WebSocket in future)
