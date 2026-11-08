"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, RotateCcw, Home } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global application boundary caught exception:", error);
  }, [error]);

  return (
    <div className="flex-1 min-h-[80vh] flex flex-col items-center justify-center p-4 sm:p-6 text-center bg-slate-50">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xl space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center mx-auto shadow-xs">
          <AlertCircle className="w-7 h-7 stroke-[2.2]" />
        </div>

        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
            Something Went Wrong
          </h2>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            {error?.message ||
              "An unexpected error occurred while loading this view. You can retry or navigate back to the home dashboard."}
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-2.5 justify-center text-xs font-semibold">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-white bg-slate-900 hover:bg-slate-800 transition-all cursor-pointer active:scale-98 shadow-xs"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Try Again</span>
          </button>

          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-all cursor-pointer active:scale-98"
          >
            <Home className="w-4 h-4" />
            <span>Return to Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
