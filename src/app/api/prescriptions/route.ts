import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getShopIdFromRequest,
  loadTenantState,
  saveTenantState,
  TenantPrescription,
} from "@/lib/tenant/store";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get("customerId");
    const query = searchParams.get("query");
    const shopId = getShopIdFromRequest(request);

    if (shopId !== "default") {
      const tenant = loadTenantState(shopId);
      let list = tenant.prescriptions.map((p) => {
        const customer = tenant.customers.find((c) => c.id === p.customerId);
        const orderCount = tenant.orders.filter((o) => o.prescriptionId === p.id).length;
        return {
          ...p,
          customer,
          _count: { orders: orderCount },
        };
      });

      if (customerId) {
        list = list.filter((p) => p.customerId === customerId);
      }

      if (query) {
        const q = query.toLowerCase();
        list = list.filter(
          (p) =>
            (p.patientName && p.patientName.toLowerCase().includes(q)) ||
            (p.customer && p.customer.name.toLowerCase().includes(q)) ||
            (p.customer && p.customer.phone.toLowerCase().includes(q)) ||
            (p.doctorName && p.doctorName.toLowerCase().includes(q)) ||
            (p.clinicOrHospital && p.clinicOrHospital.toLowerCase().includes(q)) ||
            (p.dosageInstructions && p.dosageInstructions.toLowerCase().includes(q))
        );
      }

      return NextResponse.json({ success: true, data: list });
    }

    try {
      const where: any = {};
      if (customerId) {
        where.customerId = customerId;
      }

      if (query) {
        where.OR = [
          { patientName: { contains: query, mode: "insensitive" } },
          { customer: { name: { contains: query, mode: "insensitive" } } },
          { customer: { phone: { contains: query, mode: "insensitive" } } },
          { doctorName: { contains: query, mode: "insensitive" } },
          { clinicOrHospital: { contains: query, mode: "insensitive" } },
          { dosageInstructions: { contains: query, mode: "insensitive" } },
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
    } catch {
      const tenant = loadTenantState("default");
      return NextResponse.json({ success: true, data: tenant.prescriptions });
    }
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
    const shopId = getShopIdFromRequest(request);
    const body = await request.json();
    const {
      customerId,
      patientName,
      patientAge,
      doctorName,
      optometristName, // fallback
      clinicOrHospital,
      doctorRegNo,
      prescriptionImage,
      dosageInstructions,
      notes,
    } = body;

    if (!customerId) {
      return NextResponse.json(
        { success: false, error: "Patient / Customer is required" },
        { status: 400 }
      );
    }

    const docName = doctorName || optometristName || "Dr. Registered Medical Practitioner";
    const parsedAge = patientAge !== undefined && patientAge !== "" ? parseInt(patientAge, 10) : null;

    if (shopId !== "default") {
      const tenant = loadTenantState(shopId);
      const customer = tenant.customers.find((c) => c.id === customerId);
      const resolvedPatientName = patientName || customer?.name || "Patient";

      const newRx: TenantPrescription = {
        id: `rx-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        customerId,
        patientName: resolvedPatientName,
        patientAge: parsedAge,
        doctorName: docName,
        clinicOrHospital: clinicOrHospital || null,
        doctorRegNo: doctorRegNo || null,
        prescriptionImage: prescriptionImage || null,
        dosageInstructions: dosageInstructions || null,
        notes: notes || null,
        optometristName: docName,
        shopId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      tenant.prescriptions.unshift(newRx);
      saveTenantState(tenant);

      return NextResponse.json({ success: true, data: newRx }, { status: 201 });
    }

    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    const resolvedPatientName = patientName || customer?.name || "Patient";

    const prescription = await prisma.prescription.create({
      data: {
        customerId,
        patientName: resolvedPatientName,
        patientAge: parsedAge,
        doctorName: docName,
        clinicOrHospital: clinicOrHospital || null,
        doctorRegNo: doctorRegNo || null,
        prescriptionImage: prescriptionImage || null,
        dosageInstructions: dosageInstructions || null,
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
