"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShoppingCart,
  Glasses,
  Wrench,
  Package,
  Users,
  DollarSign,
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
        title="Optical ERP Overview"
        subtitle="Clinical Operations, Eyewear Lab & Retail Performance"
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* KPI Metrics Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Revenue Metric */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden group">
            <div className="absolute right-0 top-0 translate-x-3 -translate-y-3 w-20 h-20 rounded-full bg-cyan-500/10 transition-transform group-hover:scale-125" />
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                Total Revenue
              </span>
              <div className="w-8 h-8 rounded-xl bg-cyan-100 text-cyan-700 flex items-center justify-center">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">
              {formatCurrency(metrics.totalRevenue || 0)}
            </h3>
            <p className="text-[11px] text-slate-500 mt-1 font-medium flex items-center gap-1">
              <span className="text-amber-600 font-bold">
                {formatCurrency(metrics.totalReceivables || 0)}
              </span>{" "}
              pending balance receivables
            </p>
          </div>

          {/* Active Lab Jobs Metric */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden group">
            <div className="absolute right-0 top-0 translate-x-3 -translate-y-3 w-20 h-20 rounded-full bg-amber-500/10 transition-transform group-hover:scale-125" />
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                Lab & Workshop
              </span>
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                <Wrench className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">
              {metrics.activeLabJobsCount || 0}
            </h3>
            <p className="text-[11px] text-slate-500 mt-1 font-medium flex items-center gap-1">
              <span className="text-cyan-600 font-bold">
                {metrics.readyForPickupCount || 0}
              </span>{" "}
              spectacles ready for customer pickup
            </p>
          </div>

          {/* Total Orders Metric */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden group">
            <div className="absolute right-0 top-0 translate-x-3 -translate-y-3 w-20 h-20 rounded-full bg-blue-500/10 transition-transform group-hover:scale-125" />
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                Total Orders
              </span>
              <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                <ShoppingCart className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">
              {metrics.totalOrders || 0}
            </h3>
            <p className="text-[11px] text-slate-500 mt-1 font-medium">
              Across clinical & retail POS transactions
            </p>
          </div>

          {/* Low Stock Warning Metric */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden group">
            <div className="absolute right-0 top-0 translate-x-3 -translate-y-3 w-20 h-20 rounded-full bg-rose-500/10 transition-transform group-hover:scale-125" />
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                Inventory Alerts
              </span>
              <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">
              {metrics.lowStockCount || 0}
            </h3>
            <p className="text-[11px] text-slate-500 mt-1 font-medium">
              Items at or below minimum threshold
            </p>
          </div>
        </div>

        {/* Quick Operational Actions Bar */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-cyan-950 p-4 rounded-2xl shadow-md text-white flex flex-wrap items-center justify-between gap-4">
          <div>
            <h4 className="font-bold text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" /> Optical Fast-Actions
            </h4>
            <p className="text-xs text-slate-300">
              Immediate shortcuts to daily clinic and counter workflows
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
              <span>Manage Inventory</span>
            </Link>
          </div>
        </div>

        {/* Dual Column: Workshop Glazing Tracker & Recent Orders */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Active Workshop Glazing Jobs */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <Wrench className="w-4 h-4 text-amber-600" />
                <h3 className="font-bold text-slate-800 text-sm">
                  Active Glazing & Workshop Pipeline
                </h3>
              </div>
              <Link
                href="/lab-jobs"
                className="text-xs font-semibold text-cyan-600 hover:text-cyan-800 inline-flex items-center gap-1"
              >
                <span>View All Jobs</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {loading ? (
              <div className="h-40 flex items-center justify-center text-slate-400 text-xs">
                Loading workshop queue...
              </div>
            ) : data?.activeLabJobs?.length === 0 ? (
              <div className="h-40 flex flex-col items-center justify-center text-slate-400 text-xs">
                <CheckCircle2 className="w-6 h-6 mb-1 text-emerald-500 opacity-60" />
                <p>Workshop is clear. All prescription jobs are completed!</p>
              </div>
            ) : (
              <div className="space-y-3 flex-1">
                {data?.activeLabJobs?.map((job: any) => (
                  <div
                    key={job.id}
                    className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-900 font-mono">
                        {job.jobNo}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800">
                        {job.status.replace("_", " ")}
                      </span>
                    </div>

                    <div className="text-xs">
                      <p className="font-semibold text-slate-800">
                        Patient: {job.order?.customer?.name || "Customer Job"}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate">
                        Frame: {job.frameDetails || "Customer Frame"}
                      </p>
                      <p className="text-[10px] text-slate-600 font-mono bg-white p-1 rounded border border-slate-200 mt-1 truncate">
                        {job.lensDetails || "Glazing specifications"}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                      <span>Tech: {job.technicianName || "Lab Glazier"}</span>
                      {job.dueDate && (
                        <span className="font-semibold text-cyan-700">
                          Due: {formatDate(job.dueDate)}
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
                  Recent Sales & Invoices
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
                          {order.orderNumber}
                        </span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            order.paymentStatus === "PAID"
                              ? "bg-emerald-100 text-emerald-800"
                              : order.paymentStatus === "PARTIAL"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {order.paymentStatus}
                        </span>
                      </div>
                      <p className="text-slate-600 text-xs truncate mt-0.5">
                        {order.customer ? order.customer.name : "Walk-in Guest"} •{" "}
                        {order.items?.length || 0} items
                      </p>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-slate-900 text-xs">
                        {formatCurrency(order.totalAmount)}
                      </p>
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="text-[10px] text-cyan-600 hover:text-cyan-800 font-semibold underline mt-0.5"
                      >
                        Receipt
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Lower Row: Category Sales Distribution & Today's Appointments */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sales Breakdown by Category */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <h3 className="font-bold text-slate-800 text-sm mb-4">
              Sales by Eyewear Category
            </h3>
            <div className="space-y-3 text-xs">
              {[
                { label: "Designer Frames", key: "FRAME", color: "bg-cyan-500" },
                { label: "Ophthalmic Lenses", key: "LENS", color: "bg-blue-600" },
                { label: "Contact Lenses", key: "CONTACT_LENS", color: "bg-indigo-500" },
                { label: "Accessories & Solution", key: "ACCESSORY", color: "bg-slate-500" },
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

          {/* Today's Clinical Schedule */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs lg:col-span-2 flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-slate-800 text-sm">
                  Optometry Clinical Appointments
                </h3>
              </div>
              <Link
                href="/appointments"
                className="text-xs font-semibold text-cyan-600 hover:text-cyan-800 inline-flex items-center gap-1"
              >
                <span>View Schedule</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="space-y-2 flex-1">
              {data?.todayAppointments?.length === 0 ? (
                <p className="text-slate-400 text-xs py-6 text-center">
                  No appointments scheduled.
                </p>
              ) : (
                data?.todayAppointments?.map((apt: any) => (
                  <div
                    key={apt.id}
                    className="p-3 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">
                          {apt.customer?.name}
                        </span>
                        <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                          {apt.type.replace("_", " ")}
                        </span>
                      </div>
                      <p className="text-slate-500 text-[11px] mt-0.5">
                        Optometrist: {apt.optometrist?.name || "General Eye Care"} •{" "}
                        {apt.notes || "Checkup"}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="px-2 py-1 rounded bg-white border border-slate-200 font-bold text-slate-800 text-[11px]">
                        {apt.appointmentTime}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Printable Receipt Modal if an order is clicked */}
      {selectedOrder && (
        <ReceiptModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}
    </div>
  );
}
