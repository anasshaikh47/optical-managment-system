"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
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
  Award,
  AlertTriangle,
  CreditCard,
  Eye,
  MessageSquare,
  Sparkles,
  Plus,
  LayoutGrid,
  List,
  ArrowRight,
} from "lucide-react";
import { NewCustomerModal } from "@/components/NewCustomerModal";
import { formatDate, formatCurrency } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

export default function CustomersPage() {
  const { shopId, tenantFetch } = useAuth();
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterCheckupDue, setFilterCheckupDue] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  useEffect(() => {
    fetchCustomers();

    const handleCustomerCreated = () => {
      fetchCustomers();
    };
    window.addEventListener("customer-created", handleCustomerCreated);
    return () => window.removeEventListener("customer-created", handleCustomerCreated);
  }, [shopId]);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await tenantFetch("/api/customers");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setCustomers(json.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Helper to calculate checkup reminder status
  const getCheckupStatus = (latestRx: any) => {
    if (!latestRx) return { isDue: false, label: "No Rx on record", color: "bg-slate-100 text-slate-500" };
    const rxDate = new Date(latestRx.createdAt);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - rxDate.getTime()) / (1000 * 60 * 60 * 24));
    const diffMonths = Math.floor(diffDays / 30);

    if (diffMonths >= 12) {
      return {
        isDue: true,
        label: `⚠️ Annual Test Overdue (${diffMonths} mos)`,
        color: "bg-rose-100 text-rose-800 font-bold",
      };
    } else if (diffMonths >= 10) {
      return {
        isDue: true,
        label: `⚡ Annual Test Due Soon (${diffMonths} mos)`,
        color: "bg-amber-100 text-amber-800 font-bold",
      };
    } else {
      return {
        isDue: false,
        label: `🟢 Checkup Current (${diffMonths} mos ago)`,
        color: "bg-emerald-100 text-emerald-800",
      };
    }
  };

  const filtered = customers.filter((c) => {
    const q = searchQuery.toLowerCase().trim();
    const cleanQueryDigits = q.replace(/[^0-9]/g, "");
    const cleanPhoneDigits = (c.phone || "").replace(/[^0-9]/g, "");

    const matchesSearch =
      q === "" ||
      (c.name && c.name.toLowerCase().includes(q)) ||
      (c.phone && c.phone.toLowerCase().includes(q)) ||
      (cleanQueryDigits.length > 0 && cleanPhoneDigits.includes(cleanQueryDigits)) ||
      (c.email && c.email.toLowerCase().includes(q));

    const latestRx = c.prescriptions?.[0];
    const checkup = getCheckupStatus(latestRx);
    const matchesCheckupDue = !filterCheckupDue || checkup.isDue;

    return matchesSearch && matchesCheckupDue;
  });

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-100">
      <div className="flex-1 flex flex-col overflow-hidden p-3 sm:p-4 md:p-6 pb-24 md:pb-6 space-y-4">
        {/* Controls Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or phone number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 font-medium"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap w-full md:w-auto justify-between sm:justify-end">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === "grid"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
                title="Grid Card View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Cards</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === "table"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
                title="Table View"
              >
                <List className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Table</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setFilterCheckupDue(!filterCheckupDue)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border cursor-pointer ${
                filterCheckupDue
                  ? "bg-amber-50 border-amber-300 text-amber-800"
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>Annual Checkup Due</span>
            </button>

            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-cyan-700 hover:bg-cyan-800 text-white shadow-xs transition-colors cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+ Add Customer</span>
            </button>
          </div>
        </div>

        {/* Directory Content: Grid Cards or Table */}
        {loading ? (
          <div className="flex-1 bg-white rounded-2xl border border-slate-200 p-12 flex flex-col items-center justify-center text-slate-400 text-xs">
            <span className="animate-pulse font-medium">Loading customer directory...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex-1 bg-white rounded-2xl border border-slate-200 p-12 flex flex-col items-center justify-center text-center">
            <div className="flex flex-col items-center justify-center max-w-sm mx-auto space-y-2.5">
              <Users className="w-10 h-10 text-slate-300 stroke-[1.5]" />
              <h4 className="font-extrabold text-slate-800 text-sm">
                {customers.length === 0
                  ? "Customer Directory: 0 Records"
                  : "No customers match your search"}
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                {customers.length === 0
                  ? "No customer records found in store directory. Register your first customer to manage optical prescriptions, visit history, and CRM alerts."
                  : "Try searching by another phone number, customer name, or clear the search input."}
              </p>
              {customers.length === 0 ? (
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add First Customer</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="mt-2 text-xs font-bold text-cyan-700 hover:underline cursor-pointer"
                >
                  Clear Search
                </button>
              )}
            </div>
          </div>
        ) : viewMode === "grid" ? (
          /* ======================================================== */
          /* CARD GRID VIEW                                           */
          /* ======================================================== */
          <div className="flex-1 overflow-y-auto pb-24 md:pb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
              {filtered.map((c) => {
                const ordersList = c.orders || [];
                const lifetimeSpend = ordersList
                  .filter((o: any) => o.status !== "CANCELLED")
                  .reduce((sum: number, o: any) => sum + (o.final_payable || 0), 0);
                const pendingBalance = ordersList
                  .filter((o: any) => o.status !== "CANCELLED")
                  .reduce((sum: number, o: any) => sum + (o.balance_amount || 0), 0);
                const latestRx = c.prescriptions?.[0];
                const checkup = getCheckupStatus(latestRx);

                return (
                  <Link
                    key={c.id}
                    href={`/customers/${c.id}`}
                    className="group bg-white rounded-2xl border border-slate-200 hover:border-cyan-500 hover:shadow-md transition-all active:scale-[0.99] flex flex-col justify-between overflow-hidden cursor-pointer"
                  >
                    <div className="p-4 sm:p-5">
                      {/* Top row: Avatar + Name + Chevron */}
                      <div className="flex items-start justify-between gap-2.5">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 text-cyan-400 flex items-center justify-center font-bold text-sm shrink-0">
                            {c.name ? c.name.substring(0, 2).toUpperCase() : "CU"}
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-extrabold text-slate-900 text-sm sm:text-base leading-tight truncate group-hover:text-cyan-700 transition-colors">
                              {c.name}
                            </h3>
                            <p className="font-mono text-xs text-slate-600 font-semibold flex items-center gap-1 mt-1">
                              <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                              <span>{c.phone || "No Phone"}</span>
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-cyan-600 group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
                      </div>

                      {/* Checkup reminder badge if applicable */}
                      {latestRx && (
                        <div className="mt-3">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full inline-block ${checkup.color}`}>
                            {checkup.label}
                          </span>
                        </div>
                      )}

                      {/* Metrics Row: Visits & Outstanding Balance */}
                      <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100">
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          <span className="text-[10px] font-bold text-slate-500 uppercase block tracking-wider">
                            Total Visits / Bills
                          </span>
                          <span className="text-xs sm:text-sm font-extrabold text-slate-800 mt-0.5 block">
                            {ordersList.length} {ordersList.length === 1 ? "Bill" : "Bills"}
                          </span>
                        </div>

                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          <span className="text-[10px] font-bold text-slate-500 uppercase block tracking-wider">
                            Outstanding Balance
                          </span>
                          {pendingBalance > 0 ? (
                            <span className="text-xs sm:text-sm font-black text-rose-600 mt-0.5 block">
                              {formatCurrency(pendingBalance)}
                            </span>
                          ) : (
                            <span className="text-xs sm:text-sm font-bold text-emerald-600 mt-0.5 block">
                              Settled (₹0)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Bottom row: Lifetime spend & click to view full profile */}
                    <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                      <span className="font-medium">
                        Spend: <strong className="text-slate-800">{formatCurrency(lifetimeSpend)}</strong>
                      </span>
                      <span className="font-bold text-cyan-700 flex items-center gap-1 group-hover:underline">
                        View History & Rx &rarr;
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ) : (
          /* ======================================================== */
          /* TABLE VIEW                                               */
          /* ======================================================== */
          <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
            <div className="flex-1 overflow-auto w-full pb-24 md:pb-0">
              <table className="w-full min-w-[750px] text-xs text-left border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px] font-bold sticky top-0 z-10">
                  <tr>
                    <th className="p-3.5">Patient Details</th>
                    <th className="p-3.5">Contact Information</th>
                    <th className="p-3.5 text-center">Visit Count</th>
                    <th className="p-3.5 text-right">Lifetime Spend</th>
                    <th className="p-3.5 text-right">Pending Balance</th>
                    <th className="p-3.5 text-center">Loyalty Points</th>
                    <th className="p-3.5 text-center">1-Year Checkup Status</th>
                    <th className="p-3.5 text-center">CRM Profile</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((c) => {
                    const ordersList = c.orders || [];
                    const lifetimeSpend = ordersList
                      .filter((o: any) => o.status !== "CANCELLED")
                      .reduce((sum: number, o: any) => sum + (o.final_payable || 0), 0);
                    const pendingBalance = ordersList
                      .filter((o: any) => o.status !== "CANCELLED")
                      .reduce((sum: number, o: any) => sum + (o.balance_amount || 0), 0);
                    const latestRx = c.prescriptions?.[0];
                    const checkup = getCheckupStatus(latestRx);

                    return (
                      <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3.5">
                          <Link
                            href={`/customers/${c.id}`}
                            className="font-bold text-slate-900 text-xs hover:text-cyan-700 hover:underline flex items-center gap-1.5"
                          >
                            <span>{c.name}</span>
                            <ChevronRight className="w-3 h-3 text-slate-400" />
                          </Link>
                          {c.dob && (
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              DOB: {formatDate(c.dob)}
                            </p>
                          )}
                        </td>

                        <td className="p-3.5">
                          <p className="font-mono text-slate-800 flex items-center gap-1 font-semibold">
                            <Phone className="w-3 h-3 text-slate-400" /> {c.phone}
                          </p>
                          {c.email && (
                            <p className="text-[10px] text-slate-500 mt-0.5">{c.email}</p>
                          )}
                        </td>

                        <td className="p-3.5 text-center font-bold text-slate-700">
                          {ordersList.length} visits
                        </td>

                        <td className="p-3.5 text-right font-black text-slate-900">
                          {formatCurrency(lifetimeSpend)}
                        </td>

                        <td className="p-3.5 text-right font-bold">
                          {pendingBalance > 0 ? (
                            <span className="text-rose-600 font-black">
                              {formatCurrency(pendingBalance)}
                            </span>
                          ) : (
                            <span className="text-emerald-600 font-bold text-[10px]">Settled</span>
                          )}
                        </td>

                        <td className="p-3.5 text-center">
                          <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-bold inline-flex items-center gap-0.5">
                            <Award className="w-2.5 h-2.5" /> {c.loyalty_points || 0} pts
                          </span>
                        </td>

                        <td className="p-3.5 text-center">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full ${checkup.color}`}>
                            {checkup.label}
                          </span>
                        </td>

                        <td className="p-3.5 text-center">
                          <Link
                            href={`/customers/${c.id}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border border-cyan-200 transition-colors"
                          >
                            <Eye className="w-3 h-3" />
                            <span>View CRM</span>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <NewCustomerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => { setIsModalOpen(false); fetchCustomers(); }}
      />
    </div>
  );
}
