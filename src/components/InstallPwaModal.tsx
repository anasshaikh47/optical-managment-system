"use client";

import { X, Download, Share2, PlusSquare, Smartphone, CheckCircle2, Monitor } from "lucide-react";

interface InstallPwaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInstall: () => void;
  isInstallable: boolean;
  isInstalled: boolean;
  isIos: boolean;
}

export function InstallPwaModal({
  isOpen,
  onClose,
  onInstall,
  isInstallable,
  isInstalled,
  isIos,
}: InstallPwaModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full flex flex-col overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-slate-950 to-cyan-950 text-cyan-400 flex items-center justify-center shadow-xs border border-slate-800">
              <Smartphone className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="font-black text-sm text-slate-900 leading-tight">
                Install Optical Store ERP & POS
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                Install as a native standalone desktop & mobile app
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 text-xs">
          {/* App Preview Card */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
            <img
              src="/icon-192.png"
              alt="Optical POS Icon"
              className="w-12 h-12 rounded-xl shadow-xs border border-slate-300"
            />
            <div className="flex-1 min-w-0">
              <h4 className="font-black text-slate-900 text-sm truncate">
                Optical Store ERP & POS
              </h4>
              <p className="text-[11px] text-slate-500 truncate">
                Clinical Optometry, Billing & Inventory
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-cyan-100 text-cyan-800 font-mono">
                  PWA v1.0
                </span>
                <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Standalone Ready
                </span>
              </div>
            </div>
          </div>

          {/* Benefits Grid */}
          <div className="grid grid-cols-2 gap-2 text-[11px] font-semibold text-slate-700">
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center gap-2">
              <span className="text-base">⚡</span>
              <span>Instant Launch & Offline Caching</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center gap-2">
              <span className="text-base">🖥️</span>
              <span>Full Screen Window Mode</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center gap-2">
              <span className="text-base">📱</span>
              <span>One-Tap Home Screen Access</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center gap-2">
              <span className="text-base">🔒</span>
              <span>Secure Local Data Ledger</span>
            </div>
          </div>

          {/* Conditional Instructions: iOS vs Android/Chrome/Desktop */}
          {isInstalled ? (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-center font-bold">
              ✓ This application is already installed on this device.
            </div>
          ) : isIos ? (
            <div className="space-y-2 p-3.5 rounded-xl bg-cyan-50/70 border border-cyan-200 text-slate-800">
              <p className="font-bold text-cyan-900 text-[11px] uppercase tracking-wider">
                How to install on iOS Safari:
              </p>
              <ol className="list-decimal list-inside space-y-1.5 text-slate-700 leading-relaxed text-xs">
                <li>
                  Tap the <strong className="inline-flex items-center gap-1 text-slate-900"><Share2 className="w-3.5 h-3.5 inline text-cyan-700" /> Share button</strong> in the Safari toolbar.
                </li>
                <li>
                  Scroll down the menu and select <strong className="inline-flex items-center gap-1 text-slate-900"><PlusSquare className="w-3.5 h-3.5 inline text-cyan-700" /> Add to Home Screen</strong>.
                </li>
                <li>
                  Tap <strong className="text-slate-900 font-black">Add</strong> in the top-right corner to finish.
                </li>
              </ol>
            </div>
          ) : isInstallable ? (
            <div className="text-center space-y-2">
              <p className="text-slate-500 text-[11px]">
                Click below to trigger the native installation dialog directly in your browser.
              </p>
              <button
                type="button"
                onClick={onInstall}
                className="w-full py-3 rounded-xl font-bold text-xs text-white bg-cyan-700 hover:bg-cyan-800 border border-cyan-600 shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
              >
                <Download className="w-4 h-4 stroke-[2.5]" />
                <span>Install Native Optical POS App</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700">
              <div className="flex items-center gap-2 font-bold text-slate-900">
                <Monitor className="w-4 h-4 text-cyan-600" />
                <span>Desktop Chrome / Edge / Android:</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Click the <strong>Install App icon (⊕ or 💻)</strong> in your browser&apos;s address bar, or open your browser menu (⋮) and select <strong>&ldquo;Install Optical Store ERP...&rdquo;</strong>.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <span className="text-[10px] text-slate-400 font-mono">
            Optical Store ERP • Standalone PWA
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
