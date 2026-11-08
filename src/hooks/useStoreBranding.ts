"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";

export interface StoreSettingData {
  id?: string;
  storeName?: string;
  tagline?: string;
  phone?: string;
  email?: string;
  address?: string;
  gstin?: string;
  currencySymbol?: string;
  currencyCode?: string;
  defaultGstRate?: number;
  receiptFooter?: string;
  logo_url?: string;
  [key: string]: any;
}

export const DEFAULT_FALLBACK_STORE_NAME = "Optical Store ERP & POS";
export const DEFAULT_FALLBACK_TAGLINE = "Optical Retail & Clinical Suite";

// In-memory cache for instant 0ms mount across views
const brandingMemoryCache = new Map<string, StoreSettingData>();

/**
 * Retrieve cached store branding from memory or localStorage
 */
export function getCachedStoreBranding(shopId?: string): StoreSettingData | null {
  const targetId = shopId || "default";
  const key = `store_branding_${targetId}`;

  if (brandingMemoryCache.has(key)) {
    return brandingMemoryCache.get(key) || null;
  }

  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === "object") {
          brandingMemoryCache.set(key, parsed);
          return parsed;
        }
      }
    } catch (e) {
      // ignore JSON parse or localStorage errors
    }
  }

  return null;
}

/**
 * Persist store branding into in-memory cache and localStorage,
 * and dispatch custom event so all open components update synchronously.
 */
export function setCachedStoreBranding(shopId: string | undefined, data: StoreSettingData) {
  const targetId = shopId || "default";
  const key = `store_branding_${targetId}`;

  brandingMemoryCache.set(key, data);

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      window.dispatchEvent(
        new CustomEvent("store_branding_changed", {
          detail: { shopId: targetId, data },
        })
      );
    } catch (e) {
      // ignore quota exceeded or security errors
    }
  }
}

/**
 * Hook to provide reactive store branding with instantaneous cached render,
 * graceful multi-tenant fallbacks, and live update sync.
 */
export function useStoreBranding(
  customShopId?: string,
  customTenantFetch?: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>
) {
  const auth = useAuth();
  const activeShopId = customShopId || auth?.shopId || "default";
  const activeTenantFetch = customTenantFetch || auth?.tenantFetch;

  const [settings, setSettings] = useState<StoreSettingData | null>(() => {
    return getCachedStoreBranding(activeShopId);
  });

  const [loading, setLoading] = useState<boolean>(() => {
    const cached = getCachedStoreBranding(activeShopId);
    return !cached;
  });

  const refetch = useCallback(async () => {
    try {
      const fetcher = activeTenantFetch || fetch;
      const res = await fetcher("/api/settings");
      if (res.ok) {
        const json = await res.json();
        if (json?.success && json?.data) {
          setSettings(json.data);
          setCachedStoreBranding(activeShopId, json.data);
        }
      }
    } catch (err) {
      console.warn("Could not fetch store settings:", err);
    } finally {
      setLoading(false);
    }
  }, [activeShopId, activeTenantFetch]);

  // Sync when activeShopId changes
  useEffect(() => {
    const cached = getCachedStoreBranding(activeShopId);
    if (cached) {
      setSettings(cached);
      setLoading(false);
    }
    refetch();
  }, [activeShopId, refetch]);

  // Listen for live cache updates across components
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<{ shopId: string; data: StoreSettingData }>;
      if (customEvent.detail && (customEvent.detail.shopId === activeShopId || customEvent.detail.shopId === "default")) {
        setSettings(customEvent.detail.data);
      }
    };

    window.addEventListener("store_branding_changed", handleUpdate);
    return () => {
      window.removeEventListener("store_branding_changed", handleUpdate);
    };
  }, [activeShopId]);

  // Compute effective store name with graceful fallback hierarchy:
  // 1. Database/Cached storeName from StoreSetting (if non-empty)
  // 2. If authenticated and has custom name/shopId: "Owner's Optics" or registered name
  // 3. Fallback: "Optical Store ERP & POS"
  const rawStoreName = settings?.storeName?.trim();
  const effectiveStoreName = rawStoreName
    ? rawStoreName
    : auth?.user
    ? auth.userDisplayName
      ? `${auth.userDisplayName}'s Optics`
      : DEFAULT_FALLBACK_STORE_NAME
    : DEFAULT_FALLBACK_STORE_NAME;

  const rawTagline = settings?.tagline?.trim();
  const effectiveTagline = rawTagline || DEFAULT_FALLBACK_TAGLINE;

  return {
    storeName: effectiveStoreName,
    tagline: effectiveTagline,
    settings,
    loading: loading && !settings,
    refetch,
    updateCachedBranding: (data: StoreSettingData) => setCachedStoreBranding(activeShopId, data),
  };
}
