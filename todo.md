# TODO - OneClickCredentials Roadmap

## ✅ Completed

- ✅ Domain name configuration in Resend
- ✅ Email OTP logic implementation
- ✅ Email OTP address fix

---

## 📋 Pending Features

### 1. Student Information Onboarding

**Goal**: Allow users with "user" role to submit their student information

**Fields to collect**:

- Full name
- Gender
- Birthdate
- Phone number
- LRN (Learner Reference Number)
- Student number
- Course/Program
- Year level
- Proof of enrollment (file upload)

**Technical considerations**:

- Add `StudentProfile` model to Prisma schema
- Integrate Cloudinary or UploadThing for file uploads
- Create onboarding page/form (redirect if no profile exists)
- Admin view for reviewing submitted profiles
- Validation: LRN/student number uniqueness

---

### 2. Document Request System

**Goal**: Allow students to request academic documents

**Document Request Schema**:

- Document type (Transcript, Diploma, Certificate of Enrollment, etc.)
- Price per document
- Number of copies
- Total price calculation
- Special instructions/notes
- Status tracking (Pending, Processing, Ready, Claimed)

**Technical considerations**:

- Add `DocumentType` model (name, price, description)
- Add `DocumentRequest` model (user, documentType, quantity, status, totalPrice)
- Admin CRUD for document types and pricing
- User view: request form + request history

---

### 3. Appointment Scheduling

**Goal**: Allow students to book appointments for document pickup

**Appointment Schema**:

- Selected date
- Time slot (AM/PM only - no specific hour)
- Related document request(s)
- Status (Scheduled, Completed, Cancelled, No-show)
- Notes

**Technical considerations**:

- Add `Appointment` model to Prisma
- Availability management (admin can block dates)
- Conflict prevention (limit slots per day)
- Calendar view for admin
- User view: booking form + appointment history
- **Unlocks when request status is `Approved`/`Ready`**

---

### 4. Payment System

**Goal**: Handle payments for document requests

**Payment Flow**:

1. **During Request**: Payment method defaults to "Cash" (locked, not selectable)
2. **After Admin marks as `Approved`/`Ready`**:
   - User receives notification (bell icon)
   - Payment method toggle unlocks in Payments page
   - Appointment booking unlocks
3. **Payment Proof Upload**:
   - **Online payment**: User uploads screenshot/proof (GCash, PayMaya, bank transfer)
   - **Cash payment**: User uploads receipt photo after paying on-site
   - Admin verifies uploads and marks payment as `Paid`

**Payment Options**:

- Cash on pickup
- Online payment (GCash, PayMaya, bank transfer, etc.)

**Payment Schema**:

- Payment reference number (for online payments)
- Payment method (cash/online) - toggleable after approval
- Amount
- Status (Pending, Paid, Failed, Refunded)
- Proof image upload (both cash and online)
- Linked document request(s)

**Technical considerations**:

- Add `Payment` model to Prisma
- Payment page with toggle for payment method (unlocks after approval)
- Upload functionality for payment proof (both methods)
- Admin verification workflow
- Notification system for status changes
- **Payrex Integration**:
  - Install Payrex SDK or use REST API
  - Configure test mode API keys (no business verification required for sandbox)
  - Implement Payment Intents API for GCash, Maya, Cards
  - Handle webhooks for payment status callbacks
  - Test with Payrex sandbox (test cards, e-wallets, QRPh)
  - **For production**: Complete business verification (DTI/SEC, BIR 2303, Valid ID)
  - Alternative: Partner with school as merchant of record

**Payment Gateway Decision**: Payrex

**Why Payrex for Capstone**:

- ✅ No business verification required for test mode (can test while completing KYC)
- ✅ Developer-focused platform (built for startups/SMEs)
- ✅ Fast integration (~10 minutes claimed)
- ✅ Supports GCash, Maya, Cards, QRPh (perfect for students)
- ✅ Lower card fees (2.9% vs 3.5% compared to Xendit/PayMongo)
- ✅ Modern API with unified Payment Intents
- ✅ Sandbox environment with test payment methods
- ⚠️ Newer platform (launched 2023) but well-funded and growing

**Best for**: Capstone projects, student developers, startups testing payment flows

---

### 5. Notification System

**Goal**: Notify users of important status changes

**Notification Triggers**:

- Document request status changed (Pending → Approved → Ready)
- Payment status updated
- Appointment confirmed/reminded
- Admin announcements

**Technical considerations**:

- Add `Notification` model to Prisma
- Notification bell component in header (with unread count badge)
- Real-time updates (polling or WebSocket)
- Mark as read/unread functionality
- Click notification → navigate to related page
- Email notifications (optional, via Resend)

---

### 6. Admin Dashboard (Future)

**Goal**: Admin interface for managing all operations

**Admin Pages**:

- [ ] `/admin/student-profiles` - Review submitted profiles
- [ ] `/admin/document-types` - CRUD for document types and pricing
- [ ] `/admin/requests` - Manage all requests (approve, mark ready)
- [ ] `/admin/appointments` - Calendar view, manage slots
- [ ] `/admin/payments` - Verify payment proofs
- [ ] `/admin/notifications` - Send announcements

