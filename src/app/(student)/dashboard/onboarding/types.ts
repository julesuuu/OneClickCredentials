import * as z from "zod";

const gender = [
  "MALE",
  "FEMALE",
  "NON_BINARY",
  "PREFER_NOT_TO_SAY",
  "OTHERS",
] as const;

const course = ["BSIT", "BSHM", "BSBA", "BSED", "BSCrim", "BSCS"] as const;

const yearLevel = [
  "FIRST_YEAR",
  "SECOND_YEAR",
  "THIRD_YEAR",
  "FOURTH_YEAR",
  "GRADUATE",
  "IRREGULAR",
];

export const studentFormSchema = z.object({
  fullName: z
    .string()
    .min(5, "Name must be at least 5 characters")
    .max(100, "Name must be at most 100 characters"),
  gender: z.enum(gender),
  birthDate: z.coerce.date(),
  phoneNumber: z
    .string()
    .regex(
      /^09|\d{9}$/,
      "Must be a valid 11-digit PH mobile number starting with 09",
    ),
  lrn: z
    .string()
    .length(12, "LRN must be exactly 12 digits")
    .regex(/^\d+$/, "LRN must contain only numbers"),
  studentNumber: z
    .string()
    .trim()
    .transform((val) => (val === "" ? "N/A" : val)),
  course: z.enum(course),
  yearLevel: z.enum(yearLevel),
});
