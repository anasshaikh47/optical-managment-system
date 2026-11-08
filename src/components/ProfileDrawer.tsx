"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  X,
  User,
  Store,
  Mail,
  ShieldCheck,
  Building2,
  KeyRound,
  MessageCircle,
  Phone,
  Mail as MailIcon,
  LogOut,
  RefreshCw,
  Edit2,
  Check,
  ChevronRight,
  Settings,
  Users,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useStoreBranding, setCachedStoreBranding } from "@/hooks/useStoreBranding";
import { ResetPasswordModal } from "@/components/ResetPasswordModal";
import { SUPPORT_CONFIG } from "@/config/support";
import { APP_VERSION_DISPLAY } from "@/config/version";

interface ProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProfileDrawer({ isOpen, onClose }: ProfileDrawerProps) {
  const router = useRouter();
  const { user, userDisplayName, userEmail, userAvatarUrl, isStaff, isOwner, signOut, shopId, tenantFetch } = useAuth();
  const { storeName, tagline, settings, refetch: refetchStoreBranding } = useStoreBranding();

  // Inline editing state for Store Name
  const [isEditingStoreName, setIsEditingStoreName] = useState(false);
  const [editedStoreName, setEditedStoreName] = useState(storeName);
  const [isSavingStoreName, setIsSavingStoreName] = useState(false);
  const [storeNameSaveSuccess, setStoreNameSaveSuccess] = useState(false);

  // Password reset modal state
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  // Sync edited store name with loaded storeName
  useEffect(() => {
    setEditedStoreName(storeName);
  }, [storeName]);

  if (!isOpen) return null;

  // Handle Store Name Save (inline or from info row)
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
        // Update local memory & storage caches for zero-delay update across components
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

  // Sign out handler
  const handleSignOut = async () => {
    onClose();
    await signOut();
    router.replace("/login");
  };

  // Switch store / account handler
  const handleSwitchAccount = async () => {
    onClose();
    try {
      await signOut();
    } catch (e) {
      // ignore
    }
    router.replace("/login?switch=true");
  };

