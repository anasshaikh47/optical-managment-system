import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    let settings = await prisma.storeSetting.findUnique({
      where: { id: "default" },
    });

    if (!settings) {
      settings = await prisma.storeSetting.create({
        data: { id: "default" },
      });
    }

    return NextResponse.json({ success: true, data: settings });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const settings = await prisma.storeSetting.upsert({
      where: { id: "default" },
      update: {
        ...body,
        defaultTaxRate: body.defaultTaxRate !== undefined ? parseFloat(body.defaultTaxRate) : undefined,
      },
      create: {
        id: "default",
        ...body,
        defaultTaxRate: body.defaultTaxRate !== undefined ? parseFloat(body.defaultTaxRate) : 8.5,
      },
    });

    return NextResponse.json({ success: true, data: settings });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
