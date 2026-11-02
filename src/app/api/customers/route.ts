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
      ];
    }

    const customers = await prisma.customer.findMany({
      where,
      include: {
        prescriptions: {
          orderBy: { createdAt: "desc" },
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
    const { name, phone, email, address, dob, loyalty_points = 0 } = body;

    if (!name || !phone) {
      return NextResponse.json(
        { success: false, error: "Customer name and unique phone number are required" },
        { status: 400 }
      );
    }

    // Check phone uniqueness
    const existing = await prisma.customer.findUnique({ where: { phone } });
    if (existing) {
      return NextResponse.json(
        { success: false, error: `Customer with phone "${phone}" already registered.` },
        { status: 409 }
      );
    }

    const customer = await prisma.customer.create({
      data: {
        name,
        phone,
        email: email || null,
        address: address || null,
        dob: dob ? new Date(dob) : null,
        loyalty_points: parseInt(loyalty_points, 10) || 0,
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
