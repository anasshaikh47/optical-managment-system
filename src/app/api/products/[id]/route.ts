import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const item = await prisma.inventoryItem.findUnique({
      where: { id },
    });

    if (!item) {
      return NextResponse.json(
        { success: false, error: "Inventory item not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: item });
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
    const body = await request.json();

    const updated = await prisma.inventoryItem.update({
      where: { id },
      data: {
        ...body,
        cost_price: body.cost_price !== undefined ? parseFloat(body.cost_price) : undefined,
        selling_price: body.selling_price !== undefined ? parseFloat(body.selling_price) : undefined,
        stock_quantity: body.stock_quantity !== undefined ? parseInt(body.stock_quantity, 10) : undefined,
        min_alert_threshold: body.min_alert_threshold !== undefined ? parseInt(body.min_alert_threshold, 10) : undefined,
        gst_rate: body.gst_rate !== undefined ? parseFloat(body.gst_rate) : undefined,
      },
    });

    return NextResponse.json({ success: true, data: updated });
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
    await prisma.$transaction(async (tx) => {
      await tx.orderItem.deleteMany({ where: { itemId: id } });
      await tx.inventoryItem.delete({ where: { id } });
    });
    return NextResponse.json({ success: true, message: "Item deleted successfully" });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
