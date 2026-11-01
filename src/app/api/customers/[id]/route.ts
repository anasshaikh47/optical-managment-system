import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        prescriptions: {
          include: {
            optometrist: true,
          },
          orderBy: { examDate: "desc" },
        },
        orders: {
          include: {
            items: true,
            payments: true,
            labJob: true,
          },
          orderBy: { createdAt: "desc" },
        },
        appointments: {
          include: {
            optometrist: true,
          },
          orderBy: { appointmentDate: "desc" },
        },
      },
    });

    if (!customer) {
      return NextResponse.json(
        { success: false, error: "Customer not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: customer });
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

    const customer = await prisma.customer.update({
      where: { id },
      data: {
        ...body,
        dob: body.dob ? new Date(body.dob) : undefined,
      },
    });

    return NextResponse.json({ success: true, data: customer });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
