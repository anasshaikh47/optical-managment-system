import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getShopIdFromRequest,
  loadTenantState,
  saveTenantState,
} from "@/lib/tenant/store";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const shopId = getShopIdFromRequest(request);

    if (shopId !== "default") {
      const tenant = loadTenantState(shopId);
      const item = tenant.medicines.find((i) => i.id === id);
      if (!item) {
        return NextResponse.json(
          { success: false, error: "Medicine item not found" },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, data: item });
    }

    try {
      const item = await prisma.medicine.findUnique({
        where: { id },
        include: { batches: true },
      });

      if (!item) {
        return NextResponse.json(
          { success: false, error: "Medicine item not found" },
          { status: 404 }
        );
      }

      const mapped = {
        ...item,
        brand: item.name,
        model: item.genericSaltName,
        type: item.packType,
        cost_price: item.purchaseRate,
        selling_price: item.saleRate,
        stock_quantity: item.stripQuantity,
        min_alert_threshold: item.minStockAlert,
      };

      return NextResponse.json({ success: true, data: mapped });
    } catch {
      const tenant = loadTenantState("default");
      const item = tenant.medicines.find((i) => i.id === id);
      if (!item) {
        return NextResponse.json(
          { success: false, error: "Medicine item not found" },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, data: item });
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const shopId = getShopIdFromRequest(request);
    const body = await request.json();

    if (shopId !== "default") {
      const tenant = loadTenantState(shopId);
      const index = tenant.medicines.findIndex((i) => i.id === id);
      if (index === -1) {
        return NextResponse.json(
          { success: false, error: "Medicine item not found" },
          { status: 404 }
        );
      }

      const current = tenant.medicines[index];
      const updated = {
        ...current,
        ...body,
        name: body.name || body.brand || current.name,
        genericSaltName: body.genericSaltName || body.model || current.genericSaltName,
        packType: body.packType || body.type || current.packType,
        purchaseRate:
          body.purchaseRate !== undefined
            ? parseFloat(body.purchaseRate)
            : body.cost_price !== undefined
            ? parseFloat(body.cost_price)
            : current.purchaseRate,
        saleRate:
          body.saleRate !== undefined
            ? parseFloat(body.saleRate)
            : body.selling_price !== undefined
            ? parseFloat(body.selling_price)
            : current.saleRate,
        stripQuantity:
          body.stripQuantity !== undefined
            ? parseInt(body.stripQuantity, 10)
            : body.stock_quantity !== undefined
            ? parseInt(body.stock_quantity, 10)
            : current.stripQuantity,
        looseTabletQuantity:
          body.looseTabletQuantity !== undefined
            ? parseInt(body.looseTabletQuantity, 10)
            : current.looseTabletQuantity,
        minStockAlert:
          body.minStockAlert !== undefined
            ? parseInt(body.minStockAlert, 10)
            : body.min_alert_threshold !== undefined
            ? parseInt(body.min_alert_threshold, 10)
            : current.minStockAlert,
        gstRate: body.gstRate !== undefined ? parseFloat(body.gstRate) : current.gstRate,
        batchNumber: body.batchNumber || current.batchNumber,
        expiryDate: body.expiryDate || current.expiryDate,
        rackLocation: body.rackLocation || current.rackLocation,
        // compatibility
        brand: body.name || body.brand || current.name,
        model: body.genericSaltName || body.model || current.genericSaltName,
        type: body.packType || body.type || current.packType,
        cost_price: body.purchaseRate !== undefined ? parseFloat(body.purchaseRate) : current.purchaseRate,
        selling_price: body.saleRate !== undefined ? parseFloat(body.saleRate) : current.saleRate,
        stock_quantity: body.stripQuantity !== undefined ? parseInt(body.stripQuantity, 10) : current.stripQuantity,
        min_alert_threshold: body.minStockAlert !== undefined ? parseInt(body.minStockAlert, 10) : current.minStockAlert,
        updatedAt: new Date().toISOString(),
      };

      tenant.medicines[index] = updated;
      tenant.inventory = tenant.medicines;
      saveTenantState(tenant);

      return NextResponse.json({ success: true, data: updated });
    }

    try {
      const updateData: any = {
        ...body,
      };

      if (body.brand && !body.name) updateData.name = body.brand;
      if (body.model && !body.genericSaltName) updateData.genericSaltName = body.model;
      if (body.type && !body.packType) updateData.packType = body.type;
      if (body.cost_price !== undefined && body.purchaseRate === undefined) {
        updateData.purchaseRate = parseFloat(body.cost_price);
      }
      if (body.selling_price !== undefined && body.saleRate === undefined) {
        updateData.saleRate = parseFloat(body.selling_price);
      }
      if (body.stock_quantity !== undefined && body.stripQuantity === undefined) {
        updateData.stripQuantity = parseInt(body.stock_quantity, 10);
      }
      if (body.min_alert_threshold !== undefined && body.minStockAlert === undefined) {
        updateData.minStockAlert = parseInt(body.min_alert_threshold, 10);
      }
      if (body.gst_rate !== undefined && body.gstRate === undefined) {
        updateData.gstRate = parseFloat(body.gst_rate);
      }

      // Remove optical legacy fields from Prisma update payload
      delete updateData.brand;
      delete updateData.model;
      delete updateData.type;
      delete updateData.cost_price;
      delete updateData.selling_price;
      delete updateData.stock_quantity;
      delete updateData.min_alert_threshold;
      delete updateData.gst_rate;
      delete updateData.color;
      delete updateData.size;
      delete updateData.lens_index;

      const updated = await prisma.medicine.update({
        where: { id },
        data: updateData,
      });

      const mapped = {
        ...updated,
        brand: updated.name,
        model: updated.genericSaltName,
        type: updated.packType,
        cost_price: updated.purchaseRate,
        selling_price: updated.saleRate,
        stock_quantity: updated.stripQuantity,
        min_alert_threshold: updated.minStockAlert,
      };

      return NextResponse.json({ success: true, data: mapped });
    } catch {
      const tenant = loadTenantState("default");
      const index = tenant.medicines.findIndex((i) => i.id === id);
      if (index !== -1) {
        tenant.medicines[index] = {
          ...tenant.medicines[index],
          ...body,
          updatedAt: new Date().toISOString(),
        };
        tenant.inventory = tenant.medicines;
        saveTenantState(tenant);
        return NextResponse.json({ success: true, data: tenant.medicines[index] });
      }
      return NextResponse.json({ success: false, error: "Medicine not found" }, { status: 404 });
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const shopId = getShopIdFromRequest(request);

    if (shopId !== "default") {
      const tenant = loadTenantState(shopId);
      tenant.medicines = tenant.medicines.filter((i) => i.id !== id);
      tenant.inventory = tenant.medicines;
      saveTenantState(tenant);
      return NextResponse.json({ success: true, message: "Medicine deleted successfully" });
    }

    try {
      await prisma.$transaction(async (tx) => {
        await tx.orderItem.deleteMany({ where: { medicineId: id } });
        await tx.batch.deleteMany({ where: { medicineId: id } });
        await tx.medicine.delete({ where: { id } });
      });
      return NextResponse.json({ success: true, message: "Medicine deleted successfully" });
    } catch {
      const tenant = loadTenantState("default");
      tenant.medicines = tenant.medicines.filter((i) => i.id !== id);
      tenant.inventory = tenant.medicines;
      saveTenantState(tenant);
      return NextResponse.json({ success: true, message: "Medicine deleted successfully" });
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
