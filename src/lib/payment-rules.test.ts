import { describe, expect, it } from "vitest";
import {
  canCancelPayment,
  canCompleteRequest,
  canRefund,
  canRejectRequest,
  canStartCheckout,
  canTransitionToFailed,
  canTransitionToPaid,
  validatePaymentAmount,
} from "./payment-rules";

describe("canStartCheckout", () => {
  it.each(["Pending", "Failed"])("allows a %s payment", (status) => {
    expect(canStartCheckout(status, "Pending")).toBe(true);
  });

  it.each(["Paid", "Refunded", "Cancelled"])(
    "blocks a %s payment",
    (status) => {
      expect(canStartCheckout(status, "Pending")).toBe(false);
    },
  );

  it.each(["Rejected", "Cancelled", "Completed"])(
    "blocks a %s request",
    (status) => {
      expect(canStartCheckout("Pending", status)).toBe(false);
    },
  );
});

describe("payment transitions", () => {
  it.each(["Pending", "Failed"])("allows paid from %s", (status) => {
    expect(canTransitionToPaid(status)).toBe(true);
  });

  it.each(["Paid", "Refunded", "Cancelled"])(
    "blocks paid from %s",
    (status) => {
      expect(canTransitionToPaid(status)).toBe(false);
    },
  );

  it("allows failed only from Pending", () => {
    expect(canTransitionToFailed("Pending")).toBe(true);
    expect(canTransitionToFailed("Failed")).toBe(false);
    expect(canTransitionToFailed("Paid")).toBe(false);
  });

  it("allows refund only from Paid", () => {
    expect(canRefund("Paid")).toBe(true);
    expect(canRefund("Pending")).toBe(false);
  });

  it("allows cancellation only from Pending or Failed", () => {
    expect(canCancelPayment("Pending")).toBe(true);
    expect(canCancelPayment("Failed")).toBe(true);
    expect(canCancelPayment("Paid")).toBe(false);
  });
});

describe("request guards", () => {
  it("blocks rejection only for paid or refunded payments", () => {
    expect(canRejectRequest(null)).toBe(true);
    expect(canRejectRequest("Pending")).toBe(true);
    expect(canRejectRequest("Failed")).toBe(true);
    expect(canRejectRequest("Paid")).toBe(false);
    expect(canRejectRequest("Refunded")).toBe(false);
  });

  it("allows completion only when paid", () => {
    expect(canCompleteRequest("Paid")).toBe(true);
    expect(canCompleteRequest("Pending")).toBe(false);
    expect(canCompleteRequest(null)).toBe(false);
  });
});

describe("validatePaymentAmount", () => {
  it("accepts an exact PHP amount", () => {
    expect(
      validatePaymentAmount({
        paymentAmount: 100,
        paidAmount: 10000,
        currency: "PHP",
      }),
    ).toEqual({ valid: true });
  });

  it("rejects a centavo mismatch", () => {
    expect(
      validatePaymentAmount({
        paymentAmount: 100,
        paidAmount: 9999,
        currency: "PHP",
      }),
    ).toEqual({
      valid: false,
      reason:
        "Amount mismatch: expected 10000 centavos (PHP), received 9999 PHP",
    });
  });

  it("rejects a non-PHP currency", () => {
    expect(
      validatePaymentAmount({
        paymentAmount: 100,
        paidAmount: 10000,
        currency: "USD",
      }),
    ).toEqual({
      valid: false,
      reason: "Unexpected currency: expected PHP, received USD",
    });
  });

  it.each([0, -100, 10.5])("rejects an invalid peso amount: %s", (amount) => {
    expect(
      validatePaymentAmount({
        paymentAmount: amount,
        paidAmount: 10000,
        currency: "PHP",
      }),
    ).toEqual({
      valid: false,
      reason: "Payment amount must be a positive integer",
    });
  });
});
