import {
  onAuthStateChanged,
  signInAnonymously,
  type User as FirebaseUser,
} from "@react-native-firebase/auth";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import { firebaseAuth } from "@/config/firebase-config";
import { createOrUpdateUser } from "@/services/firebase/user";
import type { User } from "@repo/types";

/**
 * Auth context — signs the user in anonymously on first launch and keeps a
 * Firestore user document in sync. Swap anonymous auth for Apple/Google
 * sign-in when you need real accounts.
 */

interface AuthContextType {
  user: FirebaseUser | null;
  userData: User | null;
  loading: boolean;
  authError: boolean;
  authErrorMessage: string | null;
  retryAuth: () => void;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(false);
  const [authErrorMessage, setAuthErrorMessage] = useState<string | null>(null);
  const [retryToken, setRetryToken] = useState(0);

  const retryAuth = useCallback(() => {
    setAuthError(false);
    setAuthErrorMessage(null);
    setLoading(true);
    setRetryToken((t) => t + 1);
  }, []);

  const refreshUserData = useCallback(async () => {
    if (!user) return;
    const data = await createOrUpdateUser(user.uid);
    setUserData(data);
  }, [user]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (firebaseUser) => {
      try {
        if (!firebaseUser) {
          await signInAnonymously(firebaseAuth);
          return; // onAuthStateChanged fires again with the new user
        }

        const data = await createOrUpdateUser(firebaseUser.uid);
        setUser(firebaseUser);
        setUserData(data);
        setLoading(false);
      } catch (error) {
        console.error("[AuthContext] Auth error:", error);
        setAuthError(true);
        setAuthErrorMessage(error instanceof Error ? error.message : String(error));
        setLoading(false);
      }
    });

    return unsubscribe;
  }, [retryToken]);

  return (
    <AuthContext.Provider
      value={{
        user,
        userData,
        loading,
        authError,
        authErrorMessage,
        retryAuth,
        refreshUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
