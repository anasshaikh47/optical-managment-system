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
        { customer: { name: { contains: query } } },
        { customer: { phone: { contains: query } } },
        { optometristName: { contains: query } },
        { lens_type: { contains: query } },
      ];
    }

    const prescriptions = await prisma.prescription.findMany({
      where,
      include: {
        customer: true,
        _count: {
          select: { orders: true },
        },
      },
      orderBy: { createdAt: "desc" },
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
      optometristName,
      od_sph,
      od_cyl,
      od_axis,
      od_add,
      os_sph,
      os_cyl,
      os_axis,
      os_add,
      pd_distance,
      pd_near,
      lens_type,
      notes,
    } = body;

    if (!customerId) {
      return NextResponse.json(
        { success: false, error: "Customer ID is required" },
        { status: 400 }
      );
    }

    const prescription = await prisma.prescription.create({
      data: {
        customerId,
        optometristName: optometristName || "Dr. Staff Optometrist",
        od_sph: od_sph !== "" && od_sph !== undefined ? parseFloat(od_sph) : null,
        od_cyl: od_cyl !== "" && od_cyl !== undefined ? parseFloat(od_cyl) : null,
        od_axis: od_axis !== "" && od_axis !== undefined ? parseInt(od_axis, 10) : null,
        od_add: od_add !== "" && od_add !== undefined ? parseFloat(od_add) : null,

        os_sph: os_sph !== "" && os_sph !== undefined ? parseFloat(os_sph) : null,
        os_cyl: os_cyl !== "" && os_cyl !== undefined ? parseFloat(os_cyl) : null,
        os_axis: os_axis !== "" && os_axis !== undefined ? parseInt(os_axis, 10) : null,
        os_add: os_add !== "" && os_add !== undefined ? parseFloat(os_add) : null,

        pd_distance: pd_distance !== "" && pd_distance !== undefined ? parseFloat(pd_distance) : null,
        pd_near: pd_near !== "" && pd_near !== undefined ? parseFloat(pd_near) : null,
        lens_type: lens_type || "SINGLE_VISION",
        notes: notes || null,
      },
      include: {
        customer: true,
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
