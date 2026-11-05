"use client";

import { useState, useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";
import { Printer, X, Tag, Pill } from "lucide-react";
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
  const [copiesPerItem, setCopiesPerItem] = useState<number>(1);
  const [useStockQty, setUseStockQty] = useState(false);
  const [storeName, setStoreName] = useState("PHARMAPULSE");

  if (!isOpen || !items || items.length === 0) return null;

  const handlePrint = () => {
    window.print();
  };

  const labelsToPrint: any[] = [];
  items.forEach((item) => {
    const qty = useStockQty ? Math.max(1, item.stripQuantity || item.stock_quantity || 1) : copiesPerItem;
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
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Pharmacy Barcode & Medicine Shelf Label Engine
              </h3>
              <p className="text-[11px] text-slate-500">
                Generating {labelsToPrint.length} shelf tags for {items.length} medicine(s)
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
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 font-bold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={useStockQty}
                onChange={(e) => setUseStockQty(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600"
              />
              <span>Print 1 Label per Stock Strip</span>
            </label>

            {!useStockQty && (
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-600">Copies / Medicine:</span>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={copiesPerItem}
                  onChange={(e) => setCopiesPerItem(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="w-16 px-2 py-1 bg-white border border-slate-300 rounded-lg text-center font-bold"
                />
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-600">Header:</span>
            <input
              type="text"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              className="w-32 px-2 py-1 bg-white border border-slate-300 rounded-lg font-bold text-xs"
            />
          </div>
        </div>

        {/* Printable Stickers Sheet */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-100 flex justify-center print:bg-white print:p-0">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 print:grid-cols-3 print:gap-1.5 w-full max-w-[800px]">
            {labelsToPrint.map((item, idx) => (
              <div
                key={idx}
                className="bg-white p-3 rounded-lg border border-slate-300 shadow-2xs font-mono text-[10px] space-y-1 text-slate-800 text-center flex flex-col justify-between print:border-slate-800 print:shadow-none"
              >
                <div>
                  <p className="font-black text-[9px] uppercase tracking-wider text-slate-900 truncate">
                    {storeName}
                  </p>
                  <p className="font-bold text-[11px] text-slate-950 truncate mt-0.5">
                    {item.name || item.brand}
                  </p>
                  <p className="text-[9px] text-slate-500 truncate">
                    {item.genericSaltName || item.model}
                  </p>
                </div>

                <div className="my-1">
                  <BarcodeSvg value={item.barcode || item.sku || `MED-${idx}`} height={22} />
                </div>

                <div className="pt-1 border-t border-slate-200 text-[9px] flex justify-between font-bold">
                  <span>B: {item.batchNumber || "BT-01"}</span>
                  <span>EXP: {item.expiryDate || "12/26"}</span>
                </div>

                <div className="flex justify-between font-black text-slate-900 text-[10px] pt-0.5">
                  <span>MRP: {formatCurrency(item.mrp || item.saleRate || item.selling_price || 0)}</span>
                  <span>{item.rackLocation || "RACK"}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
