"use client";

import Link from "next/link";
import { ShoppingCart, Glasses, Plus, ShieldCheck, Sparkles } from "lucide-react";

interface HeaderProps {
  title?: string;
  subtitle?: string;
  children?: React.ReactNode;
}

export function Header({
  title = "Optical Management Console",
  subtitle = "Precision Eyewear & Clinic Workflow",
  children,
}: HeaderProps) {
  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between flex-shrink-0 z-10 shadow-xs">
      <div>
        <h2 className="text-lg font-bold text-slate-800 leading-tight">{title}</h2>
        <p className="text-xs text-slate-500">{subtitle}</p>
      </div>

      <div className="flex items-center gap-3">
        {children}

        <Link
          href="/prescriptions?create=true"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors border border-slate-300"
        >
          <Glasses className="w-3.5 h-3.5 text-slate-600" />
          <span>New Rx</span>
        </Link>

        <Link
          href="/pos"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 shadow-sm shadow-cyan-600/20 transition-all hover:scale-[1.02]"
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          <span>Open POS</span>
        </Link>
      </div>
    </header>
  );
}
