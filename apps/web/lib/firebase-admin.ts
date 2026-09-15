import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

/**
 * Firebase Admin SDK — server-side access to Firestore and Auth.
 *
 * Required env vars (see .env.example):
 *   AUTH_FIREBASE_PROJECT_ID
 *   AUTH_FIREBASE_CLIENT_EMAIL
 *   FIREBASE_PRIVATE_KEY
 *
 * Initialization is lazy so `next build` succeeds without credentials.
 */

function getAdminApp(): App {
  const existing = getApps()[0];
  if (existing) return existing;

  const projectId = process.env.AUTH_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.AUTH_FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/gm, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Missing Firebase Admin credentials. Set AUTH_FIREBASE_PROJECT_ID, AUTH_FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY (see apps/web/.env.example)."
    );
  }

  return initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  });
}

export function getDb(): Firestore {
  return getFirestore(getAdminApp());
}

/**
 * Verify a Firebase ID token sent by the mobile app.
 */
export async function verifyFirebaseToken(token: string): Promise<{
  valid: boolean;
  userId?: string;
  error?: string;
}> {
  try {
    const decodedToken = await getAuth(getAdminApp()).verifyIdToken(token);
    return { valid: true, userId: decodedToken.uid };
  } catch (error) {
    console.error("Error verifying Firebase token:", error);
    return {
      valid: false,
      error: error instanceof Error ? error.message : "Invalid token",
    };
  }
}

/**
 * Extract bearer token from an Authorization header.
 */
export function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.slice(7);
}
