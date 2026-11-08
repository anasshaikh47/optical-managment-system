/**
 * Comprehensive safe prescription parsing, formatting, and null-guard utilities.
 * Handles flat schema fields (od_sph, os_sph), nested JSON structures (rightEye, leftEye),
 * and string/number diopter representations without runtime type exceptions.
 */

export function formatDiopter(val: any): string {
  if (val === null || val === undefined || val === "") return "-";
  const num = Number(val);
  if (isNaN(num)) return String(val);
  const formatted = num.toFixed(2);
  return num > 0 ? `+${formatted}` : formatted;
}

export function formatAdd(val: any): string {
  if (val === null || val === undefined || val === "") return "—";
  const num = Number(val);
  if (isNaN(num)) return String(val);
  const formatted = num.toFixed(2);
  return `+${formatted}`;
}

export function formatAxis(val: any): string {
  if (val === null || val === undefined || val === "") return "—";
  const num = Number(val);
  if (isNaN(num)) return String(val).includes("°") ? String(val) : `${val}°`;
  return `${num}°`;
}

export interface NormalizedEyeSpecs {
  sph: any;
  cyl: any;
  axis: any;
  add: any;
}

export interface NormalizedPrescription {
  hasRx: boolean;
  od_sph: any;
  od_cyl: any;
  od_axis: any;
  od_add: any;
  os_sph: any;
  os_cyl: any;
  os_axis: any;
  os_add: any;
  pd_distance: string;
  pd_near: string;
  lens_type: string;
  optometristName: string;
  notes: string;
  rightEye: NormalizedEyeSpecs;
  leftEye: NormalizedEyeSpecs;
  formatted: {
    od: {
      sph: string;
      cyl: string;
      axis: string;
      add: string;
      summary: string;
    };
    os: {
      sph: string;
      cyl: string;
      axis: string;
      add: string;
      summary: string;
    };
    pd: string;
    lensDesign: string;
  };
}

/**
 * Safely parses any prescription object (flat or nested) with complete null-guards.
 */
