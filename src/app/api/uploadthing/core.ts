import { createUploadthing, type FileRouter } from "uploadthing/next";

const f = createUploadthing();

export const ourFileRouter = {
  proofOfEnrollment: f({
    image: { maxFileSize: "4MB", maxFileCount: 1 },
    pdf: { maxFileSize: "4MB", maxFileCount: 1 },
  })
    .middleware(async () => {
      // TODO: Add auth check using getSession()
      return {};
    })
    .onUploadComplete(async ({ file }) => {
      return { url: file.ufsUrl };
    }),

  paymentProof: f({
    image: { maxFileSize: "4MB", maxFileCount: 1 },
    pdf: { maxFileSize: "4MB", maxFileCount: 1 },
  })
    .middleware(async () => {
      return {};
    })
    .onUploadComplete(async ({ file }) => {
      return { url: file.ufsUrl };
    }),

  profileImage: f({
    image: { maxFileSize: "4MB", maxFileCount: 1 },
  })
    .middleware(async () => {
      return {};
    })
    .onUploadComplete(async ({ file }) => {
      return { url: file.ufsUrl };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
