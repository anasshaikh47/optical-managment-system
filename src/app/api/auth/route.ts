import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { syncUserWithPublicTable } from "@/lib/auth-sync";

export async function POST(request: Request) {
  try {
    let authUser: any = null;

    try {
      const body = await request.json();
      authUser = body?.user || body;
    } catch {
      // Body may be empty if called with empty payload
    }

    if (!authUser || !authUser.id) {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      authUser = user;
    }

    if (!authUser || !authUser.id) {
      return NextResponse.json(
        { success: false, error: "No active authenticated Supabase user found" },
        { status: 401 }
      );
    }

    const syncedUser = await syncUserWithPublicTable({
      id: authUser.id,
      email: authUser.email,
      user_metadata: authUser.user_metadata,
    });

    return NextResponse.json({
      success: true,
      message: "Supabase Auth UID successfully synchronized with public User table",
      user: syncedUser,
    });
  } catch (error: any) {
    console.error("POST /api/auth error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to sync auth user" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || !user.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const syncedUser = await syncUserWithPublicTable({
      id: user.id,
      email: user.email,
      user_metadata: user.user_metadata,
    });

    return NextResponse.json({
      success: true,
      user: syncedUser,
    });
  } catch (error: any) {
    console.error("GET /api/auth error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to retrieve and sync auth user" },
      { status: 500 }
    );
  }
}
