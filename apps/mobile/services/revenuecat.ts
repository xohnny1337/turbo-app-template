import Constants from "expo-constants";
import { Platform } from "react-native";
import Purchases, { CustomerInfo, LOG_LEVEL } from "react-native-purchases";

/**
 * RevenueCat service — subscription management.
 *
 * Keys (RevenueCat dashboard -> Project settings -> API keys):
 * - EXPO_PUBLIC_REVENUECAT_API_KEY_IOS / _ANDROID (set in .env / EAS env vars)
 * - extra.revenuecat.testKey in app.json is used in dev builds if set
 */

let isConfigured = false;

const TEST_KEY = Constants.expoConfig?.extra?.revenuecat?.testKey as
  | string
  | undefined;

const REVENUECAT_API_KEY =
  __DEV__ && TEST_KEY
    ? TEST_KEY
    : Platform.OS === "ios"
      ? process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_IOS
      : process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID;

/**
 * Configure the SDK once. Pass the Firebase UID so RevenueCat identifies the
 * user directly instead of creating an anonymous customer first.
 */
export async function configureRevenueCat(userId?: string): Promise<void> {
  if (isConfigured) return;

  if (!REVENUECAT_API_KEY) {
    console.warn(
      "[RevenueCat] No API key configured — subscriptions disabled. Set EXPO_PUBLIC_REVENUECAT_API_KEY_IOS/_ANDROID."
    );
    return;
  }

  if (__DEV__) {
    Purchases.setLogLevel(LOG_LEVEL.DEBUG);
  }

  Purchases.configure({
    apiKey: REVENUECAT_API_KEY,
    appUserID: userId, // undefined = anonymous
  });
  isConfigured = true;
}

export function isRevenueCatConfigured(): boolean {
  return isConfigured;
}

/** Identify the user with their Firebase UID (syncs entitlements across devices). */
export async function loginUser(userId: string): Promise<CustomerInfo> {
  const { customerInfo } = await Purchases.logIn(userId);
  return customerInfo;
}

export async function logoutUser(): Promise<CustomerInfo> {
  return Purchases.logOut();
}

export async function restorePurchases(): Promise<CustomerInfo> {
  return Purchases.restorePurchases();
}

/** True if the customer has any active entitlement. */
export function hasActiveEntitlement(customerInfo: CustomerInfo): boolean {
  return Object.keys(customerInfo.entitlements.active).length > 0;
}
