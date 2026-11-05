import { NextResponse } from "next/server";
import { getShopIdFromRequest, loadTenantState } from "@/lib/tenant/store";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const query = searchParams.get("query");
    const shopId = getShopIdFromRequest(request);

    const tenant = loadTenantState(shopId);
    let list = tenant.orders.map((o) => {
      const customer = tenant.customers.find((c) => c.id === o.customerId);
      const prescription = tenant.prescriptions.find((p) => p.id === o.prescriptionId);
      const items = o.items.map((it) => ({
        ...it,
        item: tenant.inventory.find((inv) => inv.id === it.itemId),
      }));
      const payments = tenant.payments.filter((p) => p.orderId === o.id);
      return { ...o, customer, prescription, items, payments };
    });

    if (status && status !== "ALL") {
      list = list.filter((o) => o.status === status);
    }

    if (query) {
      const q = query.toLowerCase();
      list = list.filter(
        (o) =>
          o.bill_no.toLowerCase().includes(q) ||
          (o.customer && o.customer.name.toLowerCase().includes(q)) ||
          (o.customer && o.customer.phone.toLowerCase().includes(q))
      );
    }

    return NextResponse.json({ success: true, data: list });
  } catch (error: any) {
    console.error("Error fetching lab jobs:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch lab jobs" },
      { status: 500 }
    );
  }
}
