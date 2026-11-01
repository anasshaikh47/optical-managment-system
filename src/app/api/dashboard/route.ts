import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [
      totalOrders,
      totalCustomers,
      products,
      orders,
      activeLabJobs,
      todayAppointments,
      settings,
    ] = await Promise.all([
      prisma.order.count(),
      prisma.customer.count(),
      prisma.product.findMany({ where: { isActive: true } }),
      prisma.order.findMany({
        include: {
          customer: true,
          prescription: true,
          items: true,
          payments: true,
          labJob: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.labJob.findMany({
        where: {
          status: { in: ["PENDING", "LENS_ORDERED", "IN_WORKSHOP", "FITTING"] },
        },
        include: {
          order: {
            include: { customer: true },
          },
        },
      }),
      prisma.appointment.findMany({
        include: { customer: true, optometrist: true },
        orderBy: [{ appointmentDate: "asc" }, { appointmentTime: "asc" }],
      }),
      prisma.storeSetting.findUnique({ where: { id: "default" } }),
    ]);

    // Financial calculations
    const totalRevenue = orders.reduce((acc, o) => acc + (o.paidAmount || 0), 0);
    const totalReceivables = orders.reduce((acc, o) => acc + (o.balanceAmount || 0), 0);
    const readyForPickupCount = orders.filter((o) => o.status === "READY_FOR_PICKUP").length;

    // Low stock items
    const lowStockItems = products.filter((p) => p.stockQuantity <= p.minStockAlert);

    // Sales by Category
    const categoryRevenue: Record<string, number> = {
      FRAME: 0,
      LENS: 0,
      CONTACT_LENS: 0,
      ACCESSORY: 0,
    };

    orders.forEach((order) => {
      order.items.forEach((item) => {
        const cat = item.category || "ACCESSORY";
        if (categoryRevenue[cat] !== undefined) {
          categoryRevenue[cat] += item.totalPrice;
        } else {
          categoryRevenue[cat] = (categoryRevenue[cat] || 0) + item.totalPrice;
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
          activeLabJobsCount: activeLabJobs.length,
          readyForPickupCount,
          lowStockCount: lowStockItems.length,
          totalProducts: products.length,
        },
        recentOrders: orders.slice(0, 5),
        activeLabJobs: activeLabJobs.slice(0, 5),
        todayAppointments: todayAppointments.slice(0, 5),
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
