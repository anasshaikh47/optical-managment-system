"use client";

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from "react";
import { User, Session } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export const DEMO_USER = {
  id: "default",
  aud: "authenticated",
  role: "authenticated",
  email: "pharmacist@pharmapulse.in",
  user_metadata: {
    full_name: "Dr. Ramesh Joshi (Pharmacist)",
    name: "Dr. Ramesh Joshi",
    store_name: "PharmaPulse Medical & POS",
  },
  app_metadata: {
    provider: "email",
  },
  created_at: "2026-01-01T00:00:00.000Z",
} as unknown as User;

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  shopId: string;
  userDisplayName: string;
  userEmail: string;
  userAvatarUrl: string | null;
  signInWithGoogle: () => Promise<{ error: any }>;
  signInWithPassword: (email: string, password: string) => Promise<{ data: any; error: any }>;
  signUpWithPassword: (
    email: string,
    password: string,
    storeOrName?: string
  ) => Promise<{ data: any; error: any }>;
  loginAsDemo: () => void;
  signOut: () => Promise<void>;
  tenantFetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    let mounted = true;

    // Check for demo session cookie / localStorage
    const hasDemoCookie =
      typeof document !== "undefined" &&
      document.cookie.includes("pharmapulse_session=active");
    const hasDemoStorage =
      typeof window !== "undefined" &&
      localStorage.getItem("pharmapulse_session") === "active";

    if (hasDemoCookie || hasDemoStorage) {
      if (typeof document !== "undefined" && !document.cookie.includes("pharmapulse_session=active")) {
        document.cookie = "pharmapulse_session=active; path=/; max-age=2592000; SameSite=Lax";
      }
      setUser(DEMO_USER);
      setLoading(false);
      return;
    }

    // Check active session on mount
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        if (!mounted) return;
        if (session) {
          setSession(session);
          setUser(session.user ?? null);
        }
        setLoading(false);
      })
      .catch(() => {
        if (mounted) setLoading(false);
      });

    // Listen to Supabase auth state change events
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setSession(session);
        setUser(session.user ?? null);
      } else if (
        typeof document !== "undefined" &&
        document.cookie.includes("pharmapulse_session=active")
      ) {
        setUser(DEMO_USER);
      } else {
        setSession(null);
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  // Derived user details
  const userDisplayName = useMemo(() => {
    if (!user) return "";
    return (
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.user_metadata?.store_name ||
      user.email?.split("@")[0] ||
      "Pharmacist In-Charge"
    );
  }, [user]);

  const userEmail = useMemo(() => {
    return user?.email || "";
  }, [user]);

  const userAvatarUrl = useMemo(() => {
    return (
      user?.user_metadata?.avatar_url ||
      user?.user_metadata?.picture ||
      null
    );
  }, [user]);

  // Primary multi-tenant identifier: user.id
  const shopId = useMemo(() => {
    return user?.id || "default";
  }, [user]);

  // Instant Demo / Dev login
  const loginAsDemo = useCallback(() => {
    if (typeof document !== "undefined") {
      document.cookie = "pharmapulse_session=active; path=/; max-age=2592000; SameSite=Lax";
      localStorage.setItem("pharmapulse_session", "active");
    }
    setUser(DEMO_USER);
    setSession({
      access_token: "demo-token",
      token_type: "bearer",
      expires_in: 2592000,
      refresh_token: "demo-refresh",
      user: DEMO_USER,
    } as unknown as Session);
    setLoading(false);
  }, []);

  // Sign In with Google OAuth
  const signInWithGoogle = useCallback(async () => {
    try {
      const redirectTo = `${window.location.origin}/auth/callback`;
      const result = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });
      if (result.error) {
        console.error("Supabase Auth Detailed Error:", result.error);
      }
      return result;
    } catch (error: any) {
      console.error("Supabase Auth Detailed Error:", error);
      return { error };
    }
  }, [supabase]);

  // Sign In with Email & Password
  const signInWithPassword = useCallback(
    async (email: string, password: string) => {
      try {
        const result = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (result.error) {
          console.error("Supabase Auth Detailed Error:", result.error);
        }
        return result;
      } catch (error: any) {
        console.error("Supabase Auth Detailed Error:", error);
        return { data: null, error };
      }
    },
    [supabase]
  );

  // Sign Up with Email & Password
  const signUpWithPassword = useCallback(
    async (email: string, password: string, storeOrName?: string) => {
      try {
        const result = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: storeOrName || email.split("@")[0],
              name: storeOrName || email.split("@")[0],
              store_name: storeOrName || `${email.split("@")[0]}'s Pharmacy`,
            },
          },
        });
        if (result.error) {
          console.error("Supabase Auth Detailed Error:", result.error);
        }
        return result;
      } catch (error: any) {
        console.error("Supabase Auth Detailed Error:", error);
        return { data: null, error };
      }
    },
    [supabase]
  );

  // Sign Out
  const signOut = useCallback(async () => {
    try {
      if (typeof document !== "undefined") {
        document.cookie = "pharmapulse_session=; path=/; max-age=0";
        localStorage.removeItem("pharmapulse_session");
      }
      await supabase.auth.signOut();
    } catch (e) {
      console.error("SignOut error:", e);
    } finally {
      setUser(null);
      setSession(null);
      router.push("/login");
    }
  }, [supabase, router]);

  // Tenant fetch helper: Automatically scopes API requests with shopId & userId
  const tenantFetch = useCallback(
    async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const currentShopId = user?.id || "default";
      let urlStr = typeof input === "string" ? input : input.toString();

      if (!urlStr.includes("shopId=") && !urlStr.includes("userId=")) {
        const separator = urlStr.includes("?") ? "&" : "?";
        urlStr = `${urlStr}${separator}shopId=${encodeURIComponent(currentShopId)}&userId=${encodeURIComponent(currentShopId)}`;
      }

      const headers = new Headers(init?.headers || {});
      if (!headers.has("x-shop-id")) {
        headers.set("x-shop-id", currentShopId);
      }
      if (!headers.has("x-user-id")) {
        headers.set("x-user-id", currentShopId);
      }

      return fetch(urlStr, {
        ...init,
        headers,
      });
    },
    [user]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        shopId,
        userDisplayName,
        userEmail,
        userAvatarUrl,
        signInWithGoogle,
        signInWithPassword,
        signUpWithPassword,
        loginAsDemo,
        signOut,
        tenantFetch,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
