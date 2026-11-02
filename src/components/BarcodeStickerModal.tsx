"use client";

import { useState, useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";
import { Printer, X, Tag, Check, Sparkles, SlidersHorizontal, Package } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface BarcodeStickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: any[];
}

function BarcodeSvg({ value, height = 24 }: { value: string; height?: number }) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (svgRef.current && value) {
      try {
        JsBarcode(svgRef.current, value, {
          format: "CODE128",
          width: 1.1,
          height: height,
          displayValue: true,
          fontSize: 9,
          margin: 2,
        });
      } catch (e) {
        console.error("Barcode rendering error:", e);
      }
    }
  }, [value, height]);

  return <svg ref={svgRef} className="max-w-full mx-auto" />;
}

export function BarcodeStickerModal({ isOpen, onClose, items }: BarcodeStickerModalProps) {
  const [tagFormat, setTagFormat] = useState<"STANDARD_50x25" | "BUTTERFLY">("STANDARD_50x25");
  const [copiesPerItem, setCopiesPerItem] = useState<number>(1);
  const [useStockQty, setUseStockQty] = useState(false);
  const [storeName, setStoreName] = useState("VISIONPULSE");

  if (!isOpen || !items || items.length === 0) return null;

  const handlePrint = () => {
    window.print();
  };

  // Build the list of labels to print based on copies
  const labelsToPrint: any[] = [];
  items.forEach((item) => {
    const qty = useStockQty ? Math.max(1, item.stock_quantity || 1) : copiesPerItem;
    for (let i = 0; i < qty; i++) {
      labelsToPrint.push({ ...item, copyIndex: i + 1 });
    }
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Controls Header (Hidden in Print) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50 print:hidden">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-100 text-cyan-800 flex items-center justify-center">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Optical Barcode Sticker & Tag Engine
              </h3>
              <p className="text-[11px] text-slate-500">
                Generating {labelsToPrint.length} optical frame tags for {items.length} item(s)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Sticker Sheet ({labelsToPrint.length})</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Configuration Toolbar (Hidden in Print) */}
        <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs print:hidden">
          {/* Format Selector */}
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700">Tag Style:</span>
            <div className="flex bg-white rounded-xl border border-slate-200 p-0.5 shadow-2xs">
              <button
                type="button"
                onClick={() => setTagFormat("STANDARD_50x25")}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  tagFormat === "STANDARD_50x25"
                    ? "bg-cyan-600 text-white shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Standard (50mm x 25mm)
              </button>
              <button
                type="button"
                onClick={() => setTagFormat("BUTTERFLY")}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  tagFormat === "BUTTERFLY"
                    ? "bg-cyan-600 text-white shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Butterfly / Dumbbell Temple Tag
              </button>
            </div>
          </div>

          {/* Copies Configuration */}
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 text-slate-700 font-semibold cursor-pointer select-none">
              <input
                type="checkbox"
                checked={useStockQty}
                onChange={(e) => setUseStockQty(e.target.checked)}
                className="rounded text-cyan-600 focus:ring-cyan-500"
              />
              <span>Match Current Stock Quantity</span>
            </label>

            {!useStockQty && (
              <div className="flex items-center gap-1.5">
                <span className="text-slate-600">Copies / Item:</span>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={copiesPerItem}
                  onChange={(e) => setCopiesPerItem(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="w-14 px-2 py-1 bg-white border border-slate-300 rounded text-center font-bold text-xs"
                />
              </div>
            )}
          </div>
        </div>

        {/* Printable Stickers Canvas Grid */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-200/60 print:bg-white print:p-0">
          <div className="max-w-[760px] mx-auto bg-white p-6 rounded-xl shadow-xs border border-slate-200 print:shadow-none print:border-none print:p-0 print:m-0 print:max-w-none">
            {/* Grid of tags */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 print:grid-cols-3 print:gap-1">
              {labelsToPrint.map((item, idx) => (
                <div key={idx} className="print:break-inside-avoid">
                  {tagFormat === "STANDARD_50x25" ? (
                    /* ---------------------------------------------------- */
                    /* STANDARD RECTANGULAR OPTICAL TAG (50mm x 25mm)       */
                    /* ---------------------------------------------------- */
                    <div className="w-full h-[115px] border-2 border-dashed border-slate-300 rounded-md p-2 bg-white flex flex-col justify-between text-black font-sans shadow-2xs print:border-black print:rounded-none">
                      {/* Top Store & Brand Line */}
                      <div className="flex justify-between items-center text-[10px] border-b border-black/20 pb-0.5">
                        <span className="font-black tracking-wider text-cyan-900 print:text-black">
                          {storeName}
                        </span>
                        <span className="font-extrabold uppercase truncate max-w-[100px]">
                          {item.brand}
                        </span>
                      </div>

                      {/* Model & Specs */}
                      <div className="flex justify-between items-center text-[9px] text-slate-800 font-medium">
                        <span className="truncate max-w-[110px] font-bold">
                          {item.model || item.type}
                        </span>
                        {item.size && <span className="font-mono text-[8px]">{item.size}</span>}
                      </div>

                      {/* Barcode SVG */}
                      <div className="flex-1 flex items-center justify-center -my-1">
                        <BarcodeSvg value={item.sku || item.barcode} height={22} />
                      </div>

                      {/* Bottom MRP Line */}
                      <div className="flex justify-between items-center text-[10px] font-black border-t border-black/20 pt-0.5">
                        <span className="font-mono text-[9px] text-slate-600">
                          {item.color ? `${item.color.toUpperCase()}` : item.type}
                        </span>
                        <span className="text-black text-xs font-black">
                          MRP: {formatCurrency(item.selling_price)}
                        </span>
                      </div>
                    </div>
                  ) : (
                    /* ---------------------------------------------------- */
                    /* BUTTERFLY / DUMBBELL FOLDABLE OPTICAL FRAME TAG      */
                    /* ---------------------------------------------------- */
                    <div className="w-full border-2 border-slate-300 rounded-lg p-2 bg-white text-black font-sans shadow-2xs print:border-black print:rounded-none">
                      <div className="flex items-center justify-between gap-1 text-[9px]">
                        {/* Left Wing (Brand & Specs) */}
                        <div className="w-[45%] text-left space-y-0.5 border-r border-dashed border-slate-300 pr-1">
                          <p className="font-black text-[9px] tracking-wider text-cyan-900 print:text-black">
                            {storeName}
                          </p>
                          <p className="font-bold uppercase truncate">{item.brand}</p>
                          <p className="text-[8px] truncate">{item.model || item.sku}</p>
                          {item.size && <p className="text-[8px] font-mono">{item.size}</p>}
                        </div>

                        {/* Thin Center Bridge Fold Indicator */}
                        <div className="w-[10%] flex flex-col items-center justify-center text-[7px] text-slate-400 font-mono select-none">
                          <span>|</span>
                          <span>TEMPLE</span>
                          <span>FOLD</span>
                          <span>|</span>
                        </div>

                        {/* Right Wing (Barcode & MRP) */}
                        <div className="w-[45%] text-right space-y-0.5 pl-1">
                          <p className="font-black text-[10px] text-black">
                            {formatCurrency(item.selling_price)}
                          </p>
                          <div className="-my-1 scale-90 origin-right">
                            <BarcodeSvg value={item.sku} height={18} />
                          </div>
                          <p className="text-[8px] font-mono text-slate-500">
                            {item.color || "STD"}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions (Hidden in Print) */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between print:hidden">
          <p className="text-xs text-slate-500">
            Tip: Adjust printer settings to &ldquo;Scale: 100%&rdquo; and &ldquo;Margins: None&rdquo; for accurate label alignment.
          </p>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print {labelsToPrint.length} Stickers</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
