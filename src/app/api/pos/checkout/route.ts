import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      customerId,
      prescriptionId,
      orderType = "RETAIL",
      items,
      subtotal,
      discount = 0,
      taxRate = 0,
      taxAmount = 0,
      totalAmount,
      paidAmount = 0,
      paymentMethod = "CASH",
      referenceNo,
      notes,
      deliveryDays = 3,
      createLabJob = false,
      labInstructions,
      technicianName,
    } = body;

    if (!items || items.length === 0) {
      return NextResponse.json(
        { success: false, error: "Order must contain at least one item" },
        { status: 400 }
      );
    }

    const balanceAmount = Math.max(0, totalAmount - paidAmount);
    let paymentStatus = "UNPAID";
    if (paidAmount >= totalAmount && totalAmount > 0) {
      paymentStatus = "PAID";
    } else if (paidAmount > 0) {
      paymentStatus = "PARTIAL";
    }

    let orderStatus = "PENDING";
    if (createLabJob || orderType === "PRESCRIPTION_SPECS") {
      orderStatus = "IN_LAB";
    } else if (paymentStatus === "PAID") {
      orderStatus = "COMPLETED";
    }

    // Generate Order Number
    const count = await prisma.order.count();
    const year = new Date().getFullYear();
    const orderNumber = `ORD-${year}-${String(count + 1).padStart(4, "0")}`;

    const deliveryDate =
      orderType === "PRESCRIPTION_SPECS" || createLabJob
        ? new Date(Date.now() + (deliveryDays || 3) * 24 * 60 * 60 * 1000)
        : new Date();

    // Run transaction: create order, items, payment, lab job, update stock
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create order
      const order = await tx.order.create({
        data: {
          orderNumber,
          customerId: customerId || null,
          prescriptionId: prescriptionId || null,
          orderType,
          status: orderStatus,
          paymentStatus,
          subtotal: parseFloat(subtotal) || 0,
          discount: parseFloat(discount) || 0,
          taxRate: parseFloat(taxRate) || 0,
          taxAmount: parseFloat(taxAmount) || 0,
          totalAmount: parseFloat(totalAmount) || 0,
          paidAmount: parseFloat(paidAmount) || 0,
          balanceAmount: parseFloat(balanceAmount.toFixed(2)),
          deliveryDate,
          notes: notes || null,
        },
      });

      // 2. Create Order Items & decrement stock
      for (const item of items) {
        await tx.orderItem.create({
          data: {
            orderId: order.id,
            productId: item.productId || null,
            itemName: item.name || item.itemName,
            category: item.category || null,
            unitPrice: parseFloat(item.price || item.unitPrice) || 0,
            quantity: parseInt(item.quantity, 10) || 1,
            discount: parseFloat(item.discount) || 0,
            totalPrice: parseFloat(item.totalPrice) || (item.price * item.quantity),
            customDetails: item.customDetails || null,
          },
        });

        // Decrement stock if item is linked to product
        if (item.productId) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stockQuantity: {
                decrement: parseInt(item.quantity, 10) || 1,
              },
            },
          });
        }
      }

      // 3. Record Initial Payment if paidAmount > 0
      if (paidAmount > 0) {
        const payCount = await tx.payment.count();
        const paymentNo = `PAY-${year}-${String(payCount + 1).padStart(4, "0")}`;

        await tx.payment.create({
          data: {
            paymentNo,
            orderId: order.id,
            amount: parseFloat(paidAmount),
            paymentMethod,
            referenceNo: referenceNo || null,
            notes:
              paymentStatus === "PAID"
                ? "Full payment received at checkout."
                : `Advance deposit received. Remaining balance: $${balanceAmount.toFixed(2)}`,
          },
        });
      }

      // 4. Create Lab Job if needed
      if (createLabJob || orderType === "PRESCRIPTION_SPECS") {
        const labCount = await tx.labJob.count();
        const jobNo = `LAB-${year}-${String(labCount + 1).padStart(3, "0")}`;

        let prescriptionInfo = "Rx details not attached";
        if (prescriptionId) {
          const rx = await tx.prescription.findUnique({
            where: { id: prescriptionId },
          });
          if (rx) {
            prescriptionInfo = `OD: ${rx.sphOd ?? 0} / ${rx.cylOd ?? 0} x ${rx.axisOd ?? 0} | OS: ${rx.sphOs ?? 0} / ${rx.cylOs ?? 0} x ${rx.axisOs ?? 0} | PD: ${rx.pdTotal ?? rx.pdOd ?? "N/A"}`;
          }
        }

        const frameItem = items.find((i: any) => i.category === "FRAME");
        const lensItem = items.find((i: any) => i.category === "LENS");

        await tx.labJob.create({
          data: {
            jobNo,
            orderId: order.id,
            labType: "IN_HOUSE",
            labName: "VisionCraft Precision Workshop",
            technicianName: technicianName || "Workshop Glazier",
            status: "IN_WORKSHOP",
            lensDetails: lensItem ? `${lensItem.name} [${prescriptionInfo}]` : prescriptionInfo,
            frameDetails: frameItem ? frameItem.name : "Customer own frame",
            instructions: labInstructions || "Glaze and align according to prescription.",
            sentDate: new Date(),
            dueDate: deliveryDate,
          },
        });
      }

      return order;
    });

    // Return the full order with relations
    const finalOrder = await prisma.order.findUnique({
      where: { id: result.id },
      include: {
        customer: true,
        prescription: true,
        items: true,
        payments: true,
        labJob: true,
      },
    });

    return NextResponse.json({ success: true, data: finalOrder }, { status: 201 });
  } catch (error: any) {
    console.error("Error processing checkout:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process sale" },
      { status: 500 }
    );
  }
}
