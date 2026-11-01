import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const optometrists = await prisma.optometrist.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ success: true, data: optometrists });
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
    const { name, licenseNumber, phone, email } = body;
    if (!name) {
      return NextResponse.json(
        { success: false, error: "Name is required" },
        { status: 400 }
      );
    }
    const doctor = await prisma.optometrist.create({
      data: { name, licenseNumber, phone, email },
    });
    return NextResponse.json({ success: true, data: doctor }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
