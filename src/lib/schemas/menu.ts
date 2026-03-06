import { z } from "zod";

export const generateMenuSchema = z.object({
  courseCount: z.union([z.literal(3), z.literal(4), z.literal(5), z.literal(6)]),
  mealType: z.enum(["breakfast", "brunch", "lunch", "mid-afternoon", "dinner"]),
  restrictions: z.array(z.string()).default([]),
  notes: z.string().max(300).optional(),
  serveAt: z.string().datetime(),
  inviteeCount: z.number().min(1).max(60),
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
  optionId: z.string().uuid(),
  note: z.string().max(220).optional(),
});
