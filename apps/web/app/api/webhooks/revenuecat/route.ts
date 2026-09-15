import { NextResponse } from "next/server";

import type { Subscription, SubscriptionStatus } from "@repo/types";

import { getDb } from "@/lib/firebase-admin";

/**
 * RevenueCat webhook — syncs subscription status to the Firestore user doc
 * (users/{uid}.subscription) for server-side subscription awareness.
 *
 * Configure in the RevenueCat dashboard (Project -> Integrations -> Webhooks):
 * - URL: https://<your-domain>/api/webhooks/revenuecat
 * - Authorization header value: Bearer <REVENUECAT_WEBHOOK_AUTH_KEY>
 */

export const dynamic = "force-dynamic";

type RevenueCatEventType =
  | "TEST"
  | "INITIAL_PURCHASE"
  | "RENEWAL"
  | "CANCELLATION"
  | "UNCANCELLATION"
  | "NON_RENEWING_PURCHASE"
  | "SUBSCRIPTION_PAUSED"
  | "EXPIRATION"
  | "BILLING_ISSUE"
  | "PRODUCT_CHANGE"
  | "TRANSFER"
  | (string & {});

interface RevenueCatEvent {
  api_version: string;
  event: {
    type: RevenueCatEventType;
    id: string;
    app_user_id: string; // Firebase UID when identified, else $RCAnonymousID:…
    original_app_user_id: string;
    aliases?: string[];
    product_id: string;
    entitlement_ids?: string[] | null;
    expiration_at_ms?: number | null;
    environment: "SANDBOX" | "PRODUCTION";
  };
}

function getSubscriptionStatus(
  eventType: RevenueCatEventType
): SubscriptionStatus | null {
  switch (eventType) {
    case "INITIAL_PURCHASE":
    case "RENEWAL":
    case "UNCANCELLATION":
    case "NON_RENEWING_PURCHASE":
      return "active";
    case "CANCELLATION":
      return "cancelled"; // still active until expiration
    case "EXPIRATION":
      return "expired";
    case "BILLING_ISSUE":
      return "billing_issue";
    default:
      return null; // TEST, TRANSFER, etc. — no status change
  }
}

function verifyWebhookAuth(request: Request): boolean {
  const secret = process.env.REVENUECAT_WEBHOOK_AUTH_KEY;
  if (!secret) {
    console.error(
      "[RevenueCat Webhook] REVENUECAT_WEBHOOK_AUTH_KEY not configured"
    );
    return false;
  }
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

function isFirebaseUserId(appUserId: string): boolean {
  return !appUserId.startsWith("$RCAnonymousID:");
}

export async function POST(request: Request) {
  if (!verifyWebhookAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { event }: RevenueCatEvent = await request.json();

    console.log(`[RevenueCat Webhook] ${event.type}`, {
      app_user_id: event.app_user_id,
      product_id: event.product_id,
      environment: event.environment,
    });

    const firebaseUserId =
      [event.app_user_id, event.original_app_user_id, ...(event.aliases ?? [])]
        .filter(Boolean)
        .find(isFirebaseUserId) ?? null;

    if (!firebaseUserId) {
      return NextResponse.json({
        success: true,
        message: "Skipped anonymous user",
      });
    }

    const status = getSubscriptionStatus(event.type);
    if (status === null) {
      return NextResponse.json({
        success: true,
        message: `No status update for ${event.type}`,
      });
    }

    const subscription: Subscription = {
      status,
      productId: event.product_id,
      entitlementIds: event.entitlement_ids ?? [],
      expiresAt: event.expiration_at_ms
        ? new Date(event.expiration_at_ms).toISOString()
        : null,
      environment: event.environment,
      lastEventType: event.type,
      lastEventId: event.id,
      updatedAt: new Date().toISOString(),
    };

    await getDb()
      .collection("users")
      .doc(firebaseUserId)
      .set({ subscription }, { merge: true });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[RevenueCat Webhook] Error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
