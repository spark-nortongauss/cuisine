import { z } from "zod";

const serviceDateTimeSchema = z.string().trim().min(1, "Please select a service date and time.").transform((value, ctx) => {
  const normalized = value.includes("T") ? value : value.replace(" ", "T");
  const asDate = new Date(normalized);
  if (Number.isNaN(asDate.getTime())) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Service date and time is invalid." });
    return z.NEVER;
  }
  return asDate.toISOString();
});

const inviteePreferenceSchema = z.object({
  label: z.string().min(1),
  name: z.string().trim().max(40).optional().nullable(),
  restrictions: z.array(z.string()).default([]),
});

export const generateMenuSchema = z.object({
  courseCount: z.union([z.literal(3), z.literal(4), z.literal(5), z.literal(6)]),
  mealType: z.enum(["breakfast", "brunch", "lunch", "mid-afternoon", "dinner"]),
  restrictions: z.array(z.string()).default([]),
  notes: z.string().max(300).optional(),
  serveAt: serviceDateTimeSchema,
  inviteeCount: z.number().min(1).max(60),
  inviteePreferences: z.array(inviteePreferenceSchema).default([]),
});

export const shareMenuSchema = z.object({
  menuId: z.string().uuid(),
  invitees: z.array(
    z.object({
      firstName: z.string().min(1),
      mobile: z.string().min(8),
    }),
  ),
});

export const voteSchema = z.object({
  optionId: z.string(),
  note: z.string().max(220).optional(),
});
