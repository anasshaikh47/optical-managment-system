import prisma from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { loadTenantState, saveTenantState } from "@/lib/tenant/store";

export interface SyncUserData {
  id: string;
  email?: string | null;
  user_metadata?: {
    name?: string;
    full_name?: string;
    store_name?: string;
    role?: string;
    [key: string]: any;
  } | null;
}

/**
 * Ensures public."User".id strictly equals the Supabase Auth UID (`user.id`).
 * Checks public."User" by auth email or UID.
 * If a record exists with a different ID or is missing, upserts public."User" with:
 * id: authUser.id, email: authUser.email, name: authUser.user_metadata.name || authUser.email, and role: 'OWNER'.
 * Also associates the store configuration in StoreSetting with this exact Supabase Auth UID.
 */
export async function syncUserWithPublicTable(authUser: SyncUserData) {
  if (!authUser || !authUser.id) return null;

  const email = (authUser.email || "").toLowerCase().trim();
  if (!email) return null;

  const resolvedName =
    authUser.user_metadata?.name ||
    authUser.user_metadata?.full_name ||
    authUser.user_metadata?.store_name ||
    email.split("@")[0] ||
    email;

  const resolvedRole =
    (authUser.user_metadata?.role || "OWNER").toUpperCase() === "STAFF"
      ? "STAFF"
      : "OWNER";

  try {
    // 1. Check existing record by email and by id
    const existingByEmail = await prisma.user.findUnique({
      where: { email },
    });

    const existingById = await prisma.user.findUnique({
      where: { id: authUser.id },
    });

    // 2. If a record exists with a different ID (e.g. from seed or prior custom ID)
    if (existingByEmail && existingByEmail.id !== authUser.id) {
      const oldId = existingByEmail.id;

      // Migrate existing orders/customers/inventory items from old ID to Supabase Auth UID
      try {
        await prisma.order.updateMany({
          where: {
            OR: [{ shopId: oldId }, { userId: oldId }],
          },
          data: {
            shopId: authUser.id,
            userId: authUser.id,
          },
        });

        await prisma.customer.updateMany({
          where: {
            OR: [{ shopId: oldId }, { userId: oldId }],
          },
          data: {
            shopId: authUser.id,
            userId: authUser.id,
          },
        });

        await prisma.inventoryItem.updateMany({
          where: { shopId: oldId },
          data: { shopId: authUser.id },
        });

        // Migrate store settings if old id was used
        const oldSetting = await prisma.storeSetting.findUnique({
          where: { id: oldId },
        });
        if (oldSetting) {
          await prisma.storeSetting.delete({ where: { id: oldId } });
        }
      } catch (migrateErr) {
        console.warn("Notice: Error while migrating records from old user ID:", migrateErr);
      }

      // Delete mismatched user record so we can create/upsert with authUser.id
      try {
        await prisma.user.delete({
          where: { id: oldId },
        });
      } catch (delErr) {
        console.warn("Notice: Error removing old mismatched user row:", delErr);
      }
    }

    // 3. Upsert public."User" with id: authUser.id strictly matching Supabase Auth UID
    const syncedUser = await prisma.user.upsert({
      where: { id: authUser.id },
      create: {
        id: authUser.id,
        email,
        name: resolvedName,
        role: resolvedRole,
        pin_hash: existingByEmail?.pin_hash || existingById?.pin_hash || "1234",
      },
      update: {
        email,
        name: resolvedName,
        role: existingById?.role || resolvedRole,
      },
    });

    // 4. In StoreSetting table, associate the store configuration with this exact Supabase Auth UID
    try {
      const existingSetting = await prisma.storeSetting.findUnique({
        where: { id: authUser.id },
      });

      if (!existingSetting) {
        const defaultSetting = await prisma.storeSetting.findUnique({
          where: { id: "default" },
        });

        const storeTitle =
          authUser.user_metadata?.store_name ||
          (resolvedName ? `${resolvedName}'s Eyewear Studio` : defaultSetting?.storeName) ||
          "VisionPulse Eyewear Studio";

        await prisma.storeSetting.create({
          data: {
            id: authUser.id,
            storeName: storeTitle,
            tagline: defaultSetting?.tagline || "Precision Optometry & Designer Eyewear",
            gstin: defaultSetting?.gstin || "",
            phone: defaultSetting?.phone || "",
            email: defaultSetting?.email || email,
            address: defaultSetting?.address || "",
            currencySymbol: defaultSetting?.currencySymbol || "₹",
            currencyCode: defaultSetting?.currencyCode || "INR",
            defaultGstRate: defaultSetting?.defaultGstRate ?? 12.0,
            receiptFooter:
              defaultSetting?.receiptFooter ||
              "1-Year warranty against frame manufacturing defects. Spectacle power adaptation guarantee for 14 days.",
          },
        });
      }

      // Synchronize in-memory tenant state
      const tenant = loadTenantState(authUser.id);
      tenant.settings.shopId = authUser.id;
      if (authUser.user_metadata?.store_name) {
        tenant.settings.storeName = authUser.user_metadata.store_name;
      }
      saveTenantState(tenant);
    } catch (settingErr) {
      console.warn("Notice associating store configuration with Supabase Auth UID:", settingErr);
    }

    return syncedUser;
  } catch (err: any) {
    console.error("syncUserWithPublicTable error:", err);
    throw err;
  }
}

/**
 * Returns the active authenticated Supabase UID (`session.user.id`).
 * Prioritizes:
 * 1. Active Supabase SSR session user (via cookies)
 * 2. Authorization: Bearer token header
 * 3. Client tenant headers (x-user-id / x-shop-id) or query params
 * 4. Fallback to "default"
 */
export async function getAuthenticatedShopId(request?: Request): Promise<string> {
  // 1. Check Supabase server session user
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user?.id) {
      return user.id;
    }
  } catch {
    // SSR session not active or in static/non-request context
  }

  // 2. Check Bearer token in request Authorization header
  if (request) {
    try {
      const authHeader = request.headers.get("authorization");
      if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.substring(7);
        const supabase = await createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser(token);

        if (user?.id) {
          return user.id;
        }
      }
    } catch {}

    // 3. Fallback to header or query parameter
    const fromHeader =
      request.headers.get("x-user-id") ||
      request.headers.get("x-shop-id");
    if (fromHeader && fromHeader.trim() && fromHeader !== "default") {
      return fromHeader.trim();
    }

    try {
      const url = new URL(request.url);
      const fromQuery = url.searchParams.get("userId") || url.searchParams.get("shopId");
      if (fromQuery && fromQuery.trim() && fromQuery !== "default") {
        return fromQuery.trim();
      }
    } catch {}

    if (fromHeader && fromHeader.trim()) {
      return fromHeader.trim();
    }

    try {
      const url = new URL(request.url);
      const fromQuery = url.searchParams.get("userId") || url.searchParams.get("shopId");
      if (fromQuery && fromQuery.trim()) {
        return fromQuery.trim();
      }
    } catch {}
  }

  return "default";
}
