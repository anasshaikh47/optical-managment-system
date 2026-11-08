export type SalesPeriodFilter = "ALL_TIME" | "TODAY" | "THIS_WEEK" | "THIS_MONTH";

export function getOrderNetPayable(order: any): number {
  if (!order || order.status === "CANCELLED") return 0;

  // Final Payable = Subtotal + GST/Taxes - Discount
  // If final_payable or totalAmount is stored directly on the order:
  if (typeof order.final_payable === "number" && !isNaN(order.final_payable)) {
    return order.final_payable;
  }
  if (typeof order.totalAmount === "number" && !isNaN(order.totalAmount)) {
    return order.totalAmount;
  }

  const subtotal = parseFloat(order.subtotal ?? order.total_amount) || 0;
  const taxes = parseFloat(order.tax_amount ?? order.taxAmount) || 0;
  const discount = parseFloat(order.discount_amount ?? order.discountAmount) || 0;

  return Math.max(0, parseFloat((subtotal + taxes - discount).toFixed(2)));
}

export function getStartOfPeriod(period: SalesPeriodFilter): Date | null {
  const now = new Date();
  if (period === "TODAY") {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  }
  if (period === "THIS_WEEK") {
    // Current week starting from Monday 00:00:00 AM
    const day = now.getDay(); // 0 is Sunday, 1 is Monday...
    const diff = (day === 0 ? -6 : 1) - day;
    return new Date(now.getFullYear(), now.getMonth(), now.getDate() + diff, 0, 0, 0, 0);
  }
  if (period === "THIS_MONTH") {
    // 1st of current month 00:00:00 AM
    return new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  }
  return null;
}

export function filterOrdersByPeriod(orders: any[], period: SalesPeriodFilter): any[] {
  if (!Array.isArray(orders) || orders.length === 0) return [];
  if (period === "ALL_TIME") return orders;

  const startDate = getStartOfPeriod(period);
  if (!startDate) return orders;

  return orders.filter((order) => {
    if (!order.createdAt) return false;
    const orderDate = new Date(order.createdAt);
    return orderDate >= startDate;
  });
}

export interface CategoryBreakdownItem {
  name: string;
  label: string;
  value: number;
  percentage: number;
  color: string;
  count?: number;
}

export interface SalesBreakdownResult {
  totalAuditedRevenue: number;
  breakdown: CategoryBreakdownItem[];
  orderCount: number;
}

