import { createHmac, timingSafeEqual } from "crypto";

const PAYMONGO_API_URL = "https://api.paymongo.com";

export interface CreateCheckoutSessionInput {
  name: string;
  amount: number; // centavos
  referenceNumber: string;
  paymentId: string;
  description?: string;
  successUrl: string;
  cancelUrl: string;
}

export interface CheckoutSessionSummary {
  id: string;
  checkoutUrl: string | null;
  status: string;
  paymentIntentId: string | null;
  payments: Array<{
    id: string;
    status: string;
    amount: number;
    currency: string;
    sourceType: string | null;
  }>;
}

function getSecretKey(): string {
  const key = process.env.PAYMONGO_SECRET_KEY;
  if (!key) throw new Error("PAYMONGO_SECRET_KEY is not configured");
  return key;
}

async function paymongoRequest<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`${PAYMONGO_API_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Basic ${Buffer.from(`${getSecretKey()}:`).toString(
        "base64",
      )}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
    cache: "no-store",
  });

  const json = (await response.json().catch(() => null)) as
    | { errors?: Array<{ detail?: string }> }
    | null;

  if (!response.ok) {
    const message =
      json?.errors?.[0]?.detail ??
      `PayMongo request failed with status ${response.status}`;
    throw new Error(message);
  }

  return json as unknown as T;
}

export async function createCheckoutSession(
  input: CreateCheckoutSessionInput,
): Promise<{ id: string; checkoutUrl: string }> {
  const json = await paymongoRequest<{
    data: {
      id: string;
      attributes: { checkout_url: string };
    };
  }>("/v2/checkout_sessions", {
    method: "POST",
    body: JSON.stringify({
      data: {
        attributes: {
          line_items: [
            {
              name: input.name,
              amount: input.amount,
              currency: "PHP",
              quantity: 1,
            },
          ],
          payment_method_types: ["gcash", "maya", "card", "qrph"],
          reference_number: input.referenceNumber,
          metadata: { paymentId: input.paymentId },
          success_url: input.successUrl,
          cancel_url: input.cancelUrl,
          description: input.description,
        },
      },
    }),
  });

  return {
    id: json.data.id,
    checkoutUrl: json.data.attributes.checkout_url,
  };
}

export async function retrieveCheckoutSession(
  sessionId: string,
): Promise<CheckoutSessionSummary> {
  const json = await paymongoRequest<{
    data: {
      id: string;
      attributes: {
        checkout_url?: string | null;
        status: string;
        payment_intent?: { id: string } | null;
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
  }>(`/v1/checkout_sessions/${sessionId}`);

  const attributes = json.data.attributes;

  return {
    id: json.data.id,
    checkoutUrl: attributes.checkout_url ?? null,
    status: attributes.status,
    paymentIntentId: attributes.payment_intent?.id ?? null,
    payments: (attributes.payments ?? []).map((payment) => ({
      id: payment.id,
      status: payment.attributes.status,
      amount: payment.attributes.amount,
      currency: payment.attributes.currency,
      sourceType: payment.attributes.source?.type ?? null,
    })),
  };
}

export function verifyWebhookSignature(
  rawBody: string,
  header: string | null,
  secret: string,
  livemode: boolean,
): boolean {
  if (!header) return false;

  const parts = Object.fromEntries(
    header.split(",").map((part) => {
      const [key, ...rest] = part.split("=");
      return [key.trim(), rest.join("=").trim()];
    }),
  );

  const timestamp = parts.t;
  const signature = livemode ? parts.li : parts.te;

  if (!timestamp || !signature) return false;

  const expected = createHmac("sha256", secret)
    .update(`${timestamp}.${rawBody}`)
    .digest("hex");

  const expectedBuffer = Buffer.from(expected, "utf8");
  const actualBuffer = Buffer.from(signature, "utf8");

  if (expectedBuffer.length !== actualBuffer.length) return false;

  return timingSafeEqual(expectedBuffer, actualBuffer);
}
