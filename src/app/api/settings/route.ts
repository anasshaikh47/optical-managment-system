import { NextResponse } from "next/server";
import {
  getShopIdFromRequest,
  loadTenantState,
  saveTenantState,
} from "@/lib/tenant/store";

export async function GET(request: Request) {
  try {
    const shopId = getShopIdFromRequest(request);
    const tenant = loadTenantState(shopId);
    return NextResponse.json({ success: true, data: tenant.settings });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const shopId = getShopIdFromRequest(request);
    const body = await request.json();

    const tenant = loadTenantState(shopId);
    tenant.settings = {
      ...tenant.settings,
      ...body,
      defaultGstRate:
        body.defaultGstRate !== undefined
          ? parseFloat(body.defaultGstRate)
          : tenant.settings.defaultGstRate,
      updatedAt: new Date().toISOString(),
    };
    saveTenantState(tenant);
    return NextResponse.json({ success: true, data: tenant.settings });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
