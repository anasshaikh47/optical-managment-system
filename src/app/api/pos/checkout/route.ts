import { NextResponse } from "next/server";
import {
  getShopIdFromRequest,
  loadTenantState,
  saveTenantState,
  TenantOrder,
  TenantOrderItem,
  TenantPayment,
  TenantPrescription,
} from "@/lib/tenant/store";

export async function POST(request: Request) {
  try {
    const shopId = getShopIdFromRequest(request);
    const body = await request.json();
    const {
      customerId,
      prescriptionId: existingPrescriptionId,
      prescriptionData, // Optional inline prescription object
      items, // array of { itemId, quantity, unit_price, coating_charges, fitting_charges }
      total_amount, // subtotal
      discount_amount = 0,
      tax_amount = 0,
      final_payable,
      paid_amount = 0,
      method = "UPI", // 'CASH' | 'UPI' | 'CARD'
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

    if (!items || items.length === 0) {
      return NextResponse.json(
        { success: false, error: "Checkout cart cannot be empty" },
        { status: 400 }
      );
    }

    const finalPayableNum = parseFloat(final_payable) || 0;
    const paidAmountNum = parseFloat(paid_amount) || 0;
    const balanceAmountNum = Math.max(0, finalPayableNum - paidAmountNum);

    let payment_type = "FULL";
    if (paidAmountNum <= 0) {
      payment_type = "ADVANCE";
    } else if (paidAmountNum < finalPayableNum) {
      payment_type = "ADVANCE";
    }

    const hasRx = !!existingPrescriptionId || !!prescriptionData;
    let orderStatus = status;
    if (orderStatus === "PLACED" && hasRx) {
      orderStatus = "LENS_PROCESSING";
    } else if (balanceAmountNum <= 0 && !hasRx) {
      orderStatus = "DELIVERED";
    }

    const year = new Date().getFullYear();
    const tenant = loadTenantState(shopId);
    const count = tenant.orders.length;
    const bill_no = `VP-${year}-${String(count + 1).padStart(4, "0")}`;
    const orderId = `ord-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const now = new Date().toISOString();

    let finalRxId = existingPrescriptionId || null;
    if (prescriptionData && !finalRxId) {
      finalRxId = `rx-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
      const newRx: TenantPrescription = {
        id: finalRxId,
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
        shopId,
        createdAt: now,
        updatedAt: now,
      };
      tenant.prescriptions.unshift(newRx);
    }

    const orderItems: TenantOrderItem[] = [];
    for (const item of items) {
      const qty = parseInt(item.quantity, 10) || 1;
      const unitPrice = parseFloat(item.unit_price) || 0;
      const coating = parseFloat(item.coating_charges) || 0;
      const fitting = parseFloat(item.fitting_charges) || 0;
      const subtotal = unitPrice * qty + coating + fitting;

      orderItems.push({
        id: `item-order-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        orderId,
        itemId: item.itemId,
        quantity: qty,
        unit_price: unitPrice,
        coating_charges: coating,
        fitting_charges: fitting,
        subtotal,
        createdAt: now,
      });

      // Decrement stock in tenant inventory
      const inv = tenant.inventory.find((i) => i.id === item.itemId);
      if (inv) {
        inv.stock_quantity = Math.max(0, inv.stock_quantity - qty);
        inv.updatedAt = now;
      }
    }

    const orderPayments: TenantPayment[] = [];
    if (paidAmountNum > 0) {
      const pay: TenantPayment = {
        id: `pay-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        orderId,
        method,
        amount: paidAmountNum,
        payment_type,
        transaction_ref: transaction_ref || null,
        createdAt: now,
      };
      orderPayments.push(pay);
      tenant.payments.unshift(pay);

      // Loyalty points
      const cust = tenant.customers.find((c) => c.id === customerId);
      if (cust) {
        cust.loyalty_points += Math.floor(paidAmountNum / 100);
        cust.updatedAt = now;
      }
    }

    const newOrder: TenantOrder = {
      id: orderId,
      bill_no,
      customerId,
      prescriptionId: finalRxId,
      status: orderStatus,
      total_amount: parseFloat(total_amount) || 0,
      discount_amount: parseFloat(discount_amount) || 0,
      tax_amount: parseFloat(tax_amount) || 0,
      final_payable: finalPayableNum,
      paid_amount: paidAmountNum,
      balance_amount: parseFloat(balanceAmountNum.toFixed(2)),
      delivery_due_date: customDeliveryDate
        ? new Date(customDeliveryDate).toISOString()
        : new Date(Date.now() + (deliveryDays || 2) * 24 * 60 * 60 * 1000).toISOString(),
      items: orderItems,
      payments: orderPayments,
      shopId,
      createdAt: now,
      updatedAt: now,
    };

    tenant.orders.unshift(newOrder);
    saveTenantState(tenant);

    const customer = tenant.customers.find((c) => c.id === customerId);
    const prescription = tenant.prescriptions.find((p) => p.id === finalRxId);
    const itemsWithDetails = orderItems.map((oi) => ({
      ...oi,
      item: tenant.inventory.find((i) => i.id === oi.itemId),
    }));

    return NextResponse.json(
      {
        success: true,
        data: {
          ...newOrder,
          customer,
          prescription,
          items: itemsWithDetails,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating order:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process order" },
      { status: 500 }
    );
  }
}
