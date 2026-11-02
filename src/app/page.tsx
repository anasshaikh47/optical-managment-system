"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShoppingCart,
  Glasses,
  Wrench,
  Package,
  Users,
  IndianRupee,
  TrendingUp,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Calendar,
  ArrowRight,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { Header } from "@/components/Header";
import { ReceiptModal } from "@/components/ReceiptModal";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";

export default function DashboardPage() {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const res = await fetch("/api/dashboard");
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const metrics = data?.metrics || {};

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-100">
      <Header
        title="VisionPulse Executive Dashboard"
        subtitle="Clinical Operations, Eyewear Lab & Retail Performance"
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* KPI Metrics Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Revenue */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden group">
            <div className="absolute right-0 top-0 translate-x-3 -translate-y-3 w-20 h-20 rounded-full bg-cyan-500/10 transition-transform group-hover:scale-125" />
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                Total Revenue Collected
              </span>
              <div className="w-8 h-8 rounded-xl bg-cyan-100 text-cyan-700 flex items-center justify-center font-bold">
                <IndianRupee className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">
              {formatCurrency(metrics.totalRevenue || 0)}
            </h3>
            <p className="text-[11px] text-slate-500 mt-1 font-medium flex items-center gap-1">
              <span className="text-amber-600 font-bold">
                {formatCurrency(metrics.totalReceivables || 0)}
              </span>{" "}
              balance receivables pending
            </p>
          </div>

          {/* Glazing Workshop */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden group">
            <div className="absolute right-0 top-0 translate-x-3 -translate-y-3 w-20 h-20 rounded-full bg-amber-500/10 transition-transform group-hover:scale-125" />
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                Lab & Workshop Pipeline
              </span>
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                <Wrench className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">
              {metrics.inWorkshopCount || 0}
            </h3>
            <p className="text-[11px] text-slate-500 mt-1 font-medium flex items-center gap-1">
              <span className="text-cyan-600 font-bold">
                {metrics.readyForPickupCount || 0}
              </span>{" "}
              spectacles ready for customer pickup
            </p>
          </div>

          {/* Orders Count */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden group">
            <div className="absolute right-0 top-0 translate-x-3 -translate-y-3 w-20 h-20 rounded-full bg-blue-500/10 transition-transform group-hover:scale-125" />
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                Total Orders Placed
              </span>
              <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                <ShoppingCart className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">
              {metrics.totalOrders || 0}
            </h3>
            <p className="text-[11px] text-slate-500 mt-1 font-medium">
              Registered Patients: <strong className="text-slate-800">{metrics.totalCustomers || 0}</strong>
            </p>
          </div>

          {/* Low Stock Alerts */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden group">
            <div className="absolute right-0 top-0 translate-x-3 -translate-y-3 w-20 h-20 rounded-full bg-rose-500/10 transition-transform group-hover:scale-125" />
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                Low Stock Warning
              </span>
              <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">
              {metrics.lowStockCount || 0}
            </h3>
            <p className="text-[11px] text-slate-500 mt-1 font-medium">
              Total Catalog SKUs: <strong className="text-slate-800">{metrics.totalProducts || 0}</strong>
            </p>
          </div>
        </div>

        {/* Quick Operations Bar */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-cyan-950 p-4 rounded-2xl shadow-md text-white flex flex-wrap items-center justify-between gap-4">
          <div>
            <h4 className="font-bold text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" /> VisionPulse Fast-Actions
            </h4>
            <p className="text-xs text-slate-300">
              Instant shortcuts to daily clinic and counter workflows
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href="/pos"
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-sm transition-all hover:scale-105 inline-flex items-center gap-1.5"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>Launch POS Checkout</span>
            </Link>

            <Link
              href="/prescriptions"
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800/80 hover:bg-slate-700 text-white border border-slate-700 transition-colors inline-flex items-center gap-1.5"
            >
              <Glasses className="w-3.5 h-3.5 text-cyan-400" />
              <span>Prescription Records</span>
            </Link>

            <Link
              href="/lab-jobs"
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800/80 hover:bg-slate-700 text-white border border-slate-700 transition-colors inline-flex items-center gap-1.5"
            >
              <Wrench className="w-3.5 h-3.5 text-amber-400" />
              <span>Glazing Workshop</span>
            </Link>

            <Link
              href="/inventory"
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800/80 hover:bg-slate-700 text-white border border-slate-700 transition-colors inline-flex items-center gap-1.5"
            >
              <Package className="w-3.5 h-3.5 text-emerald-400" />
              <span>Inventory Catalog</span>
            </Link>
          </div>
        </div>

        {/* Dual Column: Workshop Glazing Tracker & Recent Orders */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Active Workshop Orders */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <Wrench className="w-4 h-4 text-amber-600" />
                <h3 className="font-bold text-slate-800 text-sm">
                  Active Workshop Jobs (Processing & Fitting)
                </h3>
              </div>
              <Link
                href="/lab-jobs"
                className="text-xs font-semibold text-cyan-600 hover:text-cyan-800 inline-flex items-center gap-1"
              >
                <span>View Glazing Board</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {loading ? (
              <div className="h-40 flex items-center justify-center text-slate-400 text-xs">
                Loading workshop orders...
              </div>
            ) : data?.activeWorkshopOrders?.length === 0 ? (
              <div className="h-40 flex flex-col items-center justify-center text-slate-400 text-xs">
                <CheckCircle2 className="w-6 h-6 mb-1 text-emerald-500 opacity-60" />
                <p>All prescription spectacle jobs have completed fitting!</p>
              </div>
            ) : (
              <div className="space-y-3 flex-1">
                {data?.activeWorkshopOrders?.map((ord: any) => (
                  <div
                    key={ord.id}
                    className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-900 font-mono">
                        {ord.bill_no}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800">
                        {ord.status.replace("_", " ")}
                      </span>
                    </div>

                    <div className="text-xs">
                      <p className="font-semibold text-slate-800">
                        Patient: {ord.customer?.name} ({ord.customer?.phone})
                      </p>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        Items: {ord.items?.map((i: any) => `${i.item?.brand} ${i.item?.model || i.item?.type}`).join(", ")}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                      <span>Paid: {formatCurrency(ord.paid_amount)}</span>
                      {ord.delivery_due_date && (
                        <span className="font-semibold text-cyan-700">
                          Due: {formatDate(ord.delivery_due_date)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Orders / Invoices */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-cyan-600" />
                <h3 className="font-bold text-slate-800 text-sm">
                  Recent Sales & GST Invoices
                </h3>
              </div>
              <Link
                href="/orders"
                className="text-xs font-semibold text-cyan-600 hover:text-cyan-800 inline-flex items-center gap-1"
              >
                <span>All Orders</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {loading ? (
              <div className="h-40 flex items-center justify-center text-slate-400 text-xs">
                Loading orders...
              </div>
            ) : data?.recentOrders?.length === 0 ? (
              <div className="h-40 flex items-center justify-center text-slate-400 text-xs">
                No orders recorded yet.
              </div>
            ) : (
              <div className="space-y-2.5 flex-1">
                {data?.recentOrders?.map((order: any) => (
                  <div
                    key={order.id}
                    className="p-3 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 font-mono">
                          {order.bill_no}
                        </span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            order.status === "DELIVERED"
                              ? "bg-emerald-100 text-emerald-800"
                              : order.status === "READY_FOR_PICKUP"
                              ? "bg-cyan-100 text-cyan-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {order.status.replace("_", " ")}
                        </span>
                      </div>
                      <p className="text-slate-600 text-xs truncate mt-0.5">
                        {order.customer ? order.customer.name : "Walk-in Guest"} •{" "}
                        {order.items?.length || 0} items
                      </p>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-slate-900 text-xs">
                        {formatCurrency(order.final_payable)}
                      </p>
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="text-[10px] text-cyan-600 hover:text-cyan-800 font-semibold underline mt-0.5"
                      >
                        Print Slip
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Lower Row: Category Sales Distribution & Low Stock Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sales Breakdown by Category */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <h3 className="font-bold text-slate-800 text-sm mb-4">
              Sales Distribution by Product Type
            </h3>
            <div className="space-y-3 text-xs">
              {[
                { label: "Spectacle Frames (Ray-Ban, Titan, Fastrack)", key: "FRAME", color: "bg-cyan-500" },
                { label: "Power Lenses (Essilor, Zeiss, Hoya)", key: "LENS", color: "bg-blue-600" },
                { label: "Contact Lenses (Bausch & Lomb, Alcon)", key: "CONTACT_LENS", color: "bg-indigo-500" },
                { label: "Optical Accessories & Solutions", key: "ACCESSORY", color: "bg-slate-500" },
              ].map((cat) => {
                const amount = data?.categoryRevenue?.[cat.key] || 0;
                return (
                  <div key={cat.key} className="space-y-1">
                    <div className="flex justify-between text-slate-700 font-medium">
                      <span>{cat.label}</span>
                      <span className="font-bold text-slate-900">
                        {formatCurrency(amount)}
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full ${cat.color} rounded-full`}
                        style={{
                          width: `${Math.min(
                            100,
                            metrics.totalRevenue > 0
                              ? (amount / metrics.totalRevenue) * 100
                              : 0
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Low Stock Warning Cards */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-500" />
                <h3 className="font-bold text-slate-800 text-sm">
                  Low Stock Re-order Alerts
                </h3>
              </div>
              <Link
                href="/inventory"
                className="text-xs font-semibold text-cyan-600 hover:text-cyan-800 inline-flex items-center gap-1"
              >
                <span>Inventory</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="space-y-2 flex-1">
              {data?.lowStockAlerts?.length === 0 ? (
                <p className="text-slate-400 text-xs py-6 text-center">
                  All inventory items are well-stocked above minimum thresholds!
                </p>
              ) : (
                data?.lowStockAlerts?.map((item: any) => (
                  <div
                    key={item.id}
                    className="p-2.5 rounded-xl border border-rose-100 bg-rose-50/40 flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <p className="font-bold text-slate-900">
                        {item.brand} - {item.model || item.type}
                      </p>
                      <p className="text-slate-500 text-[10px] font-mono">
                        SKU: {item.sku} • Threshold: {item.min_alert_threshold}
                      </p>
                    </div>

                    <span className="px-2 py-1 rounded bg-rose-100 text-rose-800 font-bold text-xs">
                      {item.stock_quantity} left
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {selectedOrder && (
        <ReceiptModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}
    </div>
  );
}
