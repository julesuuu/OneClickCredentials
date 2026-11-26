import { getMyPayments } from "./actions";
import { PaymentsList } from "./PaymentsList";

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ canceled?: string }>;
}) {
  const { canceled } = await searchParams;
  const payments = await getMyPayments();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Payments</h1>
        <p className="mt-1 text-muted-foreground">
          Pay for your document requests or upload a cash receipt.
        </p>
      </div>

      <PaymentsList
        canceled={canceled === "1"}
        payments={payments.map((payment) => ({
          id: payment.id,
          amount: payment.amount,
          method: payment.method,
          status: payment.status,
          referenceNumber: payment.referenceNumber,
          failureReason: payment.failureReason,
          createdAt: payment.createdAt,
          paidAt: payment.paidAt,
          documentRequest: {
            id: payment.documentRequest.id,
            quantity: payment.documentRequest.quantity,
            totalPrice: payment.documentRequest.totalPrice,
            status: payment.documentRequest.status,
            documentType: {
              name: payment.documentRequest.documentType.name,
            },
          },
          uploads: payment.uploads,
        }))}
      />
    </div>
  );
}
