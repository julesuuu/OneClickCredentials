import { describe, expect, it, vi } from "vitest";
import {
  buildExternalEventId,
  recordPaymentEvent,
  type RecordPaymentEventInput,
} from "./payment-events";

describe("buildExternalEventId", () => {
  it("builds a webhook key", () => {
    expect(buildExternalEventId("webhook", "evt_1", "paid")).toBe(
      "webhook:evt_1:paid",
    );
  });

  it("builds a return key with session and payment", () => {
    expect(
      buildExternalEventId("return", "cs_1:pay_1", "mismatch"),
    ).toBe("return:cs_1:pay_1:mismatch");
  });

  it("builds a checkout key without a suffix", () => {
    expect(buildExternalEventId("checkout", "cs_1")).toBe("checkout:cs_1");
  });
});

describe("recordPaymentEvent", () => {
  it("writes the event with actor snapshots and skipDuplicates", async () => {
    const createMany = vi.fn().mockResolvedValue({ count: 1 });
    const tx = {
      paymentEvent: { createMany },
    } as unknown as Parameters<typeof recordPaymentEvent>[0];

    const input: RecordPaymentEventInput = {
      paymentId: "pay_1",
      type: "PAID",
      fromStatus: "Pending",
      toStatus: "Paid",
      amount: 100,
      actor: { type: "PayMongo", userId: null, name: null },
      source: "webhook",
      message: "Payment confirmed.",
      metadata: { checkoutSessionId: "cs_1" },
      externalEventId: "webhook:evt_1:paid",
    };

    await recordPaymentEvent(tx, input);

    expect(createMany).toHaveBeenCalledWith({
      data: [
        {
          paymentId: "pay_1",
          type: "PAID",
          fromStatus: "Pending",
          toStatus: "Paid",
          amount: 100,
          actorType: "PayMongo",
          actorUserId: null,
          actorName: null,
          source: "webhook",
          message: "Payment confirmed.",
          metadata: { checkoutSessionId: "cs_1" },
          externalEventId: "webhook:evt_1:paid",
        },
      ],
      skipDuplicates: true,
    });
  });
});
