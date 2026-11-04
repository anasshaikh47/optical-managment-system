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

export function Sidebar() {
  const pathname = usePathname();
  const { openNewCustomerModal, isSidebarOpen, closeSidebar } = useAppUi();

  // Auto-close mobile sidebar drawer whenever route changes
  useEffect(() => {
    closeSidebar();
  }, [pathname]);

  const navItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      isDashboard: true,
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
      name: "Terminal Sales (POS)",
      href: "/pos",
      icon: Receipt,
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
    },
    {
      name: "Staff & Branches",
      href: "/staff",
      icon: Users,
    },
  ];

  const handleSupportClick = () => {
    window.open(
      "https://wa.me/919820112345?text=Hello%20Optical%20ERP%20Support%2C%20I%20need%20accounting%20assistance%20for%20My%20Optics%20Shop.",
      "_blank"
    );
  };

  const handleLogoutClick = () => {
    if (confirm("You are currently on OWNER - Active Terminal. Do you want to lock or switch counter user?")) {
      alert("Terminal session locked. Re-enter staff PIN to resume.");
    }
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isSidebarOpen && (
        <div
          onClick={closeSidebar}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-40 md:hidden animate-in fade-in duration-200"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container: Off-canvas drawer on mobile, static on desktop */}
      <aside
        className={cn(
          "bg-[#0B132B] text-slate-200 flex flex-col border-r border-[#1a233a] select-none shadow-xl transition-transform duration-300 ease-in-out",
          // Mobile Drawer styling
          "fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw]",
          // Desktop styling
          "md:static md:w-64 md:translate-x-0 md:z-30 md:flex-shrink-0",
          // State transition
          isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        {/* ======================================================== */}
        {/* TOP CARD: Shop logo with "Workspace Live" badge          */}
        {/* ======================================================== */}
        <div className="p-4 border-b border-[#1a233a] bg-[#070d1e]/80 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 text-white shrink-0">
              <Eye className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="font-black text-sm tracking-wide text-white leading-tight truncate">
                My Optics Shop
              </h1>
              <div className="inline-flex items-center gap-1.5 mt-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-bold text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Workspace Live</span>
              </div>
            </div>
          </div>

          {/* Close button on mobile drawer */}
          <button
            type="button"
            onClick={closeSidebar}
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ======================================================== */}
        {/* MENU ITEMS (Matching Reference Structure)                */}
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
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-300 hover:text-white hover:bg-[#152243] transition-all duration-150 group text-left cursor-pointer"
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
                  "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 group",
                  isActive && item.isDashboard
                    ? "border-l-4 border-red-500 bg-red-500/15 text-white pl-3 shadow-md shadow-red-500/10"
                    : isActive
                    ? "bg-slate-800 text-white shadow-sm"
                    : "text-slate-300 hover:text-white hover:bg-[#152243]"
                )}
              >
                <Icon
                  className={cn(
                    "w-4 h-4 transition-transform duration-150 group-hover:scale-110 shrink-0",
                    isActive && item.isDashboard
                      ? "text-red-400"
                      : isActive
                      ? "text-cyan-400"
                      : "text-slate-400 group-hover:text-slate-200"
                  )}
                />
                <span className="flex-1 truncate">{item.name}</span>
                {isActive && item.isDashboard && (
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* ======================================================== */}
        {/* BOTTOM SECTION                                           */}
        {/* ======================================================== */}
        <div className="p-3 border-t border-[#1a233a] bg-[#070d1e]/90 space-y-2.5">
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
          <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-[#0e1935] border border-[#1a2b56] text-xs">
            <div className="flex items-center gap-2 text-slate-300 font-medium">
              <span className="text-sm">🇬🇧</span>
              <span className="text-[11px] font-semibold">GB English</span>
            </div>
            <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider">
              Default
            </span>
          </div>

          {/* Current User Card: OWNER - Active Terminal */}
          <div className="flex items-center justify-between p-2 rounded-xl bg-[#0e1935] border border-[#1a2b56]">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-red-600/20 text-red-400 border border-red-500/30 flex items-center justify-center font-bold text-xs shrink-0">
                RS
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate leading-tight">
                  Rajesh Sharma
                </p>
                <p className="text-[10px] text-emerald-400 font-mono font-semibold truncate">
                  OWNER • Active Terminal
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogoutClick}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
              title="Lock Counter Terminal"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
