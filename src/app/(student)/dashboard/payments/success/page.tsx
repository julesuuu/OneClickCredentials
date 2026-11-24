import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
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
import {
  confirmPaymentFailed,
  confirmPaymentPaid,
} from "@/lib/payments";

type ViewState = "paid" | "confirming" | "failed" | "expired" | "other";

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

  let viewState: ViewState =
    payment.status === "Paid"
      ? "paid"
      : payment.status === "Failed"
        ? "failed"
        : "confirming";
  let failureReason = payment.failureReason;
  let currentStatus = payment.status;

  if (viewState === "confirming" && payment.checkoutSessionId) {
    try {
      const checkout = await retrieveCheckoutSession(
        payment.checkoutSessionId,
      );
      const paid = checkout.payments.find((p) => p.status === "paid");
      const failed = checkout.payments.find((p) => p.status === "failed");

      if (paid) {
        const transitioned = await confirmPaymentPaid(payment.id, {
          paymongoPaymentId: paid.id,
          paymentIntentId: checkout.paymentIntentId,
          paymentMethodType: paid.sourceType,
        });

        if (transitioned) {
          viewState = "paid";
          currentStatus = "Paid";
        } else {
          const current = await prisma.payment.findUnique({
            where: { id: payment.id },
            select: { status: true, failureReason: true },
          });
          failureReason = current?.failureReason ?? failureReason;
          currentStatus = current?.status ?? currentStatus;
          viewState =
            current?.status === "Paid"
              ? "paid"
              : current?.status === "Failed"
                ? "failed"
                : current?.status === "Refunded" ||
                    current?.status === "Cancelled"
                  ? "other"
                  : "confirming";
        }
      } else if (failed) {
        const transitioned = await confirmPaymentFailed(
          payment.id,
          "Payment failed",
        );
        viewState = transitioned ? "failed" : "other";
        if (transitioned) currentStatus = "Failed";
      } else if (checkout.status === "expired") {
        viewState = "expired";
      }
    } catch (error) {
      console.error("Failed to confirm PayMongo checkout session", error);
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
