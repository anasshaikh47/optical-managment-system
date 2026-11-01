"use client";

import { useState, useEffect } from "react";
import {
  Users,
  Search,
  UserPlus,
  Phone,
  Mail,
  Calendar,
  Glasses,
  ShoppingCart,
  ChevronRight,
  Clock,
  MapPin,
  X,
} from "lucide-react";
import { Header } from "@/components/Header";
import { NewCustomerModal } from "@/components/NewCustomerModal";
import { formatDate, formatCurrency, formatDiopter } from "@/lib/utils";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [customerDetail, setCustomerDetail] = useState<any | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/customers");
      const json = await res.json();
      if (json.success) {
        setCustomers(json.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCustomer = async (id: string) => {
    setSelectedCustomerId(id);
    setLoadingDetail(true);
    try {
      const res = await fetch(`/api/customers/${id}`);
      const json = await res.json();
      if (json.success) {
        setCustomerDetail(json.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingDetail(false);
    }
  };

  const filtered = customers.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.customerCode.toLowerCase().includes(q) ||
      (c.phone && c.phone.includes(q)) ||
      (c.email && c.email.toLowerCase().includes(q))
    );
  });

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-100">
      <Header
        title="Patients & Customer Accounts"
        subtitle="Clinical History, Prescription Records & Eyewear Purchases"
      >
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>New Patient</span>
        </button>
      </Header>

      <div className="flex-1 flex overflow-hidden p-6 gap-6">
        {/* Left List: Patients Roster */}
        <div className="flex-1 flex flex-col min-w-0 space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name, phone, code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="text-xs text-slate-500 font-medium">
              Total: <strong className="text-slate-800">{filtered.length}</strong> patients
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2.5">
            {loading ? (
              <div className="flex items-center justify-center h-48 text-slate-400 text-xs">
                Loading customer records...
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-slate-400 text-xs bg-white rounded-2xl border border-dashed border-slate-200">
                <Users className="w-8 h-8 mb-2 opacity-40" />
                <p>No customer records found.</p>
              </div>
            ) : (
              filtered.map((c) => {
                const isSelected = selectedCustomerId === c.id;
                return (
                  <div
                    key={c.id}
                    onClick={() => handleSelectCustomer(c.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-4 text-xs ${
                      isSelected
                        ? "bg-blue-50/70 border-blue-400 shadow-xs"
                        : "bg-white border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm shrink-0">
                        {c.name[0]}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-900 text-sm truncate">
                            {c.name}
                          </h4>
                          <span className="font-mono text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded font-semibold">
                            {c.customerCode}
                          </span>
                        </div>
                        <p className="text-slate-500 text-xs flex items-center gap-3 mt-1">
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" /> {c.phone}
                          </span>
                          {c.email && (
                            <span className="flex items-center gap-1 truncate">
                              <Mail className="w-3 h-3 text-slate-400" /> {c.email}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-slate-500 shrink-0">
                      <div className="text-right hidden sm:block">
                        <p className="font-semibold text-slate-800">
                          {c._count?.prescriptions || 0} Rx on file
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {c._count?.orders || 0} optical purchases
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Drawer / Detail: Comprehensive Patient Clinical Profile */}
        {selectedCustomerId && (
          <div className="w-96 xl:w-[460px] bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden shrink-0">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <span className="font-bold text-slate-800 text-xs uppercase tracking-wide">
                Patient Medical Profile
              </span>
              <button
                onClick={() => setSelectedCustomerId(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {loadingDetail ? (
              <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">
                Loading patient records...
              </div>
            ) : customerDetail ? (
              <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
                {/* Header Profile */}
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {customerDetail.name}
                  </h3>
                  <p className="text-slate-500 text-xs mt-0.5">
                    Code: {customerDetail.customerCode} • {customerDetail.gender || "Patient"} •{" "}
                    {customerDetail.occupation || "General"}
                  </p>
                  {customerDetail.address && (
                    <p className="text-slate-500 text-xs flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                      {customerDetail.address}
                    </p>
                  )}
                  {customerDetail.notes && (
                    <div className="mt-3 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
                      <strong>Clinical Remarks:</strong> {customerDetail.notes}
                    </div>
                  )}
                </div>

                {/* Prescriptions History */}
                <div>
                  <h4 className="font-bold text-slate-800 text-xs uppercase mb-2 flex items-center gap-1.5">
                    <Glasses className="w-3.5 h-3.5 text-cyan-600" /> Refraction Prescriptions (
                    {customerDetail.prescriptions?.length || 0})
                  </h4>

                  <div className="space-y-2.5">
                    {customerDetail.prescriptions?.length === 0 ? (
                      <p className="text-slate-400 italic">No prescriptions recorded yet.</p>
                    ) : (
                      customerDetail.prescriptions?.map((rx: any) => (
                        <div
                          key={rx.id}
                          className="p-3 rounded-xl border border-cyan-200 bg-cyan-50/30 space-y-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900 font-mono">
                              {rx.prescriptionNo}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              {formatDate(rx.examDate)}
                            </span>
                          </div>

                          <div className="font-mono text-[10px] text-slate-800 bg-white p-2 rounded border border-cyan-100 space-y-0.5">
                            <div>
                              OD: {formatDiopter(rx.sphOd)} / {formatDiopter(rx.cylOd)} x {rx.axisOd || "—"}° • ADD: {rx.addOd ? `+${rx.addOd.toFixed(2)}` : "—"}
                            </div>
                            <div>
                              OS: {formatDiopter(rx.sphOs)} / {formatDiopter(rx.cylOs)} x {rx.axisOs || "—"}° • ADD: {rx.addOs ? `+${rx.addOs.toFixed(2)}` : "—"}
                            </div>
                          </div>

                          <div className="flex justify-between text-[10px] text-slate-500 pt-0.5">
                            <span>Lens: <strong>{rx.lensType || "Single Vision"}</strong></span>
                            <span>PD: <strong>{rx.pdTotal || "—"} mm</strong></span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Purchase Orders */}
                <div>
                  <h4 className="font-bold text-slate-800 text-xs uppercase mb-2 flex items-center gap-1.5">
                    <ShoppingCart className="w-3.5 h-3.5 text-blue-600" /> Eyewear Purchases & Invoices (
                    {customerDetail.orders?.length || 0})
                  </h4>

                  <div className="space-y-2">
                    {customerDetail.orders?.length === 0 ? (
                      <p className="text-slate-400 italic">No optical orders yet.</p>
                    ) : (
                      customerDetail.orders?.map((ord: any) => (
                        <div
                          key={ord.id}
                          className="p-2.5 rounded-xl border border-slate-200 bg-white flex items-center justify-between text-xs"
                        >
                          <div>
                            <p className="font-bold text-slate-900 font-mono">
                              {ord.orderNumber}
                            </p>
                            <p className="text-[10px] text-slate-500">
                              {formatDate(ord.createdAt)} • {ord.status}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-slate-900">
                              {formatCurrency(ord.totalAmount)}
                            </span>
                            <p
                              className={`text-[10px] font-semibold ${
                                ord.paymentStatus === "PAID"
                                  ? "text-emerald-600"
                                  : "text-amber-600"
                              }`}
                            >
                              {ord.paymentStatus}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>

      <NewCustomerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => fetchCustomers()}
      />
    </div>
  );
}
