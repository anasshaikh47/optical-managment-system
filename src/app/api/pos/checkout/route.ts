import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      customerId,
      prescriptionId,
      items, // array of { itemId, quantity, unit_price, coating_charges, fitting_charges }
      total_amount, // subtotal
      discount_amount = 0,
      tax_amount = 0,
      final_payable,
      paid_amount = 0,
      method = "UPI", // 'CASH' | 'UPI' | 'CARD'
      transaction_ref,
      deliveryDays = 3,
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

    // Determine order tracking status
    let orderStatus = status;
    if (orderStatus === "PLACED" && prescriptionId) {
      orderStatus = "LENS_PROCESSING";
    } else if (balanceAmountNum <= 0 && !prescriptionId) {
      orderStatus = "DELIVERED";
    }

    // Generate Bill Number: VP-YYYY-XXXX
    const count = await prisma.order.count();
    const year = new Date().getFullYear();
    const bill_no = `VP-${year}-${String(count + 1).padStart(4, "0")}`;

    const delivery_due_date = new Date(Date.now() + (deliveryDays || 3) * 24 * 60 * 60 * 1000);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Order
      const order = await tx.order.create({
        data: {
          bill_no,
          customerId,
          prescriptionId: prescriptionId || null,
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

      // 2. Create OrderItems & decrement stock
      for (const item of items) {
        const qty = parseInt(item.quantity, 10) || 1;
        const unitPrice = parseFloat(item.unit_price) || 0;
        const coating = parseFloat(item.coating_charges) || 0;
        const fitting = parseFloat(item.fitting_charges) || 0;
        const subtotal = (unitPrice * qty) + coating + fitting;

        await tx.orderItem.create({
          data: {
            orderId: order.id,
            itemId: item.itemId,
            quantity: qty,
            unit_price: unitPrice,
            coating_charges: coating,
            fitting_charges: fitting,
            subtotal,
          },
        });

        // Decrement stock
        await tx.inventoryItem.update({
          where: { id: item.itemId },
          data: {
            stock_quantity: {
              decrement: qty,
            },
          },
        });
      }

      // 3. Record Payment if paid_amount > 0
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

        // Award 1 loyalty point per ₹100 spent
        const pointsEarned = Math.floor(paidAmountNum / 100);
        if (pointsEarned > 0) {
          await tx.customer.update({
            where: { id: customerId },
            data: {
              loyalty_points: {
                increment: pointsEarned,
              },
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
          include: { item: true },
        },
        payments: true,
      },
    });

    return NextResponse.json({ success: true, data: fullOrder }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating order:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process sale" },
      { status: 500 }
    );
  }
}
