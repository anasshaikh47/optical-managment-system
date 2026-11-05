"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Glasses,
  ShoppingCart,
  Award,
  AlertTriangle,
  CreditCard,
  Printer,
  Plus,
  MessageSquare,
  Clock,
  Sparkles,
  CheckCircle2,
  FileText,
  Eye,
} from "lucide-react";
import { ReceiptModal } from "@/components/ReceiptModal";
import { PrescriptionModal } from "@/components/PrescriptionModal";
import { formatDate, formatDateTime, formatCurrency, formatDiopter } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

export default function CustomerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: customerId } = use(params);
  const { shopId, tenantFetch } = useAuth();

  const [customer, setCustomer] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState<any | null>(null);
  const [isNewRxOpen, setIsNewRxOpen] = useState(false);

  useEffect(() => {
    fetchCustomerProfile();
  }, [customerId, shopId]);

  const fetchCustomerProfile = async () => {
    setLoading(true);
    try {
      const res = await tenantFetch(`/api/customers/${customerId}`);
      const json = await res.json();
      if (json.success) {
        setCustomer(json.data);
      } else {
        setError(json.error || "Failed to load customer profile");
      }
    } catch (e: any) {
      setError(e.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col h-full bg-slate-100 items-center justify-center text-slate-400 text-xs">
        Loading patient CRM profile...
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="flex-1 flex flex-col h-full bg-slate-100 p-6">
        <div className="p-8 text-center text-rose-600 bg-white rounded-2xl border border-rose-200 mt-4 space-y-3">
          <AlertTriangle className="w-8 h-8 mx-auto" />
          <p className="font-bold">{error || "Patient not found."}</p>
          <Link
            href="/customers"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs"
          >
            <ArrowLeft className="w-4 h-4" /> Return to Patients Directory
          </Link>
        </div>
      </div>
    );
  }

  const prescriptions = customer.prescriptions || [];
  const orders = customer.orders || [];

  const lifetimeSpend = orders
    .filter((o: any) => o.status !== "CANCELLED")
    .reduce((sum: number, o: any) => sum + (o.final_payable || 0), 0);

  const pendingBalance = orders
    .filter((o: any) => o.status !== "CANCELLED")
    .reduce((sum: number, o: any) => sum + (o.balance_amount || 0), 0);

  const latestRx = prescriptions[0];

  // Calculate 1-Year Checkup reminder status
  let checkupDueNotice = null;
  if (latestRx) {
    const rxDate = new Date(latestRx.createdAt);
    const now = new Date();
    const diffMonths = Math.floor(
      (now.getTime() - rxDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
    );

    if (diffMonths >= 12) {
      checkupDueNotice = {
        isOverdue: true,
        title: "Annual Comprehensive Eye Examination Overdue",
        message: `Patient's last refraction was ${formatDate(latestRx.createdAt)} (${diffMonths} months ago). An annual vision test is recommended.`,
        months: diffMonths,
      };
    } else if (diffMonths >= 10) {
      checkupDueNotice = {
        isOverdue: false,
        title: "Annual Eye Examination Due in 1-2 Months",
        message: `Patient's last refraction was ${formatDate(latestRx.createdAt)} (${diffMonths} months ago).`,
        months: diffMonths,
      };
    }
  }

  const handleSendCheckupReminder = () => {
    if (!customer.phone) return;
    let cleanPhone = customer.phone.replace(/[^0-9]/g, "");
    if (cleanPhone.length === 10) cleanPhone = "91" + cleanPhone;

    const message = `👓 *VISIONPULSE EYEWEAR STUDIO*
*Annual Eye Examination Reminder*

Namaste *${customer.name}*,
Regular optical checkups ensure your eyes stay healthy and your prescription is up to date!

📅 *Your Last Checkup*: ${latestRx ? formatDate(latestRx.createdAt) : "Over 1 year ago"}
👁️ *Doctor Recommendation*: Annual refractive checkup every 12 months.

We invite you to visit VisionPulse Eyewear Studio for a complimentary digital vision screening:
📍 *Location*: Galleria Arcade, Powai, Mumbai - 400076
📞 *Book Appointment*: +91 98201 12345 / care@visionpulse.in`;

    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, "_blank");
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-100">
      <div className="flex-1 flex flex-col overflow-y-auto p-3 sm:p-4 md:p-6 space-y-4">
        {/* Navigation & Action Bar */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/customers"
            className="font-bold text-slate-500 hover:text-cyan-700 flex items-center gap-1.5 text-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Patients Directory</span>
          </Link>

          <div className="flex items-center gap-2">
            {customer.phone && (
              <a
                href={`tel:${customer.phone}`}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
              >
                <Phone className="w-3.5 h-3.5 text-slate-500" />
                <span>Call Patient</span>
              </a>
            )}

            <button
              onClick={() => setIsNewRxOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border border-cyan-200 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Refraction Test</span>
            </button>

            <Link
              href="/pos"
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-700 text-white shadow-xs transition-colors"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>Create POS Bill</span>
            </Link>
          </div>
        </div>

        {/* Patient Profile Card & Lifetime KPIs */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 text-cyan-400 flex items-center justify-center font-bold text-lg shadow-xs">
                {customer.name.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black text-slate-900">{customer.name}</h3>
                  <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-bold inline-flex items-center gap-1">
                    <Award className="w-3 h-3" /> {customer.loyalty_points || 0} Loyalty Pts
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1 font-mono">
                  <span className="flex items-center gap-1 text-slate-700 font-semibold">
                    <Phone className="w-3 h-3 text-slate-400" /> {customer.phone}
                  </span>
                  {customer.email && (
                    <span className="flex items-center gap-1">
                      <Mail className="w-3 h-3 text-slate-400" /> {customer.email}
                    </span>
                  )}
                  {customer.dob && (
                    <span className="flex items-center gap-1 font-sans">
                      <Calendar className="w-3 h-3 text-slate-400" /> DOB: {formatDate(customer.dob)}
                    </span>
                  )}
                  {customer.address && (
                    <span className="flex items-center gap-1 font-sans">
                      <MapPin className="w-3 h-3 text-slate-400" /> {customer.address}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* KPI Summary Cards Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] font-bold uppercase text-slate-500 block">
                Lifetime Spend
              </span>
              <p className="text-base font-black text-slate-900 mt-0.5">
                {formatCurrency(lifetimeSpend)}
              </p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] font-bold uppercase text-slate-500 block">
                Total Orders / Visits
              </span>
              <p className="text-base font-black text-cyan-800 mt-0.5">
                {orders.length} Visits
              </p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] font-bold uppercase text-slate-500 block">
                Outstanding Balance Due
              </span>
              <p
                className={`text-base font-black mt-0.5 ${
                  pendingBalance > 0 ? "text-rose-600" : "text-emerald-600"
                }`}
              >
                {formatCurrency(pendingBalance)}
              </p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] font-bold uppercase text-slate-500 block">
                Last Refraction Test
              </span>
              <p className="text-xs font-bold text-slate-800 mt-1">
                {latestRx ? formatDate(latestRx.createdAt) : "No Test on Record"}
              </p>
            </div>
          </div>
        </div>

        {/* 1-Year Eye Checkup Reminder Banner / Callout */}
        {checkupDueNotice && (
          <div
            className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
              checkupDueNotice.isOverdue
                ? "bg-rose-50 border-rose-200 text-rose-900"
                : "bg-amber-50 border-amber-200 text-amber-900"
            }`}
          >
            <div className="flex items-start gap-2.5">
              <Clock
                className={`w-5 h-5 shrink-0 mt-0.5 ${
                  checkupDueNotice.isOverdue ? "text-rose-600" : "text-amber-600"
                }`}
              />
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wider">
                  {checkupDueNotice.title}
                </h4>
                <p className="text-xs mt-0.5">{checkupDueNotice.message}</p>
              </div>
            </div>

            <button
              onClick={handleSendCheckupReminder}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors cursor-pointer shrink-0"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Send WhatsApp Test Reminder</span>
            </button>
          </div>
        )}

        {/* Section 1: Complete Prescription Refraction History */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Glasses className="w-4 h-4 text-cyan-600" />
              Complete Eye Prescription History ({prescriptions.length})
            </h4>
            <button
              onClick={() => setIsNewRxOpen(true)}
              className="text-[11px] font-bold text-cyan-700 hover:underline"
            >
              + Add New Rx
            </button>
          </div>

          <div className="p-5 space-y-4">
            {prescriptions.length === 0 ? (
              <p className="text-center py-8 text-slate-400 text-xs italic">
                No optical prescriptions recorded for this patient yet.
              </p>
            ) : (
              prescriptions.map((rx: any, idx: number) => (
                <div
                  key={rx.id || idx}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-xs">
                        Checkup on {formatDateTime(rx.createdAt)}
                      </span>
                      <span className="text-[10px] bg-cyan-100 text-cyan-800 font-bold px-2 py-0.5 rounded uppercase">
                        {(rx.lens_type || "Single Vision").replace("_", " ")}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 font-semibold">
                      Optometrist: {rx.optometristName || "Dr. Staff"}
                    </span>
                  </div>

                  {/* Refraction Matrix Table */}
                  <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
                    <table className="w-full min-w-[500px] text-center text-xs font-mono border-collapse">
                      <thead className="bg-slate-100 text-slate-700 uppercase font-sans font-bold text-[10px]">
                        <tr>
                          <th className="p-1.5 text-left pl-3">Eye</th>
                          <th className="p-1.5">SPH</th>
                          <th className="p-1.5">CYL</th>
                          <th className="p-1.5">AXIS</th>
                          <th className="p-1.5">ADD</th>
                          <th className="p-1.5">PD (Dist)</th>
                          <th className="p-1.5">PD (Near)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        <tr>
                          <td className="p-1.5 text-left pl-3 font-sans font-bold text-cyan-800">
                            OD (Right)
                          </td>
                          <td className="p-1.5 font-bold">{formatDiopter(rx.od_sph)}</td>
                          <td className="p-1.5">{formatDiopter(rx.od_cyl)}</td>
                          <td className="p-1.5">{rx.od_axis !== null ? `${rx.od_axis}°` : "—"}</td>
                          <td className="p-1.5 text-cyan-700 font-bold">
                            {rx.od_add ? `+${rx.od_add.toFixed(2)}` : "—"}
                          </td>
                          <td className="p-1.5">{rx.pd_distance || "—"} mm</td>
                          <td className="p-1.5">{rx.pd_near || "—"} mm</td>
                        </tr>
                        <tr>
                          <td className="p-1.5 text-left pl-3 font-sans font-bold text-blue-800">
                            OS (Left)
                          </td>
                          <td className="p-1.5 font-bold">{formatDiopter(rx.os_sph)}</td>
                          <td className="p-1.5">{formatDiopter(rx.os_cyl)}</td>
                          <td className="p-1.5">{rx.os_axis !== null ? `${rx.os_axis}°` : "—"}</td>
                          <td className="p-1.5 text-cyan-700 font-bold">
                            {rx.os_add ? `+${rx.os_add.toFixed(2)}` : "—"}
                          </td>
                          <td className="p-1.5">{rx.pd_distance || "—"} mm</td>
                          <td className="p-1.5">{rx.pd_near || "—"} mm</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {rx.notes && (
                    <p className="text-[11px] text-slate-600 bg-white p-2 rounded-lg border border-slate-200">
                      <strong>Clinical Notes:</strong> {rx.notes}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Section 2: Past Purchase Invoices & Orders */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <ShoppingCart className="w-4 h-4 text-cyan-600" />
              Past Purchase Orders & GST Invoices ({orders.length})
            </h4>
            <span className="text-xs font-bold text-slate-700">
              Total Spend: {formatCurrency(lifetimeSpend)}
            </span>
          </div>

          <div className="overflow-x-auto w-full">
            <table className="w-full min-w-[750px] text-xs text-left border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px] font-bold">
                <tr>
                  <th className="p-3">Bill / Order #</th>
                  <th className="p-3">Items Purchased</th>
                  <th className="p-3">Order Date</th>
                  <th className="p-3 text-right">Net Payable</th>
                  <th className="p-3 text-right">Amount Paid</th>
                  <th className="p-3 text-right">Balance Due</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400 italic">
                      No orders placed by this patient yet.
                    </td>
                  </tr>
                ) : (
                  orders.map((ord: any) => (
                    <tr key={ord.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 font-mono font-bold text-cyan-800">
                        <Link href={`/orders/${ord.id}`} className="hover:underline">
                          {ord.bill_no}
                        </Link>
                      </td>

                      <td className="p-3 font-semibold text-slate-800">
                        {ord.items
                          ?.map(
                            (i: any) =>
                              `${i.quantity}x ${i.item?.brand} ${i.item?.model || i.item?.type}`
                          )
                          .join(", ")}
                      </td>

                      <td className="p-3 text-slate-500">{formatDate(ord.createdAt)}</td>

                      <td className="p-3 text-right font-black text-slate-900">
                        {formatCurrency(ord.final_payable)}
                      </td>

                      <td className="p-3 text-right font-semibold text-emerald-600">
                        {formatCurrency(ord.paid_amount)}
                      </td>

                      <td className="p-3 text-right font-bold">
                        {ord.balance_amount > 0 ? (
                          <span className="text-rose-600">
                            {formatCurrency(ord.balance_amount)}
                          </span>
                        ) : (
                          <span className="text-emerald-600 font-bold">Paid Full</span>
                        )}
                      </td>

                      <td className="p-3 text-center">
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {ord.status.replace("_", " ")}
                        </span>
                      </td>

                      <td className="p-3 text-center">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => setSelectedReceiptOrder(ord)}
                            className="p-1 rounded text-slate-500 hover:text-cyan-700 hover:bg-slate-100"
                            title="Print GST Invoice"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          <Link
                            href={`/orders/${ord.id}`}
                            className="p-1 rounded text-slate-500 hover:text-cyan-700 hover:bg-slate-100"
                            title="View Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Printable GST Tax Invoice Modal */}
      {selectedReceiptOrder && (
        <ReceiptModal
          order={selectedReceiptOrder}
          onClose={() => setSelectedReceiptOrder(null)}
        />
      )}

      {/* Add New Prescription Modal */}
      <PrescriptionModal
        isOpen={isNewRxOpen}
        onClose={() => setIsNewRxOpen(false)}
        preselectedCustomerId={customerId}
        onSuccess={() => fetchCustomerProfile()}
      />
    </div>
  );
}
