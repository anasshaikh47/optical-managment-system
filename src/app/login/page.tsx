"use client";

import React, { useState, useEffect, Suspense, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Loader2, Mail, Lock, User, Store, ShieldCheck, AlertCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { createClient } from "@/lib/supabase/client";
import { VisionPulseMark } from "@/components/VisionPulseLogo";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isStaff, isOwner, loading: authLoading } = useAuth();
  const supabase = useMemo(() => createClient(), []);

  const [activeTab, setActiveTab] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [storeName, setStoreName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // If already logged in, redirect based on role
  useEffect(() => {
    if (!authLoading && user) {
      if (isStaff) {
        router.push("/pos");
      } else {
        const redirectUrl = searchParams.get("redirect") || "/dashboard";
        router.push(redirectUrl);
      }
    }
  }, [user, authLoading, isStaff, router, searchParams]);

  // Handle Email/Password Sign In or Sign Up
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanEmail = email.toLowerCase().trim();

    if (!cleanEmail || !password) {
      setErrorMsg("Please enter both email and password.");
      return;
    }

    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters long.");
      return;
    }

    setIsSubmitting(true);

    try {
      if (activeTab === "signin") {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

        if (error) {
          console.error("Supabase Auth error:", error);
          setErrorMsg(error.message || "Invalid credentials. Please verify your email and password.");
        } else {
          setSuccessMsg("Credentials verified. Initializing session...");

          // Synchronize Supabase Auth UID with public User table
          if (data?.user) {
            try {
              await fetch("/api/auth", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ user: data.user }),
              });
            } catch (syncErr) {
              console.warn("User DB sync warning:", syncErr);
            }
          }

          // Determine role from metadata or database
          const metaRole = (data.user?.user_metadata?.role || "").toUpperCase();

          // Check server role if not explicit in metadata
          let assignedRole = metaRole;
          if (!assignedRole) {
            try {
              const res = await fetch(`/api/staff?email=${encodeURIComponent(cleanEmail)}`);
              const resJson = await res.json();
              assignedRole = resJson.role || "OWNER";
            } catch {
              assignedRole = "OWNER";
            }
          }

          if (assignedRole === "STAFF") {
            router.push("/pos");
          } else {
            const redirectUrl = searchParams.get("redirect") || "/dashboard";
            router.push(redirectUrl);
          }
          router.refresh();
        }
      } else {
        // Registering a new store: First user registering always becomes OWNER
        const displayName = fullName || storeName || cleanEmail.split("@")[0];
        const storeDisplayName = storeName || `${displayName}'s Optics`;

        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: {
              role: "OWNER",
              full_name: displayName,
              name: displayName,
              store_name: storeDisplayName,
            },
          },
        });

        if (error) {
          console.error("Supabase Auth registration error:", error);
          setErrorMsg(error.message || "Could not register store account.");
        } else {
          // Synchronize Supabase Auth UID with public User table
          if (data?.user) {
            try {
              await fetch("/api/auth", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ user: data.user }),
              });
            } catch (syncErr) {
              console.warn("User DB sync warning:", syncErr);
            }
          }

          if (data?.session) {
            setSuccessMsg("Store account registered! Redirecting to workspace...");
            router.push("/dashboard");
            router.refresh();
          } else {
            setSuccessMsg("Store account registered successfully! Please sign in with your credentials.");
            setActiveTab("signin");
          }
        }
      }
    } catch (err: any) {
      console.error("Authentication exception:", err);
      setErrorMsg(err.message || "Authentication error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#0B0F17] flex items-center justify-center p-4 selection:bg-slate-800 selection:text-white">
      <div className="w-full max-w-md">
        {/* Main Brand Card */}
        <div className="bg-[#111827]/80 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md">
          {/* Header & Logo */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 text-slate-100 flex items-center justify-center shadow-md mb-3.5">
              <VisionPulseMark className="w-8 h-8" />
            </div>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-white font-sans">
              VisionPulse
            </h1>
            <p className="text-[11px] font-medium tracking-wider text-slate-400 uppercase mt-0.5">
              Optical Retail &amp; Clinical Suite
            </p>
          </div>

          {/* Tab Selector: Sign In vs Register Store */}
          <div className="grid grid-cols-2 p-1 bg-[#0B0F17] rounded-xl border border-slate-800/80 mb-5">
            <button
              type="button"
              onClick={() => {
                setActiveTab("signin");
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activeTab === "signin"
                  ? "bg-slate-800 text-white shadow-xs"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Terminal Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("signup");
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activeTab === "signup"
                  ? "bg-slate-800 text-white shadow-xs"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Register Store
            </button>
          </div>

          {/* Feedback messages */}
          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Authentication Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {activeTab === "signup" && (
              <>
                <div>
                  <label className="block text-slate-300 font-medium text-xs mb-1">
                    Store / Practice Name
                  </label>
                  <div className="relative">
                    <Store className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. VisionPulse Eyewear Studio"
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-[#0B0F17] border border-slate-800 rounded-xl text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-slate-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium text-xs mb-1">
                    Full Name (Store Owner)
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="e.g. Rajesh Sharma"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-[#0B0F17] border border-slate-800 rounded-xl text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-slate-600"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-slate-300 font-medium text-xs mb-1">
                Account Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="owner@yourstore.com or staff@yourstore.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-[#0B0F17] border border-slate-800 rounded-xl text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-slate-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-medium text-xs mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-[#0B0F17] border border-slate-800 rounded-xl text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-slate-600"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-3 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-white text-slate-950 font-semibold text-xs sm:text-sm transition-all active:scale-[0.99] cursor-pointer shadow-md disabled:opacity-60 disabled:pointer-events-none"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>
                    {activeTab === "signin"
                      ? "Sign In to Terminal"
                      : "Create Store Owner Account"}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Enterprise RBAC Indicator (Sample credentials button removed) */}
          <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5 text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-slate-300" />
              <span>Role-Based Access Control</span>
            </span>
            <span className="font-mono text-slate-400 text-[10px]">
              {activeTab === "signin" ? "Owner / Staff Terminal" : "Store Administrator"}
            </span>
          </div>
        </div>

        {/* Security badge footer */}
        <p className="text-center text-[11px] text-slate-400 mt-5">
          VisionPulse Cloud • 256-bit Encrypted Session • Enterprise Architecture
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen w-full bg-[#0B0F17] flex items-center justify-center text-slate-400 text-xs">
          Loading authentication portal...
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
