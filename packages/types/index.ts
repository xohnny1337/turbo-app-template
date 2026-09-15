import { z } from "zod";

/**
 * Shared types for mobile and web apps.
 * Add your domain schemas here — both apps import from "@repo/types".
 */

export const UserSchema = z.object({
  id: z.string(),
  displayName: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type User = z.infer<typeof UserSchema>;

export const HealthResponseSchema = z.object({
  status: z.literal("ok"),
  timestamp: z.string(),
});

export type HealthResponse = z.infer<typeof HealthResponseSchema>;
