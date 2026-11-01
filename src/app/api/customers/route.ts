import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query");

    const where: any = {};
    if (query) {
      where.OR = [
        { name: { contains: query } },
        { phone: { contains: query } },
        { email: { contains: query } },
        { customerCode: { contains: query } },
      ];
    }

    const customers = await prisma.customer.findMany({
      where,
      include: {
        prescriptions: {
          orderBy: { examDate: "desc" },
          take: 1,
        },
        orders: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        _count: {
          select: {
            prescriptions: true,
            orders: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: customers });
  } catch (error: any) {
    console.error("Error fetching customers:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch customers" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, phone, email, gender, dob, address, occupation, notes } = body;

    if (!name || !phone) {
      return NextResponse.json(
        { success: false, error: "Customer name and phone number are required" },
        { status: 400 }
      );
    }

    // Generate readable code: CUST-xxxx
    const count = await prisma.customer.count();
    const customerCode = `CUST-${1001 + count}`;

    const customer = await prisma.customer.create({
      data: {
        customerCode,
        name,
        phone,
        email: email || null,
        gender: gender || null,
        dob: dob ? new Date(dob) : null,
        address: address || null,
        occupation: occupation || null,
        notes: notes || null,
      },
    });

    return NextResponse.json({ success: true, data: customer }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating customer:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create customer" },
      { status: 500 }
    );
  }
}
