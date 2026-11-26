import Link from "next/link";
import { redirect } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireStudent } from "@/lib/auth-guards";
import prisma from "@/lib/prisma";
import { retrieveCheckoutSession } from "@/lib/paymongo";
import { validatePaymentAmount } from "@/lib/payment-rules";
import { buildExternalEventId } from "@/lib/payment-events";
import {
  confirmPaymentFailed,
  confirmPaymentPaid,
  recordAmountMismatch,
} from "@/lib/payments";

type ViewState =
  | "paid"
  | "confirming"
  | "failed"
  | "expired"
  | "review"
  | "other";

function viewStateFor(status: string): ViewState {
  if (status === "Paid") return "paid";
  if (status === "Failed") return "failed";
  if (status === "Refunded" || status === "Cancelled") return "other";
  return "confirming";
}

export default async function PaymentSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ paymentId?: string }>;
}) {
  const { paymentId } = await searchParams;
  if (!paymentId) redirect("/dashboard/payments");

  const session = await requireStudent();

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      documentRequest: {
        include: {
          documentType: { select: { name: true } },
        },
      },
    },
  });

  if (!payment || payment.documentRequest.userId !== session.user.id) {
    redirect("/dashboard/payments");
  }

  const hasCheckoutSession = Boolean(payment.checkoutSessionId);
  let viewState: ViewState =
    payment.status === "Paid"
      ? "paid"
      : payment.status === "Refunded" || payment.status === "Cancelled"
        ? "other"
        : payment.status === "Failed" && !hasCheckoutSession
          ? "failed"
          : "confirming";
  let failureReason = payment.failureReason;
  let currentStatus = payment.status;

  const readCurrentState = async () =>
    prisma.payment.findUnique({
      where: { id: payment.id },
      select: { status: true, failureReason: true },
    });

  const shouldCheck =
    hasCheckoutSession &&
    (payment.status === "Pending" || payment.status === "Failed");

  if (shouldCheck && payment.checkoutSessionId) {
    try {
      const checkout = await retrieveCheckoutSession(
        payment.checkoutSessionId,
      );
      const paid = checkout.payments.find((p) => p.status === "paid");
      const failed = checkout.payments.find((p) => p.status === "failed");

      if (paid) {
        const validation = validatePaymentAmount({
          paymentAmount: payment.amount,
          paidAmount: paid.amount,
          currency: paid.currency,
        });

        if (!validation.valid) {
          const flagged = await recordAmountMismatch(payment.id, {
            expectedCentavos: payment.amount * 100,
            receivedCentavos: paid.amount,
            currency: paid.currency,
            source: "return_page",
            externalEventId: buildExternalEventId(
              "return",
              `${payment.checkoutSessionId}:${paid.id}`,
              "mismatch",
            ),
            metadata: {
              checkoutSessionId: payment.checkoutSessionId,
              paymongoPaymentId: paid.id,
            },
          });

          if (flagged) {
            viewState = "review";
          } else {
            const current = await readCurrentState();
            failureReason = current?.failureReason ?? failureReason;
            currentStatus = current?.status ?? currentStatus;
            viewState = current ? viewStateFor(current.status) : viewState;
          }
        } else {
          const transitioned = await confirmPaymentPaid(
            payment.id,
            {
              paymongoPaymentId: paid.id,
              paymentIntentId: checkout.paymentIntentId,
              paymentMethodType: paid.sourceType,
            },
            {
              actor: { type: "System" },
              source: "return_page",
              externalEventId: buildExternalEventId(
                "return",
                `${payment.checkoutSessionId}:${paid.id}`,
                "paid",
              ),
              message: "Payment confirmed.",
              metadata: {
                checkoutSessionId: payment.checkoutSessionId,
                paymongoPaymentId: paid.id,
              },
            },
          );

          if (transitioned) {
            viewState = "paid";
            currentStatus = "Paid";
          } else {
            const current = await readCurrentState();
            failureReason = current?.failureReason ?? failureReason;
            currentStatus = current?.status ?? currentStatus;
            viewState = current ? viewStateFor(current.status) : viewState;
          }
        }
      } else if (failed) {
        if (payment.status === "Pending") {
          const transitioned = await confirmPaymentFailed(
            payment.id,
            "Payment failed",
            {
              actor: { type: "System" },
              source: "return_page",
              externalEventId: buildExternalEventId(
                "return",
                `${payment.checkoutSessionId}:${failed.id}`,
                "failed",
              ),
              message: "Payment failed during checkout.",
              metadata: {
                checkoutSessionId: payment.checkoutSessionId,
              },
            },
          );

          if (transitioned) {
            viewState = "failed";
            currentStatus = "Failed";
          } else {
            const current = await readCurrentState();
            failureReason = current?.failureReason ?? failureReason;
            currentStatus = current?.status ?? currentStatus;
            viewState = current ? viewStateFor(current.status) : viewState;
          }
        } else {
          viewState = "failed";
        }
      } else if (checkout.status === "expired") {
        viewState = payment.status === "Failed" ? "failed" : "expired";
      } else {
        viewState = payment.status === "Failed" ? "failed" : "confirming";
      }
    } catch (error) {
      console.error("Failed to confirm PayMongo checkout session", error);
      if (payment.status === "Failed") {
        viewState = "failed";
      }
    }
  }

  const documentName = payment.documentRequest.documentType.name;
  const amount = payment.amount;

  return (
    <div className="container mx-auto flex min-h-[60vh] items-center justify-center py-10">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {viewState === "paid" && (
            <CheckCircle2 className="mx-auto mb-3 h-12 w-12 text-green-600" />
          )}
          {viewState === "confirming" && (
            <Clock className="mx-auto mb-3 h-12 w-12 text-amber-500" />
          )}
          {viewState === "review" && (
            <AlertTriangle className="mx-auto mb-3 h-12 w-12 text-amber-500" />
          )}
          {(viewState === "failed" ||
            viewState === "expired" ||
            viewState === "other") && (
            <XCircle className="mx-auto mb-3 h-12 w-12 text-destructive" />
          )}
          <CardTitle>
            {viewState === "paid" && "Payment confirmed"}
            {viewState === "confirming" && "We're confirming your payment"}
            {viewState === "failed" && "Payment failed"}
            {viewState === "expired" && "Checkout expired"}
            {viewState === "review" && "Payment received — under review"}
            {viewState === "other" && "Payment status"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          {viewState === "paid" && (
            <p className="text-muted-foreground">
              ₱{amount.toLocaleString()} for {documentName} has been received.
            </p>
          )}

          {viewState === "confirming" && (
            <p className="text-muted-foreground">
              We have not received the confirmation yet. Refresh this page in a
              moment, or check the payments page.
            </p>
          )}

          {viewState === "failed" && (
            <p className="text-muted-foreground">
              {failureReason ?? "The payment did not go through."} You can try
              again from the payments page.
            </p>
          )}

          {viewState === "expired" && (
            <p className="text-muted-foreground">
              The checkout session expired. Start a new payment from the
              payments page.
            </p>
          )}

          {viewState === "review" && (
            <p className="text-muted-foreground">
              We received a payment, but the amount or currency does not match
              this request. An admin will review it before it is marked paid.
            </p>
          )}

          {viewState === "other" && (
            <p className="text-muted-foreground">
              This payment is {currentStatus.toLowerCase()}. See the payments
              page for details.
            </p>
          )}

          <div className="flex flex-col gap-2">
            {viewState === "confirming" && (
              <Button asChild variant="outline">
                <Link
                  href={`/dashboard/payments/success?paymentId=${payment.id}`}
                >
                  Refresh
                </Link>
              </Button>
            )}
            <Button asChild>
              <Link href="/dashboard/payments">Back to payments</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
