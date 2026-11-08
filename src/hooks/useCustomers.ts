"use client";

import { useState, useEffect, useCallback, useMemo } from "react";

// In-memory cache for instant <50ms route transitions
const customersMemoryCache = new Map<string, any[]>();

export function getCachedCustomers(shopId: string): any[] | null {
  if (!shopId || shopId === "default") return null;
  const key = `customers_cache_v1_${shopId}`;
  if (customersMemoryCache.has(key)) {
    return customersMemoryCache.get(key) || null;
  }
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          customersMemoryCache.set(key, parsed);
          return parsed;
        }
      }
    } catch {}
  }
  return null;
}

export function setCachedCustomers(shopId: string, data: any[]) {
  if (!shopId || shopId === "default" || !Array.isArray(data)) return;
  const key = `customers_cache_v1_${shopId}`;
  customersMemoryCache.set(key, data);
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch {}
  }
}

/**
 * SWR Hook for Customers with instant cached render & silent background revalidation
 */
export function useCustomers(
  shopId: string,
  tenantFetch?: (url: string, init?: any) => Promise<Response>
) {
  const [customers, setCustomers] = useState<any[]>(() => {
    return getCachedCustomers(shopId) || [];
  });

  const [loading, setLoading] = useState<boolean>(() => {
    const cached = getCachedCustomers(shopId);
    return !cached || cached.length === 0;
  });

  const [isRevalidating, setIsRevalidating] = useState(false);

  const revalidate = useCallback(async () => {
    if (!shopId || shopId === "default") return;
    setIsRevalidating(true);
    try {
      const fetchFn = tenantFetch || fetch;
      const res = await fetchFn("/api/customers");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setCustomers(json.data);
        setCachedCustomers(shopId, json.data);
      }
    } catch (e) {
      console.warn("Background revalidation failed for customers:", e);
    } finally {
      setLoading(false);
      setIsRevalidating(false);
    }
  }, [shopId, tenantFetch]);

  useEffect(() => {
    if (!shopId || shopId === "default") {
      setCustomers([]);
      setLoading(true);
      return;
    }

    const cached = getCachedCustomers(shopId);
    if (cached && cached.length > 0) {
      setCustomers(cached);
      setLoading(false);
    }

    // Silent background refresh
    revalidate();

    const handleCustomerCreated = () => {
      revalidate();
    };
    window.addEventListener("customer-created", handleCustomerCreated);
    return () => window.removeEventListener("customer-created", handleCustomerCreated);
  }, [shopId, revalidate]);

  return {
    customers,
    setCustomers,
    loading,
    isRevalidating,
    refetch: revalidate,
  };
}
