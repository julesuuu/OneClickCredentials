import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { z } from "zod";

const f = createUploadthing();

export const ourFileRouter = {
  proofOfEnrollment: f({
    image: { maxFileSize: "4MB", maxFileCount: 1 },
    pdf: { maxFileSize: "4MB", maxFileCount: 1 },
  })
    .middleware(async ({ req }) => {
      const session = await auth.api.getSession({ headers: req.headers });
      if (!session) {
        throw new Error("Unauthorized: You must be signed in to upload files.");
      }
      return {};
    })
    .onUploadComplete(async ({ file }) => {
      await prisma.upload.create({
        data: {
          name: file.name,
          url: file.ufsUrl,
          fileType: file.type,
          fileSize: file.size,
          category: "proofOfEnrollment",
        },
      });
    }),

  paymentProof: f({
    image: { maxFileSize: "4MB", maxFileCount: 1 },
    pdf: { maxFileSize: "4MB", maxFileCount: 1 },
  })
    .input(z.object({ paymentId: z.string().optional() }))
    .middleware(async ({ req, input }) => {
      const session = await auth.api.getSession({ headers: req.headers });
      if (!session) {
        throw new Error("Unauthorized: You must be signed in to upload files.");
      }
      return { paymentId: input.paymentId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      const upload = await prisma.upload.create({
        data: {
          name: file.name,
          url: file.ufsUrl,
          fileType: file.type,
          fileSize: file.size,
          category: "paymentProof",
          paymentId: metadata.paymentId,
        },
      });
      return { url: file.ufsUrl, uploadId: upload.id };
    }),

  profileImage: f({
    image: { maxFileSize: "4MB", maxFileCount: 1 },
  })
    .input(z.object({ studentProfileId: z.string().optional() }))
    .middleware(async ({ req, input }) => {
      const session = await auth.api.getSession({ headers: req.headers });
      if (!session) {
        throw new Error("Unauthorized: You must be signed in to upload files.");
      }
      return { studentProfileId: input.studentProfileId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      const upload = await prisma.upload.create({
        data: {
          name: file.name,
          url: file.ufsUrl,
          fileType: file.type,
          fileSize: file.size,
          category: "profileImage",
          studentProfileId: metadata.studentProfileId,
        },
      });
      return { url: file.ufsUrl, uploadId: upload.id };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
