import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get("customerId");
    const query = searchParams.get("query");

    const where: any = {};
    if (customerId) {
      where.customerId = customerId;
    }

    if (query) {
      where.OR = [
        { prescriptionNo: { contains: query } },
        { customer: { name: { contains: query } } },
        { customer: { phone: { contains: query } } },
      ];
    }

    const prescriptions = await prisma.prescription.findMany({
      where,
      include: {
        customer: true,
        optometrist: true,
        _count: {
          select: { orders: true },
        },
      },
      orderBy: { examDate: "desc" },
    });

    return NextResponse.json({ success: true, data: prescriptions });
  } catch (error: any) {
    console.error("Error fetching prescriptions:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch prescriptions" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      customerId,
      optometristId,
      sphOd,
      cylOd,
      axisOd,
      addOd,
      vaOd,
      pdOd,
      sphOs,
      cylOs,
      axisOs,
      addOs,
      vaOs,
      pdOs,
      pdTotal,
      lensType,
      examDate,
      expiryDate,
      notes,
    } = body;

    if (!customerId) {
      return NextResponse.json(
        { success: false, error: "Customer ID is required" },
        { status: 400 }
      );
    }

    // Generate unique prescription number
    const count = await prisma.prescription.count();
    const year = new Date().getFullYear();
    const prescriptionNo = `RX-${year}-${String(count + 1).padStart(4, "0")}`;

    // Auto-calculate expiry date to 2 years if not provided
    const eDate = examDate ? new Date(examDate) : new Date();
    const expDate = expiryDate
      ? new Date(expiryDate)
      : new Date(new Date(eDate).setFullYear(eDate.getFullYear() + 2));

    const prescription = await prisma.prescription.create({
      data: {
        prescriptionNo,
        customerId,
        optometristId: optometristId || null,
        sphOd: sphOd !== "" && sphOd !== undefined ? parseFloat(sphOd) : null,
        cylOd: cylOd !== "" && cylOd !== undefined ? parseFloat(cylOd) : null,
        axisOd: axisOd !== "" && axisOd !== undefined ? parseInt(axisOd, 10) : null,
        addOd: addOd !== "" && addOd !== undefined ? parseFloat(addOd) : null,
        vaOd: vaOd || null,
        pdOd: pdOd !== "" && pdOd !== undefined ? parseFloat(pdOd) : null,

        sphOs: sphOs !== "" && sphOs !== undefined ? parseFloat(sphOs) : null,
        cylOs: cylOs !== "" && cylOs !== undefined ? parseFloat(cylOs) : null,
        axisOs: axisOs !== "" && axisOs !== undefined ? parseInt(axisOs, 10) : null,
        addOs: addOs !== "" && addOs !== undefined ? parseFloat(addOs) : null,
        vaOs: vaOs || null,
        pdOs: pdOs !== "" && pdOs !== undefined ? parseFloat(pdOs) : null,

        pdTotal: pdTotal !== "" && pdTotal !== undefined ? parseFloat(pdTotal) : null,
        lensType: lensType || null,
        examDate: eDate,
        expiryDate: expDate,
        notes: notes || null,
      },
      include: {
        customer: true,
        optometrist: true,
      },
    });

    return NextResponse.json({ success: true, data: prescription }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating prescription:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create prescription" },
      { status: 500 }
    );
  }
}
