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
import { useAuth } from "@/context/AuthContext";
import { useStoreBranding } from "@/hooks";
import { InstallPwaButton } from "@/components/InstallPwaButton";
import { VisionPulseMark } from "@/components/VisionPulseLogo";

interface HeaderProps {
  title?: string;
  subtitle?: string;
  children?: React.ReactNode;
}

export function Header({ children }: HeaderProps) {
  const { openNewCustomerModal, openQuickSearchModal, openMobileSyncModal, toggleSidebar } = useAppUi();
  const { userDisplayName, userAvatarUrl, isStaff, isOwner } = useAuth();
  const { storeName } = useStoreBranding();

  return (
    <header className="bg-white border-b border-slate-200 flex flex-col flex-shrink-0 z-20 shadow-xs select-none">
      {/* ======================================================== */}
      {/* 1. UPPER ROW - CLEAN MOBILE & DESKTOP HEADER             */}
      {/* ======================================================== */}
      <div className="px-3 sm:px-4 lg:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-3">
        {/* Left Side: Hamburger Menu (Mobile) + Shop Branding */}
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

          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-900 text-slate-100 flex items-center justify-center border border-slate-800 shrink-0 shadow-xs">
            <VisionPulseMark className="w-5 h-5 sm:w-5 sm:h-5" />
          </div>

          <div className="min-w-0">
            <h2
              className="text-sm sm:text-base font-bold text-slate-900 tracking-tight leading-none truncate max-w-[180px] xs:max-w-[240px] sm:max-w-xs md:max-w-sm lg:max-w-md"
              title={storeName}
            >
              {storeName}
            </h2>
            <p className="text-[10px] sm:text-xs text-slate-500 font-medium truncate mt-0.5 hidden xs:block">
              {isStaff ? "Staff Counter Terminal Active" : userDisplayName ? `Active Counter • ${userDisplayName}` : "Counter Terminal Active"}
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
            <div className="w-8 h-8 rounded-full bg-slate-900 text-cyan-400 flex items-center justify-center font-bold text-xs border border-slate-800">
              {userDisplayName
                ? userDisplayName[0].toUpperCase()
                : "V"}
            </div>
          )}
        </div>

        {/* Desktop-Only Action Buttons */}
        <div className="hidden md:flex items-center gap-2 lg:gap-2.5">
          {/* [ + New Customer ] */}
          <button
            type="button"
            onClick={openNewCustomerModal}
            className="px-4 py-2 lg:px-5 lg:py-2.5 rounded-xl font-bold text-xs sm:text-sm text-slate-800 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 shadow-xs flex items-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
            title="Register new patient / customer immediately"
          >
            <UserPlus className="w-4 h-4 text-blue-600 stroke-[2.2]" />
            <span>+ New Customer</span>
          </button>

          {/* [ 🔍 Search Record (Ctrl+K) ] */}
          <button
            type="button"
            onClick={openQuickSearchModal}
            className="px-4 py-2 lg:px-5 lg:py-2.5 rounded-xl font-bold text-xs sm:text-sm text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 shadow-xs flex items-center gap-2 transition-all active:scale-[0.98] cursor-pointer group"
            title="Search customer phone, name, or bill no (Ctrl+K)"
          >
            <Search className="w-4 h-4 text-slate-500 group-hover:text-slate-800 stroke-[2.2]" />
            <span>Search Record</span>
            <kbd className="hidden lg:inline-block px-1.5 py-0.2 text-[10px] font-mono font-bold bg-white border border-slate-300 rounded text-slate-600 shadow-2xs">
              Ctrl+K
            </kbd>
          </button>

          {/* [ 📦 Inventory ] */}
          <Link
            href="/inventory"
            className="px-4 py-2 lg:px-5 lg:py-2.5 rounded-xl font-bold text-xs sm:text-sm text-slate-800 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 shadow-xs flex items-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
            title="Manage Frames, Lenses & Barcodes"
          >
            <Package className="w-4 h-4 text-indigo-600 stroke-[2.2]" />
            <span>Inventory</span>
          </Link>

          {/* [ ⚡ POS Terminal / New Bill ] */}
          <Link
            href="/pos"
            className="px-4 py-2 lg:px-5 lg:py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white bg-cyan-700 hover:bg-cyan-800 border border-cyan-600 shadow-xs flex items-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
            title="Open Optical POS Billing Screen"
          >
            <Zap className="w-4 h-4 text-white stroke-[2.4]" />
            <span>POS Billing</span>
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
