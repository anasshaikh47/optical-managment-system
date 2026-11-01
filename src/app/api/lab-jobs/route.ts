import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const query = searchParams.get("query");

    const where: any = {};
    if (status && status !== "ALL") {
      where.status = status;
    }

    if (query) {
      where.OR = [
        { jobNo: { contains: query } },
        { order: { orderNumber: { contains: query } } },
        { order: { customer: { name: { contains: query } } } },
        { technicianName: { contains: query } },
      ];
    }

    const labJobs = await prisma.labJob.findMany({
      where,
      include: {
        order: {
          include: {
            customer: true,
            prescription: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: labJobs });
  } catch (error: any) {
    console.error("Error fetching lab jobs:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch lab jobs" },
      { status: 500 }
    );
  }
}
