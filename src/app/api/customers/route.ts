import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { loadTenantState, saveTenantState } from "@/lib/tenant/store";
import { getAuthenticatedShopId } from "@/lib/auth-sync";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query") || searchParams.get("q") || searchParams.get("search");
    const activeShopId = (await getAuthenticatedShopId(request)) || "default";

    try {
      const where: any = {
        shopId: activeShopId,
      };

      if (query && query.trim()) {
        const q = query.trim();
        where.AND = [
          {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { phone: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
            ],
          },
        ];
      }

      const dbCustomers = await prisma.customer.findMany({
        where,
        select: {
          id: true,
          shopId: true,
          userId: true,
          name: true,
          phone: true,
          email: true,
          address: true,
          dob: true,
          loyalty_points: true,
          createdAt: true,
          updatedAt: true,
          orders: {
            select: {
              id: true,
              bill_no: true,
              final_payable: true,
              paid_amount: true,
              balance_amount: true,
              status: true,
              delivery_due_date: true,
              createdAt: true,
              updatedAt: true,
            },
            orderBy: { createdAt: "desc" },
          },
          prescriptions: {
            select: {
              id: true,
              lens_type: true,
              createdAt: true,
              updatedAt: true,
            },
            orderBy: { createdAt: "desc" },
            take: 3,
          },
        },
        orderBy: { createdAt: "desc" },
      });

      const list = dbCustomers.map((c) => ({
        ...c,
        dob: c.dob ? c.dob.toISOString() : null,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
        orders: c.orders.map((o) => ({
          ...o,
          delivery_due_date: o.delivery_due_date ? o.delivery_due_date.toISOString() : null,
          createdAt: o.createdAt.toISOString(),
          updatedAt: o.updatedAt.toISOString(),
        })),
        prescriptions: c.prescriptions.map((p) => ({
          ...p,
          createdAt: p.createdAt.toISOString(),
          updatedAt: p.updatedAt.toISOString(),
        })),
        _count: {
          prescriptions: c.prescriptions.length,
          orders: c.orders.length,
        },
      }));

      // Update tenant cache as warm fallback
      try {
        const tenant = loadTenantState(activeShopId);
        tenant.customers = list as any;
        saveTenantState(tenant);
      } catch {}

      return NextResponse.json({ success: true, data: list });
    } catch (dbError: any) {
      console.warn("Prisma GET customers error, using cache fallback:", dbError.message);
      const tenant = loadTenantState(activeShopId);
      let list = tenant.customers.map((c) => {
        const cPrescriptions = (tenant.prescriptions || []).filter((p) => p.customerId === c.id);
        const cOrders = (tenant.orders || []).filter((o) => o.customerId === c.id);
        return {
          ...c,
          prescriptions: cPrescriptions.slice(0, 1),
          orders: cOrders.map((o) => ({
            id: o.id,
            bill_no: o.bill_no,
            final_payable: o.final_payable,
            paid_amount: o.paid_amount,
            balance_amount: o.balance_amount,
            status: o.status,
            createdAt: o.createdAt,
          })),
          _count: {
            prescriptions: cPrescriptions.length,
            orders: cOrders.length,
          },
        };
      });

      if (query) {
        const q = query.toLowerCase();
        list = list.filter(
          (c) =>
            c.name.toLowerCase().includes(q) ||
            c.phone.toLowerCase().includes(q) ||
            (c.email && c.email.toLowerCase().includes(q))
        );
      }

      return NextResponse.json({ success: true, data: list });
    }
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
    const activeShopId = (await getAuthenticatedShopId(request)) || "default";
    const body = await request.json();
    const { name, phone, email, address, dob, loyalty_points = 0 } = body;

    const trimmedName = name ? String(name).trim() : "";
    const trimmedPhone = phone ? String(phone).trim() : "";

    if (!trimmedName || !trimmedPhone) {
      return NextResponse.json(
        { success: false, error: "Customer name and unique phone number are required" },
        { status: 400 }
      );
    }

    // Clean 10-digit phone digits for thorough duplicate matching within activeShopId
    const rawDigits = trimmedPhone.replace(/\D/g, "");
    let clean10Digits = rawDigits;
    if (rawDigits.length === 12 && rawDigits.startsWith("91")) {
      clean10Digits = rawDigits.slice(2);
    } else if (rawDigits.length === 11 && rawDigits.startsWith("0")) {
      clean10Digits = rawDigits.slice(1);
    }

    const possiblePhones = Array.from(
      new Set(
        [
          trimmedPhone,
          clean10Digits,
          clean10Digits.length === 10 ? `+91 ${clean10Digits.slice(0, 5)} ${clean10Digits.slice(5)}` : "",
          clean10Digits.length === 10 ? `+91${clean10Digits}` : "",
          clean10Digits.length === 10 ? `0${clean10Digits}` : "",
        ].filter(Boolean)
      )
    );

    // 1. Check duplicate phone strictly scoped to activeShopId
    let existingCustomer = null;
    try {
      existingCustomer = await prisma.customer.findFirst({
        where: {
          shopId: activeShopId,
          OR: [
            { phone: trimmedPhone },
            ...possiblePhones.map((p) => ({ phone: p })),
            ...(clean10Digits.length === 10 ? [{ phone: { contains: clean10Digits } }] : []),
          ],
        },
      });
    } catch (e: any) {
      console.warn("Prisma duplicate check warning:", e.message);
    }

    // Also check tenant store cache as fallback (strictly within activeShopId)
    if (!existingCustomer) {
      try {
        const tenant = loadTenantState(activeShopId);
        const cached = tenant.customers.find((c) => {
          const cDigits = (c.phone || "").replace(/\D/g, "");
          return (
            c.phone === trimmedPhone ||
            (clean10Digits.length === 10 && cDigits.includes(clean10Digits))
          );
        });
        if (cached) {
          existingCustomer = cached as any;
        }
      } catch {}
    }

    if (existingCustomer) {
      return NextResponse.json(
        {
          success: false,
          error: "ALREADY_EXISTS",
          message: "This mobile number is already registered in your shop.",
          existingCustomer: {
            id: existingCustomer.id,
            name: existingCustomer.name,
            phone: existingCustomer.phone,
          },
        },
        { status: 409 }
      );
    }

    // 2. If not found in this shop, proceed to create with explicit shopId: activeShopId
    let newCustomer: any;
    try {
      newCustomer = await prisma.customer.create({
        data: {
          name: trimmedName,
          phone: trimmedPhone,
          email: email ? String(email).trim() : null,
          address: address ? String(address).trim() : null,
          dob: dob ? new Date(dob) : null,
          loyalty_points: parseInt(loyalty_points, 10) || 0,
          shopId: activeShopId,
          userId: activeShopId,
        },
        include: {
          orders: true,
          prescriptions: true,
        },
      });
    } catch (createErr: any) {
      // Handle unique constraint (P2002)
      if (
        createErr.code === "P2002" ||
        String(createErr.message || "").toLowerCase().includes("unique constraint")
      ) {
        // Inspect error.meta.target and check if conflict belongs to activeShopId
        const conflictInShop = await prisma.customer
          .findFirst({
            where: {
              shopId: activeShopId,
              OR: [
                { phone: trimmedPhone },
                ...possiblePhones.map((p) => ({ phone: p })),
              ],
            },
          })
          .catch(() => null);

        const target = createErr.meta?.target;
        const targetStr = Array.isArray(target) ? target.join(",") : String(target || "");
        const isShopPhoneConstraint =
          targetStr.includes("shop_customer_phone_unique") ||
          (targetStr.includes("shopId") && targetStr.includes("phone"));

        // Only trigger duplicate alert if the conflict belongs to the same shopId
        if (conflictInShop || isShopPhoneConstraint) {
          return NextResponse.json(
            {
              success: false,
              error: "ALREADY_EXISTS",
              message: "This mobile number is already registered in your shop.",
              existingCustomer: conflictInShop
                ? { id: conflictInShop.id, name: conflictInShop.name, phone: conflictInShop.phone }
                : { id: "", name: "Registered Customer", phone: trimmedPhone },
            },
            { status: 409 }
          );
        }

        // If conflict is from a legacy global unique constraint across another shopId,
        // persist to the tenant store fallback so the user is not blocked
        console.warn(
          "P2002 conflict was from another shop under legacy global unique constraint. Saving to tenant store for activeShopId:",
          activeShopId
        );
        newCustomer = {
          id: `cust-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          name: trimmedName,
          phone: trimmedPhone,
          email: email ? String(email).trim() : null,
          address: address ? String(address).trim() : null,
          dob: dob ? new Date(dob) : null,
          loyalty_points: parseInt(loyalty_points, 10) || 0,
          shopId: activeShopId,
          userId: activeShopId,
          createdAt: new Date(),
          updatedAt: new Date(),
          orders: [],
          prescriptions: [],
        };
      } else {
        throw createErr;
      }
    }

    const serializedCustomer = {
      ...newCustomer,
      dob: newCustomer.dob ? (newCustomer.dob instanceof Date ? newCustomer.dob.toISOString() : newCustomer.dob) : null,
      createdAt: newCustomer.createdAt instanceof Date ? newCustomer.createdAt.toISOString() : String(newCustomer.createdAt),
      updatedAt: newCustomer.updatedAt instanceof Date ? newCustomer.updatedAt.toISOString() : String(newCustomer.updatedAt),
      orders: [],
      prescriptions: [],
      _count: { orders: 0, prescriptions: 0 },
    };

    // Update tenant cache as fallback
    try {
      const tenant = loadTenantState(activeShopId);
      tenant.customers = tenant.customers.filter((c) => c.id !== newCustomer.id && c.phone !== newCustomer.phone);
      tenant.customers.unshift(serializedCustomer as any);
      saveTenantState(tenant);
    } catch {}

    return NextResponse.json({ success: true, data: serializedCustomer }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating customer:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create customer in database" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const activeShopId = (await getAuthenticatedShopId(request)) || "default";
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Customer ID is required" },
        { status: 400 }
      );
    }

    const existing = await prisma.customer.findFirst({
      where: {
        id,
        shopId: activeShopId,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Customer not found" },
        { status: 404 }
      );
    }

    const dataToUpdate: any = {};
    if (updateData.name !== undefined) dataToUpdate.name = String(updateData.name).trim();
    if (updateData.phone !== undefined) {
      const trimmedPhone = String(updateData.phone).trim();
      dataToUpdate.phone = trimmedPhone;

      const rawDigits = trimmedPhone.replace(/\D/g, "");
      let clean10Digits = rawDigits;
      if (rawDigits.length === 12 && rawDigits.startsWith("91")) {
        clean10Digits = rawDigits.slice(2);
      } else if (rawDigits.length === 11 && rawDigits.startsWith("0")) {
        clean10Digits = rawDigits.slice(1);
      }

      const possiblePhones = Array.from(
        new Set(
          [
            trimmedPhone,
            clean10Digits,
            clean10Digits.length === 10 ? `+91 ${clean10Digits.slice(0, 5)} ${clean10Digits.slice(5)}` : "",
            clean10Digits.length === 10 ? `+91${clean10Digits}` : "",
            clean10Digits.length === 10 ? `0${clean10Digits}` : "",
          ].filter(Boolean)
        )
      );

      // Check if phone belongs to another customer strictly in this shopId
      const conflict = await prisma.customer.findFirst({
        where: {
          id: { not: id },
          shopId: activeShopId,
          OR: [
            { phone: trimmedPhone },
            ...possiblePhones.map((p) => ({ phone: p })),
            ...(clean10Digits.length === 10 ? [{ phone: { contains: clean10Digits } }] : []),
          ],
        },
      });

      if (conflict) {
        return NextResponse.json(
          {
            success: false,
            error: "ALREADY_EXISTS",
            message: "This mobile number is already registered in your shop.",
            existingCustomer: {
              id: conflict.id,
              name: conflict.name,
              phone: conflict.phone,
            },
          },
          { status: 409 }
        );
      }
    }
    if (updateData.email !== undefined) dataToUpdate.email = updateData.email ? String(updateData.email).trim() : null;
    if (updateData.address !== undefined) dataToUpdate.address = updateData.address ? String(updateData.address).trim() : null;
    if (updateData.dob !== undefined) dataToUpdate.dob = updateData.dob ? new Date(updateData.dob) : null;
    if (updateData.loyalty_points !== undefined) dataToUpdate.loyalty_points = parseInt(updateData.loyalty_points, 10) || 0;

    let updated: any;
    try {
      updated = await prisma.customer.update({
        where: { id },
        data: dataToUpdate,
      });
    } catch (updateErr: any) {
      if (
        updateErr.code === "P2002" ||
        String(updateErr.message || "").toLowerCase().includes("unique constraint")
      ) {
        const conflictInShop = await prisma.customer
          .findFirst({
            where: {
              id: { not: id },
              shopId: activeShopId,
              phone: String(updateData.phone || "").trim(),
            },
          })
          .catch(() => null);

        const target = updateErr.meta?.target;
        const targetStr = Array.isArray(target) ? target.join(",") : String(target || "");
        const isShopPhoneConstraint =
          targetStr.includes("shop_customer_phone_unique") ||
          (targetStr.includes("shopId") && targetStr.includes("phone"));

        if (conflictInShop || isShopPhoneConstraint) {
          return NextResponse.json(
            {
              success: false,
              error: "ALREADY_EXISTS",
              message: "This mobile number is already registered in your shop.",
            },
            { status: 409 }
          );
        }

        console.warn(
          "P2002 update conflict from legacy global index across another shop. Applying to tenant fallback store:",
          activeShopId
        );
        updated = {
          ...existing,
          ...dataToUpdate,
          updatedAt: new Date(),
        };
      } else {
        throw updateErr;
      }
    }

    try {
      const tenant = loadTenantState(activeShopId);
      const idx = tenant.customers.findIndex((c) => c.id === id);
      if (idx !== -1) {
        tenant.customers[idx] = {
          ...tenant.customers[idx],
          ...updated,
          dob: updated.dob ? (updated.dob instanceof Date ? updated.dob.toISOString() : updated.dob) : null,
          createdAt: updated.createdAt instanceof Date ? updated.createdAt.toISOString() : tenant.customers[idx].createdAt,
          updatedAt: updated.updatedAt instanceof Date ? updated.updatedAt.toISOString() : new Date().toISOString(),
        } as any;
        saveTenantState(tenant);
      }
    } catch {}

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update customer" },
      { status: 500 }
    );
  }
}

export const PUT = PATCH;
