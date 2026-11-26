import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { verifyWebhookSignature } from "./paymongo";

const SECRET = "whsec_test_secret";
const BODY = JSON.stringify({ data: { id: "evt_1" } });

function sign(
  body: string,
  secret: string,
  timestamp = "1700000000",
): string {
  return createHmac("sha256", secret)
    .update(`${timestamp}.${body}`)
    .digest("hex");
}

describe("verifyWebhookSignature", () => {
  it("accepts a valid test-mode signature", () => {
    const timestamp = "1700000000";
    const header = `t=${timestamp},te=${sign(BODY, SECRET, timestamp)}`;

    expect(verifyWebhookSignature(BODY, header, SECRET, false)).toBe(true);
  });

  it("accepts a valid live-mode signature", () => {
    const timestamp = "1700000000";
    const header = `t=${timestamp},li=${sign(BODY, SECRET, timestamp)}`;

    expect(verifyWebhookSignature(BODY, header, SECRET, true)).toBe(true);
  });

  it("rejects a tampered body", () => {
    const timestamp = "1700000000";
    const header = `t=${timestamp},te=${sign(BODY, SECRET, timestamp)}`;

    expect(verifyWebhookSignature(`${BODY} `, header, SECRET, false)).toBe(
      false,
    );
  });

  it("rejects the wrong secret", () => {
    const timestamp = "1700000000";
    const header = `t=${timestamp},te=${sign(BODY, "wrong-secret", timestamp)}`;

    expect(verifyWebhookSignature(BODY, header, SECRET, false)).toBe(false);
  });

  it("rejects a missing header", () => {
    expect(verifyWebhookSignature(BODY, null, SECRET, false)).toBe(false);
  });

  it("rejects a malformed header", () => {
    expect(
      verifyWebhookSignature(BODY, "not-a-signature", SECRET, false),
    ).toBe(false);
  });

  it("rejects a test signature in live mode", () => {
    const timestamp = "1700000000";
    const header = `t=${timestamp},te=${sign(BODY, SECRET, timestamp)}`;

    expect(verifyWebhookSignature(BODY, header, SECRET, true)).toBe(false);
  });
});
