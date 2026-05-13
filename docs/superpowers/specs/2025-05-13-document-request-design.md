# Document Request Feature Design

## Overview

Allow students to submit requests for official documents (transcripts, diplomas, etc.) one at a time with quantity support.

## Data Model

Already defined in `prisma/schema.prisma`:
- `DocumentType` - name, description, price, isActive
- `DocumentRequest` - userId, documentTypeId, quantity, totalPrice, status, notes, declineReason
- `Payment` - linked to DocumentRequest (status, method, referenceNumber)
- `Appointment` - linked to DocumentRequest for pickup scheduling

## Page: New Document Request

**Route:** `/dashboard/requests/new`

### UI Components

1. **Document Type Grid**
   - Card-based display of available document types
   - Each card shows: name, description, price per copy
   - Single selection (radio behavior)
   - Only active document types shown (`isActive: true`)

2. **Quantity Input**
   - Number input with increment/decrement buttons
   - Minimum value: 1
   - Default value: 1

3. **Notes Field**
   - Optional textarea
   - Placeholder: "Any special instructions or notes..."
   - Max 500 characters

4. **Order Summary**
   - Shows selected document name
   - Shows quantity
   - Shows price per copy
   - Shows total price (quantity × price)
   - Updates reactively

5. **Submit Button**
   - Disabled until document type selected
   - Loading state during submission
   - On success: redirect to `/dashboard/requests`

### Data Flow

1. Page loads → fetch active document types from API
2. User selects document type → update summary
3. User adjusts quantity → update total price
4. User clicks submit → POST to API
5. API creates DocumentRequest with status "Pending"
6. On success → redirect to requests list

## API Route

**Endpoint:** `POST /api/document-requests`

**Request Body:**
```json
{
  "documentTypeId": "string",
  "quantity": number,
  "notes": "string | null"
}
```

**Response:**
- 201: DocumentRequest created
- 400: Validation error
- 401: Unauthorized

**Server Action Alternative:**
- `createDocumentRequest(formData)` - can use server action pattern like existing admin actions

## Edge Cases

- No active document types → show empty state message
- Invalid quantity (< 1) → prevent submission
- Network error → show toast error, allow retry
- Session expired → redirect to sign-in

## Acceptance Criteria

1. Student can view list of available document types
2. Student can select one document type
3. Student can specify quantity (1 or more)
4. Student can add optional notes
5. Student sees accurate total price in summary
6. Submit creates DocumentRequest with "Pending" status
7. Successful submission redirects to requests list
8. Form validation prevents invalid submissions

## Future Enhancements

- Batch requests (multiple documents in one order)
- Appointment scheduling for pickup
- Payment integration (GCash, PayMaya)
- Email notifications on status changes
- Admin can process and mark as ready