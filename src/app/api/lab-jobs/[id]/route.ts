import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, technicianName, instructions, cost } = body;

    const currentJob = await prisma.labJob.findUnique({
      where: { id },
      include: { order: true },
    });

    if (!currentJob) {
      return NextResponse.json(
        { success: false, error: "Lab job not found" },
        { status: 404 }
      );
    }

    const isFinished = status === "QA_PASSED" || status === "COMPLETED";

    const updatedJob = await prisma.labJob.update({
      where: { id },
      data: {
        status: status || undefined,
        technicianName: technicianName || undefined,
        instructions: instructions !== undefined ? instructions : undefined,
        cost: cost !== undefined ? parseFloat(cost) : undefined,
        completedDate: isFinished ? new Date() : undefined,
      },
      include: {
        order: {
          include: { customer: true, prescription: true },
        },
      },
    });

    // Auto update Order status if lab job is completed or QA passed
    if (isFinished && currentJob.order.status !== "COMPLETED") {
      await prisma.order.update({
        where: { id: currentJob.orderId },
        data: { status: "READY_FOR_PICKUP" },
      });
    }

    return NextResponse.json({ success: true, data: updatedJob });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
