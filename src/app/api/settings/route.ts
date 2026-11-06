import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  getShopIdFromRequest,
  loadTenantState,
  saveTenantState,
} from "@/lib/tenant/store";

export async function GET(request: Request) {
  try {
    const shopId = getShopIdFromRequest(request);

    try {
      let dbSetting = await prisma.storeSetting.findUnique({
        where: { id: shopId },
      });

      if (!dbSetting && shopId !== "default") {
        dbSetting = await prisma.storeSetting.findUnique({
          where: { id: "default" },
        });
      }

      if (!dbSetting) {
        dbSetting = await prisma.storeSetting.findFirst();
      }

      if (dbSetting) {
        return NextResponse.json({ success: true, data: dbSetting });
      }
    } catch (dbErr) {
      console.warn("Prisma GET settings fallback to tenant cache:", dbErr);
    }

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

    const parsedRate =
      body.defaultGstRate !== undefined
        ? parseFloat(body.defaultGstRate) || 0
        : undefined;

    try {
      const updated = await prisma.storeSetting.upsert({
        where: { id: shopId },
        create: {
          id: shopId,
          storeName: body.storeName || "VisionPulse Eyewear Studio",
          tagline: body.tagline ?? "Precision Optometry & Designer Eyewear",
          gstin: body.gstin ?? "",
          phone: body.phone ?? "",
          email: body.email ?? "",
          address: body.address ?? "",
          currencySymbol: body.currencySymbol || "₹",
          currencyCode: body.currencyCode || "INR",
          defaultGstRate: parsedRate !== undefined ? parsedRate : 12.0,
          receiptFooter: body.receiptFooter ?? "",
        },
        update: {
          ...(body.storeName !== undefined && { storeName: body.storeName }),
          ...(body.tagline !== undefined && { tagline: body.tagline }),
          ...(body.gstin !== undefined && { gstin: body.gstin }),
          ...(body.phone !== undefined && { phone: body.phone }),
          ...(body.email !== undefined && { email: body.email }),
          ...(body.address !== undefined && { address: body.address }),
          ...(body.currencySymbol !== undefined && { currencySymbol: body.currencySymbol }),
          ...(body.currencyCode !== undefined && { currencyCode: body.currencyCode }),
          ...(parsedRate !== undefined && { defaultGstRate: parsedRate }),
          ...(body.receiptFooter !== undefined && { receiptFooter: body.receiptFooter }),
        },
      });

      // Synchronize warm tenant cache
      try {
        const tenant = loadTenantState(shopId);
        tenant.settings = {
          ...tenant.settings,
          ...updated,
          shopId,
          updatedAt: updated.updatedAt.toISOString(),
        };
        saveTenantState(tenant);
      } catch {}

      return NextResponse.json({ success: true, data: updated });
    } catch (dbErr) {
      console.warn("Prisma PATCH settings fallback:", dbErr);
      const tenant = loadTenantState(shopId);
      tenant.settings = {
        ...tenant.settings,
        ...body,
        defaultGstRate:
          parsedRate !== undefined ? parsedRate : tenant.settings.defaultGstRate,
        updatedAt: new Date().toISOString(),
      };
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
