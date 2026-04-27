import type { OurFileRouter } from "@/app/api/uploadthing/core";

export type UploadEndpoint = keyof OurFileRouter;

export interface UploadWithUrlProps {
  endpoint: UploadEndpoint;
  field: {
    state: {
      value: string;
    };
    handleChange: (value: string) => void;
  };
  label?: string;
  description?: React.ReactNode;
  existingUrl?: string;
  onUploadComplete?: (url: string) => void;
  className?: string;
  studentProfileId?: string;
  paymentId?: string;
}
