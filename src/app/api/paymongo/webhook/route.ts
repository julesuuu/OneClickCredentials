import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyWebhookSignature } from "@/lib/paymongo";
import {
  confirmPaymentFailed,
  confirmPaymentPaid,
} from "@/lib/payments";

interface PayMongoEvent {
  data: {
    id: string;
    attributes: {
      type: string;
      livemode: boolean;
      data: {
        id: string;
        attributes: {
          reference_number?: string | null;
          metadata?: { paymentId?: string } | null;
          checkout_session_id?: string | null;
          payment_intent?: { id: string } | null;
          status?: string;
          failure_message?: string | null;
          payments?: Array<{
            id: string;
            attributes: {
              status: string;
              amount: number;
              currency: string;
              source?: { type?: string } | null;
            };
          }>;
        };
      };
    };
  };
}

export async function POST(req: Request) {
  const rawBody = await req.text();
  const secret = process.env.PAYMONGO_WEBHOOK_SECRET;

  if (!secret || secret === "whsec_your_webhook_secret_here") {
    console.error("PAYMONGO_WEBHOOK_SECRET is not configured");
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 },
    );
  }

  let event: PayMongoEvent;
  try {
    event = JSON.parse(rawBody) as PayMongoEvent;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const signature = req.headers.get("paymongo-signature");
  const livemode = event.data?.attributes?.livemode === true;

  if (!verifyWebhookSignature(rawBody, signature, secret, livemode)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const type = event.data?.attributes?.type;
  const resource = event.data?.attributes?.data;

  try {
    if (type === "checkout_session.payment.paid") {
      const attributes = resource.attributes;
      const paymentId =
        attributes.metadata?.paymentId ?? attributes.reference_number;

      if (!paymentId) {
        console.warn("PayMongo webhook missing payment id", {
          eventId: event.data.id,
        });
        return NextResponse.json({ received: true });
      }

      const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
      });

      if (!payment) {
        console.warn("PayMongo webhook for unknown payment", { paymentId });
        return NextResponse.json({ received: true });
      }

      const paid = attributes.payments?.find(
        (entry) => entry.attributes.status === "paid",
      );

      if (!paid) {
        console.warn("checkout_session.payment.paid without paid entry", {
          paymentId,
        });
        return NextResponse.json({ received: true });
      }

      if (
        paid.attributes.amount !== payment.amount * 100 ||
        paid.attributes.currency !== "PHP"
      ) {
        console.error("PayMongo amount mismatch", {
          paymentId,
          expected: payment.amount * 100,
          received: paid.attributes.amount,
        });
        await prisma.payment.update({
          where: { id: paymentId },
          data: {
            failureReason: `Amount mismatch: expected ${payment.amount * 100} centavos, received ${paid.attributes.amount}`,
          },
        });
        return NextResponse.json({ received: true });
      }

      await confirmPaymentPaid(paymentId, {
        paymongoPaymentId: paid.id,
        paymentIntentId: attributes.payment_intent?.id ?? null,
        paymentMethodType: paid.attributes.source?.type ?? null,
      });
    } else if (type === "payment.failed") {
      const attributes = resource.attributes;
      let paymentId = attributes.metadata?.paymentId ?? null;

      if (!paymentId && attributes.checkout_session_id) {
        const payment = await prisma.payment.findUnique({
          where: { checkoutSessionId: attributes.checkout_session_id },
          select: { id: true },
        });
        paymentId = payment?.id ?? null;
      }

      const reason =
        attributes.failure_message ?? attributes.status ?? "Payment failed";

      if (paymentId) {
        await confirmPaymentFailed(paymentId, reason);
      } else {
        console.warn("payment.failed without a resolvable payment", {
          eventId: event.data.id,
        });
      }
    }
  } catch (error) {
    console.error("PayMongo webhook handler error", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 },
    );
  }

  return NextResponse.json({ received: true });
}
