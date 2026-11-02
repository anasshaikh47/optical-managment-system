"use client";

import { useState, useEffect } from "react";
import {
  FileText,
  Search,
  Printer,
  IndianRupee,
  CheckCircle2,
  AlertCircle,
  Eye,
  Filter,
  Check,
  CreditCard,
  X,
} from "lucide-react";
import { Header } from "@/components/Header";
import { ReceiptModal } from "@/components/ReceiptModal";
import { formatDate, formatCurrency } from "@/lib/utils";

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState<any | null>(null);

  // Balance Payment Modal
  const [balanceModalOrder, setBalanceModalOrder] = useState<any | null>(null);
  const [payAmount, setPayAmount] = useState<string>("");
  const [payMethod, setPayMethod] = useState("UPI");
  const [transactionRef, setTransactionRef] = useState("");
  const [paySubmitting, setPaySubmitting] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/orders");
      const json = await res.json();
      if (json.success) {
        setOrders(json.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCollectPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!balanceModalOrder) return;

    setPaySubmitting(true);
    try {
      const res = await fetch(`/api/orders/${balanceModalOrder.id}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parseFloat(payAmount),
          method: payMethod,
          transaction_ref: transactionRef,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setBalanceModalOrder(null);
        fetchOrders();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setPaySubmitting(false);
    }
  };

  const filtered = orders.filter((o) => {
    const matchesStatus =
      statusFilter === "ALL" || o.status === statusFilter;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      o.bill_no.toLowerCase().includes(q) ||
      (o.customer?.name && o.customer.name.toLowerCase().includes(q)) ||
      (o.customer?.phone && o.customer.phone.includes(q));
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-100">
      <Header
        title="Orders & GST Tax Invoices"
        subtitle="Spectacle Job Orders, Lens Processing & Payment Ledger"
      />

      <div className="flex-1 flex flex-col overflow-hidden p-6 space-y-4">
        {/* Search & Filters */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Bill No (VP-), patient name, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap text-xs">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-semibold"
            >
              <option value="ALL">All Order Statuses</option>
              <option value="PLACED">Placed</option>
              <option value="LENS_PROCESSING">Lens Processing</option>
              <option value="FITTING">Fitting</option>
              <option value="READY_FOR_PICKUP">Ready for Pickup</option>
              <option value="DELIVERED">Delivered</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Orders Table */}
        <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
          <div className="flex-1 overflow-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px] font-bold sticky top-0 z-10">
                <tr>
                  <th className="p-3.5">Bill / Order #</th>
                  <th className="p-3.5">Patient Details</th>
                  <th className="p-3.5">Items Ordered</th>
                  <th className="p-3.5">Date</th>
                  <th className="p-3.5 text-right">Net Payable</th>
                  <th className="p-3.5 text-right">Paid</th>
                  <th className="p-3.5 text-right">Balance Due</th>
                  <th className="p-3.5 text-center">Tracking Status</th>
                  <th className="p-3.5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-400">
                      Loading orders...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-400">
                      No orders found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((ord) => (
                    <tr key={ord.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5 font-bold font-mono text-slate-900 text-xs">
                        {ord.bill_no}
                      </td>

                      <td className="p-3.5">
                        <p className="font-semibold text-slate-800">
                          {ord.customer?.name}
                        </p>
                        <p className="text-[10px] text-slate-500 font-mono">{ord.customer?.phone}</p>
                      </td>

                      <td className="p-3.5 text-slate-600">
                        <p className="text-xs truncate max-w-xs font-medium text-slate-800">
                          {ord.items?.map((i: any) => `${i.quantity}x ${i.item?.brand} ${i.item?.model || i.item?.type}`).join(", ")}
                        </p>
                        {ord.prescription && (
                          <span className="text-[10px] text-cyan-700 bg-cyan-50 px-1.5 py-0.2 rounded font-semibold mt-0.5 inline-block">
                            Rx specs attached
                          </span>
                        )}
                      </td>

                      <td className="p-3.5 text-slate-500">
                        {formatDate(ord.createdAt)}
                      </td>

                      <td className="p-3.5 text-right font-bold text-slate-900">
                        {formatCurrency(ord.final_payable)}
                      </td>

                      <td className="p-3.5 text-right font-semibold text-emerald-600">
                        {formatCurrency(ord.paid_amount)}
                      </td>

                      <td className="p-3.5 text-right font-bold text-rose-600">
                        {ord.balance_amount > 0 ? formatCurrency(ord.balance_amount) : "—"}
                      </td>

                      <td className="p-3.5 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            ord.status === "DELIVERED"
                              ? "bg-emerald-100 text-emerald-800"
                              : ord.status === "READY_FOR_PICKUP"
                              ? "bg-cyan-100 text-cyan-800"
                              : ord.status === "FITTING" || ord.status === "LENS_PROCESSING"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {ord.status.replace("_", " ")}
                        </span>
                      </td>

                      <td className="p-3.5 text-center">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => setSelectedReceiptOrder(ord)}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-cyan-700 hover:bg-slate-100 transition-colors"
                            title="Print Slip / Receipt"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          {ord.balance_amount > 0 && (
                            <button
                              onClick={() => {
                                setBalanceModalOrder(ord);
                                setPayAmount(ord.balance_amount.toString());
                              }}
                              className="px-2 py-1 rounded bg-amber-500 hover:bg-amber-600 text-white font-bold text-[10px] transition-colors"
                            >
                              Collect Balance
                            </button>
                          )}
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

      {/* Collect Balance Modal */}
      {balanceModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-4 border border-slate-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Collect Remaining Balance</h3>
              <button
                onClick={() => setBalanceModalOrder(null)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Invoice #{balanceModalOrder.bill_no} for{" "}
              <strong>{balanceModalOrder.customer?.name}</strong>.
            </p>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
              <div className="flex justify-between">
                <span>Net Payable:</span>
                <span className="font-semibold">{formatCurrency(balanceModalOrder.final_payable)}</span>
              </div>
              <div className="flex justify-between text-emerald-700">
                <span>Advance Paid:</span>
                <span className="font-semibold">{formatCurrency(balanceModalOrder.paid_amount)}</span>
              </div>
              <div className="flex justify-between text-rose-700 font-bold text-sm pt-1 border-t border-slate-200">
                <span>Balance Due:</span>
                <span>{formatCurrency(balanceModalOrder.balance_amount)}</span>
              </div>
            </div>

            <form onSubmit={handleCollectPayment} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Payment Amount (₹)
                </label>
                <input
                  type="number"
                  step="1"
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Payment Method
                </label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-semibold"
                >
                  <option value="UPI">UPI (Google Pay / PhonePe / Paytm)</option>
                  <option value="CARD">Credit / Debit Card</option>
                  <option value="CASH">Cash Counter</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Transaction Reference
                </label>
                <input
                  type="text"
                  placeholder="UPI Ref ID / Card Txn Code"
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setBalanceModalOrder(null)}
                  className="px-3 py-1.5 rounded-lg text-slate-600 bg-slate-100 hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={paySubmitting}
                  className="px-4 py-1.5 rounded-lg text-white font-bold bg-cyan-600 hover:bg-cyan-700 shadow-sm"
                >
                  {paySubmitting ? "Saving..." : "Record Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedReceiptOrder && (
        <ReceiptModal
          order={selectedReceiptOrder}
          onClose={() => setSelectedReceiptOrder(null)}
        />
      )}
    </div>
  );
}
