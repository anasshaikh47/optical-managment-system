import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
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
      prescriptionData, // Optional Doctor & Rx Details
      items, // array of { medicineId, itemId, quantity, unit_price, unitType, batchNumber, expiryDate, packType, subtotal }
      total_amount, // subtotal
      discount_amount = 0,
      tax_amount = 0,
      final_payable,
      paid_amount = 0,
      method = "UPI", // 'CASH' | 'UPI' | 'CARD'
      transaction_ref,
      delivery_due_date: customDeliveryDate,
      status = "COMPLETED",
    } = body;

    if (!customerId) {
      return NextResponse.json(
        { success: false, error: "Please select or register a customer / patient" },
        { status: 400 }
      );
    }

    if (!items || items.length === 0) {
      return NextResponse.json(
        { success: false, error: "Billing cart cannot be empty" },
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

    const orderStatus = balanceAmountNum <= 0 ? "COMPLETED" : status || "COMPLETED";
    const year = new Date().getFullYear();

    if (shopId !== "default") {
      const tenant = loadTenantState(shopId);
      const count = tenant.orders.length;
      const bill_no = `RX-${year}-${String(count + 1).padStart(4, "0")}`;
      const orderId = `ord-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
      const now = new Date().toISOString();

      let finalRxId = existingPrescriptionId || null;
      if (prescriptionData && !finalRxId) {
        finalRxId = `rx-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
        const customer = tenant.customers.find((c) => c.id === customerId);
        const newRx: TenantPrescription = {
          id: finalRxId,
          customerId,
          patientName: prescriptionData.patientName || customer?.name || "Patient",
          patientAge: prescriptionData.patientAge ? parseInt(prescriptionData.patientAge, 10) : null,
          doctorName: prescriptionData.doctorName || "Dr. Registered Medical Practitioner",
          clinicOrHospital: prescriptionData.clinicOrHospital || null,
          doctorRegNo: prescriptionData.doctorRegNo || null,
          prescriptionImage: prescriptionData.prescriptionImage || null,
          dosageInstructions: prescriptionData.dosageInstructions || null,
          notes: prescriptionData.notes || null,
          shopId,
          createdAt: now,
          updatedAt: now,
        };
        tenant.prescriptions.unshift(newRx);
      }

      const orderItems: TenantOrderItem[] = [];
      for (const item of items) {
        const medId = item.medicineId || item.itemId;
        const qty = parseInt(item.quantity, 10) || 1;
        const unitPrice = parseFloat(item.unit_price) || 0;
        const unitType = (item.unitType as "STRIP" | "LOOSE_TABLET" | "UNIT") || "STRIP";
        const itemSubtotal = parseFloat(item.subtotal) || unitPrice * qty;

        const inv = tenant.medicines.find((i) => i.id === medId);
        const batchNum = item.batchNumber || inv?.batchNumber || "BT-DEFAULT";
        const expDate = item.expiryDate || inv?.expiryDate || "12/2026";
        const pack = item.packType || inv?.packType || "Strip";

        orderItems.push({
          id: `item-order-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          orderId,
          medicineId: medId,
          itemId: medId,
          name: item.name || inv?.name || "Medicine Item",
          batchNumber: batchNum,
          expiryDate: expDate,
          packType: pack,
          unitType,
          quantity: qty,
          unit_price: unitPrice,
          subtotal: itemSubtotal,
          gstRate: inv?.gstRate || 12.0,
          createdAt: now,
        });

        // Decrement stock in tenant inventory
        if (inv) {
          if (unitType === "LOOSE_TABLET") {
            if (inv.looseTabletQuantity >= qty) {
              inv.looseTabletQuantity -= qty;
            } else {
              // Break strips into loose tablets
              const tabsNeeded = qty - inv.looseTabletQuantity;
              const stripsToBreak = Math.ceil(tabsNeeded / (inv.tabletsPerStrip || 10));
              inv.stripQuantity = Math.max(0, inv.stripQuantity - stripsToBreak);
              inv.looseTabletQuantity =
                inv.looseTabletQuantity + stripsToBreak * (inv.tabletsPerStrip || 10) - qty;
            }
          } else {
            inv.stripQuantity = Math.max(0, inv.stripQuantity - qty);
          }
          inv.stock_quantity = inv.stripQuantity;
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

        // Loyalty points: 1 pt per ₹100
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
        patientName: prescriptionData?.patientName || null,
        doctorName: prescriptionData?.doctorName || null,
        status: orderStatus,
        total_amount: parseFloat(total_amount) || 0,
        discount_amount: parseFloat(discount_amount) || 0,
        tax_amount: parseFloat(tax_amount) || 0,
        final_payable: finalPayableNum,
        paid_amount: paidAmountNum,
        balance_amount: parseFloat(balanceAmountNum.toFixed(2)),
        delivery_due_date: customDeliveryDate
          ? new Date(customDeliveryDate).toISOString()
          : now,
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
        medicine: tenant.medicines.find((i) => i.id === oi.medicineId),
        item: tenant.medicines.find((i) => i.id === oi.medicineId),
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
    }

    // Default tenant via Prisma
    const count = await prisma.order.count();
    const bill_no = `RX-${year}-${String(count + 1).padStart(4, "0")}`;
    const delivery_due_date = customDeliveryDate ? new Date(customDeliveryDate) : new Date();

    const result = await prisma.$transaction(async (tx) => {
      let finalRxId = existingPrescriptionId || null;

      if (prescriptionData && !finalRxId) {
        const customer = await tx.customer.findUnique({ where: { id: customerId } });
        const createdRx = await tx.prescription.create({
          data: {
            customerId,
            patientName: prescriptionData.patientName || customer?.name || "Patient",
            patientAge: prescriptionData.patientAge ? parseInt(prescriptionData.patientAge, 10) : null,
            doctorName: prescriptionData.doctorName || "Dr. Registered Medical Practitioner",
            clinicOrHospital: prescriptionData.clinicOrHospital || null,
            doctorRegNo: prescriptionData.doctorRegNo || null,
            prescriptionImage: prescriptionData.prescriptionImage || null,
            dosageInstructions: prescriptionData.dosageInstructions || null,
            notes: prescriptionData.notes || null,
          },
        });
        finalRxId = createdRx.id;
      }

      const order = await tx.order.create({
        data: {
          bill_no,
          customerId,
          prescriptionId: finalRxId,
          patientName: prescriptionData?.patientName || null,
          doctorName: prescriptionData?.doctorName || null,
          status: orderStatus,
          total_amount: parseFloat(total_amount) || 0,
          discount_amount: parseFloat(discount_amount) || 0,
          tax_amount: parseFloat(tax_amount) || 0,
          final_payable: finalPayableNum,
          paid_amount: paidAmountNum,
          balance_amount: parseFloat(balanceAmountNum.toFixed(2)),
          delivery_due_date,
        },
      });

      for (const item of items) {
        const medId = item.medicineId || item.itemId;
        const qty = parseInt(item.quantity, 10) || 1;
        const unitPrice = parseFloat(item.unit_price) || 0;
        const unitType = item.unitType || "STRIP";
        const itemSubtotal = parseFloat(item.subtotal) || unitPrice * qty;

        const med = await tx.medicine.findUnique({ where: { id: medId } });

        await tx.orderItem.create({
          data: {
            orderId: order.id,
            medicineId: medId,
            batchNumber: item.batchNumber || med?.batchNumber || "BT-DEFAULT",
            expiryDate: item.expiryDate || med?.expiryDate || "12/2026",
            packType: item.packType || med?.packType || "Strip",
            unitType,
            quantity: qty,
            unit_price: unitPrice,
            subtotal: itemSubtotal,
            gstRate: med?.gstRate || 12.0,
          },
        });

        if (med) {
          if (unitType === "LOOSE_TABLET") {
            if (med.looseTabletQuantity >= qty) {
              await tx.medicine.update({
                where: { id: medId },
                data: { looseTabletQuantity: { decrement: qty } },
              });
            } else {
              const tabsNeeded = qty - med.looseTabletQuantity;
              const stripsToBreak = Math.ceil(tabsNeeded / (med.tabletsPerStrip || 10));
              const remainingLoose =
                med.looseTabletQuantity + stripsToBreak * (med.tabletsPerStrip || 10) - qty;

              await tx.medicine.update({
                where: { id: medId },
                data: {
                  stripQuantity: { decrement: stripsToBreak },
                  looseTabletQuantity: remainingLoose,
                },
              });
            }
          } else {
            await tx.medicine.update({
              where: { id: medId },
              data: {
                stripQuantity: { decrement: qty },
              },
            });
          }
        }
      }

      if (paidAmountNum > 0) {
        await tx.payment.create({
          data: {
            orderId: order.id,
            method,
            amount: paidAmountNum,
            payment_type,
            transaction_ref: transaction_ref || null,
          },
        });

        const pointsEarned = Math.floor(paidAmountNum / 100);
        if (pointsEarned > 0) {
          await tx.customer.update({
            where: { id: customerId },
            data: {
              loyalty_points: { increment: pointsEarned },
            },
          });
        }
      }

      return order;
    });

    const fullOrder = await prisma.order.findUnique({
      where: { id: result.id },
      include: {
        customer: true,
        prescription: true,
        items: {
          include: { medicine: true },
        },
        payments: true,
      },
    });

    // Map compatibility fields on fullOrder items
    const mappedOrder = {
      ...fullOrder,
      items: fullOrder?.items.map((oi) => ({
        ...oi,
        item: oi.medicine,
      })),
    };

    return NextResponse.json({ success: true, data: mappedOrder }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating medical order:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process medical sale" },
      { status: 500 }
    );
  }
}
