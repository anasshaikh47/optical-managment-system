"use client";

import DashboardPage from "./dashboard/page";

// Re-export parallel Supabase query functions and SWR cache hook for ultra-fast loading
export {
  useDashboardData,
  fetchOrders,
  fetchCustomers,
  fetchStockSummary,
  loadDashboardDataParallel,
  getCachedDashboard,
  setCachedDashboard,
  getDashboardCacheKey,
  calculateDashboardMetrics,
  DEFAULT_DASHBOARD_DATA,
} from "@/hooks/useDashboardData";

export default function Home() {
  return <DashboardPage />;
}
