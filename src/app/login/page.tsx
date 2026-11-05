"use client";

import React, { useState, useEffect, Suspense, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Pill, Shield, Store, ArrowRight, Loader2, Mail, Lock, User, CheckCircle2, AlertCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { createClient } from "@/lib/supabase/client";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const supabase = useMemo(() => createClient(), []);

  const [activeTab, setActiveTab] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [storeName, setStoreName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // If already logged in, redirect to dashboard or POS
  useEffect(() => {
    if (!authLoading && user) {
      const redirectUrl = searchParams.get("redirect") || "/dashboard";
      router.push(redirectUrl);
    }
  }, [user, authLoading, router, searchParams]);

  // Check for error in URL params (e.g. from OAuth redirect or disabled provider)
  useEffect(() => {
    const errorParam = searchParams.get("error");
    const errorDesc = searchParams.get("error_description");
    if (errorParam || errorDesc) {
      setErrorMsg("Google sign-in is being configured. Please sign in or register with Email & Password.");
    }
  }, [searchParams]);

  // Handle Google OAuth Sign In
  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setGoogleLoading(true);
    try {
      const redirectTo = `${window.location.origin}/auth/callback`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });
      if (error) {
        console.error("Supabase Auth Detailed Error:", error);
        setErrorMsg("Google sign-in is being configured. Please sign in or register with Email & Password.");
      }
    } catch (err: any) {
      console.error("Supabase Auth Detailed Error:", err);
      setErrorMsg("Google sign-in is being configured. Please sign in or register with Email & Password.");
    } finally {
      setGoogleLoading(false);
    }
  };

  // Handle Email/Password Sign In or Sign Up
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email || !password) {
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
          email,
          password,
        });

        if (error) {
          console.error("Supabase Auth Detailed Error:", error);
          setErrorMsg(error.message || "Invalid email or password.");
        } else {
          setSuccessMsg("Signed in successfully! Redirecting...");
          const redirectUrl = searchParams.get("redirect") || "/dashboard";
          router.push(redirectUrl);
          router.refresh();
        }
      } else {
        const displayName = fullName || storeName || email.split("@")[0];
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: displayName,
              name: displayName,
              store_name: storeName || `${displayName}'s Optics`,
            },
          },
        });

        if (error) {
          console.error("Supabase Auth Detailed Error:", error);
          setErrorMsg(error.message || "Could not register store account.");
        } else if (data?.session) {
          setSuccessMsg("Store account registered! Redirecting to fresh counter...");
          const redirectUrl = searchParams.get("redirect") || "/dashboard";
          router.push(redirectUrl);
          router.refresh();
        } else {
          setSuccessMsg("Store account registered! Please sign in with your email and password.");
          setActiveTab("signin");
        }
      }
    } catch (err: any) {
      console.error("Supabase Auth Detailed Error:", err);
      setErrorMsg(err.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden select-none">
      {/* Main Container */}
      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-teal-500/10 border border-teal-500/30 text-teal-400 mb-3 shadow-xs">
            <Pill className="w-8 h-8 stroke-[2.2]" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            PharmaPulse POS & ERP
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            Pharmacy Terminal & Medical Store Management System
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl p-6 sm:p-7">
          {/* Sign In / Sign Up Tab Switcher */}
          <div className="grid grid-cols-2 p-1 bg-slate-950 border border-slate-800 rounded-xl mb-6">
            <button
              type="button"
              onClick={() => {
                setActiveTab("signin");
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === "signin"
                  ? "bg-slate-800 text-white border border-slate-700/80 shadow-xs"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Sign In to Counter
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("signup");
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === "signup"
                  ? "bg-slate-800 text-white border border-slate-700/80 shadow-xs"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Register New Store
            </button>
          </div>

          {/* Continue with Google Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading || isSubmitting}
            className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs sm:text-sm border border-slate-200 shadow-sm transition-all active:scale-[0.99] cursor-pointer disabled:opacity-70 disabled:pointer-events-none"
          >
            {googleLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-slate-600" />
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            <span>Continue with Google</span>
          </button>

          {/* Divider */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase">
              <span className="bg-slate-900 px-2 text-slate-500 font-semibold tracking-wider">
                or continue with email
              </span>
            </div>
          </div>

          {/* Feedback Messages */}
          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5 animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <div className="leading-relaxed">{errorMsg}</div>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2.5 animate-in fade-in duration-150">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
              <div className="leading-relaxed">{successMsg}</div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {activeTab === "signup" && (
              <>
                <div>
                  <label className="block text-slate-300 font-semibold text-xs mb-1">
                    Store / Boutique Name
                  </label>
                  <div className="relative">
                    <Store className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="e.g. VisionOptics Boutique"
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-[#090F24] border border-slate-800 rounded-xl text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold text-xs mb-1">
                    Owner / Staff Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="e.g. Dr. Alex Johnson"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-[#090F24] border border-slate-800 rounded-xl text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-slate-300 font-semibold text-xs mb-1">
                Account Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="owner@yourstore.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-[#090F24] border border-slate-800 rounded-xl text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-slate-300 font-semibold text-xs">
                  Password
                </label>
                {activeTab === "signin" && (
                  <span className="text-[10px] text-cyan-400 hover:underline cursor-pointer">
                    Forgot PIN?
                  </span>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-[#090F24] border border-slate-800 rounded-xl text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || googleLoading}
              className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-cyan-700 hover:bg-cyan-800 text-white font-bold text-xs sm:text-sm border border-cyan-600 shadow-xs transition-all active:scale-[0.99] cursor-pointer disabled:opacity-70 disabled:pointer-events-none"
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
                      ? "Sign In to Store Terminal"
                      : "Create Store Account"}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Access Bar */}
          <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5 text-slate-400">
              <Shield className="w-3.5 h-3.5 text-teal-400" />
              <span>Multi-Tenant Data Isolated</span>
            </span>
            <button
              type="button"
              onClick={() => {
                setEmail("pharmacist@pharmapulse.in");
                setPassword("password123");
                setActiveTab("signin");
              }}
              className="text-teal-400 hover:text-teal-300 font-semibold cursor-pointer underline underline-offset-2"
            >
              Fill Sample Credentials
            </button>
          </div>
        </div>

        {/* Security badge footer */}
        <p className="text-center text-[11px] text-slate-500 mt-5">
          PharmaPulse Cloud • 256-bit Encrypted Session • Supabase Auth Verified
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen w-full bg-[#070D1E] flex items-center justify-center text-cyan-400 text-xs">
          Loading authentication portal...
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
