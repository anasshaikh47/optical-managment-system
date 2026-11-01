import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, notes, appointmentDate, appointmentTime } = body;

    const updated = await prisma.appointment.update({
      where: { id },
      data: {
        status: status || undefined,
        notes: notes !== undefined ? notes : undefined,
        appointmentDate: appointmentDate ? new Date(appointmentDate) : undefined,
        appointmentTime: appointmentTime || undefined,
      },
      include: {
        customer: true,
        optometrist: true,
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
    await prisma.appointment.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "Appointment deleted" });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
