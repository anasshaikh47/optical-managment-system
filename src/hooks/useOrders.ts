"use client";

import { useState, useEffect, useCallback } from "react";

// In-memory cache for instant <50ms route transitions
const ordersMemoryCache = new Map<string, any[]>();

export function getCachedOrders(shopId: string): any[] | null {
  if (!shopId || shopId === "default") return null;
  const key = `orders_cache_v1_${shopId}`;
  if (ordersMemoryCache.has(key)) {
    return ordersMemoryCache.get(key) || null;
  }
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          ordersMemoryCache.set(key, parsed);
          return parsed;
        }
      }
    } catch {}
  }
  return null;
}

export function setCachedOrders(shopId: string, data: any[]) {
  if (!shopId || shopId === "default" || !Array.isArray(data)) return;
  const key = `orders_cache_v1_${shopId}`;
  ordersMemoryCache.set(key, data);
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch {}
  }
}

/**
 * SWR Hook for Orders with instant cached render & silent background revalidation
 */
export function useOrders(
  shopId: string,
  tenantFetch?: (url: string, init?: any) => Promise<Response>
) {
  const [orders, setOrders] = useState<any[]>(() => {
    return getCachedOrders(shopId) || [];
  });

  const [loading, setLoading] = useState<boolean>(() => {
    const cached = getCachedOrders(shopId);
    return !cached || cached.length === 0;
  });

  const [isRevalidating, setIsRevalidating] = useState(false);

  const revalidate = useCallback(async () => {
    if (!shopId || shopId === "default") return;
    setIsRevalidating(true);
    try {
      const fetchFn = tenantFetch || fetch;
      const res = await fetchFn("/api/orders");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setOrders(json.data);
        setCachedOrders(shopId, json.data);
      }
    } catch (e) {
      console.warn("Background revalidation failed for orders:", e);
    } finally {
      setLoading(false);
      setIsRevalidating(false);
    }
  }, [shopId, tenantFetch]);

  useEffect(() => {
    if (!shopId || shopId === "default") {
      setOrders([]);
      setLoading(true);
      return;
    }

    const cached = getCachedOrders(shopId);
    if (cached && cached.length > 0) {
      setOrders(cached);
      setLoading(false);
    }

    // Silent background refresh
    revalidate();

    const handleOrderCreated = () => {
      revalidate();
    };
    window.addEventListener("order-created", handleOrderCreated);
    return () => window.removeEventListener("order-created", handleOrderCreated);
  }, [shopId, revalidate]);

  return {
    orders,
    setOrders,
    loading,
    isRevalidating,
    refetch: revalidate,
  };
}
