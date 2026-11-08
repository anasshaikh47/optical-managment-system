"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Zap,
  Package,
  Users,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useAppUi } from "@/context/AppUiContext";
import { ProfileDrawer } from "@/components/ProfileDrawer";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const pathname = usePathname();
  const { user, userDisplayName, userEmail, userAvatarUrl, isStaff } = useAuth();
  const { isSidebarOpen } = useAppUi();
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
      isActive: pathname === "/dashboard",
      ownerOnly: true,
    },
    {
      name: "POS Terminal",
      href: "/pos",
      icon: Zap,
      isActive: pathname.startsWith("/pos"),
    },
    {
      name: "Inventory",
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

  return (
    <>
      {/* ======================================================== */}
      {/* 1. FIXED NATIVE-STYLE BOTTOM NAVIGATION BAR (MOBILE)     */}
      {/* ======================================================== */}
      <nav
        aria-label="Mobile Navigation"
        className={cn(
          "md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 px-2 py-1.5 flex items-center justify-around shadow-2xl transition-all duration-300 pb-[env(safe-area-inset-bottom,0px)]",
          isSidebarOpen && "pointer-events-none opacity-0 translate-y-full"
        )}
      >
        {navItems.map((item) => {
          // If staff, hide owner-only tabs
          if (isStaff && item.ownerOnly) return null;

          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all duration-200 select-none group min-h-[48px]",
                item.isActive
                  ? "text-sky-400 font-bold"
                  : "text-slate-400 hover:text-slate-200 font-medium"
              )}
            >
              <div
                className={cn(
                  "p-1 rounded-lg transition-transform duration-200 group-active:scale-90",
                  item.isActive && "bg-sky-500/15"
                )}
              >
                <Icon
                  className={cn(
                    "w-5 h-5 transition-colors",
                    item.isActive ? "stroke-[2.5]" : "stroke-[1.8]"
                  )}
                />
              </div>
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
            "flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all duration-200 select-none group min-h-[48px] cursor-pointer",
            isProfileOpen
              ? "text-sky-400 font-bold"
              : "text-slate-400 hover:text-slate-200 font-medium"
          )}
          aria-label="Open User Profile"
        >
          {userAvatarUrl ? (
            <img
              src={userAvatarUrl}
              alt={userDisplayName || "Avatar"}
              className={cn(
                "w-6 h-6 rounded-full object-cover border transition-transform duration-200",
                isProfileOpen ? "border-sky-400 scale-105" : "border-slate-600"
              )}
            />
          ) : (
            <div
              className={cn(
                "w-6 h-6 rounded-full bg-slate-800 border flex items-center justify-center font-bold text-[10px] transition-transform duration-200",
                isProfileOpen
                  ? "border-sky-400 text-sky-400 scale-105"
                  : "border-slate-700 text-slate-300"
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

      {/* Dynamic Profile Sheet Drawer */}
      <ProfileDrawer isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
    </>
  );
}
