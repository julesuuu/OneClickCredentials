export const PAID_FROM = ["Pending", "Failed"] as const;
export const FAILED_FROM = ["Pending"] as const;
export const PAYABLE_PAYMENT_STATUSES = ["Pending", "Failed"] as const;
export const UNPAYABLE_REQUEST_STATUSES = [
  "Rejected",
  "Cancelled",
  "Completed",
] as const;

function includesStatus(
  statuses: readonly string[],
  status: string,
): boolean {
  return statuses.includes(status);
}

export function canStartCheckout(
  paymentStatus: string,
  requestStatus: string,
): boolean {
  return (
    includesStatus(PAYABLE_PAYMENT_STATUSES, paymentStatus) &&
    !includesStatus(UNPAYABLE_REQUEST_STATUSES, requestStatus)
  );
}

export function canTransitionToPaid(paymentStatus: string): boolean {
  return includesStatus(PAID_FROM, paymentStatus);
}

export function canTransitionToFailed(paymentStatus: string): boolean {
  return includesStatus(FAILED_FROM, paymentStatus);
}

export function canRefund(paymentStatus: string): boolean {
  return paymentStatus === "Paid";
}

export function canCancelPayment(paymentStatus: string): boolean {
  return includesStatus(PAYABLE_PAYMENT_STATUSES, paymentStatus);
}

export function canRejectRequest(
  paymentStatus: string | null | undefined,
): boolean {
  return paymentStatus !== "Paid" && paymentStatus !== "Refunded";
}

export function canCompleteRequest(
  paymentStatus: string | null | undefined,
): boolean {
  return paymentStatus === "Paid";
}

export interface AmountValidationInput {
  paymentAmount: number;
  paidAmount: number;
  currency: string;
}

export type AmountValidationResult =
  | { valid: true }
  | { valid: false; reason: string };

export function validatePaymentAmount(
  input: AmountValidationInput,
): AmountValidationResult {
  const { paymentAmount, paidAmount, currency } = input;

  if (!Number.isInteger(paymentAmount) || paymentAmount <= 0) {
    return {
      valid: false,
      reason: "Payment amount must be a positive integer",
    };
  }

  if (currency !== "PHP") {
    return {
      valid: false,
      reason: `Unexpected currency: expected PHP, received ${currency}`,
    };
  }

  const expected = paymentAmount * 100;

  if (paidAmount !== expected) {
    return {
      valid: false,
      reason: `Amount mismatch: expected ${expected} centavos (PHP), received ${paidAmount} ${currency}`,
    };
  }

  return { valid: true };
}
