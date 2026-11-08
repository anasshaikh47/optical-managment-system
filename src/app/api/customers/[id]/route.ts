import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { loadTenantState, saveTenantState } from "@/lib/tenant/store";
import { getAuthenticatedShopId } from "@/lib/auth-sync";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const shopId = await getAuthenticatedShopId(request);

    try {
      const whereShop = {
        OR: [
          { shopId },
          { userId: shopId },
          ...(shopId === "default" ? [{ shopId: "default" }] : []),
        ],
      };

      const [customer, orders, prescriptions] = await Promise.all([
        prisma.customer.findFirst({
          where: {
            id,
            ...whereShop,
          },
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            address: true,
            dob: true,
            loyalty_points: true,
            shopId: true,
            userId: true,
            createdAt: true,
            updatedAt: true,
          },
        }),
        prisma.order.findMany({
          where: {
            customerId: id,
            ...whereShop,
          },
          orderBy: { createdAt: "desc" },
          take: 20,
          select: {
            id: true,
            bill_no: true,
            status: true,
            total_amount: true,
            discount_amount: true,
            tax_amount: true,
            final_payable: true,
            paid_amount: true,
            balance_amount: true,
            delivery_due_date: true,
            createdAt: true,
            updatedAt: true,
            items: {
              select: {
                id: true,
                quantity: true,
                unit_price: true,
                subtotal: true,
                item: {
                  select: {
                    id: true,
                    brand: true,
                    model: true,
                    type: true,
                  },
                },
              },
            },
            payments: {
              select: {
                id: true,
                amount: true,
                method: true,
                payment_type: true,
                createdAt: true,
              },
            },
            prescription: true,
          },
        }),
        prisma.prescription.findMany({
          where: { customerId: id },
          orderBy: { createdAt: "desc" },
          take: 10,
        }),
      ]);

      if (!customer) {
        return NextResponse.json(
          { success: false, error: "Customer not found" },
          { status: 404 }
        );
      }

      const serializedCustomer = {
        ...customer,
        loyaltyPoints: customer.loyalty_points ?? 0,
        dob: customer.dob ? customer.dob.toISOString() : null,
        createdAt: customer.createdAt.toISOString(),
        updatedAt: customer.updatedAt.toISOString(),
        orders: orders.map((o) => ({
          ...o,
          balanceRemaining: o.balance_amount ?? 0,
          delivery_due_date: o.delivery_due_date ? o.delivery_due_date.toISOString() : null,
          createdAt: o.createdAt.toISOString(),
          updatedAt: o.updatedAt.toISOString(),
          items: o.items.map((it) => ({
            ...it,
            item: it.item ? { ...it.item } : null,
          })),
          payments: o.payments.map((p) => ({
            ...p,
            createdAt: p.createdAt.toISOString(),
          })),
        })),
        prescriptions: prescriptions.map((p) => ({
          ...p,
          createdAt: p.createdAt.toISOString(),
          updatedAt: p.updatedAt.toISOString(),
        })),
      };

      return NextResponse.json(
        { success: true, data: serializedCustomer },
        {
          headers: {
            "Cache-Control": "s-maxage=60, stale-while-revalidate=300",
          },
        }
      );
    } catch (dbError: any) {
      console.warn("Prisma GET customer[id] fallback:", dbError.message);
      const tenant = loadTenantState(shopId);
      const customer = tenant.customers.find((c) => c.id === id);
      if (!customer) {
        return NextResponse.json(
          { success: false, error: "Customer not found" },
          { status: 404 }
        );
      }

      const prescriptions = tenant.prescriptions.filter((p) => p.customerId === id);
      const orders = tenant.orders.filter((o) => o.customerId === id);

      return NextResponse.json(
        {
          success: true,
          data: {
            ...customer,
            loyaltyPoints: (customer as any).loyalty_points ?? (customer as any).loyaltyPoints ?? 0,
            prescriptions,
            orders,
          },
        },
        {
          headers: {
            "Cache-Control": "s-maxage=60, stale-while-revalidate=300",
          },
        }
      );
    }
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
    const shopId = await getAuthenticatedShopId(request);
    const body = await request.json();

    try {
      const shopCondition = {
        OR: [
          { shopId },
          { userId: shopId },
          ...(shopId === "default" ? [{ shopId: "default" }] : []),
        ],
      };

      const existing = await prisma.customer.findFirst({
        where: {
          id,
          AND: [shopCondition],
        },
      });

      if (!existing) {
        return NextResponse.json(
          { success: false, error: "Customer not found" },
          { status: 404 }
        );
      }

      const dataToUpdate: any = {};
      if (body.name !== undefined) dataToUpdate.name = String(body.name).trim();
      if (body.phone !== undefined) {
        const trimmedPhone = String(body.phone).trim();
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

        // Check if phone belongs to another customer strictly in this shop
        const conflict = await prisma.customer.findFirst({
          where: {
            id: { not: id },
            AND: [
              shopCondition,
              {
                OR: [
                  { phone: trimmedPhone },
                  ...possiblePhones.map((p) => ({ phone: p })),
                  ...(clean10Digits.length === 10 ? [{ phone: { contains: clean10Digits } }] : []),
                ],
              },
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
      if (body.email !== undefined) dataToUpdate.email = body.email ? String(body.email).trim() : null;
      if (body.address !== undefined) dataToUpdate.address = body.address ? String(body.address).trim() : null;
      if (body.dob !== undefined) dataToUpdate.dob = body.dob ? new Date(body.dob) : null;
      if (body.loyalty_points !== undefined) dataToUpdate.loyalty_points = parseInt(body.loyalty_points, 10) || 0;

      let updated;
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
                shopId,
                phone: String(body.phone || "").trim(),
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
            shopId
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

      // Sync updated record with tenant fallback store
      try {
        const tenant = loadTenantState(shopId);
        const idx = tenant.customers.findIndex((c) => c.id === id);
        if (idx !== -1) {
          tenant.customers[idx] = {
            ...tenant.customers[idx],
            ...updated,
            createdAt: updated.createdAt ? updated.createdAt.toISOString() : tenant.customers[idx].createdAt,
            dob: updated.dob ? updated.dob.toISOString() : null,
            updatedAt: updated.updatedAt.toISOString(),
          } as any;
          saveTenantState(tenant);
        }
      } catch {}

      return NextResponse.json({
        success: true,
        data: {
          ...updated,
          dob: updated.dob ? updated.dob.toISOString() : null,
          createdAt: updated.createdAt.toISOString(),
          updatedAt: updated.updatedAt.toISOString(),
        },
      });
    } catch (dbError: any) {
      console.warn("Prisma PATCH customer fallback:", dbError.message);
      const tenant = loadTenantState(shopId);
      const index = tenant.customers.findIndex((c) => c.id === id);
      if (index === -1) {
        return NextResponse.json(
          { success: false, error: "Customer not found" },
          { status: 404 }
        );
      }

      if (body.phone) {
        const trimmedPhone = String(body.phone).trim();
        const conflictInTenant = tenant.customers.find(
          (c) => c.id !== id && c.phone === trimmedPhone
        );
        if (conflictInTenant) {
          return NextResponse.json(
            {
              success: false,
              error: "ALREADY_EXISTS",
              message: "This mobile number is already registered in your shop.",
              existingCustomer: {
                id: conflictInTenant.id,
                name: conflictInTenant.name,
                phone: conflictInTenant.phone,
              },
            },
            { status: 409 }
          );
        }
      }

      tenant.customers[index] = {
        ...tenant.customers[index],
        ...body,
        updatedAt: new Date().toISOString(),
      };
      saveTenantState(tenant);

      return NextResponse.json({ success: true, data: tenant.customers[index] });
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export const PUT = PATCH;

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const shopId = await getAuthenticatedShopId(request);

    try {
      const existing = await prisma.customer.findFirst({
        where: {
          id,
          OR: [
            { shopId },
            { userId: shopId },
            ...(shopId === "default" ? [{ shopId: "default" }] : []),
          ],
        },
      });

      if (existing) {
        await prisma.customer.delete({
          where: { id },
        });
      }
    } catch (e) {
      console.warn("Prisma DELETE customer fallback:", e);
    }

    try {
      const tenant = loadTenantState(shopId);
      tenant.customers = tenant.customers.filter((c) => c.id !== id);
      saveTenantState(tenant);
    } catch {}

    return NextResponse.json({ success: true, message: "Customer deleted successfully" });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
