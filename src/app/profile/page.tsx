"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  Store,
  User,
  Mail,
  Phone,
  Settings,
  Users,
  Zap,
  Package,
  ShieldCheck,
  CheckCircle2,
  LogOut,
  ExternalLink,
  MessageCircle,
  KeyRound,
  Edit2,
  Check,
  X,
  Loader2,
  RefreshCw,
  Mail as MailIcon,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useStoreBranding, setCachedStoreBranding } from "@/hooks/useStoreBranding";
import { ResetPasswordModal } from "@/components/ResetPasswordModal";
import { SUPPORT_CONFIG } from "@/config/support";
import { VisionPulseMark } from "@/components/VisionPulseLogo";
import { APP_VERSION_DISPLAY } from "@/config/version";

export default function ProfilePage() {
  const router = useRouter();
  const { user, userDisplayName, userEmail, userAvatarUrl, shopId, isStaff, isOwner, signOut, tenantFetch } = useAuth();
  const { storeName, tagline, settings, refetch: refetchStoreBranding } = useStoreBranding();

  // Inline editing state for Store Name
  const [isEditingStoreName, setIsEditingStoreName] = useState(false);
  const [editedStoreName, setEditedStoreName] = useState(storeName);
  const [isSavingStoreName, setIsSavingStoreName] = useState(false);
  const [storeNameSaveSuccess, setStoreNameSaveSuccess] = useState(false);

  // Password reset modal state
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  useEffect(() => {
    setEditedStoreName(storeName);
  }, [storeName]);

  const handleSaveStoreName = async (customName?: string) => {
    const targetName = (customName !== undefined ? customName : editedStoreName).trim();
    if (!targetName) return;

    setIsSavingStoreName(true);
    setStoreNameSaveSuccess(false);

    try {
      const res = await tenantFetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeName: targetName, shopId, userId: shopId }),
      });

      if (res.ok) {
        setCachedStoreBranding(shopId, {
          ...(settings || {}),
          storeName: targetName,
        });
        setIsEditingStoreName(false);
        setStoreNameSaveSuccess(true);
        setTimeout(() => setStoreNameSaveSuccess(false), 3000);
        refetchStoreBranding();
      }
    } catch (err) {
      console.error("Failed to update store name:", err);
    } finally {
      setIsSavingStoreName(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.replace("/login");
  };

  const handleSwitchAccount = async () => {
    try {
      await signOut();
    } catch (e) {}
    router.replace("/login?switch=true");
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
              Multi-tenant identity, counter terminals, security &amp; live support
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
        {/* 1. DYNAMIC STORE HEADER CARD (INLINE EDITABLE STORE NAME)*/}
        {/* ======================================================== */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
            <div className="flex items-center gap-4 min-w-0 flex-1">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-slate-900 text-slate-100 flex items-center justify-center border border-slate-800 shadow-sm shrink-0">
                <VisionPulseMark className="w-8 h-8 sm:w-9 sm:h-9" />
              </div>

              <div className="min-w-0 flex-1">
                {/* Primary Title: Prominently Displayed Store Name (Editable) */}
                {isEditingStoreName ? (
                  <div className="flex items-center gap-2 max-w-md my-1">
                    <input
                      type="text"
                      value={editedStoreName}
                      onChange={(e) => setEditedStoreName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveStoreName();
                        if (e.key === "Escape") {
                          setEditedStoreName(storeName);
                          setIsEditingStoreName(false);
                        }
                      }}
                      autoFocus
                      disabled={isSavingStoreName}
                      placeholder="Enter Store Name..."
                      className="w-full text-base sm:text-lg font-bold bg-slate-50 border border-cyan-500 rounded-xl px-3 py-1.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveStoreName()}
                      disabled={isSavingStoreName}
                      className="px-3 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors shrink-0"
                      title="Save Store Name"
                    >
                      {isSavingStoreName ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      <span>Save</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditedStoreName(storeName);
                        setIsEditingStoreName(false);
                      }}
                      disabled={isSavingStoreName}
                      className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 cursor-pointer shrink-0 transition-colors"
                      title="Cancel"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 group">
                    <h2
                      className="text-lg sm:text-2xl font-extrabold text-slate-900 tracking-tight leading-tight truncate cursor-pointer hover:text-cyan-700 transition-colors"
                      title="Tap to edit store name"
                      onClick={() => setIsEditingStoreName(true)}
                    >
                      {storeName}
                    </h2>
                    {!isStaff && (
                      <button
                        type="button"
                        onClick={() => setIsEditingStoreName(true)}
                        className="p-1.5 text-slate-400 hover:text-cyan-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
                        title="Edit Store Name"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}

                {/* Subtitle with dynamic role badge and name */}
                <div className="flex flex-wrap items-center gap-2 mt-1.5">
                  <p className="text-xs sm:text-sm text-slate-600 font-semibold truncate">
                    {isStaff
                      ? `Staff: ${userDisplayName || "Counter Operator"}`
                      : `Owner: ${userDisplayName || userEmail?.split("@")[0] || "Store Administrator"}`}
                  </p>

                  {/* Dynamic Role Badge */}
                  {isStaff ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-[11px] font-bold text-indigo-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse" />
                      <span>• Active Counter Terminal</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-bold text-emerald-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                      <span>• Verified Owner</span>
                    </span>
                  )}
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
                  <span>Configure Practice</span>
                </Link>
              </div>
            )}
          </div>

          {storeNameSaveSuccess && (
            <div className="mt-3 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>Store Name successfully saved to cloud database and synchronized!</span>
            </div>
          )}

          {/* Store Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-5 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-150">
              <span className="text-[11px] text-slate-400 font-medium block">Tagline / Motto</span>
              <p className="text-slate-800 font-semibold mt-0.5 truncate" title={tagline}>
                {tagline}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-150">
              <span className="text-[11px] text-slate-400 font-medium block">GSTIN / Tax ID</span>
              <p className="text-slate-800 font-bold font-mono mt-0.5">
                {settings?.gstin || "Exempt / Unregistered"}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-150">
              <span className="text-[11px] text-slate-400 font-medium block">Store Contact Phone</span>
              <p className="text-slate-800 font-semibold font-mono mt-0.5">
                {settings?.phone || "+91 98201 12345"}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-150">
              <span className="text-[11px] text-slate-400 font-medium block">Store Contact Email</span>
              <p className="text-slate-800 font-semibold font-mono mt-0.5 truncate">
                {settings?.email || userEmail || "care@visionpulse.in"}
              </p>
            </div>

            <div className="sm:col-span-2 p-3.5 rounded-xl bg-slate-50 border border-slate-150">
              <span className="text-[11px] text-slate-400 font-medium block">Store Address</span>
              <p className="text-slate-800 font-medium mt-0.5">
                {settings?.address || "Address not specified. Update in Store Settings."}
              </p>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* 2. INFORMATION ROWS & SESSION CLAIMS                     */}
        {/* ======================================================== */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <User className="w-4 h-4 text-sky-600" />
              <span>Session Claims &amp; Terminal Details</span>
            </div>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono tracking-wider ${
                isStaff
                  ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                  : "bg-emerald-50 text-emerald-700 border border-emerald-200"
              }`}
            >
              {isStaff ? "STAFF TERMINAL" : "STORE OWNER"}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* Info Row 1: Logged-in Email */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
              <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5 mb-1">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>Logged-in Email</span>
              </span>
              <span className="font-mono font-bold text-slate-900 text-xs sm:text-sm truncate" title={userEmail || ""}>
                {userEmail || "No active session email"}
              </span>
            </div>

            {/* Info Row 2: Store Name */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
              <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5 mb-1">
                <Store className="w-3.5 h-3.5 text-slate-400" />
                <span>Store Name</span>
              </span>
              <div className="flex items-center justify-between gap-1">
                <span className="font-bold text-slate-900 text-xs sm:text-sm truncate" title={storeName}>
                  {storeName}
                </span>
                {!isStaff && (
                  <button
                    type="button"
                    onClick={() => setIsEditingStoreName(true)}
                    className="p-1 text-slate-400 hover:text-cyan-600 cursor-pointer"
                    title="Edit Store Name"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Info Row 3: Account Role */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
              <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5 mb-1">
                <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                <span>Account Role</span>
              </span>
              <span className="font-mono font-extrabold text-slate-900 text-xs tracking-wider">
                {isStaff ? "STAFF TERMINAL" : "STORE OWNER"}
              </span>
            </div>

            {/* Info Row 4: Active Branch / Counter */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
              <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5 mb-1">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <span>Active Branch / Counter</span>
              </span>
              <span className="font-semibold text-slate-900 text-xs truncate">
                Main Branch - Live (Terminal #01)
              </span>
            </div>
          </div>

          {/* Password / Account Reset Button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setIsPasswordModalOpen(true)}
              className="w-full flex items-center justify-between p-3.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 transition-all cursor-pointer font-bold text-xs group shadow-2xs"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-cyan-50 text-cyan-700 border border-cyan-200 flex items-center justify-center">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <span className="block text-slate-900">Reset Password / Security Credentials</span>
                  <span className="text-[11px] text-slate-500 font-normal">Update terminal password or trigger Supabase email recovery link</span>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
            </button>
          </div>
        </div>

        {/* ======================================================== */}
        {/* 3. ACCOUNTING & LIVE WHATSAPP SUPPORT SECTION            */}
        {/* ======================================================== */}
        <div className="bg-white rounded-2xl border border-emerald-200 p-5 sm:p-6 shadow-xs space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
              <MessageCircle className="w-4 h-4 text-emerald-600" />
              <span>Accounting &amp; Priority WhatsApp Support</span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono">
              24/7 Optical ERP Desk
            </span>
          </div>

          <p className="text-xs text-slate-600">
            Need urgent assistance with optical billing, GST e-invoices, prescription adapting, or multi-counter sync?
            Contact our senior clinical &amp; accounting support team directly.
          </p>

          {/* Primary Action Button (WhatsApp) */}
          <a
            href={SUPPORT_CONFIG.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-between p-3.5 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-xs sm:text-sm shadow-sm transition-all cursor-pointer active:scale-98 group"
          >
            <div className="flex items-center gap-2.5">
              <MessageCircle className="w-5 h-5 fill-white/20 stroke-white" />
              <span>Accounting &amp; WhatsApp Support</span>
            </div>
            <ExternalLink className="w-4 h-4 text-white/80 group-hover:translate-x-0.5 transition-transform" />
          </a>

          {/* Fallback Call & Email Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 text-xs">
            <a
              href={SUPPORT_CONFIG.phoneCallUrl}
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 font-semibold transition-colors"
              title={`Call ${SUPPORT_CONFIG.phoneDisplay}`}
            >
              <Phone className="w-4 h-4 text-cyan-600" />
              <span>Phone Call: <strong className="font-mono">{SUPPORT_CONFIG.phoneDisplay}</strong></span>
            </a>

            <a
              href={SUPPORT_CONFIG.emailSupportUrl}
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 font-semibold transition-colors truncate"
              title={`Email ${SUPPORT_CONFIG.email}`}
            >
              <MailIcon className="w-4 h-4 text-amber-600 shrink-0" />
              <span className="truncate">Email: <strong className="font-mono">{SUPPORT_CONFIG.email}</strong></span>
            </a>
          </div>
        </div>

        {/* ======================================================== */}
        {/* 4. QUICK NAVIGATION MODULES                              */}
        {/* ======================================================== */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Workspace Modules
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
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                <span>Sales &amp; Invoice Records Ledger</span>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </Link>
          </div>
        </div>

        {/* ======================================================== */}
        {/* 5. ACCOUNT SWITCHING & SIGN OUT HIERARCHY                */}
        {/* ======================================================== */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-2.5">
          {/* Primary Styled Red Sign Out Button */}
          <button
            type="button"
            onClick={handleSignOut}
            className="w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out of Account</span>
          </button>

          {/* Secondary Outlined Switch Store / Account Button */}
          <button
            type="button"
            onClick={handleSwitchAccount}
            className="w-full py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-300 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
          >
            <RefreshCw className="w-4 h-4 text-cyan-600" />
            <span>Switch Store / Account</span>
          </button>
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

      {/* Password Reset Modal */}
      <ResetPasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        userEmail={userEmail}
      />
    </div>
  );
}
