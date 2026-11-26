import { beforeEach, describe, expect, it, vi } from "vitest";
import prisma from "@/lib/prisma";
import {
  confirmPaymentFailed,
  confirmPaymentPaid,
  recordAmountMismatch,
} from "./payments";

vi.mock("@/lib/prisma", () => ({
  default: {
    $transaction: vi.fn(),
  },
}));

interface FakeTransaction {
  payment: {
    findUnique: ReturnType<typeof vi.fn>;
    updateMany: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
  notification: {
    create: ReturnType<typeof vi.fn>;
  };
  paymentEvent: {
    createMany: ReturnType<typeof vi.fn>;
  };
}

function makeTransaction(): FakeTransaction {
  return {
    payment: {
      findUnique: vi.fn(),
      updateMany: vi.fn(),
      update: vi.fn(),
    },
    notification: { create: vi.fn() },
    paymentEvent: { createMany: vi.fn() },
  };
}

const transactionMock = prisma.$transaction as unknown as ReturnType<
  typeof vi.fn
>;

function useTransaction(tx: FakeTransaction) {
  transactionMock.mockImplementation(
    async (callback: (transaction: FakeTransaction) => Promise<unknown>) =>
      callback(tx),
  );
}

const paymentRow = {
  status: "Pending",
  amount: 100,
  documentRequest: {
    documentType: { name: "Transcript" },
    user: { studentProfile: { id: "sp_1" } },
  },
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("confirmPaymentPaid", () => {
  it("writes the paid event and notification", async () => {
    const tx = makeTransaction();
    tx.payment.findUnique.mockResolvedValue(paymentRow);
    tx.payment.updateMany.mockResolvedValue({ count: 1 });
    useTransaction(tx);

    await expect(
      confirmPaymentPaid(
        "pay_1",
        { paymongoPaymentId: "paymongo_1" },
        {
          actor: { type: "PayMongo" },
          source: "webhook",
          externalEventId: "webhook:evt_1:paid",
          message: "Payment confirmed.",
          metadata: { checkoutSessionId: "cs_1" },
        },
      ),
    ).resolves.toBe(true);

    expect(tx.payment.findUnique).toHaveBeenCalledWith({
      where: { id: "pay_1" },
      select: expect.any(Object),
    });
    expect(tx.payment.updateMany).toHaveBeenCalledWith({
      where: { id: "pay_1", status: { in: ["Pending", "Failed"] } },
      data: expect.objectContaining({
        status: "Paid",
        paymongoPaymentId: "paymongo_1",
        failureReason: null,
      }),
    });
    expect(tx.notification.create).toHaveBeenCalledTimes(1);
    expect(tx.paymentEvent.createMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({
          paymentId: "pay_1",
          type: "PAID",
          fromStatus: "Pending",
          toStatus: "Paid",
          amount: 100,
          actorType: "PayMongo",
          source: "webhook",
          message: "Payment confirmed.",
          externalEventId: "webhook:evt_1:paid",
        }),
      ],
      skipDuplicates: true,
    });
  });

  it("pre-fetches snapshots before the atomic update", async () => {
    const tx = makeTransaction();
    tx.payment.findUnique.mockResolvedValue(paymentRow);
    tx.payment.updateMany.mockResolvedValue({ count: 1 });
    useTransaction(tx);

    await confirmPaymentPaid("pay_1");

    expect(
      tx.payment.findUnique.mock.invocationCallOrder[0],
    ).toBeLessThan(tx.payment.updateMany.mock.invocationCallOrder[0]);
  });

  it("is a no-op when the atomic guard updates nothing", async () => {
    const tx = makeTransaction();
    tx.payment.findUnique.mockResolvedValue(paymentRow);
    tx.payment.updateMany.mockResolvedValue({ count: 0 });
    useTransaction(tx);

    await expect(confirmPaymentPaid("pay_1")).resolves.toBe(false);

    expect(tx.notification.create).not.toHaveBeenCalled();
    expect(tx.paymentEvent.createMany).not.toHaveBeenCalled();
  });

  it("writes the paid event when recovering a failed payment", async () => {
    const tx = makeTransaction();
    tx.payment.findUnique.mockResolvedValue({
      ...paymentRow,
      status: "Failed",
    });
    tx.payment.updateMany.mockResolvedValue({ count: 1 });
    useTransaction(tx);

    await expect(confirmPaymentPaid("pay_1")).resolves.toBe(true);

    expect(tx.payment.updateMany).toHaveBeenCalledWith({
      where: { id: "pay_1", status: { in: ["Pending", "Failed"] } },
      data: expect.objectContaining({ status: "Paid" }),
    });
    expect(tx.paymentEvent.createMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({
          type: "PAID",
          fromStatus: "Failed",
          toStatus: "Paid",
        }),
      ],
      skipDuplicates: true,
    });
  });

  it.each(["Cancelled", "Refunded"])(
    "does not revive a %s payment",
    async (status) => {
      const tx = makeTransaction();
      tx.payment.findUnique.mockResolvedValue({
        ...paymentRow,
        status,
      });
      useTransaction(tx);

      await expect(confirmPaymentPaid("pay_1")).resolves.toBe(false);
      expect(tx.payment.updateMany).not.toHaveBeenCalled();
    },
  );
});

