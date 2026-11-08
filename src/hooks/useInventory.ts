"use client";

import { useState, useEffect, useCallback } from "react";

// In-memory cache for instant <50ms route transitions
const inventoryMemoryCache = new Map<string, any[]>();

export function getCachedInventory(shopId: string): any[] | null {
  if (!shopId || shopId === "default") return null;
  const key = `inventory_cache_v1_${shopId}`;
  if (inventoryMemoryCache.has(key)) {
    return inventoryMemoryCache.get(key) || null;
  }
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          inventoryMemoryCache.set(key, parsed);
          return parsed;
        }
      }
    } catch {}
  }
  return null;
}

export function setCachedInventory(shopId: string, data: any[]) {
  if (!shopId || shopId === "default" || !Array.isArray(data)) return;
  const key = `inventory_cache_v1_${shopId}`;
  inventoryMemoryCache.set(key, data);
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch {}
  }
}

/**
 * SWR Hook for Inventory Items with instant cached render & silent background revalidation
 */
export function useInventory(
  shopId: string,
  tenantFetch?: (url: string, init?: any) => Promise<Response>
) {
  const [items, setItems] = useState<any[]>(() => {
    return getCachedInventory(shopId) || [];
  });

  const [loading, setLoading] = useState<boolean>(() => {
    const cached = getCachedInventory(shopId);
    return !cached || cached.length === 0;
  });

  const [isRevalidating, setIsRevalidating] = useState(false);

  const revalidate = useCallback(async () => {
    if (!shopId || shopId === "default") return;
    setIsRevalidating(true);
    try {
      const fetchFn = tenantFetch || fetch;
      const res = await fetchFn("/api/inventory");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setItems(json.data);
        setCachedInventory(shopId, json.data);
      }
    } catch (e) {
      console.warn("Background revalidation failed for inventory:", e);
    } finally {
      setLoading(false);
      setIsRevalidating(false);
    }
  }, [shopId, tenantFetch]);

  useEffect(() => {
    if (!shopId || shopId === "default") {
      setItems([]);
      setLoading(true);
      return;
    }

    const cached = getCachedInventory(shopId);
    if (cached && cached.length > 0) {
      setItems(cached);
      setLoading(false);
    }

    // Silent background refresh
    revalidate();

    const handleInventoryUpdated = () => {
      revalidate();
    };
    window.addEventListener("inventory-updated", handleInventoryUpdated);
    return () => window.removeEventListener("inventory-updated", handleInventoryUpdated);
  }, [shopId, revalidate]);

  return {
    items,
    setItems,
    loading,
    isRevalidating,
    refetch: revalidate,
  };
}
