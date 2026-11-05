"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Zap,
  Package,
  Users,
  User,
  Store,
  LogOut,
  Settings,
  ShieldCheck,
  X,
  ChevronRight,
  MessageCircle,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const pathname = usePathname();
  const { user, userDisplayName, userEmail, userAvatarUrl, signOut } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // If on login or auth callback, do not render bottom navigation
  if (pathname === "/login" || pathname.startsWith("/auth")) {
    return null;
  }

  const navItems = [
    {
      name: "Home",
      href: "/dashboard",
      icon: LayoutDashboard,
      isActive: pathname === "/" || pathname === "/dashboard",
    },
    {
      name: "Billing",
      href: "/pos",
      icon: Zap,
      isActive: pathname.startsWith("/pos"),
    },
    {
      name: "Stock",
      href: "/inventory",
      icon: Package,
      isActive: pathname.startsWith("/inventory"),
    },
    {
      name: "Customers",
      href: "/customers",
      icon: Users,
      isActive: pathname.startsWith("/customers"),
    },
  ];

  const handleSupportClick = () => {
    window.open(
      "https://wa.me/919820112345?text=Hello%20Optical%20ERP%20Support%2C%20I%20need%20accounting%20assistance.",
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
        className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 h-14 md:hidden flex items-center justify-around px-2 py-1.5 shadow-2xl select-none"
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex-1 flex flex-col items-center justify-center py-0.5 rounded-lg transition-all active:scale-90",
                item.isActive
                  ? "text-cyan-400 font-bold"
                  : "text-slate-400 hover:text-slate-200"
              )}
            >
              <div className="relative">
                <Icon
                  className={cn(
                    "w-5 h-5 transition-transform",
                    item.isActive ? "scale-105 stroke-[2.2]" : "stroke-[1.8]"
                  )}
                />
                {item.isActive && (
                  <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-cyan-400" />
                )}
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight leading-none">
                {item.name}
              </span>
            </Link>
          );
        })}

        {/* Tab 5: Profile / Store Account Button */}
        <button
          type="button"
          onClick={() => setIsProfileOpen(true)}
          className={cn(
            "flex-1 flex flex-col items-center justify-center py-0.5 rounded-lg transition-all active:scale-90 cursor-pointer",
            isProfileOpen
              ? "text-cyan-400 font-bold"
              : "text-slate-400 hover:text-slate-200"
          )}
          aria-label="Open User Profile"
        >
          <div className="relative">
            {userAvatarUrl ? (
              <img
                src={userAvatarUrl}
                alt={userDisplayName || "Avatar"}
                className={cn(
                  "w-5 h-5 rounded-full object-cover border transition-all",
                  isProfileOpen ? "border-cyan-400 scale-105" : "border-slate-600"
                )}
              />
            ) : (
              <div
                className={cn(
                  "w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold border transition-all",
                  isProfileOpen
                    ? "bg-cyan-500/20 text-cyan-400 border-cyan-400 scale-105"
                    : "bg-slate-800 text-slate-300 border-slate-700"
                )}
              >
                {userDisplayName
                  ? userDisplayName[0].toUpperCase()
                  : userEmail
                  ? userEmail[0].toUpperCase()
                  : "U"}
              </div>
            )}
            {isProfileOpen && (
              <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-cyan-400" />
            )}
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight leading-none">
            Profile
          </span>
        </button>
      </nav>

      {/* ======================================================== */}
      {/* 2. NATIVE PROFILE / STORE ACCOUNT BOTTOM SHEET MODAL     */}
      {/* ======================================================== */}
      {isProfileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex flex-col justify-end">
          {/* Backdrop */}
          <div
            onClick={() => setIsProfileOpen(false)}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200"
          />

          {/* Sheet Container */}
          <div className="relative bg-slate-900 border-t border-slate-800 rounded-t-3xl p-5 pb-8 shadow-2xl text-slate-200 max-h-[85vh] overflow-y-auto space-y-4 animate-in slide-in-from-bottom duration-250">
            {/* Sheet Handle */}
            <div className="w-12 h-1.5 rounded-full bg-slate-700 mx-auto -mt-1 mb-2" />

            {/* Profile Header Card */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3 min-w-0">
                {userAvatarUrl ? (
                  <img
                    src={userAvatarUrl}
                    alt={userDisplayName || "Avatar"}
                    className="w-12 h-12 rounded-2xl object-cover border border-slate-700 shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 flex items-center justify-center font-bold text-base shrink-0">
                    {userDisplayName
                      ? userDisplayName
                          .split(" ")
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join("")
                          .toUpperCase()
                      : userEmail
                      ? userEmail[0].toUpperCase()
                      : "OP"}
                  </div>
                )}
                <div className="min-w-0">
                  <h3 className="font-bold text-base text-white truncate leading-tight">
                    {userDisplayName || userEmail?.split("@")[0] || "Store Owner"}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono truncate mt-0.5">
                    {userEmail || "owner@visionpulse.in"}
                  </p>
                  <div className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>Verified Owner • Active Counter</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsProfileOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Store & Cloud Status Details */}
            <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium">Store Profile</span>
                <span className="text-white font-bold truncate max-w-[180px]">
                  {userDisplayName ? `${userDisplayName}'s Optics` : "VisionPulse Optics"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium">Database Ledger</span>
                <span className="text-emerald-400 font-semibold font-mono flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Cloud Synced (Supabase)
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium">Branch</span>
                <span className="text-slate-300 font-semibold">Main Branch - Live</span>
              </div>
            </div>

            {/* Quick Action Navigation Links */}
            <div className="space-y-1.5 text-xs font-semibold">
              <Link
                href="/settings"
                onClick={() => setIsProfileOpen(false)}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 hover:bg-slate-800 border border-slate-800 text-slate-200 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Settings className="w-4 h-4 text-cyan-400" />
                  <span>My Shop Profiles & Tax Settings</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </Link>

              <Link
                href="/staff"
                onClick={() => setIsProfileOpen(false)}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 hover:bg-slate-800 border border-slate-800 text-slate-200 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Store className="w-4 h-4 text-indigo-400" />
                  <span>Staff & Counter Terminals</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </Link>

              <button
                type="button"
                onClick={handleSupportClick}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-800/40 hover:bg-slate-800 border border-slate-800 text-slate-200 transition-colors cursor-pointer text-left"
              >
                <div className="flex items-center gap-2.5">
                  <MessageCircle className="w-4 h-4 text-[#25D366]" />
                  <span>Accounting & WhatsApp Support</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            {/* Sign Out Action Button */}
            <button
              type="button"
              onClick={handleSignOut}
              className="w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out of Account</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
