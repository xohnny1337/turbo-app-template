import { z } from "zod";

/**
 * Shared types for mobile and web apps.
 * Add your domain schemas here — both apps import from "@repo/types".
 */

export const SubscriptionStatusSchema = z.enum([
  "active",
  "cancelled",
  "expired",
  "billing_issue",
]);

export type SubscriptionStatus = z.infer<typeof SubscriptionStatusSchema>;

/**
 * Server-side subscription snapshot, written to users/{uid}.subscription by
 * the RevenueCat webhook (apps/web/app/api/webhooks/revenuecat).
 * The mobile app reads live entitlements from the RevenueCat SDK; this copy
 * is for server-side checks (API routes, cron jobs).
 */
export const SubscriptionSchema = z.object({
  status: SubscriptionStatusSchema,
  productId: z.string(),
  entitlementIds: z.array(z.string()),
  expiresAt: z.string().nullable(),
  environment: z.enum(["SANDBOX", "PRODUCTION"]),
  lastEventType: z.string(),
  lastEventId: z.string(),
  updatedAt: z.string(),
});

export type Subscription = z.infer<typeof SubscriptionSchema>;

export const UserSchema = z.object({
  id: z.string(),
  displayName: z.string().nullable(),
  subscription: SubscriptionSchema.optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type User = z.infer<typeof UserSchema>;

export const HealthResponseSchema = z.object({
  status: z.literal("ok"),
  timestamp: z.string(),
});

export type HealthResponse = z.infer<typeof HealthResponseSchema>;
