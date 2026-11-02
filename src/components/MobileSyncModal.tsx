"use client";

import { useState } from "react";
import { X, Smartphone, QrCode, CheckCircle2, ShieldCheck, RefreshCw } from "lucide-react";

interface MobileSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileSyncModal({ isOpen, onClose }: MobileSyncModalProps) {
  const [synced, setSynced] = useState(true);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Mobile Sync & Wireless Scanner
              </h3>
              <p className="text-[11px] text-slate-500">
                Pair counter phone for instant barcode scanning
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 text-center space-y-4">
          <div className="w-48 h-48 mx-auto bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl p-4 flex flex-col items-center justify-center relative group">
            <QrCode className="w-32 h-32 text-slate-800" />
            <div className="absolute inset-0 bg-white/90 rounded-2xl flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <p className="text-xs font-bold text-slate-900">Live Counter QR</p>
              <p className="text-[10px] text-slate-500 font-mono">Terminal #01 • VisionPulse</p>
            </div>
          </div>

          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 mb-2">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Mobile Sync Active • 0ms Delay</span>
            </div>
            <p className="text-xs text-slate-600">
              Open your smartphone camera or optical assistant app and point at this code to automatically stream barcode scans directly into the POS billing terminal.
            </p>
          </div>

          <div className="bg-slate-50 rounded-xl p-3 text-left space-y-1.5 border border-slate-100 text-xs">
            <div className="flex items-center justify-between text-slate-700 font-semibold">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                <span>Security Token:</span>
              </span>
              <span className="font-mono text-[11px] text-slate-500">VP-TERM-982</span>
            </div>
            <div className="flex items-center justify-between text-slate-700 font-semibold">
              <span>Cloud Ledger:</span>
              <span className="text-emerald-600 font-semibold text-[11px]">Synchronized</span>
            </div>
          </div>
        </div>

        <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <button
            onClick={() => setSynced(!synced)}
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Regenerate Pair Key</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
