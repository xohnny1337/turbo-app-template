import { getIdToken } from "@react-native-firebase/auth";
import * as Application from "expo-application";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/contexts/auth-context";
import { getApiUrl } from "@/lib/api-url";
import tw from "@/lib/tw";

/**
 * Settings screen — app info plus two checks against the Next.js web app:
 * an unauthenticated /api/health ping, and an authenticated /api/me call
 * (Firebase ID token as bearer, verified server-side with firebase-admin).
 */
export default function SettingsScreen() {
  const { user } = useAuth();
  const [apiStatus, setApiStatus] = useState<string | null>(null);

  const checkApi = async () => {
    setApiStatus("Checking…");
    try {
      const response = await fetch(getApiUrl("/api/health"));
      const data = await response.json();
      setApiStatus(`API says: ${data.status} (${data.timestamp})`);
    } catch (error) {
      setApiStatus(
        "API unreachable — is the web app running? (pnpm dev in apps/web)"
      );
      console.error("[Settings] Health check failed:", error);
    }
  };

  const fetchProfile = async () => {
    if (!user) return;
    setApiStatus("Fetching profile…");
    try {
      const token = await getIdToken(user);
      const response = await fetch(getApiUrl("/api/me"), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setApiStatus(
        response.ok
          ? `Verified! /api/me returned user ${data.id}`
          : `/api/me error ${response.status}: ${data.error}`
      );
    } catch (error) {
      setApiStatus(
        "API unreachable — is the web app running with Firebase Admin env vars set?"
      );
      console.error("[Settings] Profile fetch failed:", error);
    }
  };

  return (
    <SafeAreaView style={tw`flex-1 bg-background`}>
      <View style={tw`flex-1 px-6 pt-4`}>
        <Text style={tw`mb-6 text-2xl font-bold text-content`}>Settings</Text>

        <View style={tw`mb-4 rounded-2xl bg-surface p-4`}>
          <Text style={tw`text-xs uppercase text-muted`}>User ID</Text>
          <Text style={tw`text-content`}>{user?.uid ?? "—"}</Text>
        </View>

        <View style={tw`mb-4 rounded-2xl bg-surface p-4`}>
          <Text style={tw`text-xs uppercase text-muted`}>App version</Text>
          <Text style={tw`text-content`}>
            {Application.nativeApplicationVersion ?? "dev"} (
            {Application.nativeBuildVersion ?? "-"})
          </Text>
        </View>

        <Pressable
          onPress={checkApi}
          style={tw`mb-3 items-center rounded-full bg-primary px-6 py-3`}
        >
          <Text style={tw`font-semibold text-white`}>Ping web API</Text>
        </Pressable>
        <Pressable
          onPress={fetchProfile}
          style={tw`mb-3 items-center rounded-full bg-surface px-6 py-3`}
        >
          <Text style={tw`font-semibold text-content`}>
            Fetch profile (authed /api/me)
          </Text>
        </Pressable>
        {apiStatus && (
          <Text style={tw`text-center text-sm text-muted`}>{apiStatus}</Text>
        )}
      </View>
    </SafeAreaView>
  );
}
