import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { syncUserWithPublicTable } from "@/lib/auth-sync";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        if (data?.user) {
          try {
            await syncUserWithPublicTable(data.user);
          } catch (syncErr) {
            console.error("Auth callback user sync error:", syncErr);
          }
        }
        return NextResponse.redirect(`${origin}${next}`);
      }
    } catch (e) {
      console.error("Auth callback error:", e);
    }
  }

  // Return the user to an error page or login with instructions
  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
