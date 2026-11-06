"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  UserPlus,
  Search,
  Wrench,
  Receipt,
  Package,
  Store,
  Users,
  LogOut,
  Globe,
  Eye,
  MessageCircle,
  X,
} from "lucide-react";
import { useAppUi } from "@/context/AppUiContext";
import { InstallPwaButton } from "@/components/InstallPwaButton";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { VisionPulseMark } from "@/components/VisionPulseLogo";

export function Sidebar() {
  const pathname = usePathname();
  const { openNewCustomerModal, isSidebarOpen, closeSidebar } = useAppUi();
  const { user, userDisplayName, userEmail, userAvatarUrl, signOut, isStaff, isOwner } = useAuth();

  // Auto-close mobile sidebar drawer whenever route changes
  useEffect(() => {
    closeSidebar();
  }, [pathname]);

  const allNavItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      isDashboard: true,
      ownerOnly: true,
    },
    {
      name: "Terminal Sales (POS)",
      href: "/pos",
      icon: Receipt,
    },
    {
      name: "Add Customer",
      isAction: true,
      onClick: () => {
        closeSidebar();
        openNewCustomerModal();
      },
      icon: UserPlus,
    },
    {
      name: "Search Customer",
      href: "/customers",
      icon: Search,
    },
    {
      name: "Repairing Module",
      href: "/repairing",
      icon: Wrench,
    },
    {
      name: "Stock Control (Inventory)",
      href: "/inventory",
      icon: Package,
    },
    {
      name: "My Shop Profiles",
      href: "/settings",
      icon: Store,
      ownerOnly: true,
    },
    {
      name: "Staff & Branches",
      href: "/staff",
      icon: Users,
      ownerOnly: true,
    },
  ];

  const navItems = allNavItems.filter((item) => {
    if (isStaff && item.ownerOnly) return false;
    return true;
  });

  const handleSupportClick = () => {
    window.open(
      "https://wa.me/919820112345?text=Hello%20Optical%20ERP%20Support%2C%20I%20need%20accounting%20assistance%20for%20My%20Optics%20Shop.",
      "_blank"
    );
  };

  const handleLogoutClick = async () => {
    await signOut();
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isSidebarOpen && (
        <div
          onClick={closeSidebar}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-[60] md:hidden animate-in fade-in duration-200"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container: Off-canvas drawer on mobile, static on desktop */}
      <aside
        className={cn(
          "bg-slate-900 text-slate-200 flex flex-col border-r border-slate-800 select-none shadow-2xl transition-transform duration-300 ease-in-out",
          // Mobile Drawer styling: z-[60], full viewport height
          "fixed inset-y-0 left-0 z-[60] w-72 max-w-[85vw] h-screen h-[100dvh] overflow-hidden",
          // Desktop styling
          "md:static md:w-64 md:translate-x-0 md:z-30 md:flex-shrink-0 md:h-full",
          // State transition
          isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        {/* ======================================================== */}
        {/* TOP CARD: Shop logo with "Workspace Live" badge          */}
        {/* ======================================================== */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-100 shrink-0 shadow-sm">
              <VisionPulseMark className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="font-bold text-sm tracking-tight text-white leading-tight truncate">
                {userDisplayName ? `${userDisplayName}'s Optics` : "VisionPulse Optics"}
              </h1>
              <div className="inline-flex items-center gap-1.5 mt-1 px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-[10px] font-semibold text-slate-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>{isStaff ? "Staff Counter Terminal" : "Executive Workspace"}</span>
              </div>
            </div>
          </div>

          {/* Close button on mobile drawer */}
          <button
            type="button"
            onClick={closeSidebar}
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ======================================================== */}
        {/* MENU ITEMS (Clean Matte Enterprise Navigation Pills)     */}
        {/* ======================================================== */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;

            if (item.isAction) {
              return (
                <button
                  key={item.name}
                  type="button"
                  onClick={item.onClick}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/60 border border-slate-800/80 transition-all duration-150 group text-left cursor-pointer"
                >
                  <Icon className="w-4 h-4 text-cyan-400 transition-transform duration-150 group-hover:scale-110 shrink-0" />
                  <span className="flex-1 truncate">{item.name}</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    + Add
                  </span>
                </button>
              );
            }

            const isActive =
              item.href === "/dashboard"
                ? pathname === "/" || pathname === "/dashboard"
                : pathname.startsWith(item.href || "");

            return (
              <Link
                key={item.name}
                href={item.href || "#"}
                onClick={closeSidebar}
                className={cn(
                  "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 group",
                  isActive
                    ? "bg-slate-800 text-white font-bold shadow-xs border border-slate-700/60"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                )}
              >
                <Icon
                  className={cn(
                    "w-4 h-4 shrink-0 transition-transform duration-150 group-hover:scale-110",
                    isActive ? "text-cyan-400" : "text-slate-500 group-hover:text-slate-300"
                  )}
                />
                <span className="flex-1 truncate">{item.name}</span>
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* ======================================================== */}
        {/* BOTTOM SECTION                                           */}
        {/* ======================================================== */}
        <div className="p-3 pb-8 md:pb-3 border-t border-slate-800 bg-slate-950/90 space-y-2.5 shrink-0">
          {/* Native PWA Install App Action */}
          <InstallPwaButton variant="sidebar" />

          {/* WhatsApp Accounting Support Button */}
          <button
            type="button"
            onClick={handleSupportClick}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-[#25D366] bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/30 transition-all cursor-pointer group"
            title="Direct WhatsApp Accounting & Billing Support"
          >
            <MessageCircle className="w-4 h-4 fill-[#25D366]/20 stroke-[#25D366] group-hover:scale-110 transition-transform" />
            <span>Accounting Support</span>
          </button>

          {/* Language Selector: GB English */}
          <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs">
            <div className="flex items-center gap-2 text-slate-300 font-medium">
              <span className="text-sm">🇬🇧</span>
              <span className="text-[11px] font-semibold">GB English</span>
            </div>
            <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider">
              Default
            </span>
          </div>

          {/* Logged In User Profile Card */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/70 border border-slate-700/60">
            <div className="flex items-center gap-2.5 min-w-0">
              {userAvatarUrl ? (
                <img
                  src={userAvatarUrl}
                  alt={userDisplayName || "User Avatar"}
                  className="w-8 h-8 rounded-lg object-cover border border-slate-600 shrink-0"
                />
              ) : (
                <div className="w-8 h-8 rounded-lg bg-slate-700 text-cyan-400 border border-slate-600 flex items-center justify-center font-bold text-xs shrink-0">
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
                <p className="text-xs font-bold text-white truncate leading-tight">
                  {userDisplayName || userEmail?.split("@")[0] || "Store Owner"}
                </p>
                <p className="text-[10px] text-slate-400 font-mono truncate">
                  {userEmail || "user@visionpulse.in"} • {isStaff ? "STAFF" : "OWNER"}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogoutClick}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
