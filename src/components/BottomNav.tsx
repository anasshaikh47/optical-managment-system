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
import { useAppUi } from "@/context/AppUiContext";
import { cn } from "@/lib/utils";
import { APP_VERSION_DISPLAY } from "@/config/version";

export function BottomNav() {
  const pathname = usePathname();
  const { user, userDisplayName, userEmail, userAvatarUrl, signOut, isStaff, isOwner } = useAuth();
  const { isSidebarOpen } = useAppUi();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // If on login or auth callback, do not render bottom navigation
  if (pathname === "/login" || pathname.startsWith("/auth")) {
    return null;
  }

  const navItems = [
    {
      name: isStaff ? "POS" : "Home",
      href: isStaff ? "/pos" : "/dashboard",
      icon: isStaff ? Zap : LayoutDashboard,
      isActive: isStaff
        ? pathname.startsWith("/pos")
        : pathname === "/" || pathname === "/dashboard",
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
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50 bg-slate-900/90 backdrop-blur-lg border-t border-slate-800/80 h-16 pb-1 pt-1.5 md:hidden items-center justify-around px-2 shadow-2xl select-none transition-all duration-200",
          isSidebarOpen ? "hidden" : "flex"
        )}
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex-1 flex flex-col items-center justify-center py-1 rounded-xl transition-all active:scale-95",
                item.isActive
                  ? "text-sky-400 font-semibold"
                  : "text-slate-400 hover:text-slate-200"
              )}
            >
              <Icon
                className={cn(
                  "w-5 h-5 transition-transform",
                  item.isActive ? "scale-105 stroke-[2.2] text-sky-400" : "stroke-[1.8] text-slate-400"
                )}
              />
              <span className="text-[11px] font-medium tracking-tight leading-tight mt-1">
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
            "flex-1 flex flex-col items-center justify-center py-1 rounded-xl transition-all active:scale-95 cursor-pointer",
            isProfileOpen
              ? "text-sky-400 font-semibold"
              : "text-slate-400 hover:text-slate-200"
          )}
          aria-label="Open User Profile"
        >
          {userAvatarUrl ? (
            <img
              src={userAvatarUrl}
              alt={userDisplayName || "Avatar"}
              className={cn(
                "w-5 h-5 rounded-full object-cover border transition-all",
                isProfileOpen ? "border-sky-400 scale-105" : "border-slate-600"
              )}
            />
          ) : (
            <div
              className={cn(
                "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border transition-all",
                isProfileOpen
                  ? "bg-sky-500/20 text-sky-400 border-sky-400 scale-105"
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
          <span className="text-[11px] font-medium tracking-tight leading-tight mt-1">
            Profile
          </span>
        </button>
      </nav>

      {/* ======================================================== */}
      {/* 2. NATIVE PROFILE / STORE ACCOUNT BOTTOM SHEET MODAL     */}
      {/* ======================================================== */}
      {isProfileOpen && (
        <div className="fixed inset-0 z-[70] md:hidden flex flex-col justify-end">
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
                  <div className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-[10px] font-bold text-slate-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>{isStaff ? "Verified Staff • Counter Terminal" : "Verified Owner • Active Counter"}</span>
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
                <span className="text-slate-400 font-medium">Account Role</span>
                <span className="text-slate-200 font-bold font-mono">
                  {isStaff ? "STAFF TERMINAL" : "STORE OWNER"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium">Branch</span>
                <span className="text-slate-300 font-semibold">Main Branch - Live</span>
              </div>
            </div>

            {/* Quick Action Navigation Links */}
            <div className="space-y-1.5 text-xs font-semibold">
              {!isStaff && (
                <>
                  <Link
                    href="/settings"
                    onClick={() => setIsProfileOpen(false)}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 hover:bg-slate-800 border border-slate-800 text-slate-200 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <Settings className="w-4 h-4 text-slate-300" />
                      <span>My Shop Profiles &amp; Tax Settings</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500" />
                  </Link>

                  <Link
                    href="/staff"
                    onClick={() => setIsProfileOpen(false)}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 hover:bg-slate-800 border border-slate-800 text-slate-200 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <Store className="w-4 h-4 text-slate-300" />
                      <span>Staff &amp; Counter Terminals</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500" />
                  </Link>
                </>
              )}

              <button
                type="button"
                onClick={handleSupportClick}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-800/40 hover:bg-slate-800 border border-slate-800 text-slate-200 transition-colors cursor-pointer text-left"
              >
                <div className="flex items-center gap-2.5">
                  <MessageCircle className="w-4 h-4 text-[#25D366]" />
                  <span>Accounting &amp; WhatsApp Support</span>
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

            {/* Version & Sync Status */}
            <div className="pt-2 text-center space-y-0.5">
              <p className="text-[11px] font-mono text-slate-400 font-medium select-none">
                {APP_VERSION_DISPLAY}
              </p>
              <div className="inline-flex items-center gap-1.5 text-[10px] text-emerald-400/90 font-semibold select-none">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Cloud Database Synchronized</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