**Technical considerations**:

- Role-based access control (admin vs user)
- better-auth admin plugin integration
- Bulk actions (approve multiple, batch notifications)

---

## 🗂️ Database Schema Changes Needed

```prisma
model StudentProfile {
  id              String   @id @default(cuid())
  userId          String   @unique
  // user info fields
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  user            User     @relation(fields: [userId], references: [id])
}

model DocumentType {
  id          String   @id @default(cuid())
  name        String
  description String?
  price       Decimal
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model DocumentRequest {
  id              String   @id @default(cuid())
  userId          String
  documentTypeId  String
  quantity        Int
  totalPrice      Decimal
  status          String   // Pending, Approved, Ready, Claimed
  notes           String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model Appointment {
  id              String   @id @default(cuid())
  userId          String
  date            DateTime
  timeSlot        String   // AM or PM
  status          String   // Scheduled, Completed, Cancelled, No-show
  notes           String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model Payment {
  id              String   @id @default(cuid())
  userId          String
  documentRequestId String?
  method          String   // cash, online
  referenceNumber String?
  amount          Decimal
  status          String   // Pending, Paid, Failed, Refunded
  proofImageUrl   String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model Notification {
  id          String   @id @default(cuid())
  userId      String
  title       String
  message     String
  type        String   // status_update, payment, appointment, etc.
  read        Boolean  @default(false)
  link        String?  // Optional link to related page
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

---

## 📁 Pages to Create

### Student Onboarding

- [ ] `/dashboard/onboarding` - Student info form (first-time users)
- [ ] `/dashboard/settings/profile` - Edit student info

### Documents

- [ ] `/dashboard/documents` - List available document types (read-only view)
- [ ] `/dashboard/documents/request` - Request form (payment defaults to Cash)
- [ ] `/dashboard/documents/history` - Request history with status

### Appointments

- [ ] `/dashboard/appointments` - Book appointment (unlocks when request is `Approved`/`Ready`)
- [ ] `/dashboard/appointments/my-appointments` - View scheduled appointments

### Payments

- [ ] `/dashboard/payments` - Payment page with method toggle (unlocks after approval)
- [ ] `/dashboard/payments/history` - Payment history with upload proof
- [ ] `/dashboard/payments/upload-proof` - Upload payment proof (cash receipt or online screenshot)

### Notifications

- [ ] Notification bell component in header (shared layout)
- [ ] `/dashboard/notifications` - Notification list with read/unread toggle

### Admin Pages (future)

- [ ] `/admin/student-profiles` - Review submitted profiles
- [ ] `/admin/document-types` - CRUD for document types
- [ ] `/admin/requests` - Manage all requests (approve, mark ready)
- [ ] `/admin/appointments` - Calendar view
- [ ] `/admin/payments` - Verify payments
- [ ] `/admin/notifications` - Send announcements

---

## 🔧 Technical Setup

### File Upload Integration

**Decision**: UploadThing (Recommended for Next.js)

**Why UploadThing over Cloudinary**:

- ✅ Built for Next.js App Router (server actions ready)
- ✅ Better TypeScript types out of the box
- ✅ Simpler pricing (free tier: 10GB storage, unlimited uploads)
- ✅ No need to manage cloud credentials separately
- ✅ Direct upload from client (faster, less server load)

**Cloudinary Alternative**:

- More image transformation features
- Better for global CDN
- Free tier: 25GB storage, 25GB bandwidth/month

**Tasks**:

- [ ] Install `uploadthing` package
- [ ] Configure upload route handler
- [ ] Create reusable upload component
- [ ] Set file type restrictions (PDF, JPG, PNG for proofs)
- [ ] Add file size limits (max 5MB for documents)

### Role Management

- [ ] Define roles: `user`, `admin`
- [ ] Add role-based access control
- [ ] Protect admin routes

### Validation

- [ ] Form validation with Zod
- [ ] Server-side validation
- [ ] Unique constraint checks (LRN, student number)

---

## 🎯 Implementation Priority

1. **Student Profile** - Foundation for all other features
2. **Document Types** - Admin can define what's available
3. **Document Requests** - Core functionality
4. **Notification System** - Enables status update alerts
5. **Appointments** - Unlocks when request is `Approved`/`Ready`
6. **Payments** - Payment method toggle + proof upload
7. **Admin Dashboard** - Manage all operations

---

## 💡 Key Design Decisions

### Payment Flow

- **During request**: Payment method locked to "Cash" (default)
- **After approval**: User can toggle between Cash/Online in Payments page
- **Proof upload**: Both payment types can upload proof (receipt or screenshot)
- **Verification**: Admin marks payment as `Paid` after verifying proof

### Status-Based Unlocking

- Documents/Requests pages: Always visible, actions locked by status
- Appointments: Unlocks when request status = `Approved` or `Ready`
- Payment method toggle: Unlocks when request status = `Approved` or `Ready`
- Payment proof upload: Available after payment method is selected

### Notifications

- Triggered by admin actions (status changes, payment verification)
- Bell icon in header with unread count
- Click to navigate to related page
