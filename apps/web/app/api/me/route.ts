import { NextRequest, NextResponse } from "next/server";

import {
  extractBearerToken,
  getDb,
  verifyFirebaseToken,
} from "@/lib/firebase-admin";

/**
 * Returns the authenticated user's Firestore document.
 * The mobile app calls this with `Authorization: Bearer <firebase-id-token>`
 * (get one via `await getIdToken(user)` from @react-native-firebase/auth).
 */
export async function GET(request: NextRequest) {
  const token = extractBearerToken(request.headers.get("authorization"));
  if (!token) {
    return NextResponse.json({ error: "Missing bearer token" }, { status: 401 });
  }

  const { valid, userId, error } = await verifyFirebaseToken(token);
  if (!valid || !userId) {
    return NextResponse.json({ error }, { status: 401 });
  }

  const snapshot = await getDb().collection("users").doc(userId).get();
  if (!snapshot.exists) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json(snapshot.data());
}
