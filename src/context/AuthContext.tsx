"use client";

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from "react";
import { User, Session } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export type UserRole = "OWNER" | "STAFF";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  shopId: string;
  role: UserRole;
  isOwner: boolean;
  isStaff: boolean;
  userDisplayName: string;
  userEmail: string;
  userAvatarUrl: string | null;
  signInWithGoogle: () => Promise<{ error: any }>;
  signInWithPassword: (email: string, password: string) => Promise<{ data: any; error: any }>;
  signUpWithPassword: (
    email: string,
    password: string,
    storeOrName?: string,
    role?: UserRole
  ) => Promise<{ data: any; error: any }>;
  signOut: () => Promise<void>;
  tenantFetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [serverRole, setServerRole] = useState<UserRole | null>(null);
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    let mounted = true;

    // Check active session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen to Supabase auth state change events
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  // Sync role with database table
  useEffect(() => {
    if (!user?.email) {
      setServerRole(null);
      return;
    }

    let isMounted = true;
    fetch(`/api/staff?email=${encodeURIComponent(user.email)}`)
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data?.role) {
          setServerRole(data.role === "STAFF" ? "STAFF" : "OWNER");
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [user?.email]);

  // Role calculation: First checks server DB confirmation, then user_metadata, defaults to OWNER for store creator
  const role: UserRole = useMemo(() => {
    if (serverRole) return serverRole;
    const metaRole = (user?.user_metadata?.role || "").toUpperCase();
    if (metaRole === "STAFF") return "STAFF";
    if (metaRole === "OWNER") return "OWNER";
    return "OWNER";
  }, [user, serverRole]);

  const isOwner = role === "OWNER";
  const isStaff = role === "STAFF";

  // Derived user details
  const userDisplayName = useMemo(() => {
    if (!user) return "";
    return (
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.user_metadata?.store_name ||
      user.email?.split("@")[0] ||
      (isStaff ? "Staff Member" : "Store Owner")
    );
  }, [user, isStaff]);

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

  // Sign Up with Email & Password (First store creator becomes OWNER)
  const signUpWithPassword = useCallback(
    async (
      email: string,
      password: string,
      storeOrName?: string,
      accountRole: UserRole = "OWNER"
    ) => {
      try {
        const result = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              role: accountRole,
              full_name: storeOrName || email.split("@")[0],
              name: storeOrName || email.split("@")[0],
              store_name: storeOrName || `${email.split("@")[0]}'s Optics`,
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
      await supabase.auth.signOut();
    } catch (e) {
      console.error("SignOut error:", e);
    } finally {
      setUser(null);
      setSession(null);
      setServerRole(null);
      router.push("/login");
    }
  }, [supabase, router]);

  // Tenant fetch helper: Automatically scopes API requests with shopId & userId
  const tenantFetch = useCallback(
    async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const currentShopId = user?.id || "default";
      let urlStr = typeof input === "string" ? input : input.toString();

      // Append shopId and userId as query params if not already present
      if (!urlStr.includes("shopId=") && !urlStr.includes("userId=")) {
        const separator = urlStr.includes("?") ? "&" : "?";
        urlStr = `${urlStr}${separator}shopId=${encodeURIComponent(currentShopId)}&userId=${encodeURIComponent(currentShopId)}`;
      }

      // Merge headers
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
        role,
        isOwner,
        isStaff,
        userDisplayName,
        userEmail,
        userAvatarUrl,
        signInWithGoogle,
        signInWithPassword,
        signUpWithPassword,
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
