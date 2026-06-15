"use client";

import React, { useState, useEffect } from "react";
import PageHeader from "../../Components/PageHeader";
import { PAGE_CONTAINER_CLASS, PRIMARY_ACTION_BTN_CLASS } from "../../lib/pageLayout";
import { useDashboard } from "../DashboardContext";
import { API_URL } from "../../config/api.config";
import { getAuthHeaders } from "../../lib/auth";
import { ROLE_LABELS } from "../../lib/permissions";
import KPICard from "../../Components/KPICard";

interface EmployeeStats {
  assignedLeads: number;
  dealsClosed: number;
  conversionRate: number;
  revenueGenerated: number;
}

interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  isActive: boolean;
  performanceTag: string | null;
  stats: EmployeeStats;
  createdAt: string;
}

const ROLE_OPTIONS = [
  "SALES_EXECUTIVE",
  "SALES_MANAGER",
  "ADMIN",
  "FINANCIAL_EXECUTIVE",
  "VIEWER",
];

const ROLE_LABEL = ROLE_LABELS;

const AVATAR_COLORS = [
  "bg-[#EF4444]", "bg-[#3B82F6]", "bg-[#8B5CF6]",
  "bg-[#10B981]", "bg-[#F59E0B]", "bg-[#EC4899]",
];

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function getAvatarColor(name: string) {
  const idx = name.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

function formatRevenue(amount: number) {
  if (!amount) return "₹0";
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`;
  if (amount >= 100000) return `₹${Math.round(amount / 100000)}L`;
  if (amount >= 1000) return `₹${Math.round(amount / 1000)}K`;
  return `₹${amount}`;
}

const PHONE_REGEX = /^[6-9]\d{9}$/;

function sanitizePhone(value: string) {
  return value.replace(/\D/g, "").slice(0, 10);
}

function getPhoneError(phone: string) {
  if (!phone.trim()) return null;
  if (!PHONE_REGEX.test(phone.trim())) {
    return "Enter a valid 10-digit mobile number starting with 6, 7, 8, or 9";
  }
  return null;
}

export default function EmployeePage() {
  const { searchQuery, addToast } = useDashboard();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [roleFilter, setRoleFilter] = useState("All roles");
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);

  // Add modal
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("SALES_EXECUTIVE");
  const [saving, setSaving] = useState(false);

  // Delete confirm
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      let url = `${API_URL}/v1/users?page=${currentPage}&limit=10`;
      if (roleFilter !== "All roles") url += `&role=${roleFilter}`;
      const res = await fetch(url, { headers: getAuthHeaders() });
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        const mapped = (json.data || []).map((u: Record<string, unknown>) => ({
          id: u._id as string,
          name: u.name as string,
          email: u.email as string,
          phone: (u.phone as string) || "—",
          role: u.role as string,
          isActive: u.isActive !== false,
          performanceTag: (u.performanceTag as string | null) || null,
          stats: {
            assignedLeads: (u.stats as EmployeeStats)?.assignedLeads ?? 0,
            dealsClosed: (u.stats as EmployeeStats)?.dealsClosed ?? 0,
            conversionRate: (u.stats as EmployeeStats)?.conversionRate ?? 0,
            revenueGenerated: (u.stats as EmployeeStats)?.revenueGenerated ?? 0,
          },
          createdAt: u.createdAt
            ? new Date(u.createdAt as string).toLocaleDateString("en-IN")
            : "—",
        }));
        setEmployees(mapped);
        setTotalPages(json.pagination?.totalPages || 1);
      } else {
        addToast(json.message || "Failed to load employees", "info");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error connecting to server";
      addToast(message, "info");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [currentPage, roleFilter]);

  const filteredEmployees = searchQuery
    ? employees.filter(
        (e) =>
          e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          e.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          e.phone.includes(searchQuery)
      )
    : employees;

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim() || !newPassword.trim()) {
      addToast("Please fill all required fields", "info");
      return;
    }
    const phoneValidationError = getPhoneError(newPhone);
    if (phoneValidationError) {
      setPhoneError(phoneValidationError);
      addToast(phoneValidationError, "info");
      return;
    }
    setSaving(true);
    try {
      const body: Record<string, string> = {
        name: newName.trim(),
        email: newEmail.trim(),
        password: newPassword,
        role: newRole,
      };
      if (newPhone.trim()) body.phone = newPhone.trim();

      const res = await fetch(`${API_URL}/v1/users`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (json.success) {
        addToast(`Employee "${newName}" added successfully!`, "success");
        setIsAddOpen(false);
        setNewName(""); setNewEmail(""); setNewPhone(""); setPhoneError(null); setNewPassword(""); setNewRole("SALES_EXECUTIVE");
        fetchEmployees();
      } else {
        addToast(json.message || "Failed to add employee", "info");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error adding employee";
      addToast(message, "info");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/v1/users/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      const json = await res.json();
      if (json.success) {
        addToast("Employee deleted successfully", "success");
        fetchEmployees();
      } else {
        addToast(json.message || "Failed to delete", "info");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error deleting employee";
      addToast(message, "info");
    }
    setDeleteId(null);
    setActiveMenu(null);
  };

  return (
    <div className={`${PAGE_CONTAINER_CLASS} pb-10`}>
      <PageHeader
        title="Employees"
        subtitle="Manage your CRM team members"
        actions={
          <button onClick={() => setIsAddOpen(true)} className={PRIMARY_ACTION_BTN_CLASS}>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add Employee
          </button>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard title="Total Staff" value={employees.length} subtext="All team members" accentColor="#1e293b" />
        <KPICard title="Sales Executives" value={employees.filter(e => e.role === "SALES_EXECUTIVE").length} subtext="Field sales team" accentColor="#FBBF24" />
        <KPICard title="Managers" value={employees.filter(e => e.role === "SALES_MANAGER").length} subtext="Team leads" accentColor="#3B82F6" />
        <KPICard title="Admins" value={employees.filter(e => e.role === "ADMIN" || e.role === "SUPER_ADMIN").length} subtext="System administrators" accentColor="#22C55E" />
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-3xl p-3 shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center gap-3">
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg className="h-[17px] w-[17px] text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            readOnly
            value={searchQuery}
            className="w-full pl-10 pr-4 py-3 bg-[#F4F4F5] border-none rounded-2xl text-[14px] text-slate-800 focus:outline-none placeholder:text-slate-500 font-medium"
            placeholder="Search employees..."
          />
        </div>
        <div className="flex flex-wrap md:flex-nowrap items-center gap-3">
          <div className="relative flex-1 md:flex-none">
            <button
              onClick={() => setShowRoleDropdown(!showRoleDropdown)}
              className="w-full md:w-auto bg-[#F4F4F5] hover:bg-slate-200 transition-colors text-slate-800 font-bold px-4 py-3 rounded-2xl text-[13.5px] flex items-center justify-between gap-2 min-w-[150px]"
            >
              {roleFilter}
              <svg className={`w-4 h-4 text-slate-500 transition-transform ${showRoleDropdown ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showRoleDropdown && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowRoleDropdown(false)} />
                <div className="absolute right-0 mt-2 w-52 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 p-2 text-[13.5px] font-medium">
                  {["All roles", ...ROLE_OPTIONS].map((r) => (
                    <button
                      key={r}
                      onClick={() => { setRoleFilter(r); setShowRoleDropdown(false); setCurrentPage(1); }}
                      className="w-full text-left px-3.5 py-2 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-slate-900 cursor-pointer"
                    >
                      {r === "All roles" ? "All roles" : ROLE_LABEL[r] || r}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          <button
            onClick={() => { setRoleFilter("All roles"); addToast("Filters reset", "info"); }}
            className="w-full md:w-auto bg-[#FEF2F2] hover:bg-[#FEE2E2] text-[#EF4444] font-bold px-5 py-3 rounded-2xl text-[13.5px] flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <svg className="w-[17px] h-[17px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filter
          </button>
        </div>
      </div>

      {/* Employee Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {loading ? (
          <div className="col-span-full py-20 flex flex-col items-center gap-3 text-slate-400 font-semibold">
            <span className="w-8 h-8 rounded-full border-[3px] border-slate-200 border-t-[#EB3539] animate-spin" />
            Loading employees...
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div className="col-span-full bg-white rounded-3xl border border-slate-100 shadow-sm p-12 text-center text-slate-400 font-medium">
            No employees found.
          </div>
        ) : (
          filteredEmployees.map((emp) => (
            <div key={emp.id} className="bg-white rounded-3xl border-2 border-[#3B82F6]/30 shadow-sm p-5 md:p-6 flex flex-col gap-4 hover:shadow-md transition-shadow relative">

              {/* Top Row */}
              <div className="flex justify-between items-start">
                <div className="flex gap-4 flex-1 min-w-0">
                  <div className={`${getAvatarColor(emp.name)} w-[52px] h-[52px] flex-shrink-0 rounded-xl flex items-center justify-center text-white font-bold text-[18px] shadow-sm`}>
                    {getInitials(emp.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-[16px] font-bold text-slate-900 truncate">{emp.name}</h3>
                    <p className="text-slate-500 text-[13px] font-medium mt-0.5">
                      {ROLE_LABEL[emp.role] || emp.role}
                    </p>
                    <div className="space-y-1 mt-2">
                      <div className="flex items-center gap-2 text-slate-600 text-[13px] font-medium">
                        <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                        <span className="truncate">{emp.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600 text-[13px] font-medium">
                        <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                        <span>{emp.phone}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2 flex-shrink-0 ml-2">
                  <div className="flex flex-wrap justify-end gap-1.5">
                    <span className={`text-[11.5px] font-bold px-3 py-1 rounded-md ${emp.isActive ? "bg-[#DCFCE7] text-[#16A34A]" : "bg-slate-100 text-slate-500"}`}>
                      {emp.isActive ? "Active" : "Inactive"}
                    </span>
                    {emp.performanceTag && (
                      <span className="bg-[#EDE9FE] text-[#7C3AED] text-[11.5px] font-bold px-3 py-1 rounded-md">
                        {emp.performanceTag}
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <button
                      onClick={() => setActiveMenu(activeMenu === emp.id ? null : emp.id)}
                      className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                      </svg>
                    </button>
                    {activeMenu === emp.id && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setActiveMenu(null)} />
                        <div className="absolute right-0 mt-1 w-44 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 p-2 text-[13px] font-semibold">
                          <button
                            onClick={() => { setDeleteId(emp.id); setActiveMenu(null); }}
                            className="w-full text-left px-3.5 py-2.5 rounded-xl hover:bg-rose-50 text-rose-600 flex items-center gap-2 cursor-pointer"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-100">
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Assigned leads</p>
                  <p className="text-[22px] font-bold text-slate-900 mt-0.5">{emp.stats.assignedLeads}</p>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Deals closed</p>
                  <p className="text-[22px] font-bold text-slate-900 mt-0.5">{emp.stats.dealsClosed}</p>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Conversion rate</p>
                  <p className="text-[22px] font-bold text-slate-900 mt-0.5">{emp.stats.conversionRate}%</p>
                </div>
              </div>

              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#EB3539] rounded-full transition-all"
                  style={{ width: `${Math.min(emp.stats.conversionRate, 100)}%` }}
                />
              </div>

              {/* Revenue & Join Date */}
              <div className="flex items-center justify-between text-[13px] font-medium text-slate-600">
                <div>
                  <span className="text-slate-400 font-bold text-[11px] uppercase tracking-wide">Revenue generated</span>
                  <p className="text-[15px] font-bold text-slate-900 mt-0.5">{formatRevenue(emp.stats.revenueGenerated)}</p>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 font-bold text-[11px] uppercase tracking-wide">Join date</span>
                  <p className="text-[15px] font-bold text-slate-900 mt-0.5">{emp.createdAt}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2.5 pt-1">
                <button
                  onClick={() => addToast(`Viewing details for ${emp.name}`, "info")}
                  className="flex-1 bg-[#16A34A] hover:bg-[#15803d] text-white text-[13px] font-bold px-4 py-2.5 rounded-xl transition-colors cursor-pointer shadow-sm"
                >
                  View Details
                </button>
                <button
                  onClick={() => addToast(`${emp.stats.assignedLeads} leads assigned to ${emp.name}`, "info")}
                  className="flex-1 bg-[#4C1D95] hover:bg-[#3b0764] text-white text-[13px] font-bold px-4 py-2.5 rounded-xl transition-colors cursor-pointer shadow-sm"
                >
                  Assigned Leads
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-1 flex-wrap py-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-slate-500 transition-all ${currentPage === 1 ? "opacity-40 cursor-not-allowed" : "hover:bg-slate-100 cursor-pointer"}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setCurrentPage(p)}
              className={`w-9 h-9 rounded-xl font-bold transition-all cursor-pointer ${currentPage === p ? "bg-[#EB3539] text-white shadow-md" : "text-slate-600 hover:bg-slate-100"}`}
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-slate-500 transition-all ${currentPage === totalPages ? "opacity-40 cursor-not-allowed" : "hover:bg-slate-100 cursor-pointer"}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      )}

      {/* Add Employee Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-[28px] w-full max-w-md border border-slate-100 shadow-2xl p-6 md:p-8">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 mb-5">
              <h2 className="text-xl font-bold text-slate-900">Add New Employee</h2>
              <button onClick={() => setIsAddOpen(false)} className="p-1.5 rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 cursor-pointer">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleAddEmployee} className="space-y-4 text-[13.5px]">
              <div>
                <label className="block text-slate-600 font-bold mb-1.5">Full Name *</label>
                <input type="text" required placeholder="e.g. Rahul Sharma" value={newName} onChange={(e) => setNewName(e.target.value)}
                  className="w-full border border-slate-200 rounded-2xl px-4 py-3 bg-white focus:ring-2 focus:ring-red-200 outline-none placeholder:text-slate-400 font-medium" />
              </div>
              <div>
                <label className="block text-slate-600 font-bold mb-1.5">Email Address *</label>
                <input type="email" required placeholder="e.g. rahul@company.com" value={newEmail} onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full border border-slate-200 rounded-2xl px-4 py-3 bg-white focus:ring-2 focus:ring-red-200 outline-none placeholder:text-slate-400 font-medium" />
              </div>
              <div>
                <label className="block text-slate-600 font-bold mb-1.5">Phone</label>
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="e.g. 9665452226"
                  value={newPhone}
                  onChange={(e) => {
                    const cleaned = sanitizePhone(e.target.value);
                    setNewPhone(cleaned);
                    setPhoneError(cleaned ? getPhoneError(cleaned) : null);
                  }}
                  className={`w-full border rounded-2xl px-4 py-3 bg-white focus:ring-2 outline-none placeholder:text-slate-400 font-medium ${
                    phoneError ? "border-rose-300 focus:ring-rose-200" : "border-slate-200 focus:ring-red-200"
                  }`}
                />
                <p className={`mt-1.5 text-[12px] font-medium ${phoneError ? "text-rose-500" : "text-slate-400"}`}>
                  {phoneError || "10-digit Indian mobile number (optional)"}
                </p>
              </div>
              <div>
                <label className="block text-slate-600 font-bold mb-1.5">Password *</label>
                <input type="password" required placeholder="Min. 6 characters" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full border border-slate-200 rounded-2xl px-4 py-3 bg-white focus:ring-2 focus:ring-red-200 outline-none placeholder:text-slate-400 font-medium" />
              </div>
              <div>
                <label className="block text-slate-600 font-bold mb-1.5">Role</label>
                <select value={newRole} onChange={(e) => setNewRole(e.target.value)}
                  className="w-full border border-slate-200 rounded-2xl px-4 py-3 bg-white focus:ring-2 focus:ring-red-200 outline-none font-semibold text-slate-700">
                  {ROLE_OPTIONS.map((r) => (
                    <option key={r} value={r}>{ROLE_LABEL[r] || r}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-4 justify-end">
                <button type="button" onClick={() => setIsAddOpen(false)}
                  className="px-5 py-2.5 rounded-2xl text-slate-500 hover:bg-slate-100 font-bold cursor-pointer">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="px-6 py-2.5 rounded-2xl bg-[#EB3539] hover:bg-[#d42d31] text-white font-bold shadow-md shadow-red-200 cursor-pointer disabled:opacity-70">
                  {saving ? "Saving..." : "Add Employee"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-[28px] w-full max-w-sm border border-slate-100 shadow-2xl p-6 text-center">
            <div className="w-14 h-14 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h3 className="text-[17px] font-bold text-slate-900 mb-1">Delete Employee?</h3>
            <p className="text-slate-500 text-[13.5px] font-medium mb-6">This action cannot be undone.</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setDeleteId(null)}
                className="px-5 py-2.5 rounded-2xl text-slate-500 hover:bg-slate-100 font-bold cursor-pointer text-[14px]">
                Cancel
              </button>
              <button onClick={() => handleDelete(deleteId)}
                className="px-6 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold cursor-pointer text-[14px]">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
