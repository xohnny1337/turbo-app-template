import Constants from "expo-constants";
import { Platform } from "react-native";

/**
 * API URL utility for calling the Next.js web app backend.
 * - Development: uses Expo's debugger host to reach the local Next.js server
 * - Production: EXPO_PUBLIC_API_URL environment variable (inlined by Metro)
 */

const WEB_DEV_PORT = 3333;

function getApiBaseUrl(): string {
  if (__DEV__) {
    const debuggerHost = Constants.expoConfig?.hostUri?.split(":")[0];

    if (debuggerHost) {
      return `http://${debuggerHost}:${WEB_DEV_PORT}`;
    }

    // Fallback for Android emulator
    if (Platform.OS === "android") {
      return `http://10.0.2.2:${WEB_DEV_PORT}`;
    }

    // Fallback for iOS simulator
    return `http://localhost:${WEB_DEV_PORT}`;
  }

  const prodUrl = process.env.EXPO_PUBLIC_API_URL ?? "";
  if (!prodUrl) {
    throw new Error("EXPO_PUBLIC_API_URL environment variable is not set");
  }
  return prodUrl;
}

export function getApiUrl(path: string): string {
  const baseUrl = getApiBaseUrl();
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
}
