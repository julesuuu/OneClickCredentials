"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { UploadWithUrl } from "@/components/upload/upload-with-url";
import { submitVerificationAction } from "./actions";
import { toast } from "sonner";
import { AlertCircle, CheckCircle2, Eye, FileText } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface VerificationStatusProps {
  isVerified: boolean;
  declineReason: string | null;
  hasUploads: boolean;
  lastUpload: { url: string; fileType: string; createdAt: Date } | null;
}

export function VerificationStatus({
  isVerified,
  declineReason,
  hasUploads,
  lastUpload,
}: VerificationStatusProps) {
  const router = useRouter();
  const [uploadUrl, setUploadUrl] = useState(lastUpload?.url || "");
  const [uploadId, setUploadId] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!uploadUrl) {
      toast.error("Please upload your proof of enrollment first.");
      return;
    }

    setIsSubmitting(true);
    const result = await submitVerificationAction({
      proofOfEnrollmentUrl: uploadUrl,
      proofOfEnrollmentUploadId: uploadId,
    });

    setIsSubmitting(false);

    if (result.success) {
      toast.success("Verification submitted successfully!");
      router.refresh();
    } else {
      toast.error(result.error || "Failed to submit verification.");
    }
  };

  const status = isVerified
    ? "verified"
    : declineReason
      ? "rejected"
      : "pending";

  return (
    <div className="container max-w-2xl mx-auto py-10">
      <h1 className="text-2xl font-bold tracking-tight mb-6">
        Verification Status
      </h1>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Current Status</CardTitle>
            {status === "verified" && (
              <Badge variant="default" className="gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Verified
              </Badge>
            )}
            {status === "rejected" && (
              <Badge variant="destructive" className="gap-1">
                <AlertCircle className="h-3 w-3" />
                Rejected
              </Badge>
            )}
            {status === "pending" && (
              <Badge variant="secondary" className="gap-1">
                <AlertCircle className="h-3 w-3" />
                Pending Review
              </Badge>
            )}
          </div>
          <CardDescription>
            {status === "verified" &&
              "Your verification has been approved. You can now request documents."}
            {status === "rejected" &&
              "Your verification was rejected. Please review the reason and re-upload your documents."}
            {status === "pending" &&
              "Your documents are being reviewed. We'll notify you once verification is complete."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === "rejected" && declineReason && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Rejection Reason</AlertTitle>
              <AlertDescription>{declineReason}</AlertDescription>
            </Alert>
          )}

          {hasUploads && lastUpload && (
            <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Proof of Enrollment</p>
                  <p className="text-xs text-muted-foreground">
                    Uploaded on{" "}
                    {new Date(lastUpload.createdAt).toLocaleDateString(
                      "en-US",
                      {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      },
                    )}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setPreviewUrl(lastUpload.url)}
              >
                <Eye className="h-4 w-4" />
              </Button>
            </div>
          )}

          {(status === "rejected" || status === "pending") && (
            <div className="space-y-4 pt-4 border-t">
              <p className="text-sm font-medium">
                {status === "rejected"
                  ? "Re-upload your proof of enrollment to submit for verification again"
                  : "Upload your proof of enrollment to start the verification process"}
              </p>
              <UploadWithUrl
                endpoint="proofOfEnrollment"
                field={{
                  state: { value: uploadUrl },
                  handleChange: setUploadUrl,
                }}
                label="Proof of Enrollment"
                onUploadIdComplete={setUploadId}
                onPreview={(url) => setPreviewUrl(url)}
                description={
                  <>
                    Acceptable documents include:
                    <span className="block">• Valid Student ID</span>
                    <span className="block">• Current Enrollment Form</span>
                    <span className="block">
                      • Certificate of Registration (COR)
                    </span>
                  </>
                }
              />
              <Button
                onClick={handleSubmit}
                disabled={!uploadUrl || isSubmitting}
                className="w-full"
              >
                {isSubmitting ? "Submitting..." : "Submit for Verification"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!previewUrl} onOpenChange={() => setPreviewUrl(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Proof of Enrollment</DialogTitle>
            <DialogDescription>Document preview</DialogDescription>
          </DialogHeader>
          {previewUrl &&
            (previewUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
              <img
                src={previewUrl}
                alt="Proof of Enrollment"
                className="w-full h-auto object-contain max-h-[70vh]"
              />
            ) : (
              <iframe
                src={previewUrl}
                className="w-full h-125"
                title="Proof of Enrollment"
              />
            ))}
        </DialogContent>
      </Dialog>
    </div>
  );
}