describe("confirmPaymentFailed", () => {
  it("writes the failed event and notification", async () => {
    const tx = makeTransaction();
    tx.payment.findUnique.mockResolvedValue(paymentRow);
    tx.payment.updateMany.mockResolvedValue({ count: 1 });
    useTransaction(tx);

    await expect(
      confirmPaymentFailed("pay_1", "Card declined", {
        actor: { type: "PayMongo" },
        source: "webhook",
        externalEventId: "webhook:evt_2:failed",
      }),
    ).resolves.toBe(true);

    expect(tx.payment.updateMany).toHaveBeenCalledWith({
      where: { id: "pay_1", status: "Pending" },
      data: { status: "Failed", failureReason: "Card declined" },
    });
    expect(tx.notification.create).toHaveBeenCalledTimes(1);
    expect(tx.paymentEvent.createMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({
          type: "FAILED",
          fromStatus: "Pending",
          toStatus: "Failed",
          message: "Card declined",
          externalEventId: "webhook:evt_2:failed",
        }),
      ],
      skipDuplicates: true,
    });
  });

  it("does not fail a paid payment", async () => {
    const tx = makeTransaction();
    tx.payment.findUnique.mockResolvedValue({
      ...paymentRow,
      status: "Paid",
    });
    useTransaction(tx);

    await expect(confirmPaymentFailed("pay_1")).resolves.toBe(false);
    expect(tx.payment.updateMany).not.toHaveBeenCalled();
  });
});

describe("recordAmountMismatch", () => {
  it("flags a mismatch without changing status", async () => {
    const tx = makeTransaction();
    tx.payment.findUnique.mockResolvedValue({
      status: "Pending",
      amount: 100,
      failureReason: null,
    });
    tx.payment.update.mockResolvedValue({});
    useTransaction(tx);

    await expect(
      recordAmountMismatch("pay_1", {
        expectedCentavos: 10000,
        receivedCentavos: 9999,
        currency: "PHP",
        source: "webhook",
        externalEventId: "webhook:evt_3:mismatch",
      }),
    ).resolves.toBe(true);

    expect(tx.payment.update).toHaveBeenCalledWith({
      where: { id: "pay_1" },
      data: {
        failureReason:
          "Amount mismatch: expected 10000 centavos (PHP), received 9999 PHP",
      },
    });
    expect(tx.paymentEvent.createMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({
          type: "AMOUNT_MISMATCH",
          fromStatus: "Pending",
          toStatus: null,
          source: "webhook",
          actorType: "PayMongo",
          externalEventId: "webhook:evt_3:mismatch",
        }),
      ],
      skipDuplicates: true,
    });
  });

  it.each(["Paid", "Refunded", "Cancelled"])(
    "does not flag a %s payment",
    async (status) => {
      const tx = makeTransaction();
      tx.payment.findUnique.mockResolvedValue({
        status,
        amount: 100,
        failureReason: null,
      });
      useTransaction(tx);

      await expect(
        recordAmountMismatch("pay_1", {
          expectedCentavos: 10000,
          receivedCentavos: 9999,
          currency: "PHP",
          source: "webhook",
          externalEventId: "webhook:evt_4:mismatch",
        }),
      ).resolves.toBe(false);

      expect(tx.payment.update).not.toHaveBeenCalled();
      expect(tx.paymentEvent.createMany).not.toHaveBeenCalled();
    },
  );
});
