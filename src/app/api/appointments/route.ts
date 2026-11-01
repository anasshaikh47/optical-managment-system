import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    const status = searchParams.get("status");

    const where: any = {};
    if (status && status !== "ALL") {
      where.status = status;
    }

    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        customer: true,
        optometrist: true,
      },
      orderBy: [{ appointmentDate: "asc" }, { appointmentTime: "asc" }],
    });

    return NextResponse.json({ success: true, data: appointments });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
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
      appointmentDate,
      appointmentTime,
      type = "EYE_EXAM",
      notes,
    } = body;

    if (!customerId || !appointmentDate || !appointmentTime) {
      return NextResponse.json(
        { success: false, error: "Customer, date, and time are required" },
        { status: 400 }
      );
    }

    const appointment = await prisma.appointment.create({
      data: {
        customerId,
        optometristId: optometristId || null,
        appointmentDate: new Date(appointmentDate),
        appointmentTime,
        type,
        status: "SCHEDULED",
        notes: notes || null,
      },
      include: {
        customer: true,
        optometrist: true,
      },
    });

    return NextResponse.json({ success: true, data: appointment }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