export function normalizeRx(rawRx: any): NormalizedPrescription {
  if (!rawRx || typeof rawRx !== "object") {
    return {
      hasRx: false,
      od_sph: null,
      od_cyl: null,
      od_axis: null,
      od_add: null,
      os_sph: null,
      os_cyl: null,
      os_axis: null,
      os_add: null,
      pd_distance: "—",
      pd_near: "—",
      lens_type: "Single Vision",
      optometristName: "Dr. Staff Optometrist",
      notes: "",
      rightEye: { sph: null, cyl: null, axis: null, add: null },
      leftEye: { sph: null, cyl: null, axis: null, add: null },
      formatted: {
        od: { sph: "-", cyl: "-", axis: "—", add: "—", summary: "OD: —" },
        os: { sph: "-", cyl: "-", axis: "—", add: "—", summary: "OS: —" },
        pd: "—",
        lensDesign: "Single Vision",
      },
    };
  }

  // Support both flat schema fields and nested JSON eye structures
  const rEye = rawRx.rightEye || rawRx.od || {};
  const lEye = rawRx.leftEye || rawRx.os || {};

  const od_sph =
    rawRx.od_sph !== undefined && rawRx.od_sph !== ""
      ? rawRx.od_sph
      : rEye.sph !== undefined && rEye.sph !== ""
      ? rEye.sph
      : rEye.od_sph ?? null;

  const od_cyl =
    rawRx.od_cyl !== undefined && rawRx.od_cyl !== ""
      ? rawRx.od_cyl
      : rEye.cyl !== undefined && rEye.cyl !== ""
      ? rEye.cyl
      : rEye.od_cyl ?? null;

  const od_axis =
    rawRx.od_axis !== undefined && rawRx.od_axis !== ""
      ? rawRx.od_axis
      : rEye.axis !== undefined && rEye.axis !== ""
      ? rEye.axis
      : rEye.od_axis ?? null;

  const od_add =
    rawRx.od_add !== undefined && rawRx.od_add !== ""
      ? rawRx.od_add
      : rEye.add !== undefined && rEye.add !== ""
      ? rEye.add
      : rEye.od_add ?? null;

  const os_sph =
    rawRx.os_sph !== undefined && rawRx.os_sph !== ""
      ? rawRx.os_sph
      : lEye.sph !== undefined && lEye.sph !== ""
      ? lEye.sph
      : lEye.os_sph ?? null;

  const os_cyl =
    rawRx.os_cyl !== undefined && rawRx.os_cyl !== ""
      ? rawRx.os_cyl
      : lEye.cyl !== undefined && lEye.cyl !== ""
      ? lEye.cyl
      : lEye.os_cyl ?? null;

  const os_axis =
    rawRx.os_axis !== undefined && rawRx.os_axis !== ""
      ? rawRx.os_axis
      : lEye.axis !== undefined && lEye.axis !== ""
      ? lEye.axis
      : lEye.os_axis ?? null;

  const os_add =
    rawRx.os_add !== undefined && rawRx.os_add !== ""
      ? rawRx.os_add
      : lEye.add !== undefined && lEye.add !== ""
      ? lEye.add
      : lEye.os_add ?? null;

  const rawPdDist =
    rawRx.pd_distance !== undefined && rawRx.pd_distance !== ""
      ? rawRx.pd_distance
      : rawRx.pdDist !== undefined && rawRx.pdDist !== ""
      ? rawRx.pdDist
      : rawRx.pd ?? null;

  const rawPdNear =
    rawRx.pd_near !== undefined && rawRx.pd_near !== ""
      ? rawRx.pd_near
      : rawRx.pdNear ?? null;

  const rawLensType =
    rawRx.lens_type || rawRx.designType || rawRx.lensType || "Single Vision";

  const rawOptometrist =
    rawRx.optometristName || rawRx.optometrist || "Dr. Staff Optometrist";

  const rawNotes = rawRx.notes || "";

  const pd_distance =
    rawPdDist !== null && rawPdDist !== undefined && rawPdDist !== ""
      ? String(rawPdDist)
      : "—";

  const pd_near =
    rawPdNear !== null && rawPdNear !== undefined && rawPdNear !== ""
      ? String(rawPdNear)
      : "—";

  const lens_type =
    typeof rawLensType === "string"
      ? rawLensType.replace(/_/g, " ")
      : "Single Vision";

  const optometristName =
    typeof rawOptometrist === "string" ? rawOptometrist : "Dr. Staff Optometrist";

  const notes = typeof rawNotes === "string" ? rawNotes : "";

  const hasPower = [
    od_sph,
    od_cyl,
    od_axis,
    od_add,
    os_sph,
    os_cyl,
    os_axis,
    os_add,
  ].some((v) => v !== null && v !== undefined && v !== "");

  const odSphFormatted = formatDiopter(od_sph);
  const odCylFormatted = formatDiopter(od_cyl);
  const odAxisFormatted = formatAxis(od_axis);
  const odAddFormatted = formatAdd(od_add);

  const osSphFormatted = formatDiopter(os_sph);
  const osCylFormatted = formatDiopter(os_cyl);
  const osAxisFormatted = formatAxis(os_axis);
  const osAddFormatted = formatAdd(os_add);

  const odSummary = `SPH ${odSphFormatted} | CYL ${odCylFormatted} x ${odAxisFormatted}${
    od_add !== null && od_add !== undefined && od_add !== ""
      ? ` | ADD ${odAddFormatted}`
      : ""
  }`;

  const osSummary = `SPH ${osSphFormatted} | CYL ${osCylFormatted} x ${osAxisFormatted}${
    os_add !== null && os_add !== undefined && os_add !== ""
      ? ` | ADD ${osAddFormatted}`
      : ""
  }`;

  return {
    hasRx: hasPower || Boolean(rawRx.id || rawRx.notes || rawRx.lens_type),
    od_sph,
    od_cyl,
    od_axis,
    od_add,
    os_sph,
    os_cyl,
    os_axis,
    os_add,
    pd_distance,
    pd_near,
    lens_type,
    optometristName,
    notes,
    rightEye: {
      sph: od_sph,
      cyl: od_cyl,
      axis: od_axis,
      add: od_add,
    },
    leftEye: {
      sph: os_sph,
      cyl: os_cyl,
      axis: os_axis,
      add: os_add,
    },
    formatted: {
      od: {
        sph: odSphFormatted,
        cyl: odCylFormatted,
        axis: odAxisFormatted,
        add: odAddFormatted,
        summary: odSummary,
      },
      os: {
        sph: osSphFormatted,
        cyl: osCylFormatted,
        axis: osAxisFormatted,
        add: osAddFormatted,
        summary: osSummary,
      },
      pd: `${pd_distance} mm (Dist) • ${pd_near} mm (Near)`,
      lensDesign: lens_type,
    },
  };
}
