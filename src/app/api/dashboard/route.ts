import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [
      totalOrders,
      totalCustomers,
      inventoryItems,
      orders,
      settings,
    ] = await Promise.all([
      prisma.order.count(),
      prisma.customer.count(),
      prisma.inventoryItem.findMany(),
      prisma.order.findMany({
        include: {
          customer: true,
          prescription: true,
          items: {
            include: { item: true },
          },
          payments: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.storeSetting.findUnique({ where: { id: "default" } }),
    ]);

    const totalRevenue = orders.reduce((acc, o) => acc + (o.paid_amount || 0), 0);
    const totalReceivables = orders.reduce((acc, o) => acc + (o.balance_amount || 0), 0);
    const readyForPickupCount = orders.filter((o) => o.status === "READY_FOR_PICKUP").length;
    const inWorkshopCount = orders.filter((o) => o.status === "LENS_PROCESSING" || o.status === "FITTING").length;

    const lowStockItems = inventoryItems.filter((i) => i.stock_quantity <= i.min_alert_threshold);

    // Sales by Type
    const categoryRevenue: Record<string, number> = {
      FRAME: 0,
      LENS: 0,
      CONTACT_LENS: 0,
      ACCESSORY: 0,
    };

    orders.forEach((order) => {
      order.items.forEach((oi) => {
        const type = oi.item?.type || "ACCESSORY";
        if (categoryRevenue[type] !== undefined) {
          categoryRevenue[type] += oi.subtotal;
        } else {
          categoryRevenue[type] = (categoryRevenue[type] || 0) + oi.subtotal;
        }
      });
    });

    return NextResponse.json({
      success: true,
      data: {
        metrics: {
          totalRevenue,
          totalReceivables,
          totalOrders,
          totalCustomers,
          inWorkshopCount,
          readyForPickupCount,
          lowStockCount: lowStockItems.length,
          totalProducts: inventoryItems.length,
        },
        recentOrders: orders.slice(0, 5),
        activeWorkshopOrders: orders.filter((o) => ["PLACED", "LENS_PROCESSING", "FITTING"].includes(o.status)).slice(0, 5),
        lowStockAlerts: lowStockItems.slice(0, 6),
        categoryRevenue,
        storeSetting: settings,
      },
    });
  } catch (error: any) {
    console.error("Dashboard error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
