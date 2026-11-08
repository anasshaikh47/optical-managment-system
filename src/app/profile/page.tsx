"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  Store,
  User,
  Mail,
  Phone,
  MapPin,
  FileText,
  Percent,
  Settings,
  Users,
  Zap,
  Package,
  ShieldCheck,
  CheckCircle2,
  LogOut,
  ExternalLink,
  MessageCircle,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useStoreBranding } from "@/hooks";
import { VisionPulseMark } from "@/components/VisionPulseLogo";
import { APP_VERSION_DISPLAY } from "@/config/version";

export default function ProfilePage() {
  const router = useRouter();
  const { user, userDisplayName, userEmail, userAvatarUrl, shopId, isStaff, isOwner, signOut } = useAuth();
  const { storeName, tagline, settings } = useStoreBranding();

  const handleSupportClick = () => {
    window.open(
      "https://wa.me/919820112345?text=Hello%20Optical%20ERP%20Support%2C%20I%20need%20assistance%20with%20my%20store%20profile.",
      "_blank"
    );
  };

  const handleSignOut = async () => {
    await signOut();
    router.replace("/login");
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-100">
      {/* Top Header Bar */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3.5 flex items-center justify-between shrink-0 shadow-2xs">
        <div className="flex items-center gap-3">
          <Link
            href={isStaff ? "/pos" : "/dashboard"}
            className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors"
            title="Return to Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
              Store &amp; Account Profile
            </h1>
            <p className="text-[11px] sm:text-xs text-slate-500 font-medium">
              Multi-tenant branding identity, counter terminals &amp; credentials
            </p>
          </div>
        </div>

        {!isStaff && (
          <Link
            href="/settings"
            className="inline-flex items-center gap-2 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 shadow-2xs transition-all active:scale-98"
          >
            <Settings className="w-4 h-4 text-slate-500" />
            <span className="hidden sm:inline">Store Settings</span>
          </Link>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-6 max-w-4xl w-full mx-auto space-y-5 pb-20 md:pb-8">
        {/* ======================================================== */}
        {/* 1. STORE BRANDING & BUSINESS IDENTITY CARD               */}
        {/* ======================================================== */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-slate-900 text-slate-100 flex items-center justify-center border border-slate-800 shadow-sm shrink-0">
                <VisionPulseMark className="w-8 h-8 sm:w-9 sm:h-9" />
              </div>
              <div className="min-w-0">
                {/* Primary Title: Store Name */}
                <h2
                  className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight leading-tight truncate"
                  title={storeName}
                >
                  {storeName}
                </h2>
                {/* Underneath: Owner Name in subtle subtext */}
                <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
                  {isStaff
                    ? `Staff Operator: ${userDisplayName || "Counter Terminal"}`
                    : `Owner: ${userDisplayName || userEmail?.split("@")[0] || "Administrator"}`}
                </p>
                <div className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-[11px] font-semibold text-slate-700">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{isStaff ? "Staff Counter Terminal" : "Verified Store Tenant"}</span>
                </div>
              </div>
            </div>

            {!isStaff && (
              <div className="sm:self-center shrink-0">
                <Link
                  href="/settings"
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-slate-900 hover:bg-slate-800 text-white transition-all shadow-xs active:scale-98 w-full sm:w-auto"
                >
                  <Settings className="w-4 h-4" />
                  <span>Edit Store Details</span>
                </Link>
              </div>
            )}
          </div>

          {/* Store Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-5 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-150">
              <span className="text-[11px] text-slate-400 font-medium block">Tagline / Motto</span>
              <p className="text-slate-800 font-semibold mt-0.5 truncate" title={tagline}>
                {tagline}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-150">
              <span className="text-[11px] text-slate-400 font-medium block">GSTIN / Tax ID</span>
              <p className="text-slate-800 font-bold font-mono mt-0.5">
                {settings?.gstin || "Exempt / Unregistered"}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-150">
              <span className="text-[11px] text-slate-400 font-medium block">Store Contact Phone</span>
              <p className="text-slate-800 font-semibold font-mono mt-0.5">
                {settings?.phone || "+91 98201 12345"}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-150">
              <span className="text-[11px] text-slate-400 font-medium block">Store Contact Email</span>
              <p className="text-slate-800 font-semibold font-mono mt-0.5 truncate">
                {settings?.email || userEmail || "care@visionpulse.in"}
              </p>
            </div>

            <div className="sm:col-span-2 p-3 rounded-xl bg-slate-50 border border-slate-150">
              <span className="text-[11px] text-slate-400 font-medium block">Store Address</span>
              <p className="text-slate-800 font-medium mt-0.5">
                {settings?.address || "Address not specified. Update in Store Settings."}
              </p>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* 2. ACTIVE USER & OPERATOR CREDENTIALS                    */}
        {/* ======================================================== */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <User className="w-4 h-4 text-sky-600" />
              <span>Operator &amp; Session Credentials</span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              {isStaff ? "STAFF OPERATOR" : "STORE OWNER"}
            </span>
          </div>

          <div className="flex items-center gap-4">
            {userAvatarUrl ? (
              <img
                src={userAvatarUrl}
                alt={userDisplayName || "Avatar"}
                className="w-12 h-12 rounded-2xl object-cover border border-slate-200 shadow-2xs"
              />
            ) : (
              <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 border border-sky-200 flex items-center justify-center font-bold text-base shadow-2xs">
                {userDisplayName
                  ? userDisplayName
                      .split(" ")
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase()
                  : "U"}
              </div>
            )}

            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-sm sm:text-base text-slate-900 truncate">
                {userDisplayName || "Store Administrator"}
              </h3>
              <p className="text-xs text-slate-500 font-mono truncate">{userEmail || "No email"}</p>
              <p className="text-[11px] text-slate-400 font-mono truncate mt-0.5">
                Shop UID: <span className="font-semibold text-slate-600">{shopId}</span>
              </p>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* 3. QUICK NAVIGATION & SHORTCUT ACTIONS                   */}
        {/* ======================================================== */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Quick Actions &amp; Workspace Modules
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs font-semibold">
            {!isStaff && (
              <Link
                href="/settings"
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Settings className="w-4 h-4 text-slate-600" />
                  <span>My Shop Profiles &amp; Tax Settings</span>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              </Link>
            )}

            {!isStaff && (
              <Link
                href="/staff"
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Users className="w-4 h-4 text-slate-600" />
                  <span>Staff &amp; Counter Terminals</span>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              </Link>
            )}

            <Link
              href="/pos"
              className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Zap className="w-4 h-4 text-amber-600" />
                <span>Open POS Terminal</span>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </Link>

            <Link
              href="/orders"
              className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <FileText className="w-4 h-4 text-blue-600" />
                <span>Sales &amp; Invoice Records Ledger</span>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </Link>

            <Link
              href="/inventory"
              className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Package className="w-4 h-4 text-indigo-600" />
                <span>Inventory &amp; Stock Control</span>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </Link>

            <button
              type="button"
              onClick={handleSupportClick}
              className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-900 transition-colors cursor-pointer text-left"
            >
              <div className="flex items-center gap-2.5">
                <MessageCircle className="w-4 h-4 text-emerald-600" />
                <span>WhatsApp Accounting Support</span>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-emerald-500" />
            </button>
          </div>

          <div className="pt-3 border-t border-slate-150">
            <button
              type="button"
              onClick={handleSignOut}
              className="w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out of Account</span>
            </button>
          </div>
        </div>

        {/* Footer System Version */}
        <div className="text-center space-y-1 select-none pt-2">
          <p className="text-[11px] font-mono text-slate-400 font-medium">
            {APP_VERSION_DISPLAY}
          </p>
          <div className="inline-flex items-center gap-1.5 text-[10px] text-emerald-600 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Multi-Tenant Cloud Workspace Active</span>
          </div>
        </div>
      </div>
    </div>
  );
}
