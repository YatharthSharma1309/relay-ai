import { z } from "zod";
import { appConfig } from "@/lib/recruitment/config";

const criteriaArraySchema = z
  .array(z.string().trim().min(1).max(120))
  .max(40)
  .default([]);

export const createJobSchema = z.object({
  title: z.string().trim().min(2).max(120),
  description: z.string().trim().min(20).max(8000),
  requiredSkills: z
    .array(z.string().trim().min(1).max(80))
    .min(1)
    .max(40),
  preferredSkills: criteriaArraySchema,
  experienceLevel: z.string().trim().max(80).nullable().default(null),
  minYearsExperience: z.number().int().min(0).max(60).nullable().default(null),
  educationRequirements: criteriaArraySchema,
  certifications: criteriaArraySchema,
  roleType: z.string().trim().max(80).nullable().default(null),
});

export const updateJobSchema = createJobSchema;

export const jobAssistSchema = z.object({
  title: z.string().trim().min(2).max(120),
  description: z.string().trim().max(8000).optional().default(""),
});

export const candidateStatusSchema = z.enum([
  "new",
  "shortlisted",
  "interviewing",
  "rejected",
  "hired",
]);

export const createCandidateTextSchema = z.object({
  jobId: z.string().cuid(),
  displayName: z.string().trim().min(1).max(120),
  rawText: z.string().trim().min(50).max(appConfig.maxResumeTextChars),
});

export const updateCandidateSchema = z
  .object({
    displayName: z.string().trim().min(1).max(120).optional(),
    rawText: z.string().trim().min(50).max(appConfig.maxResumeTextChars).optional(),
    status: candidateStatusSchema.optional(),
    notes: z.string().trim().max(4000).nullable().optional(),
  })
  .refine((value) => Object.values(value).some((field) => field !== undefined), {
    message: "At least one candidate field must be provided.",
  });

export const analyzeCandidateSchema = z.object({
  candidateId: z.string().cuid(),
});

export const ALLOWED_UPLOAD_MIME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;

export type AllowedUploadMime = (typeof ALLOWED_UPLOAD_MIME_TYPES)[number];

export function isAllowedUploadMime(mime: string): mime is AllowedUploadMime {
  return (ALLOWED_UPLOAD_MIME_TYPES as readonly string[]).includes(mime);
}
