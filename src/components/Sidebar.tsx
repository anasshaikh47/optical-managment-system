"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  FileText,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "POS Billing", href: "/pos", icon: ShoppingCart, highlight: true },
  { name: "Orders Tracking", href: "/orders", icon: FileText },
  { name: "Inventory", href: "/inventory", icon: Package },
  { name: "Customers", href: "/customers", icon: Users },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-60 bg-slate-900 text-slate-200 flex flex-col flex-shrink-0 border-r border-slate-800 select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-5 gap-3 border-b border-slate-800 bg-slate-950/60">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-md text-white font-bold">
          <Eye className="w-5 h-5" />
        </div>
        <div>
          <h1 className="font-extrabold text-sm tracking-wider text-white leading-tight">
            VISION<span className="text-cyan-400">PULSE</span>
          </h1>
          <p className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase">
            Optical POS & ERP
          </p>
        </div>
      </div>

      {/* Navigation Links - 5 Core Clean Tabs */}
      <nav className="flex-1 py-5 px-3 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/" || pathname === "/dashboard"
              : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 group",
                isActive
                  ? "bg-cyan-600 text-white shadow-md shadow-cyan-600/30"
                  : item.highlight
                  ? "text-cyan-300 hover:bg-slate-800 hover:text-white"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              )}
            >
              <Icon
                className={cn(
                  "w-4 h-4 transition-transform duration-150 group-hover:scale-110",
                  isActive
                    ? "text-white"
                    : item.highlight
                    ? "text-cyan-400"
                    : "text-slate-400 group-hover:text-slate-200"
                )}
              />
              <span className="flex-1 truncate">{item.name}</span>
              {item.highlight && !isActive && (
                <span className="px-1.5 py-0.2 text-[9px] uppercase font-bold tracking-wider rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  Counter
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer Store Status */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40">
        <div className="flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <div className="text-xs">
            <p className="text-slate-200 font-bold text-[11px]">VisionPulse Retail</p>
            <p className="text-slate-500 text-[10px]">Galleria Studio • Active</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