export function computeSalesBreakdown(orders: any[]): SalesBreakdownResult {
  let totalAuditedRevenue = 0;
  let framesAmount = 0;
  let framesCount = 0;
  let lensesAmount = 0;
  let lensesCount = 0;
  let servicesAmount = 0;
  let servicesCount = 0;
  let validOrderCount = 0;

  (orders || []).forEach((order) => {
    if (order.status === "CANCELLED") return;
    validOrderCount++;

    const netPayable = getOrderNetPayable(order);
    totalAuditedRevenue += netPayable;

    const orderItems =
      order.items && order.items.length > 0
        ? order.items
        : Array.isArray(order.itemsJson)
        ? order.itemsJson
        : [];

    let orderRawFrames = 0;
    let orderFramesQty = 0;
    let orderRawLenses = 0;
    let orderLensesQty = 0;
    let orderRawServices = 0;
    let orderServicesQty = 0;

    orderItems.forEach((oi: any) => {
      const type = (oi.item?.type || oi.type || "").toUpperCase();
      const qty = parseInt(oi.quantity, 10) || 1;
      const subtotal = parseFloat(oi.subtotal) || (parseFloat(oi.unit_price || 0) * qty);
      const coating = parseFloat(oi.coating_charges) || 0;
      const fitting = parseFloat(oi.fitting_charges) || 0;
      const serviceCharges = coating + fitting;

      if (type === "FRAME" || type === "SUNGLASSES" || type === "ACCESSORY") {
        orderRawFrames += subtotal;
        orderFramesQty += qty;
      } else if (type === "LENS" || type === "CONTACT_LENS") {
        orderRawLenses += subtotal;
        orderLensesQty += qty;
      } else if (type === "SERVICE" || type === "REPAIR") {
        orderRawServices += subtotal;
        orderServicesQty += qty;
      } else {
        orderRawFrames += subtotal;
        orderFramesQty += qty;
      }

      if (serviceCharges > 0) {
        orderRawServices += serviceCharges;
        orderServicesQty += 1;
      }
    });

    framesCount += orderFramesQty;
    lensesCount += orderLensesQty;
    servicesCount += orderServicesQty;

    const rawTotal = orderRawFrames + orderRawLenses + orderRawServices;

    if (rawTotal > 0) {
      // Distribute order-level discounts and taxes proportionally across item categories
      // so category values sum up strictly to netPayable
      const ratio = netPayable / rawTotal;
      framesAmount += orderRawFrames * ratio;
      lensesAmount += orderRawLenses * ratio;
      servicesAmount += orderRawServices * ratio;
    } else {
      // If order has no detailed item lines, allocate netPayable to Frames
      framesAmount += netPayable;
      if (framesCount === 0) framesCount = 1;
    }
  });

  // Round amounts to 2 decimal places
  framesAmount = Math.round(framesAmount * 100) / 100;
  lensesAmount = Math.round(lensesAmount * 100) / 100;
  servicesAmount = Math.round(servicesAmount * 100) / 100;
  totalAuditedRevenue = Math.round(totalAuditedRevenue * 100) / 100;

  // Clean rounding discrepancy so sum(categories) === totalAuditedRevenue exactly
  const sumCats = Math.round((framesAmount + lensesAmount + servicesAmount) * 100) / 100;
  const diff = Math.round((totalAuditedRevenue - sumCats) * 100) / 100;
  if (Math.abs(diff) > 0 && Math.abs(diff) < 1) {
    if (framesAmount >= lensesAmount && framesAmount >= servicesAmount) {
      framesAmount = Math.max(0, framesAmount + diff);
    } else if (lensesAmount >= servicesAmount) {
      lensesAmount = Math.max(0, lensesAmount + diff);
    } else {
      servicesAmount = Math.max(0, servicesAmount + diff);
    }
  }

  const breakdown: CategoryBreakdownItem[] = [];
  if (totalAuditedRevenue > 0) {
    const calcPct = (val: number) => Math.min(100, Math.max(0, Math.round((val / totalAuditedRevenue) * 100)));
    let pFrames = calcPct(framesAmount);
    let pLenses = calcPct(lensesAmount);
    let pServices = calcPct(servicesAmount);

    // Ensure percentage sum is exactly 100%
    const pSum = pFrames + pLenses + pServices;
    if (pSum !== 100 && (pFrames > 0 || pLenses > 0 || pServices > 0)) {
      const pDiff = 100 - pSum;
      if (pFrames >= pLenses && pFrames >= pServices) pFrames += pDiff;
      else if (pLenses >= pServices) pLenses += pDiff;
      else pServices += pDiff;
    }

    breakdown.push({
      name: "Frames",
      label: "Spectacle Frames",
      value: framesAmount,
      count: framesCount,
      percentage: pFrames,
      color: "#2563EB",
    });
    breakdown.push({
      name: "Lenses",
      label: "Prescription Lenses",
      value: lensesAmount,
      count: lensesCount,
      percentage: pLenses,
      color: "#10B981",
    });
    breakdown.push({
      name: "Services/Repairing",
      label: "Fitting, Lab & Repairs",
      value: servicesAmount,
      count: servicesCount,
      percentage: pServices,
      color: "#F59E0B",
    });
  }

  return {
    totalAuditedRevenue,
    breakdown,
    orderCount: validOrderCount,
  };
}

export function getPeriodSubtitle(period: SalesPeriodFilter): string {
  switch (period) {
    case "TODAY":
      return "Showing Today's Closed Bills";
    case "THIS_WEEK":
      return "Showing This Week's Net Sales";
    case "THIS_MONTH":
      return "Showing This Month's Net Sales";
    case "ALL_TIME":
    default:
      return "Showing All Time Net Sales";
  }
}
