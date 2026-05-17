"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "@tanstack/react-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { createDocumentRequest } from "../actions";
import { toast } from "sonner";
import { FileText, ChevronUp, ChevronDown, Loader2 } from "lucide-react";

const MAX_QUANTITY = 5;

interface DocumentType {
  id: string;
  name: string;
  description: string | null;
  price: number;
}

interface NewRequestFormProps {
  documentTypes: DocumentType[];
}

export function NewRequestForm({ documentTypes }: NewRequestFormProps) {
  const router = useRouter();
  const [selectedType, setSelectedType] = React.useState<string | null>(null);
  const [quantity, setQuantity] = React.useState(1);
  const [notes, setNotes] = React.useState("");

  const selectedDoc = documentTypes.find((d) => d.id === selectedType);

  const form = useForm({
    defaultValues: {
      documentTypeId: "",
    },
    onSubmit: async ({ value }) => {
      if (!value.documentTypeId) {
        toast.error("Please select a document type");
        return;
      }

      try {
        const formData = new FormData();
        formData.append("documentTypeId", value.documentTypeId);
        formData.append("quantity", quantity.toString());
        formData.append("notes", notes || "");

        await createDocumentRequest(formData);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to create request");
      }
    },
  });

  if (documentTypes.length === 0) {
    return (
      <div className="container mx-auto py-10 max-w-2xl">
        <Card>
          <CardContent className="pt-6 text-center py-10">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No Document Types Available</h3>
            <p className="text-muted-foreground mt-2">
              There are no active document types available for request at this time.
            </p>
            <Button variant="outline" className="mt-4" onClick={() => router.push("/dashboard/requests")}>
              Back to Requests
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">New Document Request</h1>
        <p className="text-muted-foreground mt-1">Select a document type and specify quantity</p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
        className="space-y-6"
      >
        <Card>
          <CardHeader>
            <CardTitle>Select Document Type</CardTitle>
            <CardDescription>Choose the document you need</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              {documentTypes.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => {
                    setSelectedType(doc.id);
                    form.setFieldValue("documentTypeId", doc.id);
                  }}
                  className={`cursor-pointer rounded-lg border-2 p-4 transition-all ${
                    selectedType === doc.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50 hover:bg-muted/50"
                  }`}
                >
                  <div className="font-medium">{doc.name}</div>
                  {doc.description && (
                    <p className="text-sm text-muted-foreground mt-1">{doc.description}</p>
                  )}
                  <div className="mt-2 font-semibold text-primary">₱{doc.price.toFixed(2)}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quantity</CardTitle>
            <CardDescription>Number of copies needed</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-4">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
                <Input
                  type="number"
                  value={quantity}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    setQuantity(isNaN(val) || val < 1 ? 1 : Math.min(val, MAX_QUANTITY));
                  }}
                  className="w-20 text-center"
                  min={1}
                  max={MAX_QUANTITY}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity((q) => Math.min(MAX_QUANTITY, q + 1))}
                  disabled={quantity >= MAX_QUANTITY}
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Maximum {MAX_QUANTITY} copies per request
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notes (Optional)</CardTitle>
            <CardDescription>Any special instructions</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Any special instructions or notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={500}
              rows={4}
            />
            <p className="text-xs text-muted-foreground mt-2 text-right">
              {notes.length}/500
            </p>
          </CardContent>
        </Card>

        {selectedDoc && (
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Document</span>
                <span className="font-medium">{selectedDoc.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Price per copy</span>
                <span>₱{selectedDoc.price.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Quantity</span>
                <span>{quantity}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-semibold">
                <span>Total</span>
                <span className="text-primary">₱{(selectedDoc.price * quantity).toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex gap-4">
          <Button type="button" variant="outline" onClick={() => router.push("/dashboard/requests")}>
            Cancel
          </Button>
          <Button
            type="submit"
            className="flex-1"
            disabled={!selectedType || form.state.isSubmitting}
          >
            {form.state.isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Request"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}