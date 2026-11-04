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
      if (json.success) {
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
    const matchesSearch =
      q === "" ||
      c.name.toLowerCase().includes(q) ||
      (c.phone && c.phone.includes(q)) ||
      (c.email && c.email.toLowerCase().includes(q));

    const latestRx = c.prescriptions?.[0];
    const checkup = getCheckupStatus(latestRx);
    const matchesCheckupDue = !filterCheckupDue || checkup.isDue;

    return matchesSearch && matchesCheckupDue;
  });

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-100">
      <div className="flex-1 flex flex-col overflow-hidden p-3 sm:p-4 md:p-6 space-y-4">
        {/* Controls Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, phone (+91), or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap w-full md:w-auto justify-between sm:justify-end">
            <button
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
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+ Add Customer</span>
            </button>
          </div>
        </div>

        {/* Patients Table */}
        <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
          <div className="flex-1 overflow-auto w-full">
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
                {loading ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400">
                      Loading patient database...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400">
                      No patients match your search.
                    </td>
                  </tr>
                ) : (
                  filtered.map((c) => {
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
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <NewCustomerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => fetchCustomers()}
      />
    </div>
  );
}
