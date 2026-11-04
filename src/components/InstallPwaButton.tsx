"use client";

import { Download, Smartphone, CheckCircle2 } from "lucide-react";
import { useAppUi } from "@/context/AppUiContext";

interface InstallPwaButtonProps {
  variant?: "header" | "sidebar" | "banner";
  className?: string;
}

export function InstallPwaButton({ variant = "header", className = "" }: InstallPwaButtonProps) {
  const { promptInstall, isInstalled, isInstallable, isIos, openInstallModal } = useAppUi();

  const handleClick = async () => {
    if (isInstallable) {
      await promptInstall();
    } else {
      openInstallModal();
    }
  };

  // If already running in standalone mode, show subtle badge
  if (isInstalled) {
    if (variant === "header") {
      return (
        <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[10px] sm:text-[11px] ${className}`}>
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>App Installed</span>
        </div>
      );
    }
    return null;
  }

  if (variant === "sidebar") {
    return (
      <button
        type="button"
        onClick={handleClick}
        className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-cyan-300 bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-800/80 transition-all cursor-pointer group text-left ${className}`}
        title="Install Optical Store ERP & POS App"
      >
        <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0 border border-cyan-500/30 group-hover:scale-105 transition-transform">
          <Download className="w-3.5 h-3.5 stroke-[2.5]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="leading-tight font-black text-white truncate">Install App</p>
          <p className="text-[10px] text-cyan-400 font-medium truncate">Native Offline Mode</p>
        </div>
        <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-cyan-400/20 text-cyan-300 font-mono">
          PWA
        </span>
      </button>
    );
  }

  if (variant === "banner") {
    return (
      <div className={`flex items-center justify-between gap-3 p-3 rounded-xl bg-gradient-to-r from-slate-900 to-[#0B132B] text-white border border-slate-700/60 shadow-lg ${className}`}>
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0 border border-cyan-500/40">
            <Smartphone className="w-4 h-4 stroke-[2.2]" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold truncate">Install Optical POS App</p>
            <p className="text-[10px] text-slate-400 truncate">Run full screen with offline cache</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleClick}
          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-colors shrink-0 cursor-pointer shadow-sm"
        >
          Install
        </button>
      </div>
    );
  }

  // Default: variant === "header"
  return (
    <button
      type="button"
      onClick={handleClick}
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-gradient-to-r from-cyan-500/10 to-blue-500/10 hover:from-cyan-500/20 hover:to-blue-500/20 text-cyan-800 border border-cyan-300/80 font-bold text-[10px] sm:text-[11px] transition-all cursor-pointer shadow-2xs group ${className}`}
      title="Install Optical Store ERP on this device"
    >
      <Download className="w-3.5 h-3.5 text-cyan-600 group-hover:translate-y-0.5 transition-transform shrink-0 stroke-[2.4]" />
      <span>Install App</span>
      <span className="hidden xs:inline-block text-[9px] uppercase px-1 rounded bg-cyan-200/80 text-cyan-900 font-mono font-black">
        PWA
      </span>
    </button>
  );
}
