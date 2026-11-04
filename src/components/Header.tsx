"use client";

import Link from "next/link";
import {
  MapPin,
  Search,
  Package,
  Zap,
  CheckCircle2,
  Smartphone,
  Eye,
  ShieldCheck,
  UserPlus,
  Menu,
} from "lucide-react";
import { useAppUi } from "@/context/AppUiContext";
import { InstallPwaButton } from "@/components/InstallPwaButton";

interface HeaderProps {
  title?: string;
  subtitle?: string;
  children?: React.ReactNode;
}

export function Header({ children }: HeaderProps) {
  const { openNewCustomerModal, openQuickSearchModal, openMobileSyncModal, toggleSidebar } = useAppUi();

  return (
    <header className="bg-white border-b border-slate-200 flex flex-col flex-shrink-0 z-20 shadow-xs select-none">
      {/* ======================================================== */}
      {/* 1. UPPER ROW - PRIMARY PROMINENT LARGE ACTION BUTTONS    */}
      {/* ======================================================== */}
      <div className="px-3 sm:px-4 lg:px-6 py-2.5 sm:py-3 flex flex-wrap items-center justify-between gap-2.5 sm:gap-3">
        {/* Left Side: Hamburger Menu (Mobile) + Shop Branding */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {/* Mobile Hamburger Menu Button */}
          <button
            type="button"
            onClick={toggleSidebar}
            className="md:hidden p-2 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer shrink-0"
            title="Toggle Navigation Menu"
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-5 h-5 stroke-[2.2]" />
          </button>

          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-slate-950 via-slate-900 to-cyan-950 text-cyan-400 flex items-center justify-center shadow-sm border border-slate-700/60 shrink-0">
            <Eye className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-400 stroke-[2.4]" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-black text-slate-900 tracking-tight leading-none truncate">
                My Optics Shop
              </h2>
            </div>
            <p className="text-[10px] sm:text-xs text-slate-500 font-medium truncate mt-0.5 hidden xs:block">
              Welcome back! Manage your shop efficiently
            </p>
          </div>
        </div>

        {/* Center / Right: 4 Action Buttons with Responsive Padding & Wrapping */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 md:gap-3 flex-wrap">
          {/* [ + New Customer ] */}
          <button
            type="button"
            onClick={openNewCustomerModal}
            className="px-3 py-2 sm:px-5 sm:py-3 lg:px-6 lg:py-3.5 rounded-xl font-bold text-xs sm:text-sm text-slate-800 bg-white hover:bg-slate-50 border-2 border-slate-200 hover:border-blue-500 shadow-xs flex items-center gap-1.5 sm:gap-2.5 transition-all hover:shadow-sm active:scale-[0.98] cursor-pointer"
            title="Register new patient / customer immediately"
          >
            <UserPlus className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 stroke-[2.4]" />
            <span className="hidden sm:inline">+ New Customer</span>
            <span className="sm:hidden font-bold">+ Customer</span>
          </button>

          {/* [ 🔍 Search Record (Ctrl+K) ] */}
          <button
            type="button"
            onClick={openQuickSearchModal}
            className="px-3 py-2 sm:px-5 sm:py-3 lg:px-6 lg:py-3.5 rounded-xl font-bold text-xs sm:text-sm text-slate-700 bg-slate-50 hover:bg-slate-100 border-2 border-slate-200 hover:border-slate-300 shadow-xs flex items-center gap-1.5 sm:gap-2.5 transition-all active:scale-[0.98] cursor-pointer group"
            title="Search customer phone, name, or bill no (Ctrl+K)"
          >
            <Search className="w-4 h-4 sm:w-5 sm:h-5 text-slate-500 group-hover:text-slate-800 stroke-[2.2]" />
            <span className="hidden sm:inline">Search Record</span>
            <span className="sm:hidden">Search</span>
            <kbd className="hidden lg:inline-block px-2 py-0.5 text-[11px] font-mono font-bold bg-white border border-slate-300 rounded text-slate-600 shadow-2xs">
              Ctrl+K
            </kbd>
          </button>

          {/* [ 📦 Inventory ] */}
          <Link
            href="/inventory"
            className="px-3 py-2 sm:px-5 sm:py-3 lg:px-6 lg:py-3.5 rounded-xl font-bold text-xs sm:text-sm text-slate-800 bg-white hover:bg-slate-50 border-2 border-slate-200 hover:border-indigo-400 shadow-xs flex items-center gap-1.5 sm:gap-2.5 transition-all hover:shadow-sm active:scale-[0.98] cursor-pointer"
            title="Manage Frames, Lenses & Barcodes"
          >
            <Package className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 stroke-[2.4]" />
            <span className="hidden xs:inline">Inventory</span>
          </Link>

          {/* [ ⚡ POS Terminal / New Bill ] */}
          <Link
            href="/pos"
            className="px-3 py-2 sm:px-5 sm:py-3 lg:px-6 lg:py-3.5 rounded-xl font-black text-xs sm:text-sm text-amber-950 bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 hover:from-amber-500 hover:to-yellow-500 border-2 border-amber-500/50 shadow-md shadow-amber-400/25 flex items-center gap-1.5 sm:gap-2.5 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            title="Open Optical POS Billing Screen"
          >
            <Zap className="w-4 h-4 sm:w-5 sm:h-5 fill-amber-950 text-amber-950 stroke-[2.5]" />
            <span className="hidden sm:inline tracking-tight">⚡ POS Terminal / New Bill</span>
            <span className="sm:hidden tracking-tight font-black">POS</span>
          </Link>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. LOWER SUB-ROW - COMPACT SECONDARY STATUS BAR          */}
      {/* ======================================================== */}
      <div className="bg-slate-50/95 border-t border-slate-200/80 px-3 sm:px-4 lg:px-6 py-1.5 sm:py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
        {/* Status Pills */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* Database Ledger: Cloud Synced */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold text-[10px] sm:text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="font-mono">Database Ledger: Cloud Synced</span>
          </div>

          {/* Plan: ACTIVE */}
          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300 font-extrabold text-[10px] tracking-wider uppercase">
            <ShieldCheck className="w-3 h-3 text-emerald-700" />
            <span>Plan: ACTIVE</span>
          </div>

          {/* Mobile Sync Ready */}
          <button
            type="button"
            onClick={openMobileSyncModal}
            className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold text-[10px] sm:text-[11px] transition-colors cursor-pointer shadow-2xs"
            title="Wireless Barcode Scanner Ready"
          >
            <Smartphone className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span>Mobile Sync Ready</span>
          </button>

          {/* Store Branch Indicator */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-slate-200/70 text-slate-700 font-bold text-[10px] sm:text-[11px]">
            <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
            <span>Main Branch - Live</span>
          </div>

          {/* Native PWA Install Button */}
          <InstallPwaButton variant="header" />
        </div>

        {/* Counter Terminal Info (Hidden on very small screens, visible from md:) */}
        <div className="hidden lg:flex items-center gap-2 text-[11px] font-mono text-slate-500">
          <span>Terminal #01 (Active Counter)</span>
          <span>•</span>
          <span>Powai Flagship</span>
          <span>•</span>
          <span className="text-emerald-600 font-bold">Online</span>
        </div>
      </div>
    </header>
  );
}

export const TopHeader = Header;
