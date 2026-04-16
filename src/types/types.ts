import * as z from "zod";

const gender = ["Male", "Female", "Other"] as const;

const YearLevelSchema = z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5), z.literal(6)]);

export const studentProfileSchema = z.object({
  gender: z.enum(gender),
  birthDate: z.coerce.date(),
  phoneNumber: z.string().min(10, "Phone number must be at least 10 digits."),
  lrn: z.string().length(12, "LRN must be exactly 12 digits."),
  studentNumber: z.string().min(5, "Invalid Student Number Format"),
  course: z.string().min(3, "Course name is required."),
  yearLevel: YearLevelSchema,
  proofOfEnrollmentUrl: z.url("Invalid Page URL."),
});

export type StudentProfileInput = z.infer<typeof studentProfileSchema>;
