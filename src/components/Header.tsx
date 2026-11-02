"use client";

import Link from "next/link";
import {
  MapPin,
  Plus,
  Search,
  Package,
  Zap,
  CheckCircle2,
  Smartphone,
  Eye,
  ShieldCheck,
} from "lucide-react";
import { useAppUi } from "@/context/AppUiContext";

interface HeaderProps {
  title?: string;
  subtitle?: string;
  children?: React.ReactNode;
}

export function Header({ title, subtitle, children }: HeaderProps) {
  const { openNewCustomerModal, openQuickSearchModal, openMobileSyncModal } = useAppUi();

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 lg:px-6 flex items-center justify-between flex-shrink-0 z-20 shadow-xs">
      {/* ======================================================== */}
      {/* 1. LEFT SIDE: Shop Branding Badge, Tagline & Location Pin */}
      {/* ======================================================== */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-slate-900 to-slate-800 text-cyan-400 flex items-center justify-center shadow-xs shrink-0 border border-slate-700">
          <Eye className="w-5 h-5 text-cyan-400 stroke-[2.2]" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-extrabold text-slate-900 tracking-tight leading-none truncate">
              My Optics Shop
            </h2>
            <div className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-[10px] font-semibold text-slate-600 shrink-0">
              <MapPin className="w-2.5 h-2.5 text-rose-500" />
              <span>Main Branch</span>
            </div>
          </div>
          <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
            Welcome back! Manage your shop efficiently
          </p>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. CENTER / QUICK ACTION BAR                            */}
      {/* ======================================================== */}
      <div className="flex items-center gap-2 mx-2">
        {/* [ + New Customer ] button */}
        <button
          type="button"
          onClick={openNewCustomerModal}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 shadow-xs hover:border-slate-300 transition-all cursor-pointer"
          title="Register new patient / customer"
        >
          <Plus className="w-3.5 h-3.5 text-blue-600 stroke-[2.5]" />
          <span className="hidden md:inline">New Customer</span>
        </button>

        {/* [ 🔍 Search Record ] button / input */}
        <button
          type="button"
          onClick={openQuickSearchModal}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-all cursor-pointer group"
          title="Search by mobile, bill no, or barcode (Ctrl+K)"
        >
          <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600" />
          <span className="hidden sm:inline text-slate-600">Search Record</span>
          <kbd className="hidden lg:inline-block px-1.5 py-0.2 text-[9px] font-mono font-bold bg-white border border-slate-300 rounded text-slate-500">
            Ctrl+K
          </kbd>
        </button>

        {/* [ 📦 Inventory ] button */}
        <Link
          href="/inventory"
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 shadow-xs hover:border-slate-300 transition-all cursor-pointer"
        >
          <Package className="w-3.5 h-3.5 text-slate-600" />
          <span>Inventory</span>
        </Link>

        {/* [ ⚡ POS Terminal / New Bill ] primary highlight button */}
        <Link
          href="/pos"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-black text-amber-950 bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 hover:from-amber-500 hover:to-yellow-500 border border-amber-500/30 shadow-sm shadow-amber-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          title="Open POS Terminal & Billing Counter"
        >
          <Zap className="w-3.5 h-3.5 fill-amber-950 text-amber-950 stroke-[2.5]" />
          <span className="tracking-tight">POS Terminal / New Bill</span>
        </Link>
      </div>

      {/* ======================================================== */}
      {/* 3. RIGHT SIDE STATUS PILLS                              */}
      {/* ======================================================== */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Optional Page Children */}
        {children && <div className="hidden xl:flex items-center gap-2">{children}</div>}

        {/* "Database Ledger: Cloud Synced" */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-[11px] font-semibold text-emerald-800">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span className="font-mono">Ledger: Cloud Synced</span>
        </div>

        {/* "Plan: ACTIVE" badge */}
        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300 font-extrabold text-[10px] tracking-wider uppercase">
          <ShieldCheck className="w-3 h-3 text-emerald-700" />
          <span>Plan: ACTIVE</span>
        </div>

        {/* "Mobile Sync Ready" button */}
        <button
          type="button"
          onClick={openMobileSyncModal}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors cursor-pointer"
          title="View Mobile Scanner QR Pair"
        >
          <Smartphone className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <span className="hidden sm:inline">Mobile Sync Ready</span>
        </button>
      </div>
    </header>
  );
}

export const TopHeader = Header;
