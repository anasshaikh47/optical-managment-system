import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@supabase/supabase-js";

// Helper to initialize isolated Supabase client without session pollution
function getIsolatedSupabaseClient() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    "https://lnwqzandufvjywgqbivj.supabase.co";
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxud3F6YW5kdWZ2anl3Z3FiaXZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM3MDY3MTIsImV4cCI6MjEwOTI4MjcxMn0.1S0yanvEFdgveFxL2QPvlhEf4cWGgbwX5zYbF9lk2U8";

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

// GET /api/staff - List all staff or check role by email
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (email) {
      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase().trim() },
      });

      if (user) {
        return NextResponse.json({
          success: true,
          role: user.role === "STAFF" ? "STAFF" : "OWNER",
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          },
        });
      }

      // If user is not yet in prisma.user table, first store creator defaults to OWNER
      return NextResponse.json({
        success: true,
        role: "OWNER",
        user: null,
      });
    }

    const staffMembers = await prisma.user.findMany({
      orderBy: [{ role: "desc" }, { createdAt: "asc" }],
    });

    return NextResponse.json({
      success: true,
      staff: staffMembers,
    });
  } catch (error: any) {
    console.error("GET /api/staff error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch staff" },
      { status: 500 }
    );
  }
}

// POST /api/staff - Owner creates new staff or owner account with Email + Password
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name,
      email,
      password,
      role = "STAFF",
      phone = "",
      terminal = "Terminal #02 (Secondary POS)",
    } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, error: "Name, email, and password are required." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 6 characters." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const assignedRole = role === "OWNER" ? "OWNER" : "STAFF";

    // 1. Register/Sync in Supabase Auth with explicit role in user_metadata
    let authUser: any = null;
    try {
      const supabase = getIsolatedSupabaseClient();
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          data: {
            role: assignedRole,
            full_name: name.trim(),
            name: name.trim(),
            phone,
            terminal,
          },
        },
      });

      if (authError) {
        console.warn("Supabase Auth notice during staff registration:", authError.message);
      } else if (authData?.user) {
        authUser = authData.user;
      }
    } catch (authErr) {
      console.warn("Supabase isolated signup error:", authErr);
    }

    // 2. Synchronize Supabase Auth UID with Prisma User table
    let dbUser: any = null;
    if (authUser?.id) {
      const { syncUserWithPublicTable } = await import("@/lib/auth-sync");
      dbUser = await syncUserWithPublicTable({
        id: authUser.id,
        email: normalizedEmail,
        user_metadata: {
          name: name.trim(),
          role: assignedRole,
        },
      });
    } else {
      // Fallback if authUser wasn't returned directly by signUp (e.g. email confirmation required)
      dbUser = await prisma.user.upsert({
        where: { email: normalizedEmail },
        update: {
          name: name.trim(),
          role: assignedRole,
        },
        create: {
          name: name.trim(),
          email: normalizedEmail,
          role: assignedRole,
          pin_hash: password.slice(0, 8),
        },
      });
    }

    return NextResponse.json(
      {
        success: true,
        message: `${assignedRole === "OWNER" ? "Owner" : "Staff"} account created successfully.`,
        data: dbUser,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST /api/staff error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create staff account" },
      { status: 500 }
    );
  }
}
