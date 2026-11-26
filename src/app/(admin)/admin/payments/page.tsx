import { getAllPayments } from "./actions";
import { PaymentsManager } from "./PaymentsManager";

export default async function AdminPaymentsPage() {
  const payments = await getAllPayments();

  return (
    <PaymentsManager
      payments={payments.map((payment) => ({
        id: payment.id,
        amount: payment.amount,
        method: payment.method,
        status: payment.status,
        referenceNumber: payment.referenceNumber,
        paymentMethodType: payment.paymentMethodType,
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
          user: {
            email: payment.documentRequest.user.email,
            studentProfile: payment.documentRequest.user.studentProfile,
          },
        },
        uploads: payment.uploads,
        events: payment.events,
      }))}
    />
  );
}
