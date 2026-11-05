"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Zap,
  Package,
  Users,
  Store,
  LogOut,
  Settings,
  ShieldPlus,
  X,
  ChevronRight,
  MessageCircle,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const pathname = usePathname();
  const { userDisplayName, userEmail, userAvatarUrl, signOut } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // If on login or auth callback, do not render bottom navigation
  if (pathname === "/login" || pathname.startsWith("/auth")) {
    return null;
  }

  const navItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      isActive: pathname === "/" || pathname === "/dashboard",
    },
    {
      name: "POS Billing",
      href: "/pos",
      icon: Zap,
      isActive: pathname.startsWith("/pos"),
    },
    {
      name: "Medicines",
      href: "/inventory",
      icon: Package,
      isActive: pathname.startsWith("/inventory"),
    },
    {
      name: "Patients",
      href: "/customers",
      icon: Users,
      isActive: pathname.startsWith("/customers"),
    },
  ];

  const handleSupportClick = () => {
    window.open(
      "https://wa.me/919820112345?text=Hello%20PharmaPulse%20ERP%20Support%2C%20I%20need%20pharmacy%20billing%20assistance.",
      "_blank"
    );
  };

  const handleSignOut = async () => {
    setIsProfileOpen(false);
    await signOut();
  };

  return (
    <>
      {/* ======================================================== */}
      {/* 1. FIXED NATIVE-STYLE BOTTOM NAVIGATION BAR (MOBILE)     */}
      {/* ======================================================== */}
      <nav
        aria-label="Mobile Navigation"
        className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 h-16 md:hidden flex items-center justify-around px-2 shadow-2xl select-none"
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex-1 flex flex-col items-center justify-center py-1 rounded-xl transition-all active:scale-90",
                item.isActive
                  ? "text-emerald-400 font-bold"
                  : "text-slate-400 hover:text-slate-200"
              )}
            >
              <div className="relative">
                <Icon
                  className={cn(
                    "w-5 h-5 transition-transform",
                    item.isActive ? "scale-110 stroke-[2.4]" : "stroke-[2]"
                  )}
                />
                {item.isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-emerald-400" />
                )}
              </div>
              <span className="text-[10px] mt-1 tracking-tight leading-none">
                {item.name}
              </span>
            </Link>
          );
        })}

        {/* Tab 5: Profile / Pharmacy Account Button */}
        <button
          type="button"
          onClick={() => setIsProfileOpen(true)}
          className={cn(
            "flex-1 flex flex-col items-center justify-center py-1 rounded-xl transition-all active:scale-90 cursor-pointer",
            isProfileOpen
              ? "text-emerald-400 font-bold"
              : "text-slate-400 hover:text-slate-200"
          )}
          aria-label="Open Pharmacy Profile"
        >
          <div className="relative">
            {userAvatarUrl ? (
              <img
                src={userAvatarUrl}
                alt={userDisplayName || "Avatar"}
                className={cn(
                  "w-5 h-5 rounded-full object-cover border transition-all",
                  isProfileOpen ? "border-emerald-400 scale-110" : "border-slate-600"
                )}
              />
            ) : (
              <div
                className={cn(
                  "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border transition-all",
                  isProfileOpen
                    ? "bg-emerald-500/20 text-emerald-400 border-emerald-400 scale-110"
                    : "bg-slate-800 text-slate-300 border-slate-700"
                )}
              >
                {userDisplayName
                  ? userDisplayName[0].toUpperCase()
                  : "Rx"}
              </div>
            )}
            {isProfileOpen && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-emerald-400" />
            )}
          </div>
          <span className="text-[10px] mt-1 tracking-tight leading-none">
            Profile
          </span>
        </button>
      </nav>

      {/* ======================================================== */}
      {/* 2. MOBILE PROFILE DRAWER                                 */}
      {/* ======================================================== */}
      {isProfileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex flex-col justify-end">
          {/* Backdrop */}
          <div
            onClick={() => setIsProfileOpen(false)}
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs animate-in fade-in"
          />

          {/* Drawer Sheet */}
          <div className="relative bg-slate-900 border-t border-slate-800 rounded-t-3xl p-5 shadow-2xl z-10 space-y-4 animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-950 text-emerald-400 border border-emerald-700/60 flex items-center justify-center font-bold text-sm">
                  Rx
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">
                    {userDisplayName || "Pharmacist In-Charge"}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    {userEmail || "OWNER • Active Terminal"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsProfileOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-1.5 text-xs">
              <Link
                href="/settings"
                onClick={() => setIsProfileOpen(false)}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-200 font-semibold transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Store className="w-4 h-4 text-emerald-400" />
                  <span>Pharmacy Profile & Drug License</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </Link>

              <Link
                href="/prescriptions"
                onClick={() => setIsProfileOpen(false)}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-200 font-semibold transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <ShieldPlus className="w-4 h-4 text-cyan-400" />
                  <span>Prescription Records & Refills</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </Link>

              <button
                type="button"
                onClick={handleSupportClick}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-[#25D366]/10 border border-[#25D366]/30 hover:bg-[#25D366]/20 text-[#25D366] font-bold transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <MessageCircle className="w-4 h-4 fill-[#25D366]/20 stroke-[#25D366]" />
                  <span>Pharmacist Support Helpline</span>
                </div>
                <ChevronRight className="w-4 h-4 text-[#25D366]/60" />
              </button>
            </div>

            <button
              type="button"
              onClick={handleSignOut}
              className="w-full py-2.5 px-4 rounded-xl font-bold text-xs text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out Terminal</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
