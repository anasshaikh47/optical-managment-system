import React from "react";
import { cn } from "@/lib/utils";

interface VisionPulseMarkProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
}

/**
 * High-End Minimalist Geometric Optical Mark.
 * Combines an aperture focal ring, sleek geometric spectacle rims,
 * an architectural bridge, and micro optical reticle calibration points.
 */
export function VisionPulseMark({
  className = "w-6 h-6",
  ...props
}: VisionPulseMarkProps) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="VisionPulse Optical Mark"
      {...props}
    >
      {/* Precision outer calibration / aperture circle */}
      <circle
        cx="20"
        cy="20"
        r="18"
        stroke="currentColor"
        strokeWidth="1"
        strokeDasharray="2 3"
        className="opacity-30"
      />

      {/* Left geometric lens frame */}
      <path
        d="M 6.5 15 C 6.5 12.5 8.5 11 11 11 H 17 C 18 11 18.5 11.8 18.5 12.8 V 23.5 C 18.5 27 16.2 29 12.8 29 H 11 C 8.5 29 6.5 27.2 6.5 24 Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Right geometric lens frame */}
      <path
        d="M 33.5 15 C 33.5 12.5 31.5 11 29 11 H 23 C 22 11 21.5 11.8 21.5 12.8 V 23.5 C 21.5 27 23.8 29 27.2 29 H 29 C 31.5 29 33.5 27.2 33.5 24 Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Minimalist architectural spectacle bridge */}
      <path
        d="M 18.5 17.5 C 19.5 16 20.5 16 21.5 17.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />

      {/* Temple hinge terminals */}
      <line
        x1="3.5"
        y1="15"
        x2="6.5"
        y2="15"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <line
        x1="33.5"
        y1="15"
        x2="36.5"
        y2="15"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />

      {/* Optical focal reticles & micro-aperture calibration centers */}
      <circle cx="12.5" cy="20" r="1.3" fill="currentColor" className="opacity-95" />
      <circle cx="27.5" cy="20" r="1.3" fill="currentColor" className="opacity-95" />

      {/* Thin optical alignment cross-hairs */}
      <path
        d="M 12.5 17.5 V 18.5 M 12.5 21.5 V 22.5 M 10 20 H 11 M 14 20 H 15"
        stroke="currentColor"
        strokeWidth="0.9"
        strokeLinecap="round"
        className="opacity-40"
      />
      <path
        d="M 27.5 17.5 V 18.5 M 27.5 21.5 V 22.5 M 25 20 H 26 M 29 20 H 30"
        stroke="currentColor"
        strokeWidth="0.9"
        strokeLinecap="round"
        className="opacity-40"
      />
    </svg>
  );
}

interface VisionPulseLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showSubtitle?: boolean;
  className?: string;
  subtitleText?: string;
}

export function VisionPulseLogo({
  size = "md",
  showSubtitle = true,
  className = "",
  subtitleText = "Optical Retail & Clinical Suite",
}: VisionPulseLogoProps) {
  const sizeConfig = {
    sm: {
      markWrapper: "w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 text-slate-100",
      mark: "w-4 h-4",
      title: "text-xs font-semibold tracking-tight text-white",
      subtitle: "text-[9px] tracking-wider text-slate-400 uppercase",
      gap: "gap-2",
    },
    md: {
      markWrapper: "w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 shadow-sm",
      mark: "w-5 h-5",
      title: "text-sm font-semibold tracking-tight text-white",
      subtitle: "text-[10px] tracking-wider text-slate-400 uppercase font-medium",
      gap: "gap-2.5",
    },
    lg: {
      markWrapper: "w-12 h-12 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-100 shadow-md",
      mark: "w-6 h-6",
      title: "text-base sm:text-lg font-semibold tracking-tight text-white",
      subtitle: "text-[10px] sm:text-[11px] tracking-wider text-slate-400 uppercase font-medium",
      gap: "gap-3",
    },
    xl: {
      markWrapper: "w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-slate-900/90 border border-slate-800 text-slate-100 shadow-lg shadow-black/40",
      mark: "w-8 h-8 sm:w-9 sm:h-9",
      title: "text-xl sm:text-2xl font-semibold tracking-tight text-white",
      subtitle: "text-xs tracking-wider text-slate-400 uppercase font-medium",
      gap: "gap-3.5",
    },
  }[size];

  return (
    <div className={cn("flex items-center", sizeConfig.gap, className)}>
      <div
        className={cn(
          "flex items-center justify-center shrink-0 transition-transform",
          sizeConfig.markWrapper
        )}
      >
        <VisionPulseMark className={sizeConfig.mark} />
      </div>
      <div className="flex flex-col min-w-0">
        <span className={cn("leading-none", sizeConfig.title)}>VisionPulse</span>
        {showSubtitle && (
          <span className={cn("mt-1 leading-tight truncate", sizeConfig.subtitle)}>
            {subtitleText}
          </span>
        )}
      </div>
    </div>
  );
}
