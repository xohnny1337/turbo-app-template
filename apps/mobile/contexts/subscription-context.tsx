import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { Alert } from "react-native";
import Purchases, { CustomerInfo } from "react-native-purchases";
import RevenueCatUI, { PAYWALL_RESULT } from "react-native-purchases-ui";

import { useAuth } from "@/contexts/auth-context";
import {
  configureRevenueCat,
  hasActiveEntitlement,
  isRevenueCatConfigured,
  loginUser,
  logoutUser,
  restorePurchases as restorePurchasesService,
} from "@/services/revenuecat";

/**
 * Subscription context — RevenueCat subscription state.
 * Configures the SDK once auth is ready (identified with the Firebase UID),
 * keeps entitlement state live via the customer-info listener, and exposes
 * the RevenueCat paywall.
 */

interface SubscriptionContextValue {
  /** Whether the user has any active entitlement */
  isPro: boolean;
  /** Whether subscription state is still loading */
  loading: boolean;
  /** Current RevenueCat customer info */
  customerInfo: CustomerInfo | null;
  /** Present the paywall. Resolves true if purchased/restored. */
  presentPaywall: () => Promise<boolean>;
  /** Restore previous purchases */
  restorePurchases: () => Promise<void>;
  /** Manually refresh subscription status */
  refresh: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextValue | undefined>(
  undefined
);

export function SubscriptionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading: authLoading } = useAuth();
  const [isPro, setIsPro] = useState(false);
  const [loading, setLoading] = useState(true);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [isConfigured, setIsConfigured] = useState(false);
  const [configuredUserId, setConfiguredUserId] = useState<string | null>(null);

  const applyCustomerInfo = useCallback((info: CustomerInfo) => {
    setCustomerInfo(info);
    setIsPro(hasActiveEntitlement(info));
  }, []);

  // Configure once auth is ready, identified with the Firebase UID
  useEffect(() => {
    if (authLoading || isConfigured) return;

    const configure = async () => {
      try {
        await configureRevenueCat(user?.uid);
        if (isRevenueCatConfigured()) {
          setIsConfigured(true);
          setConfiguredUserId(user?.uid ?? null);
          applyCustomerInfo(await Purchases.getCustomerInfo());
        }
      } catch (error) {
        console.error("[Subscription] Failed to configure:", error);
      } finally {
        setLoading(false);
      }
    };
    configure();
  }, [authLoading, isConfigured, user?.uid, applyCustomerInfo]);

  // Keep entitlements live (purchases, renewals, webhook-driven changes)
  useEffect(() => {
    if (!isConfigured) return;
    const listener = (info: CustomerInfo) => applyCustomerInfo(info);
    Purchases.addCustomerInfoUpdateListener(listener);
    return () => {
      Purchases.removeCustomerInfoUpdateListener(listener);
    };
  }, [isConfigured, applyCustomerInfo]);

  // Sync RevenueCat identity when the signed-in user changes
  useEffect(() => {
    if (!isConfigured || configuredUserId === (user?.uid ?? null)) return;

    const syncUser = async () => {
      setLoading(true);
      try {
        const info = user?.uid
          ? await loginUser(user.uid)
          : await logoutUser();
        applyCustomerInfo(info);
        setConfiguredUserId(user?.uid ?? null);
      } catch (error) {
        console.error("[Subscription] Failed to sync user:", error);
      } finally {
        setLoading(false);
      }
    };
    syncUser();
  }, [isConfigured, configuredUserId, user?.uid, applyCustomerInfo]);

  const presentPaywall = useCallback(async (): Promise<boolean> => {
    if (!isConfigured) {
      console.warn("[Subscription] RevenueCat not configured");
      return false;
    }

    try {
      // Skip the paywall if an entitlement is already active
      const currentInfo = await Purchases.getCustomerInfo();
      if (hasActiveEntitlement(currentInfo)) {
        applyCustomerInfo(currentInfo);
        return true;
      }

      const result = await RevenueCatUI.presentPaywall();
      if (
        result === PAYWALL_RESULT.PURCHASED ||
        result === PAYWALL_RESULT.RESTORED
      ) {
        applyCustomerInfo(await Purchases.getCustomerInfo());
        return true;
      }
      return false;
    } catch (error) {
      console.error("[Subscription] Failed to present paywall:", error);
      Alert.alert(
        "Subscription Error",
        error instanceof Error ? error.message : String(error)
      );
      return false;
    }
  }, [isConfigured, applyCustomerInfo]);

  const restorePurchases = useCallback(async () => {
    if (!isConfigured) return;
    try {
      applyCustomerInfo(await restorePurchasesService());
    } catch (error) {
      console.error("[Subscription] Failed to restore:", error);
      Alert.alert(
        "Restore Failed",
        error instanceof Error ? error.message : String(error)
      );
    }
  }, [isConfigured, applyCustomerInfo]);

  const refresh = useCallback(async () => {
    if (!isConfigured) return;
    try {
      applyCustomerInfo(await Purchases.getCustomerInfo());
    } catch (error) {
      console.error("[Subscription] Failed to refresh:", error);
    }
  }, [isConfigured, applyCustomerInfo]);

  return (
    <SubscriptionContext.Provider
      value={{
        isPro,
        loading,
        customerInfo,
        presentPaywall,
        restorePurchases,
        refresh,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error(
      "useSubscription must be used within a SubscriptionProvider"
    );
  }
  return context;
}
