# OneClickCredentials — Entity Relationship Diagram

```mermaid
erDiagram
    %% ──────────────────────────────────────────────
    %% AUTH / BETTER-AUTH TABLES (simplified)
    %% ──────────────────────────────────────────────
    User {
        string id PK
        string name
        string email UK
        boolean emailVerified
        string image
        string role
        boolean banned
        string banReason
        datetime banExpires
        boolean twoFactorEnabled
        datetime createdAt
        datetime updatedAt
    }

    Session {
        string id PK
        string token UK
        datetime expiresAt
        string ipAddress
        string userAgent
        string impersonatedBy
        string userId FK
    }

    Account {
        string id PK
        string accountId
        string providerId
        string userId FK
        string accessToken
        string refreshToken
        string password
    }

    Verification {
        string id PK
        string identifier
        string value
        datetime expiresAt
    }

    TwoFactor {
        string id PK
        string secret
        string backupCodes
        string userId FK
    }

    RateLimit {
        string id PK
        string key UK
        int count
        bigint lastRequest
    }

    Passkey {
        string id PK
        string name
        string publicKey
        string userId FK
        string credentialID
        int counter
        string deviceType
        boolean backedUp
        string transports
        string aaguid
    }

    %% ──────────────────────────────────────────────
    %% CORE BUSINESS ENTITIES
    %% ──────────────────────────────────────────────
    StudentProfile {
        string id PK
        string userId FK
        string fullName
        string gender
        datetime birthDate
        string phoneNumber
        string lrn UK
        string studentNumber
        string course
        string yearLevel
        boolean isProfileComplete
        boolean isVerified
        string declineReason
        datetime createdAt
        datetime updatedAt
    }

    DocumentType {
        string id PK
        string name
        string description
        int price
        boolean isActive
        datetime createdAt
        datetime updatedAt
    }

    DocumentRequest {
        string id PK
        string userId FK
        string documentTypeId FK
        int quantity
        int totalPrice
        string status
        string notes
        string declineReason
        string paymentId UK
        string appointmentId UK
        datetime createdAt
        datetime updatedAt
    }

    Payment {
        string id PK
        string documentRequestId UK
        string method
        string referenceNumber
        int amount
        string status
        datetime createdAt
        datetime updatedAt
    }

    Appointment {
        string id PK
        string documentRequestId UK
        datetime date
        string timeSlot
        string status
        string notes
        datetime createdAt
        datetime updatedAt
    }

    Upload {
        string id PK
        string name
        string url
        string fileType
        int fileSize
        string category
        string studentProfileId FK
        string paymentId FK
        datetime createdAt
    }

    Notification {
        string id PK
        string studentProfileId FK
        string title
        string message
        string type
        boolean isRead
        string relatedEntityId
        string relatedEntityType
        datetime createdAt
        datetime updatedAt
    }

    %% ──────────────────────────────────────────────
    %% RELATIONSHIPS — AUTH
    %% ──────────────────────────────────────────────
    User  ||--o{ Session       : "has"
    User  ||--o{ Account       : "has"
    User  ||--o{ TwoFactor     : "has"
    User  ||--o{ Passkey       : "has"

    %% ──────────────────────────────────────────────
    %% RELATIONSHIPS — CORE BUSINESS
    %% ──────────────────────────────────────────────
    User            ||--|| StudentProfile     : "has"
    User            ||--o{ DocumentRequest    : "makes"
    StudentProfile  ||--o{ Upload            : "has proof / avatar"
    StudentProfile  ||--o{ Notification      : "receives"
    DocumentType    ||--o{ DocumentRequest   : "classified as"
    DocumentRequest ||--o| Payment           : "has (optional)"
    DocumentRequest ||--o| Appointment       : "has (optional)"
    Payment         ||--o{ Upload            : "has payment proof"
```

## Entity Relationship Summary

```
User (1) ──── (1) StudentProfile
User (1) ──── (N) DocumentRequest
User (1) ──── (N) Session, Account, TwoFactor, Passkey

StudentProfile (1) ──── (N) Upload (via studentProfileId)
StudentProfile (1) ──── (N) Notification

DocumentType (1) ──── (N) DocumentRequest

DocumentRequest (1) ──── (1) Payment        ← 1:1 optional
DocumentRequest (1) ──── (1) Appointment    ← 1:1 optional
DocumentRequest (N) ──── (1) User
DocumentRequest (N) ──── (1) DocumentType

Payment (1) ──── (N) Upload (via paymentId)
```

## Status Lifecycles

```
DocumentRequest:  Pending → Processing → Ready → Completed
                                          ↘ Rejected / Cancelled

Payment:          Pending → Paid
                           ↘ Failed / Refunded

Appointment:      Scheduled → Completed
                             ↘ Cancelled / No-show
```

## Key Design Notes

- **Payment** is already in the schema with a 1:1 relation to `DocumentRequest`, but the UI/controller logic for online payment gateways (GCash, Maya, etc.) is **not yet implemented**. The current flow supports Cash (default) with manual proof upload via UploadThing.
- `DocumentRequest.paymentId` and `DocumentRequest.appointmentId` are **nullable** — the Payment and Appointment records are created later in the workflow (after admin marks a request as Ready).
- All monetary values (`price`, `totalPrice`, `amount`) are stored as **integers** (whole pesos/cents — no decimals).
- The `Upload` table is polymorphic — it can belong to either a `StudentProfile` (enrollment proof, avatar) or a `Payment` (payment receipt), controlled by the `category` field.
