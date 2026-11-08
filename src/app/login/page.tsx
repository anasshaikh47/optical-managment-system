"use client";

import React, { useState, useEffect, Suspense, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  Loader2,
  Mail,
  Lock,
  User,
  Store,
  ShieldCheck,
  AlertCircle,
  KeyRound,
  Zap,
  Crown,
  Eye,
  EyeOff,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { createClient } from "@/lib/supabase/client";
import { VisionPulseMark } from "@/components/VisionPulseLogo";

type RoleTab = "owner" | "staff";
type OwnerMode = "signin_password" | "signin_otp" | "register";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isStaff, isOwner, loading: authLoading } = useAuth();
  const supabase = useMemo(() => createClient(), []);

  const isSwitching = searchParams.get("switch") === "true";

  // Segmented Role Selector: Store Owner vs Staff / Operator
  const [roleTab, setRoleTab] = useState<RoleTab>("owner");

  // Owner Mode (Password, OTP, or Register Store)
  const [ownerMode, setOwnerMode] = useState<OwnerMode>("signin_password");

  // Form Fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [fullName, setFullName] = useState("");
  const [storeName, setStoreName] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Status & Feedback
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // If already logged in (and not explicitly switching accounts), redirect based on role
  useEffect(() => {
    if (isSwitching) {
      // Clear current active session & cookies to facilitate switching accounts
      supabase.auth.signOut().catch(() => {});
      return;
    }

    if (!authLoading && user) {
      if (isStaff) {
        router.push("/pos");
      } else {
        const redirectUrl = searchParams.get("redirect") || "/dashboard";
        router.push(redirectUrl);
      }
    }
  }, [user, authLoading, isStaff, isSwitching, router, searchParams, supabase]);

  // Handle Owner or Staff Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanEmail = email.toLowerCase().trim();

    if (!cleanEmail) {
      setErrorMsg("Please enter your account email.");
      return;
    }

    // ========================================================
    // CASE A: OWNER OTP LOGIN
    // ========================================================
    if (roleTab === "owner" && ownerMode === "signin_otp") {
      if (!otpSent) {
        // Step 1: Send OTP code
        setIsSubmitting(true);
        try {
          const { error } = await supabase.auth.signInWithOtp({
            email: cleanEmail,
            options: {
              emailRedirectTo: `${window.location.origin}/auth/callback`,
            },
          });

          if (error) {
            setErrorMsg(error.message || "Failed to send one-time code.");
          } else {
            setOtpSent(true);
            setSuccessMsg(`One-Time Code / Magic Link dispatched to ${cleanEmail}. Check your inbox.`);
          }
        } catch (err: any) {
          setErrorMsg(err.message || "Failed to dispatch OTP code.");
        } finally {
          setIsSubmitting(false);
        }
        return;
      } else {
        // Step 2: Verify OTP code
        if (!otpCode || otpCode.trim().length < 6) {
          setErrorMsg("Please enter the 6-digit verification code from your email.");
          return;
        }

        setIsSubmitting(true);
        try {
          const { data, error } = await supabase.auth.verifyOtp({
            email: cleanEmail,
            token: otpCode.trim(),
            type: "email",
          });

          if (error) {
            setErrorMsg(error.message || "Invalid or expired OTP code.");
          } else {
            setSuccessMsg("Identity verified! Loading owner dashboard...");
            if (data?.user) {
              await fetch("/api/auth", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ user: data.user }),
              });
            }
            router.push("/dashboard");
            router.refresh();
          }
        } catch (err: any) {
          setErrorMsg(err.message || "Verification failed. Please try again.");
        } finally {
          setIsSubmitting(false);
        }
        return;
      }
    }

    // ========================================================
    // CASE B: REGISTER NEW STORE (Owner)
    // ========================================================
    if (roleTab === "owner" && ownerMode === "register") {
      if (!password || password.length < 6) {
        setErrorMsg("Password must be at least 6 characters long.");
        return;
      }

      setIsSubmitting(true);
      try {
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
            setSuccessMsg("Store account registered! Redirecting to dashboard...");
            router.push("/dashboard");
            router.refresh();
          } else {
            setSuccessMsg("Store registered! Please sign in with your credentials.");
            setOwnerMode("signin_password");
          }
        }
      } catch (err: any) {
        setErrorMsg(err.message || "Registration exception occurred.");
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // ========================================================
    // CASE C: STANDARD PASSWORD SIGN IN (Owner or Staff)
    // ========================================================
    if (!password) {
      setErrorMsg(
        roleTab === "staff"
          ? "Please enter your Terminal PIN or Password."
          : "Please enter your account password."
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (error) {
        setErrorMsg(
          roleTab === "staff"
            ? `Staff verification failed for ${cleanEmail}. Please verify your email and PIN/Password.`
            : error.message || "Invalid credentials. Please verify your email and password."
        );
      } else {
        setSuccessMsg(
          roleTab === "staff"
            ? "Staff terminal authenticated! Scoping access to POS..."
            : "Store Owner credentials verified. Loading practice dashboard..."
        );

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

        // Determine destination role
        const metaRole = (data.user?.user_metadata?.role || "").toUpperCase();
        let assignedRole = metaRole;

        if (!assignedRole) {
          try {
            const res = await fetch(`/api/staff?email=${encodeURIComponent(cleanEmail)}`);
            const resJson = await res.json();
            assignedRole = resJson.role || (roleTab === "staff" ? "STAFF" : "OWNER");
          } catch {
            assignedRole = roleTab === "staff" ? "STAFF" : "OWNER";
          }
        }

        // Scope permissions: Staff goes straight to POS terminal
        if (roleTab === "staff" || assignedRole === "STAFF") {
          router.push("/pos");
        } else {
          const redirectUrl = searchParams.get("redirect") || "/dashboard";
          router.push(redirectUrl);
        }
        router.refresh();
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Authentication error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#0B0F17] flex items-center justify-center p-4 selection:bg-slate-800 selection:text-white">
      <div className="w-full max-w-md">
        {/* Main Brand Card */}
        <div className="bg-[#111827]/85 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md">
          {/* Header & Logo */}
          <div className="flex flex-col items-center text-center mb-5">
            <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 text-slate-100 flex items-center justify-center shadow-md mb-3">
              <VisionPulseMark className="w-8 h-8" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-sans">
              VisionPulse
            </h1>
            <p className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase mt-0.5">
              Optical Retail &amp; Clinical ERP Suite
            </p>
          </div>

          {/* Account Switching Banner */}
          {isSwitching && (
            <div className="mb-4 p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/25 text-cyan-300 text-xs flex items-center gap-2">
              <RefreshCw className="w-4 h-4 shrink-0 text-cyan-400 animate-spin" />
              <span>Switching account. Please select Store Owner or Staff to sign in.</span>
            </div>
          )}

          {/* ======================================================== */}
          {/* SEGMENTED TAB SELECTOR: [ STORE OWNER ] | [ STAFF ]      */}
          {/* ======================================================== */}
          <div className="grid grid-cols-2 p-1 bg-[#0B0F17] rounded-2xl border border-slate-800 mb-4">
            <button
              type="button"
              onClick={() => {
                setRoleTab("owner");
                setErrorMsg(null);
                setSuccessMsg(null);
                setOtpSent(false);
              }}
              className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                roleTab === "owner"
                  ? "bg-slate-800 text-white shadow-md border border-slate-700/60"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Crown className={`w-3.5 h-3.5 ${roleTab === "owner" ? "text-amber-400" : "text-slate-500"}`} />
              <span>Store Owner</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setRoleTab("staff");
                setErrorMsg(null);
                setSuccessMsg(null);
                setOtpSent(false);
              }}
              className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                roleTab === "staff"
                  ? "bg-slate-800 text-white shadow-md border border-slate-700/60"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Zap className={`w-3.5 h-3.5 ${roleTab === "staff" ? "text-cyan-400" : "text-slate-500"}`} />
              <span>Staff / Operator</span>
            </button>
          </div>

          {/* Role Status Description Pills */}
          <div className="mb-4 px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-800/80 text-[11px] flex items-center justify-between">
            <span className="text-slate-400 font-medium">Permission Scope:</span>
            {roleTab === "owner" ? (
              <span className="font-semibold text-amber-400/90 flex items-center gap-1 font-mono text-[10px]">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>Full Access (Profit, Sales, Settings)</span>
              </span>
            ) : (
              <span className="font-semibold text-cyan-400/90 flex items-center gap-1 font-mono text-[10px]">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                <span>Scoped (POS Billing &amp; Customers)</span>
              </span>
            )}
          </div>

          {/* Owner Sub-Mode Toggle (Sign In vs OTP vs Register) */}
          {roleTab === "owner" && (
            <div className="flex items-center justify-between gap-2 mb-4 text-[11px] font-semibold border-b border-slate-800 pb-2">
              <button
                type="button"
                onClick={() => {
                  setOwnerMode("signin_password");
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className={`transition-colors cursor-pointer ${
                  ownerMode === "signin_password" ? "text-cyan-400 underline underline-offset-4" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Password Login
              </button>

              <button
                type="button"
                onClick={() => {
                  setOwnerMode("signin_otp");
                  setErrorMsg(null);
                  setSuccessMsg(null);
                  setOtpSent(false);
                }}
                className={`transition-colors cursor-pointer ${
                  ownerMode === "signin_otp" ? "text-cyan-400 underline underline-offset-4" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                One-Time OTP Login
              </button>

              <button
                type="button"
                onClick={() => {
                  setOwnerMode("register");
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className={`transition-colors cursor-pointer ${
                  ownerMode === "register" ? "text-emerald-400 underline underline-offset-4" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Register Store
              </button>
            </div>
          )}

          {/* Feedback Messages */}
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

          {/* ======================================================== */}
          {/* AUTHENTICATION FORM                                      */}
          {/* ======================================================== */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Store Registration Extra Fields (Owner only) */}
            {roleTab === "owner" && ownerMode === "register" && (
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
                      className="w-full pl-9 pr-3 py-2 bg-[#0B0F17] border border-slate-800 rounded-xl text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium text-xs mb-1">
                    Owner Full Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="e.g. Rajesh Sharma"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-[#0B0F17] border border-slate-800 rounded-xl text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Email Field */}
            <div>
              <label className="block text-slate-300 font-medium text-xs mb-1">
                {roleTab === "owner" ? "Store Owner Email" : "Staff Member Email"}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder={
                    roleTab === "owner"
                      ? "owner@yourstore.com"
                      : "staff@yourstore.com"
                  }
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-[#0B0F17] border border-slate-800 rounded-xl text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            {/* Password / PIN Field (If not in OTP flow or if in register mode) */}
            {(roleTab === "staff" || (roleTab === "owner" && ownerMode !== "signin_otp")) && (
              <div>
                <label className="block text-slate-300 font-medium text-xs mb-1">
                  {roleTab === "staff" ? "Terminal PIN or Password" : "Password"}
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder={
                      roleTab === "staff"
                        ? "Enter 4-6 digit Terminal PIN or Password"
                        : "••••••••"
                    }
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-10 py-2 bg-[#0B0F17] border border-slate-800 rounded-xl text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-cyan-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* OTP Code Input (When OTP mode is selected for Owner and code is sent) */}
            {roleTab === "owner" && ownerMode === "signin_otp" && otpSent && (
              <div>
                <label className="block text-slate-300 font-medium text-xs mb-1">
                  6-Digit Verification Code
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="123456"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-[#0B0F17] border border-cyan-500 rounded-xl text-white text-center font-mono tracking-widest text-sm focus:outline-none focus:ring-1 focus:ring-cyan-400"
                  />
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full mt-3 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm transition-all active:scale-[0.99] cursor-pointer shadow-md disabled:opacity-60 disabled:pointer-events-none ${
                roleTab === "staff"
                  ? "bg-cyan-600 hover:bg-cyan-500 text-white"
                  : "bg-slate-100 hover:bg-white text-slate-950"
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>
                    {roleTab === "staff"
                      ? "Sign In to Staff Terminal (POS)"
                      : ownerMode === "register"
                      ? "Create Store Owner Account"
                      : ownerMode === "signin_otp" && !otpSent
                      ? "Send One-Time OTP Code"
                      : ownerMode === "signin_otp" && otpSent
                      ? "Verify & Open Dashboard"
                      : "Sign In as Store Owner"}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* RBAC Info Footer */}
          <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5 text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-slate-300" />
              <span>Multi-Tenant Access</span>
            </span>
            <span className="font-mono text-slate-400 text-[10px]">
              {roleTab === "owner" ? "Store Owner Authority" : "Operator Terminal #01"}
            </span>
          </div>
        </div>

        {/* Security badge footer */}
        <p className="text-center text-[11px] text-slate-400 mt-5">
          VisionPulse Cloud • 256-bit Encrypted Session • Multi-Counter Security
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