  return (
    <>
      <div className="fixed inset-0 z-[70] flex flex-col justify-end md:justify-center md:items-end">
        {/* Backdrop */}
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200"
        />

        {/* Drawer Container (Mobile Bottom Sheet / Desktop Slide-over Drawer) */}
        <div className="relative w-full md:max-w-md bg-slate-900 border-t md:border-l md:border-t-0 border-slate-800 rounded-t-3xl md:rounded-l-3xl md:rounded-tr-none p-5 pb-8 md:p-6 shadow-2xl text-slate-200 max-h-[90vh] md:h-full md:max-h-screen overflow-y-auto space-y-4 animate-in slide-in-from-bottom md:slide-in-from-right duration-250 z-10">
          {/* Mobile Handle */}
          <div className="w-12 h-1.5 rounded-full bg-slate-700 mx-auto -mt-1 mb-2 md:hidden" />

          {/* ======================================================== */}
          {/* 1. TOP HEADER & BRAND IDENTITY                           */}
          {/* ======================================================== */}
          <div className="pb-4 border-b border-slate-800">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {userAvatarUrl ? (
                  <img
                    src={userAvatarUrl}
                    alt={userDisplayName || "Avatar"}
                    className="w-13 h-13 rounded-2xl object-cover border border-slate-700 shrink-0"
                  />
                ) : (
                  <div className="w-13 h-13 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 flex items-center justify-center font-bold text-lg shrink-0">
                    {userDisplayName
                      ? userDisplayName
                          .split(" ")
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join("")
                          .toUpperCase()
                      : userEmail
                      ? userEmail[0].toUpperCase()
                      : "VP"}
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  {/* Inline Editable Store Name Header */}
                  {isEditingStoreName ? (
                    <div className="flex items-center gap-1.5 my-0.5">
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
                        className="w-full text-sm sm:text-base font-bold bg-slate-950 border border-cyan-500 rounded-lg px-2.5 py-1 text-white focus:outline-none focus:ring-1 focus:ring-cyan-400"
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveStoreName()}
                        disabled={isSavingStoreName}
                        className="p-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white cursor-pointer shrink-0 transition-colors"
                        title="Save Store Name"
                      >
                        {isSavingStoreName ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditedStoreName(storeName);
                          setIsEditingStoreName(false);
                        }}
                        disabled={isSavingStoreName}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer shrink-0 transition-colors"
                        title="Cancel"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 group">
                      <h3
                        className="text-base sm:text-lg font-bold text-white truncate leading-tight cursor-pointer hover:text-cyan-300 transition-colors"
                        title="Tap to edit store name"
                        onClick={() => setIsEditingStoreName(true)}
                      >
                        {storeName}
                      </h3>
                      {!isStaff && (
                        <button
                          type="button"
                          onClick={() => setIsEditingStoreName(true)}
                          className="p-1 text-slate-500 hover:text-cyan-400 rounded-md transition-colors cursor-pointer shrink-0"
                          title="Edit Store Name"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}

                  {/* Subtitle with dynamic role name and role badge */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-1">
                    <p className="text-xs text-slate-300 font-medium truncate">
                      {isStaff
                        ? `Staff: ${userDisplayName || "Counter Operator"}`
                        : `Owner: ${userDisplayName || userEmail?.split("@")[0] || "Store Administrator"}`}
                    </p>

                    {/* Dynamic Role Badge */}
                    {isStaff ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-[10px] font-bold text-indigo-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                        <span>• Active Counter Terminal</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-bold text-emerald-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span>• Verified Owner</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                aria-label="Close Profile Drawer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {storeNameSaveSuccess && (
              <div className="mt-2.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-semibold flex items-center gap-1.5 animate-in fade-in">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Store Name updated and saved to database!</span>
              </div>
            )}
          </div>

          {/* ======================================================== */}
          {/* 2. INFORMATION ROWS                                      */}
          {/* ======================================================== */}
          <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-800 space-y-3 text-xs">
            {/* Row 1: Logged-in Email */}
            <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-700/50">
              <span className="text-slate-400 font-medium shrink-0 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-500" />
                <span>Logged-in Email</span>
              </span>
              <span className="text-white font-mono font-semibold truncate max-w-[210px]" title={userEmail || ""}>
                {userEmail || "No session email"}
              </span>
            </div>

            {/* Row 2: Store Name (Interactive input / view) */}
            <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-700/50">
              <span className="text-slate-400 font-medium shrink-0 flex items-center gap-1.5">
                <Store className="w-3.5 h-3.5 text-slate-500" />
                <span>Store Name</span>
              </span>
              <div className="flex items-center gap-1.5 max-w-[210px]">
                <span className="text-slate-200 font-bold truncate" title={storeName}>
                  {storeName}
                </span>
                {!isStaff && !isEditingStoreName && (
                  <button
                    type="button"
                    onClick={() => setIsEditingStoreName(true)}
                    className="p-1 text-slate-400 hover:text-cyan-400 rounded transition-colors cursor-pointer"
                    title="Edit Store Name"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Row 3: Account Role */}
            <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-700/50">
              <span className="text-slate-400 font-medium shrink-0 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
                <span>Account Role</span>
              </span>
              <span
                className={`font-mono font-extrabold px-2 py-0.5 rounded-md text-[10px] tracking-wider ${
                  isStaff
                    ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/30"
                    : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                }`}
              >
                {isStaff ? "STAFF TERMINAL" : "STORE OWNER"}
              </span>
            </div>

            {/* Row 4: Active Branch / Counter */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-400 font-medium shrink-0 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-500" />
                <span>Active Branch / Counter</span>
              </span>
              <span className="text-slate-300 font-semibold text-right truncate max-w-[200px]">
                Main Branch - Live (Terminal #01)
              </span>
            </div>
          </div>

          {/* ======================================================== */}
          {/* 3. PASSWORD / ACCOUNT RESET BUTTON                       */}
          {/* ======================================================== */}
          <div>
            <button
              type="button"
              onClick={() => setIsPasswordModalOpen(true)}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700 text-slate-200 hover:text-white transition-all cursor-pointer font-semibold text-xs group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                  <KeyRound className="w-3.5 h-3.5" />
                </div>
                <span>Reset Password / Security</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-300 group-hover:translate-x-0.5 transition-all" />
            </button>
          </div>

          {/* ======================================================== */}
          {/* 4. NAVIGATION MODULE SHORTCUTS                           */}
          {/* ======================================================== */}
          <div className="space-y-1.5 text-xs font-semibold">
            <Link
              href="/profile"
              onClick={onClose}
              className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 hover:bg-slate-800 border border-slate-800 text-slate-200 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <User className="w-4 h-4 text-sky-400" />
                <span>Full Profile &amp; Store Overview</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500" />
            </Link>

            {!isStaff && (
              <>
                <Link
                  href="/settings"
                  onClick={onClose}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 hover:bg-slate-800 border border-slate-800 text-slate-200 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <Settings className="w-4 h-4 text-slate-300" />
                    <span>My Shop Profiles &amp; Tax Settings</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                </Link>

                <Link
                  href="/staff"
                  onClick={onClose}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 hover:bg-slate-800 border border-slate-800 text-slate-200 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <Users className="w-4 h-4 text-slate-300" />
                    <span>Staff &amp; Counter Terminals</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                </Link>
              </>
            )}
          </div>

          {/* ======================================================== */}
          {/* 5. ACCOUNTING & WHATSAPP SUPPORT SECTION                 */}
          {/* ======================================================== */}
          <div className="p-3.5 rounded-2xl bg-emerald-950/20 border border-emerald-500/20 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>Accounting &amp; Live Support</span>
              </span>
              <span className="text-[10px] text-emerald-500 font-mono font-bold">24/7 Priority</span>
            </div>

            {/* Primary WhatsApp Action Row */}
            <a
              href={SUPPORT_CONFIG.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-between p-2.5 rounded-xl bg-[#25D366]/15 hover:bg-[#25D366]/25 border border-[#25D366]/30 text-white font-bold text-xs transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-[#25D366] fill-[#25D366]/20 group-hover:scale-110 transition-transform" />
                <span>Accounting &amp; WhatsApp Support</span>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-emerald-400 group-hover:translate-x-0.5 transition-transform" />
            </a>

            {/* Direct Call & Email Action Quick-Pills */}
            <div className="grid grid-cols-2 gap-2 pt-0.5 text-[11px]">
              <a
                href={SUPPORT_CONFIG.phoneCallUrl}
                className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-slate-200 transition-colors"
                title={`Call ${SUPPORT_CONFIG.phoneDisplay}`}
              >
                <Phone className="w-3.5 h-3.5 text-cyan-400" />
                <span className="font-mono">{SUPPORT_CONFIG.phoneDisplay}</span>
              </a>

              <a
                href={SUPPORT_CONFIG.emailSupportUrl}
                className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-slate-200 transition-colors truncate"
                title={`Email ${SUPPORT_CONFIG.email}`}
              >
                <MailIcon className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="truncate">Email Desk</span>
              </a>
            </div>
          </div>

          {/* ======================================================== */}
          {/* 6. ACCOUNT SWITCHING & SIGN OUT HIERARCHY                */}
          {/* ======================================================== */}
          <div className="space-y-2 pt-1">
            {/* Primary Red Sign Out Action Button */}
            <button
              type="button"
              onClick={handleSignOut}
              className="w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out of Account</span>
            </button>

            {/* Secondary Outlined Switch Store / Account Action */}
            <button
              type="button"
              onClick={handleSwitchAccount}
              className="w-full py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm text-slate-300 hover:text-white bg-slate-800/40 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
            >
              <RefreshCw className="w-4 h-4 text-cyan-400" />
              <span>Switch Store / Account</span>
            </button>
          </div>

          {/* Footer System Version */}
          <div className="pt-2 text-center space-y-0.5">
            <p className="text-[11px] font-mono text-slate-400 font-medium select-none">
              {APP_VERSION_DISPLAY}
            </p>
            <div className="inline-flex items-center gap-1.5 text-[10px] text-emerald-400/90 font-semibold select-none">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Cloud Multi-Tenant Register Synchronized</span>
            </div>
          </div>
        </div>
      </div>

      {/* Password Reset Modal */}
      <ResetPasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        userEmail={userEmail}
      />
    </>
  );
}
