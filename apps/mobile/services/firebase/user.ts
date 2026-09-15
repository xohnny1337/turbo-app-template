import { doc, getDoc, setDoc } from "@react-native-firebase/firestore";
import type { User } from "@repo/types";

import { firebaseDb } from "@/config/firebase-config";

/**
 * Firestore operations for the users collection.
 */

export async function getUserById(userId: string): Promise<User | null> {
  const snapshot = await getDoc(doc(firebaseDb, "users", userId));
  if (!snapshot.exists()) return null;
  return snapshot.data() as User;
}

export async function createOrUpdateUser(
  userId: string,
  data: Partial<User> = {}
): Promise<User> {
  const now = new Date().toISOString();
  const existing = await getUserById(userId);

  const user: User = {
    id: userId,
    displayName: existing?.displayName ?? null,
    createdAt: existing?.createdAt ?? now,
    ...data,
    updatedAt: now,
  };

  await setDoc(doc(firebaseDb, "users", userId), user, { merge: true });
  return user;
}
