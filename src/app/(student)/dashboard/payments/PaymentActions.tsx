"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { UploadWithUrl } from "@/components/upload/upload-with-url";
import { startOnlinePayment } from "./actions";

interface PaymentActionsProps {
  paymentId: string;
  canPay: boolean;
  hasReceipt: boolean;
  receiptUrl?: string;
}

export function PaymentActions({
  paymentId,
  canPay,
  hasReceipt,
  receiptUrl,
}: PaymentActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [uploadUrl, setUploadUrl] = useState("");

  const handlePay = () => {
    startTransition(async () => {
      try {
        const { checkoutUrl } = await startOnlinePayment(paymentId);
        window.location.assign(checkoutUrl);
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Could not start checkout. Please try again.",
        );
      }
    });
  };

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      {receiptUrl && (
        <Button asChild size="sm" variant="ghost">
          <a href={receiptUrl} target="_blank" rel="noopener noreferrer">
            View Receipt
          </a>
        </Button>
      )}

      {canPay && (
        <Button size="sm" onClick={handlePay} disabled={isPending}>
          {isPending ? "Redirecting..." : "Pay Online"}
        </Button>
      )}

      <Dialog open={receiptOpen} onOpenChange={setReceiptOpen}>
        <DialogTrigger asChild>
          <Button size="sm" variant="outline">
            {hasReceipt ? "Replace Receipt" : "Upload Receipt"}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload cash receipt</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Optional. Upload a photo or PDF of your receipt so an admin can
            verify your cash payment.
          </p>
          <UploadWithUrl
            endpoint="paymentProof"
            input={{ paymentId }}
            field={{
              state: { value: uploadUrl },
              handleChange: setUploadUrl,
            }}
            onUploadComplete={() => {
              toast.success("Receipt uploaded. An admin will verify it.");
              setReceiptOpen(false);
              router.refresh();
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
