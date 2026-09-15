import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

import { AuthProvider } from "@/contexts/auth-context";
import { SubscriptionProvider } from "@/contexts/subscription-context";

export default function RootLayout() {
  return (
    <AuthProvider>
      <SubscriptionProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
        </Stack>
        <StatusBar style="auto" />
      </SubscriptionProvider>
    </AuthProvider>
  );
}
