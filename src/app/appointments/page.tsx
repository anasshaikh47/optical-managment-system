"use client";

import { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  Plus,
  User,
  CheckCircle2,
  XCircle,
  Filter,
  Check,
  Stethoscope,
  X,
} from "lucide-react";
import { Header } from "@/components/Header";
import { formatDate } from "@/lib/utils";

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form
  const [customers, setCustomers] = useState<any[]>([]);
  const [optometrists, setOptometrists] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    customerId: "",
    optometristId: "",
    appointmentDate: "",
    appointmentTime: "10:00 AM",
    type: "EYE_EXAM",
    notes: "",
  });

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/appointments");
      const json = await res.json();
      if (json.success) {
        setAppointments(json.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const openNewModal = async () => {
    setFormData((prev) => ({
      ...prev,
      appointmentDate: new Date().toISOString().split("T")[0],
    }));
    setIsModalOpen(true);
    try {
      const [cRes, oRes] = await Promise.all([
        fetch("/api/customers").then((r) => r.json()),
        fetch("/api/optometrists").then((r) => r.json()),
      ]);
      if (cRes.success) setCustomers(cRes.data);
      if (oRes.success) {
        setOptometrists(oRes.data);
        if (oRes.data.length > 0) {
          setFormData((prev) => ({ ...prev, optometristId: oRes.data[0].id }));
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        setIsModalOpen(false);
        fetchAppointments();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.success) {
        fetchAppointments();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filtered = appointments.filter((a) => {
    return statusFilter === "ALL" || a.status === statusFilter;
  });

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-100">
      <Header
        title="Optometry Clinical Appointments"
        subtitle="Eye Exam Bookings, Contact Lens Trials & Consultation Schedule"
      >
        <button
          onClick={openNewModal}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Book Appointment</span>
        </button>
      </Header>

      <div className="flex-1 flex flex-col overflow-hidden p-6 space-y-4">
        {/* Filter Bar */}
        <div className="flex items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex gap-1.5 overflow-x-auto text-xs">
            {["ALL", "SCHEDULED", "CONFIRMED", "COMPLETED", "CANCELLED"].map(
              (st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all ${
                    statusFilter === st
                      ? "bg-slate-900 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {st.replace("_", " ")}
                </button>
              )
            )}
          </div>

          <span className="text-xs text-slate-500 font-medium">
            <strong>{filtered.length}</strong> bookings scheduled
          </span>
        </div>

        {/* Appointments List */}
        <div className="flex-1 overflow-y-auto space-y-3">
          {loading ? (
            <div className="flex items-center justify-center h-48 text-slate-400 text-xs">
              Loading appointments...
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-slate-400 text-xs bg-white rounded-2xl border border-dashed border-slate-200">
              <Calendar className="w-8 h-8 mb-2 opacity-40" />
              <p>No appointments match this filter.</p>
            </div>
          ) : (
            filtered.map((apt) => (
              <div
                key={apt.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-wrap items-center justify-between gap-4 text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                    <Stethoscope className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-900 text-sm">
                        {apt.customer?.name}
                      </h4>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-800">
                        {apt.type.replace("_", " ")}
                      </span>
                    </div>
                    <p className="text-slate-500 text-xs mt-0.5">
                      Doctor:{" "}
                      <strong className="text-slate-700">
                        {apt.optometrist?.name || "General Optometrist"}
                      </strong>
                      {apt.notes && ` • "${apt.notes}"`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-bold text-slate-900 text-xs flex items-center gap-1 justify-end">
                      <Clock className="w-3.5 h-3.5 text-cyan-600" />
                      {apt.appointmentTime}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {formatDate(apt.appointmentDate)}
                    </p>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      apt.status === "COMPLETED"
                        ? "bg-emerald-100 text-emerald-800"
                        : apt.status === "CONFIRMED"
                        ? "bg-cyan-100 text-cyan-800"
                        : apt.status === "CANCELLED"
                        ? "bg-rose-100 text-rose-800"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {apt.status}
                  </span>

                  <div className="flex items-center gap-1">
                    {apt.status !== "COMPLETED" && (
                      <button
                        onClick={() => handleUpdateStatus(apt.id, "COMPLETED")}
                        className="p-1.5 rounded-lg text-emerald-700 hover:bg-emerald-50 transition-colors"
                        title="Mark Completed"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                    )}
                    {apt.status !== "CANCELLED" && (
                      <button
                        onClick={() => handleUpdateStatus(apt.id, "CANCELLED")}
                        className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Cancel Appointment"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Book Appointment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-slate-200 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Book Optometry Visit</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Select Patient *
                </label>
                <select
                  required
                  value={formData.customerId}
                  onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
                >
                  <option value="">-- Choose Patient --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.phone || c.customerCode})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Optometrist / Specialist
                </label>
                <select
                  value={formData.optometristId}
                  onChange={(e) => setFormData({ ...formData, optometristId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
                >
                  {optometrists.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.appointmentDate}
                    onChange={(e) => setFormData({ ...formData, appointmentDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Time *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="10:30 AM"
                    value={formData.appointmentTime}
                    onChange={(e) => setFormData({ ...formData, appointmentTime: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Consultation Purpose
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
                >
                  <option value="EYE_EXAM">Comprehensive Digital Eye Exam</option>
                  <option value="CONTACT_LENS_FITTING">Contact Lens Trial & Fitting</option>
                  <option value="FRAME_SELECTION">Eyewear Styling & Frame Selection</option>
                  <option value="FOLLOW_UP">Prescription Follow-Up Check</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Notes
                </label>
                <input
                  type="text"
                  placeholder="Chief complaint or requirements..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-slate-600 bg-slate-100 hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg text-white font-bold bg-blue-600 hover:bg-blue-700 shadow-sm"
                >
                  Confirm Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
