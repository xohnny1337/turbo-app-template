import { doc, getDoc, setDoc } from "@react-native-firebase/firestore";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { firebaseDb } from "@/config/firebase-config";
import { useAuth } from "@/contexts/auth-context";
import tw from "@/lib/tw";

/**
 * Home screen — demonstrates the Firestore round trip:
 * a per-user tap counter stored in users/{uid}/demo/counter.
 */
export default function HomeScreen() {
  const { user, loading, authError, authErrorMessage, retryAuth } = useAuth();
  const [taps, setTaps] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const counterRef = useCallback(() => {
    if (!user) return null;
    return doc(firebaseDb, "users", user.uid, "demo", "counter");
  }, [user]);

  useEffect(() => {
    const ref = counterRef();
    if (!ref) return;
    getDoc(ref)
      .then((snapshot) => {
        setTaps(snapshot.exists() ? (snapshot.data()?.taps ?? 0) : 0);
      })
      .catch((error) => {
        console.error("[Home] Failed to load counter:", error);
        // Fall back to 0 so tapping still exercises the write path
        // (and surfaces the underlying error, e.g. rules not deployed).
        setTaps(0);
      });
  }, [counterRef]);

  const handleTap = async () => {
    const ref = counterRef();
    if (!ref || taps === null || saving) return;
    const next = taps + 1;
    setTaps(next);
    setSaving(true);
    try {
      await setDoc(ref, { taps: next }, { merge: true });
    } catch (error) {
      console.error("[Home] Failed to save counter:", error);
      setTaps(taps);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={tw`flex-1 items-center justify-center bg-background`}>
        <ActivityIndicator />
      </SafeAreaView>
    );
  }

  if (authError) {
    return (
      <SafeAreaView style={tw`flex-1 items-center justify-center bg-background px-8`}>
        <Text style={tw`mb-2 text-center font-semibold text-content`}>
          Could not sign in to Firebase.
        </Text>
        <Text style={tw`mb-4 text-center text-sm text-muted`}>
          Common causes: Anonymous sign-in not enabled in the Firebase console
          (Authentication → Sign-in method), or the placeholder
          google-services.json / GoogleService-Info.plist files were not
          replaced with the real ones.
        </Text>
        {authErrorMessage && (
          <Text style={tw`mb-4 text-center text-xs text-danger`}>
            {authErrorMessage}
          </Text>
        )}
        <Pressable
          onPress={retryAuth}
          style={tw`rounded-full bg-primary px-6 py-3`}
        >
          <Text style={tw`font-semibold text-white`}>Retry</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={tw`flex-1 bg-background`}>
      <View style={tw`flex-1 items-center justify-center px-8`}>
        <Text style={tw`mb-1 text-3xl font-bold text-content`}>MyApp</Text>
        <Text style={tw`mb-8 text-center text-muted`}>
          Signed in anonymously as {user?.uid.slice(0, 8)}…
        </Text>

        <Pressable
          onPress={handleTap}
          style={tw`h-40 w-40 items-center justify-center rounded-full bg-primary`}
        >
          <Text style={tw`text-4xl font-bold text-white`}>
            {taps === null ? "…" : taps}
          </Text>
          <Text style={tw`text-white/80`}>taps</Text>
        </Pressable>

        <Text style={tw`mt-8 text-center text-xs text-muted`}>
          Stored in Firestore at users/{"{uid}"}/demo/counter
        </Text>
      </View>
    </SafeAreaView>
  );
}
