"use client";

import { useState } from "react";
import { Users, Store, Shield, CheckCircle2, UserPlus, Phone, Mail, Award, Clock } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function StaffPage() {
  const { userDisplayName, userEmail } = useAuth();

  const staffMembers = [
    {
      id: "usr-01",
      name: userDisplayName || "Store Owner",
      role: "STORE OWNER",
      pin: "****",
      phone: "+91 98201 12345",
      email: userEmail || "owner@visionpulse.in",
      terminal: "Terminal #01 (Active Counter)",
      status: "ONLINE",
      permissions: "Full Administrative & Financial Access",
    },
    {
      id: "usr-02",
      name: "Sunil Joshi",
      role: "OPTOMETRIST / REFRACTIONIST",
      pin: "****",
      phone: "+91 98202 23456",
      email: "sunil.optom@myopticsshop.com",
      terminal: "Clinical Consultation Room #1",
      status: "ACTIVE",
      permissions: "Eye Exam, Prescription Refraction, Lens Recommendations",
    },
    {
      id: "usr-03",
      name: "Pooja Verma",
      role: "SALES & BILLING EXECUTIVE",
      pin: "****",
      phone: "+91 98203 34567",
      email: "pooja.sales@myopticsshop.com",
      terminal: "Terminal #02 (Secondary POS)",
      status: "STANDBY",
      permissions: "POS Billing, Frame Fitting, Order Tracking",
    },
  ];

  const branches = [
    {
      id: "br-01",
      name: "My Optics Shop - Powai Flagship (Main)",
      location: "Shop 4 & 5, Galleria Arcade, Hiranandani Gardens, Powai, Mumbai - 400076",
      phone: "+91 98201 12345",
      activeTerminals: 2,
      status: "PRIMARY LIVE",
    },
    {
      id: "br-02",
      name: "My Optics Shop - Andheri West Clinic",
      location: "Shop 12, Crystal Point Mall, Link Road, Andheri West, Mumbai - 400053",
      phone: "+91 98202 88990",
      activeTerminals: 1,
      status: "SYNCED",
    },
  ];

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-slate-50 p-6 space-y-6">
      {/* Page Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">
            Staff & Branches Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage multi-terminal staff access, optometry permissions, and branch store counters
          </p>
        </div>
        <button
          onClick={() => alert("Staff management: Role-based PIN authorization active.")}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition-colors shadow-xs"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Add Staff Member</span>
        </button>
      </div>

      {/* Active Branches Grid */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
          <Store className="w-4 h-4 text-blue-600" />
          <span>Connected Store Branches & Counters</span>
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
                <span className="text-blue-600 font-semibold cursor-pointer hover:underline">
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
              Staff Members & Terminal Roles
            </h3>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            {staffMembers.length} Active Staff Accounts
          </span>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full min-w-[700px] text-xs text-left">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-100">
              <tr>
                <th className="p-3.5">Staff Name</th>
                <th className="p-3.5">Role</th>
                <th className="p-3.5">Assigned Terminal</th>
                <th className="p-3.5">Contact Details</th>
                <th className="p-3.5">Permissions</th>
                <th className="p-3.5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {staffMembers.map((staff) => (
                <tr key={staff.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
                        {staff.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{staff.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono">ID: {staff.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-3.5">
                    <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-bold text-[10px]">
                      {staff.role}
                    </span>
                  </td>
                  <td className="p-3.5 text-slate-700 font-medium">{staff.terminal}</td>
                  <td className="p-3.5">
                    <p className="font-mono text-slate-800">{staff.phone}</p>
                    <p className="text-[10px] text-slate-400">{staff.email}</p>
                  </td>
                  <td className="p-3.5 text-slate-600 text-[11px] max-w-xs truncate">
                    {staff.permissions}
                  </td>
                  <td className="p-3.5 text-center">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span>{staff.status}</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
