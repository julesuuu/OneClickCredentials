import * as z from "zod";

export const genderOptions = [
  "MALE",
  "FEMALE",
  "NON_BINARY",
  "PREFER_NOT_TO_SAY",
  "OTHER",
] as const;

export const courseOptions = [
  "BSIT",
  "BSHM",
  "BSBA",
  "BSED",
  "BSCRIM",
] as const;

export const yearLevelOptions = [
  "FIRST_YEAR",
  "SECOND_YEAR",
  "THIRD_YEAR",
  "FOURTH_YEAR",
  "GRADUATE",
  "IRREGULAR",
] as const;

export const step1Schema = z.object({
  fullName: z
    .string()
    .min(5, "Name must be at least 5 characters")
    .max(100, "Name must be at most 100 characters"),
  gender: z.enum(genderOptions),
  birthDate: z.coerce.date({
    message: "Birth date is required",
  }),
  phoneNumber: z
    .string()
    .regex(
      /^09\d{9}$/,
      "Must be a valid 11-digit PH mobile number starting with 09",
    ),
});

export const step2Schema = z.object({
  lrn: z
    .string()
    .length(12, "LRN must be exactly 12 digits")
    .regex(/^\d+$/, "LRN must contain only numbers"),
  studentNumber: z
    .string()
    .trim()
    .optional()
    .transform((val) => (val === "" || !val ? "N/A" : val)),
  course: z.enum(courseOptions),
  yearLevel: z.enum(yearLevelOptions),
  proofOfEnrollmentUrl: z
    .any()
    .refine(
      (val) =>
        val instanceof File || (typeof val === "string" && val.length > 0),
      {
        message: "Please upload your proof of enrollment",
      },
    ),
});

export const studentFormSchema = step1Schema.extend(step2Schema.shape).extend({
  proofOfEnrollmentUrl: z.url("A valid proof of enrollment URL is required"),
});

export type StudentFormValues = z.infer<typeof studentFormSchema>;
export type Step1Values = z.infer<typeof step1Schema>;
export type Step2Values = z.infer<typeof step2Schema>;
