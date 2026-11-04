import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getShopIdFromRequest,
  loadTenantState,
  saveTenantState,
} from "@/lib/tenant/store";

export async function GET(request: Request) {
  try {
    const shopId = getShopIdFromRequest(request);

    if (shopId !== "default") {
      const tenant = loadTenantState(shopId);
      return NextResponse.json({ success: true, data: tenant.settings });
    }

    try {
      let settings = await prisma.storeSetting.findUnique({
        where: { id: "default" },
      });

      if (!settings) {
        settings = await prisma.storeSetting.create({
          data: { id: "default" },
        });
      }

      return NextResponse.json({ success: true, data: settings });
    } catch {
      const tenant = loadTenantState("default");
      return NextResponse.json({ success: true, data: tenant.settings });
    }
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

    if (shopId !== "default") {
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
    }

    try {
      const settings = await prisma.storeSetting.upsert({
        where: { id: "default" },
        update: {
          ...body,
          defaultGstRate: body.defaultGstRate !== undefined ? parseFloat(body.defaultGstRate) : undefined,
        },
        create: {
          id: "default",
          ...body,
          defaultGstRate: body.defaultGstRate !== undefined ? parseFloat(body.defaultGstRate) : 12.0,
        },
      });

      return NextResponse.json({ success: true, data: settings });
    } catch {
      const tenant = loadTenantState("default");
      tenant.settings = { ...tenant.settings, ...body, updatedAt: new Date().toISOString() };
      saveTenantState(tenant);
      return NextResponse.json({ success: true, data: tenant.settings });
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
