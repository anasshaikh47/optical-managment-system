"use client";

import Link from "next/link";
import {
  MapPin,
  Search,
  Package,
  Zap,
  CheckCircle2,
  Barcode,
  Pill,
  ShieldPlus,
  UserPlus,
  Menu,
} from "lucide-react";
import { useAppUi } from "@/context/AppUiContext";
import { useAuth } from "@/context/AuthContext";
import { InstallPwaButton } from "@/components/InstallPwaButton";

interface HeaderProps {
  title?: string;
  subtitle?: string;
  children?: React.ReactNode;
}

export function Header({ children }: HeaderProps) {
  const { openNewCustomerModal, openQuickSearchModal, openMobileSyncModal, toggleSidebar } = useAppUi();
  const { userDisplayName, userAvatarUrl } = useAuth();

  return (
    <header className="bg-white border-b border-slate-200 flex flex-col flex-shrink-0 z-20 shadow-xs select-none">
      {/* ======================================================== */}
      {/* 1. UPPER ROW - CLEAN MOBILE & DESKTOP HEADER             */}
      {/* ======================================================== */}
      <div className="px-3 sm:px-4 lg:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-3">
        {/* Left Side: Hamburger Menu (Mobile) + Pharmacy Branding */}
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
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

          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-950 text-emerald-400 flex items-center justify-center border border-emerald-800 shrink-0 shadow-xs">
            <Pill className="w-5 h-5 stroke-[2.4]" />
          </div>

          <div className="min-w-0">
            <h2 className="text-sm sm:text-base font-black text-slate-900 tracking-tight leading-none truncate">
              {userDisplayName
                ? `${userDisplayName}'s Pharma`
                : "PharmaPulse POS & ERP - Pharmacy Terminal"}
            </h2>
            <p className="text-[10px] sm:text-xs text-slate-500 font-medium truncate mt-0.5 hidden xs:block">
              {userDisplayName
                ? `Active Counter • ${userDisplayName} (Pharmacist)`
                : "Active Dispensary Counter Terminal • Schedule H Compliant"}
            </p>
          </div>
        </div>

        {/* Mobile-Only Avatar Quick Indicator */}
        <div className="md:hidden flex items-center gap-2">
          {userAvatarUrl ? (
            <img
              src={userAvatarUrl}
              alt={userDisplayName || "Avatar"}
              className="w-8 h-8 rounded-full border border-slate-200 object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-emerald-950 text-emerald-400 flex items-center justify-center font-bold text-xs border border-emerald-800">
              {userDisplayName ? userDisplayName[0].toUpperCase() : "Rx"}
            </div>
          )}
        </div>

        {/* Desktop-Only Action Buttons */}
        <div className="hidden md:flex items-center gap-2 lg:gap-2.5">
          {/* [ + New Patient ] */}
          <button
            type="button"
            onClick={openNewCustomerModal}
            className="px-4 py-2 lg:px-5 lg:py-2.5 rounded-xl font-bold text-xs sm:text-sm text-slate-800 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 shadow-xs flex items-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
            title="Register new patient immediately"
          >
            <UserPlus className="w-4 h-4 text-emerald-600 stroke-[2.2]" />
            <span>+ New Patient</span>
          </button>

          {/* [ 🔍 Search Batch / Salt (Ctrl+K) ] */}
          <button
            type="button"
            onClick={openQuickSearchModal}
            className="px-4 py-2 lg:px-5 lg:py-2.5 rounded-xl font-bold text-xs sm:text-sm text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 shadow-xs flex items-center gap-2 transition-all active:scale-[0.98] cursor-pointer group"
            title="Search medicine brand, salt composition, batch or patient (Ctrl+K)"
          >
            <Search className="w-4 h-4 text-slate-500 group-hover:text-slate-800 stroke-[2.2]" />
            <span>Search Batch / Salt</span>
            <kbd className="hidden lg:inline-block px-1.5 py-0.2 text-[10px] font-mono font-bold bg-white border border-slate-300 rounded text-slate-600 shadow-2xs">
              Ctrl+K
            </kbd>
          </button>

          {/* [ 📦 Medicines / Inventory ] */}
          <Link
            href="/inventory"
            className="px-4 py-2 lg:px-5 lg:py-2.5 rounded-xl font-bold text-xs sm:text-sm text-slate-800 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 shadow-xs flex items-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
            title="Stock, Batches, Rack Locations & Expiry"
          >
            <Package className="w-4 h-4 text-indigo-600 stroke-[2.2]" />
            <span>Medicines Stock</span>
          </Link>

          {/* [ ⚡ POS Terminal / New Bill ] */}
          <Link
            href="/pos"
            className="px-4 py-2 lg:px-5 lg:py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white bg-emerald-600 hover:bg-emerald-700 border border-emerald-500 shadow-xs flex items-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
            title="Open Pharmacy Fast POS Terminal"
          >
            <Zap className="w-4 h-4 text-white stroke-[2.4]" />
            <span>Medical Bill (POS)</span>
          </Link>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. LOWER SUB-ROW - COMPACT SECONDARY STATUS BAR          */}
      {/* (Hidden on mobile screens to eliminate screen clutter)   */}
      {/* ======================================================== */}
      <div className="hidden md:flex bg-slate-50/95 border-t border-slate-200/80 px-3 sm:px-4 lg:px-6 py-1.5 sm:py-2 flex-wrap items-center justify-between gap-2 text-xs">
        {/* Status Pills */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* Cloud Synced */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold text-[10px] sm:text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="font-mono">Pharmacy Ledger: Cloud Synced</span>
          </div>

          {/* Drug License Active */}
          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-900 border border-emerald-300 font-extrabold text-[10px] tracking-wider uppercase">
            <ShieldPlus className="w-3 h-3 text-emerald-700" />
            <span>Drug License: VALID & ACTIVE</span>
          </div>

          {/* Barcode Scanner Gun Ready */}
          <button
            type="button"
            onClick={openMobileSyncModal}
            className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold text-[10px] sm:text-[11px] transition-colors cursor-pointer shadow-2xs"
            title="Barcode Scanner Ready"
          >
            <Barcode className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span>Barcode Scanner Gun Ready</span>
          </button>

          {/* Pharmacy Location Indicator */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-slate-200/70 text-slate-700 font-bold text-[10px] sm:text-[11px]">
            <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
            <span>Flagship Medical Store</span>
          </div>

          {/* Native PWA Install Button */}
          <InstallPwaButton variant="header" />
        </div>

        {/* Counter Terminal Info */}
        <div className="hidden lg:flex items-center gap-2 text-[11px] font-mono text-slate-500">
          <span>Terminal #01 (Dispensing Counter)</span>
          <span>•</span>
          <span>Pharmacist In-Charge On Duty</span>
          <span>•</span>
          <span className="text-emerald-600 font-bold">Online</span>
        </div>
      </div>
    </header>
  );
}

export const TopHeader = Header;
