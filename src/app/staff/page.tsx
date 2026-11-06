"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  Store,
  ShieldCheck,
  UserPlus,
  Phone,
  Mail,
  Lock,
  X,
  Loader2,
  CheckCircle2,
  Terminal,
  ShieldAlert,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function StaffPage() {
  const router = useRouter();
  const { user, isStaff, isOwner, loading: authLoading, userDisplayName, userEmail } = useAuth();

  const [staffList, setStaffList] = useState<any[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  // New staff form state
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<"STAFF" | "OWNER">("STAFF");
  const [newPhone, setNewPhone] = useState("");
  const [newTerminal, setNewTerminal] = useState("Terminal #02 (Secondary POS)");
  const [formError, setFormError] = useState<string | null>(null);

  // Route protection: If a Staff tries to open restricted routes, cleanly redirect to /pos
  useEffect(() => {
    if (!authLoading && isStaff) {
      router.replace("/pos");
    }
  }, [isStaff, authLoading, router]);

  // Fetch staff list from database
  const fetchStaff = async () => {
    setLoadingStaff(true);
    try {
      const res = await fetch("/api/staff");
      const json = await res.json();
      if (json.success && Array.isArray(json.staff)) {
        setStaffList(json.staff);
      }
    } catch (e) {
      console.error("Failed to fetch staff:", e);
    } finally {
      setLoadingStaff(false);
    }
  };

  useEffect(() => {
    if (!isStaff) {
      fetchStaff();
    }
  }, [isStaff]);

  // Handle adding new staff account
  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!newName || !newEmail || !newPassword) {
      setFormError("Name, email, and password are required.");
      return;
    }

    if (newPassword.length < 6) {
      setFormError("Password must be at least 6 characters.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName,
          email: newEmail,
          password: newPassword,
          role: newRole,
          phone: newPhone,
          terminal: newTerminal,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setFormError(json.error || "Failed to create staff account.");
      } else {
        setFeedbackToast(
          `${newRole === "OWNER" ? "Owner" : "Staff"} account "${newName}" created successfully!`
        );
        setIsAddModalOpen(false);
        setNewName("");
        setNewEmail("");
        setNewPassword("");
        setNewPhone("");
        await fetchStaff();
        setTimeout(() => setFeedbackToast(null), 4000);
      }
    } catch (err: any) {
      setFormError(err.message || "An unexpected error occurred.");
    } finally {
      setSaving(false);
    }
  };

  if (isStaff) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-slate-400 text-xs">
        <Loader2 className="w-5 h-5 animate-spin mb-2" />
        <span>Redirecting staff to POS Terminal...</span>
      </div>
    );
  }

  const branches = [
    {
      id: "br-01",
      name: "Powai Flagship (Main Studio)",
      location: "Shop 4 & 5, Galleria Arcade, Hiranandani Gardens, Powai, Mumbai - 400076",
      phone: "+91 98201 12345",
      activeTerminals: 2,
      status: "PRIMARY LIVE",
    },
    {
      id: "br-02",
      name: "Andheri West Optical Clinic",
      location: "Shop 12, Crystal Point Mall, Link Road, Andheri West, Mumbai - 400053",
      phone: "+91 98202 88990",
      activeTerminals: 1,
      status: "SYNCED",
    },
  ];

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-slate-50 p-4 sm:p-6 pb-28 md:pb-6 space-y-6">
      {/* Toast Feedback */}
      {feedbackToast && (
        <div className="fixed top-20 right-4 sm:right-6 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold shadow-xl border border-slate-800 animate-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{feedbackToast}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">
            Staff &amp; Branches Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Role-based terminal access: Owner full financial control vs Staff POS &amp; clinical permissions
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition-colors shadow-xs cursor-pointer active:scale-95 shrink-0"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>+ Add Staff Member</span>
        </button>
      </div>

      {/* Role-Based Access Control Summary Banner */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center shrink-0 border border-slate-200">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-xs sm:text-sm">
              Role-Based Access Control Active
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              <strong>Owner:</strong> Full revenue, profit margins, cost price &amp; store settings.
              <br />
              <strong>Staff:</strong> Fast Counter Billing (POS), Patient Registration, Lens Refraction &amp; Stock Count. Cost prices and revenues are strictly hidden.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-900 text-white border border-slate-800">
            OWNER: Active
          </span>
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
            STAFF: Restricted
          </span>
        </div>
      </div>

      {/* Connected Branches Grid */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
          <Store className="w-4 h-4 text-slate-600" />
          <span>Connected Store Branches &amp; Terminals</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {branches.map((br) => (
            <div
              key={br.id}
              className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-slate-900 text-sm">{br.name}</h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {br.status}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mb-2">{br.location}</p>
                <p className="text-xs font-mono text-slate-600 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{br.phone}</span>
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                <span>Active Billing Counters: <strong>{br.activeTerminals}</strong></span>
                <span className="text-slate-900 font-semibold cursor-pointer hover:underline">
                  Manage Terminals
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Staff Directory Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-700" />
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
              Staff Accounts &amp; Permissions
            </h3>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            {staffList.length} Registered Accounts
          </span>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full min-w-[700px] text-xs text-left">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-100">
              <tr>
                <th className="p-3.5">User</th>
                <th className="p-3.5">Role</th>
                <th className="p-3.5">Assigned Terminal</th>
                <th className="p-3.5">Contact Details</th>
                <th className="p-3.5">Permissions</th>
                <th className="p-3.5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loadingStaff ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400 text-xs">
                    <Loader2 className="w-4 h-4 animate-spin mx-auto mb-2 text-slate-400" />
                    <span>Loading staff directory...</span>
                  </td>
                </tr>
              ) : staffList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400 text-xs">
                    No staff accounts registered yet. Click &quot;+ Add Staff Member&quot; to add counter terminals.
                  </td>
                </tr>
              ) : (
                staffList.map((staff) => {
                  const isStaffOwner = staff.role === "OWNER";
                  return (
                    <tr key={staff.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                            isStaffOwner ? "bg-slate-900 text-white" : "bg-slate-200 text-slate-800"
                          }`}>
                            {(staff.name || "U").charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{staff.name || "User"}</p>
                            <p className="text-[10px] text-slate-400 font-mono">
                              ID: {staff.id?.slice(0, 8)}...
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                            isStaffOwner
                              ? "bg-slate-900 text-white"
                              : "bg-slate-100 text-slate-800 border border-slate-200"
                          }`}
                        >
                          {staff.role}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-700 font-medium">
                        {isStaffOwner ? "Terminal #01 (Active Counter)" : "Terminal #02 (Secondary POS)"}
                      </td>
                      <td className="p-3.5">
                        <p className="font-mono text-slate-800 text-[11px]">{staff.email}</p>
                      </td>
                      <td className="p-3.5 text-slate-600 text-[11px]">
                        {isStaffOwner ? (
                          <span className="font-medium text-slate-900">
                            Full Admin, Financial Revenue, Profit Margins, Cost &amp; Settings
                          </span>
                        ) : (
                          <span className="text-slate-600">
                            POS Counter Billing, Customer Registration, Refraction, Stock Count (Costs &amp; Revenue Hidden)
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-center">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span>ACTIVE</span>
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add New Staff Member */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Add Staff Account</h3>
                  <p className="text-[11px] text-slate-500">Create login credentials for billing &amp; optometry staff</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleAddStaff} className="space-y-3.5 mt-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sunil Joshi"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Staff Email (Login ID)
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="staff@visionpulse.in"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Login Password (Min 6 characters)
                </label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Role Assignment
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewRole("STAFF")}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer text-left ${
                      newRole === "STAFF"
                        ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    <div className="font-bold">STAFF</div>
                    <div className="text-[10px] opacity-80">POS &amp; Rx (Costs Hidden)</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewRole("OWNER")}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer text-left ${
                      newRole === "OWNER"
                        ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    <div className="font-bold">OWNER</div>
                    <div className="text-[10px] opacity-80">Full Financial Access</div>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Assigned Terminal
                </label>
                <div className="relative">
                  <Terminal className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={newTerminal}
                    onChange={(e) => setNewTerminal(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition-all flex items-center gap-1.5 shadow-xs disabled:opacity-60 cursor-pointer"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    <span>Save Staff Account</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
