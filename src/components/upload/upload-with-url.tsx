"use client";

import { useState } from "react";
import Image from "next/image";
import { UploadButton } from "@/utils/uploadthing";
import type { UploadWithUrlProps } from "./upload-with-url.types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function UploadWithUrl({
  endpoint,
  field,
  label,
  description,
  existingUrl,
  onUploadComplete,
  className,
}: UploadWithUrlProps) {
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(
    existingUrl || (typeof field.state.value === "string" ? field.state.value : null)
  );
  const [isUploading, setIsUploading] = useState(false);

  const handleUploadComplete = (res: Array<{ url: string }>) => {
    if (res?.[0]?.url) {
      const url = res[0].url;
      setUploadedUrl(url);
      field.handleChange(url);
      onUploadComplete?.(url);
    }
    setIsUploading(false);
  };

  const handleRemove = () => {
    setUploadedUrl(null);
    field.handleChange("");
  };

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <span className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {label}
        </span>
      )}

      {uploadedUrl ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2 p-3 border rounded-lg bg-muted/50">
            <div className="flex-1 min-w-0">
              {uploadedUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                <div className="relative w-20 h-20">
                  <Image
                    src={uploadedUrl}
                    alt="Uploaded file"
                    fill
                    className="object-cover rounded border"
                  />
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <svg
                    className="w-8 h-8 text-muted-foreground"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                    />
                  </svg>
                  <a
                    href={uploadedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline truncate"
                  >
                    View Uploaded File
                  </a>
                </div>
              )}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRemove}
            >
              Replace
            </Button>
          </div>
        </div>
      ) : (
        <div className="border-2 border-dashed rounded-lg p-4 hover:border-primary/50 transition-colors">
          <UploadButton
            endpoint={endpoint}
            onClientUploadComplete={handleUploadComplete}
            onUploadError={(error: Error) => {
              console.error("Upload error:", error);
              setIsUploading(false);
            }}
            onUploadBegin={() => {
              setIsUploading(true);
            }}
            className="ut-button:bg-primary ut-button:text-primary-foreground ut-button:hover:bg-primary/90 ut-button:rounded-md ut-button:px-4 ut-button:py-2 ut-button:text-sm ut-button:font-medium ut-button:transition-colors ut-allowed-content:text-muted-foreground ut-allowed-content:text-xs"
          />
          {isUploading && (
            <p className="text-sm text-muted-foreground mt-2">Uploading...</p>
          )}
        </div>
      )}

      {description && (
        <div className="text-sm text-muted-foreground">{description}</div>
      )}
    </div>
  );
}
