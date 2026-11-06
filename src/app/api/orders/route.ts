import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getShopIdFromRequest, loadTenantState, saveTenantState } from "@/lib/tenant/store";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const query = searchParams.get("query");
    const customerId = searchParams.get("customerId");
    const shopId = getShopIdFromRequest(request);

    try {
      const where: any = {
        OR: [
          { shopId },
          { userId: shopId },
          ...(shopId === "default" ? [{ shopId: "default" }] : []),
        ],
      };

      if (status && status !== "ALL") {
        where.status = status;
      }

      if (customerId) {
        where.customerId = customerId;
      }

      if (query && query.trim()) {
        const q = query.trim();
        where.AND = [
          {
            OR: [
              { bill_no: { contains: q, mode: "insensitive" } },
              { customerName: { contains: q, mode: "insensitive" } },
              { customerPhone: { contains: q, mode: "insensitive" } },
              { customer: { name: { contains: q, mode: "insensitive" } } },
              { customer: { phone: { contains: q, mode: "insensitive" } } },
            ],
          },
        ];
      }

      const dbOrders = await prisma.order.findMany({
        where,
        include: {
          customer: true,
          prescription: true,
          items: {
            include: {
              item: true,
            },
          },
          payments: {
            orderBy: { createdAt: "desc" },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      const list = dbOrders.map((o) => {
        const subtotal = o.subtotal ?? o.total_amount;
        const totalAmount = o.totalAmount ?? o.final_payable;
        const paidAmount = o.paidAmount ?? o.paid_amount;
        const pendingAmount = o.pendingAmount ?? o.balance_amount;
        const taxAmount = o.taxAmount ?? o.tax_amount;

        return {
          ...o,
          subtotal,
          totalAmount,
          paidAmount,
          pendingAmount,
          taxAmount,
          customerName: o.customerName || o.customer?.name || "",
          customerPhone: o.customerPhone || o.customer?.phone || "",
          delivery_due_date: o.delivery_due_date ? o.delivery_due_date.toISOString() : null,
          createdAt: o.createdAt.toISOString(),
          updatedAt: o.updatedAt.toISOString(),
          customer: o.customer
            ? {
                ...o.customer,
                dob: o.customer.dob ? o.customer.dob.toISOString() : null,
                createdAt: o.customer.createdAt.toISOString(),
                updatedAt: o.customer.updatedAt.toISOString(),
              }
            : null,
          prescription: o.prescription
            ? {
                ...o.prescription,
                createdAt: o.prescription.createdAt.toISOString(),
                updatedAt: o.prescription.updatedAt.toISOString(),
              }
            : null,
          items: o.items.map((it) => ({
            ...it,
            createdAt: it.createdAt.toISOString(),
            item: it.item
              ? {
                  ...it.item,
                  createdAt: it.item.createdAt.toISOString(),
                  updatedAt: it.item.updatedAt.toISOString(),
                }
              : null,
          })),
          payments: o.payments.map((p) => ({
            ...p,
            createdAt: p.createdAt.toISOString(),
          })),
        };
      });

      // Keep tenant cache synced
      try {
        const tenant = loadTenantState(shopId);
        tenant.orders = list as any;
        saveTenantState(tenant);
      } catch {}

      return NextResponse.json({ success: true, data: list });
    } catch (dbError: any) {
      console.warn("Prisma GET orders fallback:", dbError.message);
      const tenant = loadTenantState(shopId);
      let list = tenant.orders.map((o) => {
        const customer = tenant.customers.find((c) => c.id === o.customerId);
        const prescription = tenant.prescriptions.find((p) => p.id === o.prescriptionId);
        const items = o.items.map((it) => ({
          ...it,
          item: tenant.inventory.find((inv) => inv.id === it.itemId),
        }));
        const payments = tenant.payments.filter((p) => p.orderId === o.id);

        return {
          ...o,
          customer,
          prescription,
          items,
          payments,
        };
      });

      if (status && status !== "ALL") {
        list = list.filter((o) => o.status === status);
      }

      if (customerId) {
        list = list.filter((o) => o.customerId === customerId);
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
    }
  } catch (error: any) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const shopId = getShopIdFromRequest(request);
    const body = await request.json();
    const {
      customerId,
      customerName,
      customerPhone,
      prescriptionId: existingPrescriptionId,
      prescriptionData,
      items, // array of { itemId, quantity, unit_price, coating_charges, fitting_charges }
      total_amount,
      subtotal,
      discount_amount = 0,
      discountAmount = 0,
      tax_amount = 0,
      taxAmount = 0,
      final_payable,
      totalAmount,
      paid_amount = 0,
      paidAmount = 0,
      method = "UPI",
      transaction_ref,
      delivery_due_date: customDeliveryDate,
      deliveryDays = 2,
      status = "PLACED",
    } = body;

    if (!customerId) {
      return NextResponse.json(
        { success: false, error: "Please select or register a customer" },
        { status: 400 }
      );
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: "Checkout cart cannot be empty" },
        { status: 400 }
      );
    }

    // Retrieve customer record to guarantee valid foreign key & contact details
    let customer = await prisma.customer.findFirst({
      where: { id: customerId },
    });

    if (!customer) {
      // If customer was in tenant store, insert it to database
      const tenant = loadTenantState(shopId);
      const cachedCust = tenant.customers.find((c) => c.id === customerId);
      if (cachedCust) {
        customer = await prisma.customer.create({
          data: {
            id: cachedCust.id,
            name: cachedCust.name,
            phone: cachedCust.phone,
            email: cachedCust.email || null,
            address: cachedCust.address || null,
            loyalty_points: cachedCust.loyalty_points || 0,
            shopId,
            userId: shopId,
          },
        });
      } else {
        return NextResponse.json(
          { success: false, error: "Selected customer does not exist in the database." },
          { status: 404 }
        );
      }
    }

    // Optional inline prescription creation
    let finalRxId = existingPrescriptionId || null;
    if (prescriptionData && !finalRxId) {
      const createdRx = await prisma.prescription.create({
        data: {
          customerId,
          optometristName: prescriptionData.optometristName || "Dr. Staff Optometrist",
          od_sph: prescriptionData.od_sph !== "" && prescriptionData.od_sph !== undefined ? parseFloat(prescriptionData.od_sph) : null,
          od_cyl: prescriptionData.od_cyl !== "" && prescriptionData.od_cyl !== undefined ? parseFloat(prescriptionData.od_cyl) : null,
          od_axis: prescriptionData.od_axis !== "" && prescriptionData.od_axis !== undefined ? parseInt(prescriptionData.od_axis, 10) : null,
          od_add: prescriptionData.od_add !== "" && prescriptionData.od_add !== undefined ? parseFloat(prescriptionData.od_add) : null,
          os_sph: prescriptionData.os_sph !== "" && prescriptionData.os_sph !== undefined ? parseFloat(prescriptionData.os_sph) : null,
          os_cyl: prescriptionData.os_cyl !== "" && prescriptionData.os_cyl !== undefined ? parseFloat(prescriptionData.os_cyl) : null,
          os_axis: prescriptionData.os_axis !== "" && prescriptionData.os_axis !== undefined ? parseInt(prescriptionData.os_axis, 10) : null,
          os_add: prescriptionData.os_add !== "" && prescriptionData.os_add !== undefined ? parseFloat(prescriptionData.os_add) : null,
          pd_distance: prescriptionData.pd_distance !== "" && prescriptionData.pd_distance !== undefined ? parseFloat(prescriptionData.pd_distance) : null,
          pd_near: prescriptionData.pd_near !== "" && prescriptionData.pd_near !== undefined ? parseFloat(prescriptionData.pd_near) : null,
          lens_type: prescriptionData.lens_type || "SINGLE_VISION",
          notes: prescriptionData.notes || null,
        },
      });
      finalRxId = createdRx.id;
    }

    const subtotalNum = parseFloat(subtotal ?? total_amount) || 0;
    const discountNum = parseFloat(discountAmount ?? discount_amount) || 0;
    const taxNum = parseFloat(taxAmount ?? tax_amount) || 0;
    const finalPayableNum = parseFloat(totalAmount ?? final_payable) || 0;
    const paidAmountNum = parseFloat(paidAmount ?? paid_amount) || 0;
    const balanceAmountNum = Math.max(0, parseFloat((finalPayableNum - paidAmountNum).toFixed(2)));

    const hasRx = !!finalRxId;
    let orderStatus = status;
    if (orderStatus === "PLACED" && hasRx) {
      orderStatus = "LENS_PROCESSING";
    } else if (balanceAmountNum <= 0 && !hasRx && orderStatus === "PLACED") {
      orderStatus = "DELIVERED";
    }

    // Decrement inventory stock in database for purchased items
    for (const item of items) {
      if (item.itemId) {
        const qty = parseInt(item.quantity, 10) || 1;
        try {
          await prisma.inventoryItem.update({
            where: { id: item.itemId },
            data: {
              stock_quantity: {
                decrement: qty,
              },
            },
          });
        } catch (invErr) {
          console.warn(`Could not decrement DB inventory for itemId ${item.itemId}:`, invErr);
        }
      }
    }

    // Generate unique bill number
    const year = new Date().getFullYear();
    const orderCount = await prisma.order.count({ where: { shopId } });
    let bill_no = `VP-${year}-${String(orderCount + 1).padStart(4, "0")}`;
    let existingOrderWithBill = await prisma.order.findUnique({ where: { bill_no } });
    let inc = 1;
    while (existingOrderWithBill) {
      bill_no = `VP-${year}-${String(orderCount + inc + 1).padStart(4, "0")}`;
      existingOrderWithBill = await prisma.order.findUnique({ where: { bill_no } });
      inc++;
    }

    const deliveryDateObj = customDeliveryDate
      ? new Date(customDeliveryDate)
      : new Date(Date.now() + (deliveryDays || 2) * 24 * 60 * 60 * 1000);

    const resolvedCustomerName = customerName || customer.name;
    const resolvedCustomerPhone = customerPhone || customer.phone;

    // Insert Order with OrderItems and Payments in Prisma
    const newOrder = await prisma.order.create({
      data: {
        bill_no,
        shopId,
        userId: shopId,
        customerId,
        customerName: resolvedCustomerName,
        customerPhone: resolvedCustomerPhone,
        prescriptionId: finalRxId,
        status: orderStatus,
        total_amount: subtotalNum,
        subtotal: subtotalNum,
        discount_amount: discountNum,
                tax_amount: taxNum,
        taxAmount: taxNum,
        final_payable: finalPayableNum,
        totalAmount: finalPayableNum,
        paid_amount: paidAmountNum,
        paidAmount: paidAmountNum,
        balance_amount: balanceAmountNum,
        pendingAmount: balanceAmountNum,
        delivery_due_date: deliveryDateObj,
        itemsJson: items,
        items: {
          create: items.map((it: any) => {
            const q = parseInt(it.quantity, 10) || 1;
            const up = parseFloat(it.unit_price) || 0;
            const cc = parseFloat(it.coating_charges) || 0;
            const fc = parseFloat(it.fitting_charges) || 0;
            return {
              itemId: it.itemId || null,
              quantity: q,
              unit_price: up,
              coating_charges: cc,
              fitting_charges: fc,
              subtotal: up * q + cc + fc,
            };
          }),
        },
        payments:
          paidAmountNum > 0
            ? {
                create: [
                  {
                    method: method || "UPI",
                    amount: paidAmountNum,
                    payment_type: paidAmountNum >= finalPayableNum ? "FULL" : "ADVANCE",
                    transaction_ref: transaction_ref || null,
                  },
                ],
              }
            : undefined,
      },
      include: {
        customer: true,
        prescription: true,
        items: {
          include: {
            item: true,
          },
        },
        payments: true,
      },
    });

    // Award loyalty points to customer
    if (paidAmountNum > 0) {
      try {
        await prisma.customer.update({
          where: { id: customerId },
          data: {
            loyalty_points: {
              increment: Math.floor(paidAmountNum / 100),
            },
          },
        });
      } catch (err) {
        console.warn("Could not award loyalty points:", err);
      }
    }

    const serializedOrder = {
      ...newOrder,
      subtotal: subtotalNum,
      totalAmount: finalPayableNum,
      paidAmount: paidAmountNum,
      pendingAmount: balanceAmountNum,
      taxAmount: taxNum,
      customerName: resolvedCustomerName,
      customerPhone: resolvedCustomerPhone,
      delivery_due_date: newOrder.delivery_due_date ? newOrder.delivery_due_date.toISOString() : null,
      createdAt: newOrder.createdAt.toISOString(),
      updatedAt: newOrder.updatedAt.toISOString(),
      customer: newOrder.customer
        ? {
            ...newOrder.customer,
            dob: newOrder.customer.dob ? newOrder.customer.dob.toISOString() : null,
            createdAt: newOrder.customer.createdAt.toISOString(),
            updatedAt: newOrder.customer.updatedAt.toISOString(),
          }
        : null,
      prescription: newOrder.prescription
        ? {
            ...newOrder.prescription,
            createdAt: newOrder.prescription.createdAt.toISOString(),
            updatedAt: newOrder.prescription.updatedAt.toISOString(),
          }
        : null,
      items: newOrder.items.map((it) => ({
        ...it,
        createdAt: it.createdAt.toISOString(),
        item: it.item
          ? {
              ...it.item,
              createdAt: it.item.createdAt.toISOString(),
              updatedAt: it.item.updatedAt.toISOString(),
            }
          : null,
      })),
      payments: newOrder.payments.map((p) => ({
        ...p,
        createdAt: p.createdAt.toISOString(),
      })),
    };

    // Keep tenant cache synced
    try {
      const tenant = loadTenantState(shopId);
      tenant.orders.unshift(serializedOrder as any);
      saveTenantState(tenant);
    } catch {}

    return NextResponse.json({ success: true, data: serializedOrder }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating order:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process and persist order in database" },
      { status: 500 }
    );
  }
}
