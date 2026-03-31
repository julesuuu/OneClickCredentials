# TODO - OneClickCredentials Roadmap

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

### 1.1 Student Onboarding

**Goal**: Collect student information from first-time users

**Fields** (all required):
- Full name
- Gender
- Birthdate
- Phone number
- LRN (Learner Reference Number)
- Student number
- Course/Program
- Year level
- Proof of enrollment (file upload via UploadThing)

**Flow:**
```
User signs up → No StudentProfile exists
  ↓
Redirect to /dashboard/onboarding
  ↓
Fill form (9 fields) + Upload proof of enrollment
  ↓
Create StudentProfile record
  ↓
Set: isProfileComplete = true, isVerified = false
  ↓
User can now request documents (pending admin verification)
```

**Technical considerations:**
- Add `StudentProfile` model to Prisma schema
- Integrate UploadThing for file uploads
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
1. During Request:
   Payment method defaults to "Cash" (locked, not selectable)

2. After Admin marks as "Approved"/"Ready":
   - User receives notification (bell icon)
   - Payment method toggle unlocks in Payments page
   - Appointment booking unlocks

3. Payment Proof Upload:
   - Online payment: User uploads screenshot/proof (GCash, Maya)
   - Cash payment: User uploads receipt photo after paying on-site
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
model StudentProfile {
  id                    String   @id @default(cuid())
  userId                String   @unique
  user                  User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Student Information (all required)
  gender                String
  birthdate             DateTime
  phoneNumber           String
  lrn                   String
  studentNumber         String
  course                String
  yearLevel             Int
  proofOfEnrollmentUrl  String
  
  // Status Tracking
  isProfileComplete     Boolean  @default(false)  // User completed form
  isVerified            Boolean  @default(false)  // Admin verified proof
  
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
  
  @@index([userId])
  @@unique([lrn])
  @@unique([studentNumber])
}

model DocumentType {
  id          String   @id @default(cuid())
  name        String
  description String?
  price       Decimal
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  requests    DocumentRequest[]
}

model DocumentRequest {
  id              String   @id @default(cuid())
  userId          String
  documentTypeId  String
  documentType    DocumentType @relation(fields: [documentTypeId], references: [id])
  quantity        Int
  totalPrice      Decimal
  status          String   // Pending, Approved, Ready, Claimed, Declined
  notes           String?
  declineReason   String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  payment         Payment?
  appointment     Appointment?
}

model Appointment {
  id              String   @id @default(cuid())
  userId          String
  documentRequestId String? @unique
  documentRequest DocumentRequest? @relation(fields: [documentRequestId], references: [id])
  date            DateTime
  timeSlot        String   // AM or PM
  status          String   // Scheduled, Completed, Cancelled, No-show
  notes           String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model Payment {
  id                String   @id @default(cuid())
  userId            String
  documentRequestId String? @unique
  documentRequest   DocumentRequest? @relation(fields: [documentRequestId], references: [id])
  method            String   // cash, online
  referenceNumber   String?
  amount            Decimal
  status            String   // Pending, Paid, Failed, Refunded
  proofImageUrl     String?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
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
