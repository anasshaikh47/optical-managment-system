"use client";

import React from "react";
import { ArrowUpCircle, X } from "lucide-react";
import { useAppUi } from "@/context/AppUiContext";

export function AppUpdateBanner() {
  const { isUpdateAvailable, applyAppUpdate, dismissUpdate } = useAppUi();

  if (!isUpdateAvailable) return null;

  return (
    <aside
      role="alert"
      aria-live="polite"
      aria-label="Application Update Available"
      className="fixed top-3 sm:top-4 left-1/2 -translate-x-1/2 z-[100] max-w-lg w-[92vw] sm:w-auto animate-in fade-in slide-in-from-top-4 duration-300 pointer-events-auto"
    >
      <div className="bg-slate-900/95 backdrop-blur-md text-white border border-cyan-500/50 shadow-2xl rounded-full px-3.5 sm:px-4 py-2 sm:py-2.5 flex items-center justify-between gap-2.5 sm:gap-3 text-xs">
        <div className="flex items-center gap-2 min-w-0">
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500" />
          </span>
          <span className="font-semibold text-slate-100 truncate text-[11px] sm:text-xs">
            A new version of the app is available.
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={applyAppUpdate}
            className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-[11px] sm:text-xs shadow-sm transition-all cursor-pointer active:scale-95"
          >
            <ArrowUpCircle className="w-3.5 h-3.5 shrink-0" />
            <span>Update Now</span>
          </button>
          <button
            type="button"
            onClick={dismissUpdate}
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Dismiss notification"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
