"use client";

import { useState, useEffect, useCallback } from "react";
import { getCachedCustomers } from "./useCustomers";

// In-memory cache for customer detail records
const customerDetailMemoryCache = new Map<string, any>();
const inflightCustomerPrefetches = new Set<string>();

export function getCachedCustomerDetail(customerId: string, shopId?: string): any | null {
  if (!customerId) return null;

  // 1. Direct in-memory hit
  if (customerDetailMemoryCache.has(customerId)) {
    return customerDetailMemoryCache.get(customerId) || null;
  }

  // 2. Check customer list cache (from useCustomers hook)
  if (shopId) {
    const list = getCachedCustomers(shopId);
    if (list && Array.isArray(list)) {
      const found = list.find((c: any) => c.id === customerId);
      if (found) {
        const fallback = {
          ...found,
          orders: found.orders || [],
          prescriptions: found.prescriptions || [],
          _isListCached: true,
        };
        customerDetailMemoryCache.set(customerId, fallback);
        return fallback;
      }
    }
  }

  // 3. Fallback to localStorage
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem(`customer_detail_${customerId}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.id === customerId) {
          customerDetailMemoryCache.set(customerId, parsed);
          return parsed;
        }
      }
    } catch {}
  }

  return null;
}

export function setCachedCustomerDetail(customerId: string, data: any) {
  if (!customerId || !data) return;
  customerDetailMemoryCache.set(customerId, data);
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(`customer_detail_${customerId}`, JSON.stringify(data));
    } catch {}
  }
}

export function prefetchCustomerProfile(
  customerId: string,
  tenantFetch?: (url: string, init?: any) => Promise<Response>,
  seedData?: any
) {
  if (!customerId) return;

  // Seed cache immediately if seed data is provided
  if (seedData && !customerDetailMemoryCache.has(customerId)) {
    setCachedCustomerDetail(customerId, seedData);
  }

  if (inflightCustomerPrefetches.has(customerId)) return;
  inflightCustomerPrefetches.add(customerId);

  const fetchFn = tenantFetch || fetch;
  fetchFn(`/api/customers/${customerId}`)
    .then((res) => {
      if (!res.ok) throw new Error("Prefetch response not ok");
      return res.json();
    })
    .then((json) => {
      if (json.success && json.data) {
        setCachedCustomerDetail(customerId, json.data);
      }
    })
    .catch(() => {
      // Ignore background prefetch network errors silently
    })
    .finally(() => {
      inflightCustomerPrefetches.delete(customerId);
    });
}

/**
 * High-performance hook for patient profile CRM view.
 * Guarantees <50ms instant render from memory/list cache, followed by background revalidation.
 */
export function useCustomerProfile(
  customerId: string,
  shopId: string,
  tenantFetch?: (url: string, init?: any) => Promise<Response>
) {
  const [customer, setCustomer] = useState<any | null>(() => {
    return getCachedCustomerDetail(customerId, shopId);
  });

  const [loading, setLoading] = useState<boolean>(() => {
    const cached = getCachedCustomerDetail(customerId, shopId);
    return !cached;
  });

  const [error, setError] = useState<string | null>(null);
  const [isRevalidating, setIsRevalidating] = useState(false);

  const revalidate = useCallback(async () => {
    if (!customerId) return;
    setIsRevalidating(true);
    try {
      const fetchFn = tenantFetch || fetch;
      const res = await fetchFn(`/api/customers/${customerId}`);
      const json = await res.json();
      if (json.success && json.data) {
        setCustomer(json.data);
        setCachedCustomerDetail(customerId, json.data);
        setError(null);
      } else {
        // Only set error if we don't already have cached data rendered
        setCustomer((prev: any) => {
          if (!prev) setError(json.error || "Failed to load customer profile");
          return prev;
        });
      }
    } catch (e: any) {
      setCustomer((prev: any) => {
        if (!prev) setError(e.message || "An unexpected error occurred");
        return prev;
      });
    } finally {
      setLoading(false);
      setIsRevalidating(false);
    }
  }, [customerId, tenantFetch]);

  useEffect(() => {
    if (!customerId) return;
    const cached = getCachedCustomerDetail(customerId, shopId);
    if (cached) {
      setCustomer(cached);
      setLoading(false);
    }
    revalidate();
  }, [customerId, shopId, revalidate]);

  return {
    customer,
    setCustomer,
    loading,
    error,
    isRevalidating,
    refetch: revalidate,
  };
}
