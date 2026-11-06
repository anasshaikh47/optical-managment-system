"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { VisionPulseMark } from "@/components/VisionPulseLogo";
import { useAuth } from "@/context/AuthContext";
import { ArrowRight, ShieldCheck, Zap, Layers, Loader2 } from "lucide-react";

export default function SplashScreen() {
  const router = useRouter();
  const { user, loading, isStaff, isOwner, userDisplayName } = useAuth();
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      setRedirecting(true);
      const timer = setTimeout(() => {
        if (isStaff) {
          router.push("/pos");
        } else {
          router.push("/dashboard");
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [user, loading, isStaff, router]);

  return (
    <div className="min-h-screen w-full bg-[#0B0F17] flex items-center justify-center p-4 selection:bg-slate-800 selection:text-white">
      <div className="w-full max-w-md bg-[#111827]/80 border border-slate-800 rounded-3xl p-8 sm:p-10 shadow-2xl backdrop-blur-md flex flex-col items-center text-center">
        {/* Geometric Minimalist Optical Mark */}
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-900 border border-slate-800 text-slate-100 flex items-center justify-center shadow-lg shadow-black/50 mb-6 transition-transform hover:scale-105 duration-300">
          <VisionPulseMark className="w-9 h-9 sm:w-11 sm:h-11" />
        </div>

        {/* Branding Typography */}
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white font-sans">
          VisionPulse
        </h1>
        <p className="text-xs sm:text-sm font-medium tracking-wider text-slate-400 uppercase mt-1">
          Optical Retail &amp; Clinical Suite
        </p>

        <div className="w-12 h-px bg-slate-800 my-6" />

        {/* Dynamic Status / Actions */}
        {loading ? (
          <div className="flex items-center gap-2 text-xs text-slate-400 py-3">
            <Loader2 className="w-4 h-4 animate-spin text-slate-300" />
            <span>Initializing optical workspace...</span>
          </div>
        ) : user ? (
          <div className="space-y-4 w-full">
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-left">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-400">Active Account</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-200 border border-slate-700">
                  {isStaff ? "STAFF TERMINAL" : "STORE OWNER"}
                </span>
              </div>
              <p className="text-sm font-bold text-white mt-1 truncate">
                {userDisplayName}
              </p>
              <p className="text-xs text-slate-400 font-mono truncate">{user.email}</p>
            </div>

            <button
              onClick={() => router.push(isStaff ? "/pos" : "/dashboard")}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-100 hover:bg-white text-slate-950 font-semibold text-xs sm:text-sm transition-all active:scale-[0.99] shadow-md cursor-pointer"
            >
              <span>{redirecting ? "Launching Workspace..." : "Continue to Workspace"}</span>
              {redirecting ? (
                <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
              ) : (
                <ArrowRight className="w-4 h-4" />
              )}
            </button>
          </div>
        ) : (
          <div className="space-y-4 w-full">
            <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
              Precision Optometry, Real-Time POS Billing &amp; Enterprise Multi-Terminal Access.
            </p>

            <Link
              href="/login"
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-100 hover:bg-white text-slate-950 font-semibold text-xs sm:text-sm transition-all active:scale-[0.99] shadow-md cursor-pointer"
            >
              <span>Access Store Terminal</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {/* Enterprise Badges */}
        <div className="mt-8 pt-6 border-t border-slate-800/80 w-full flex items-center justify-around text-[10px] sm:text-[11px] text-slate-400 font-medium">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-slate-300" />
            <span>Role-Based RBAC</span>
          </span>
          <span className="w-1 h-1 rounded-full bg-slate-700" />
          <span className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-slate-300" />
            <span>Fast POS Billing</span>
          </span>
          <span className="w-1 h-1 rounded-full bg-slate-700" />
          <span className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-slate-300" />
            <span>Cloud Ledger</span>
          </span>
        </div>
      </div>
    </div>
  );
}
