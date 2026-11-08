export { useDashboardData, DEFAULT_DASHBOARD_DATA, getCachedDashboard, setCachedDashboard } from "./useDashboardData";
export { useCustomers, getCachedCustomers, setCachedCustomers } from "./useCustomers";
export { useCustomerProfile, getCachedCustomerDetail, setCachedCustomerDetail, prefetchCustomerProfile } from "./useCustomerProfile";
export { useInventory, getCachedInventory, setCachedInventory } from "./useInventory";
export { useOrders, getCachedOrders, setCachedOrders } from "./useOrders";
export {
  computeSalesBreakdown,
  filterOrdersByPeriod,
  getOrderNetPayable,
  getPeriodSubtitle,
  type SalesPeriodFilter,
  type CategoryBreakdownItem,
  type SalesBreakdownResult,
} from "@/lib/salesBreakdown";
