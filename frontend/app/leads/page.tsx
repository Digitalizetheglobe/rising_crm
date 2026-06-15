"use client";

import React, { useState, useEffect } from "react";
import { API_URL } from "../../config/api.config";
import { getAuthHeaders } from "../../lib/auth";
import { importLeads, exportLeads } from "../../lib/leadService";
import { downloadCrmTemplateExcel } from "../../lib/services/importExportService";
import { useAuth } from "../AuthContext";
import LeadDetailModule from "../../Components/leadDetailModule";
import PageHeader from "../../Components/PageHeader";
import { PAGE_CONTAINER_CLASS, PRIMARY_ACTION_BTN_CLASS } from "../../lib/pageLayout";
import { useDashboard } from "../DashboardContext";
import { DownloadIcon, UploadIcon } from "lucide-react";
import KPICard from "../../Components/KPICard";

// Interfaces
interface Lead {
  id: string;
  name: string;
  source: string;
  phone: string;
  status: "Hot Lead" | "Closed" | "New lead" | string;
  lastContacted: string;
  email?: string;
  budgetRange?: string;
  propertyType?: string;
  preferredLocation?: string;
  assignEmployee?: string;
  notes?: string;
  createdAt?: string;
}

export default function LeadsPage() {
  const { searchQuery, setSearchQuery, addToast } = useDashboard();
  const { user } = useAuth();

  // Filter & Search states
  const [statusFilter, setStatusFilter] = useState("All status");
  const [assignEmployeeFilter, setAssignEmployeeFilter] = useState("All employees");
  const [timeRange, setTimeRange] = useState("Last 30 days");
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showTimeDropdown, setShowTimeDropdown] = useState(false);

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newLeadName, setNewLeadName] = useState("");
  const [newLeadEmail, setNewLeadEmail] = useState("");
  const [newLeadPhone, setNewLeadPhone] = useState("");
  const [newLeadBudget, setNewLeadBudget] = useState("");
  const [newLeadProperty, setNewLeadProperty] = useState("");
  const [newLeadSource, setNewLeadSource] = useState("Google Ads");
  const [newLeadStatus, setNewLeadStatus] = useState<"Hot Lead" | "Closed" | "New lead">("New lead");

  // Detail Modal State
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  // Import/Export loading
  const importInputRef = React.useRef<HTMLInputElement>(null);
  const [importLoading, setImportLoading] = React.useState(false);
  const [exportLoading, setExportLoading] = React.useState(false);

  // Assign & Follow-up Modal State
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);

  const [users, setUsers] = useState<any[]>([]);

  // Fetch users when Assign Modal opens
  useEffect(() => {
    if (isAssignModalOpen && users.length === 0) {
      fetch(`${API_URL}/v1/users`, { headers: getAuthHeaders() })
        .then(res => res.json())
        .then(json => {
          if (json.success) {
            setUsers(json.data || []);
          }
        })
        .catch(() => { });
    }
  }, [isAssignModalOpen]);

  // Follow-up state
  const [followUpDate, setFollowUpDate] = useState("");
  const [followUpTime, setFollowUpTime] = useState("");
  const [followUpNotes, setFollowUpNotes] = useState("");
  const [followUpType, setFollowUpType] = useState("Call");

  // Row Action Dropdown state
  const [activeRowActionId, setActiveRowActionId] = useState<string | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Initial Leads list (starts empty and is populated from backend)
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState({ total: 0, hot: 0, new: 0, closed: 0 });

  const fetchLeads = async () => {
    setLoading(true);
    try {
      let url = `${API_URL}/v1/leads?page=${currentPage}&limit=10`;
      if (searchQuery) {
        url += `&search=${encodeURIComponent(searchQuery)}`;
      }
      if (statusFilter !== "All status") {
        url += `&status=${statusFilter}`;
      }
      const res = await fetch(url, { headers: getAuthHeaders() });
      const json = await res.json();
      if (json.success && json.data) {
        const mapped = (json.data.leads || []).map((l: any) => ({
          id: l._id,
          name: l.name || (l.enquiryId ? l.enquiryId.name : "Unknown"),
          source: l.source || (l.enquiryId ? l.enquiryId.source : "Unknown"),
          phone: l.phone || (l.enquiryId ? l.enquiryId.phone : "Unknown"),
          email: l.email || "Not provided",
          budgetRange: l.budgetRange || "Not specified",
          propertyType: l.propertyType || "Not specified",
          preferredLocation: l.preferredLocation || "Not specified",
          notes: l.notes || "",
          status: l.status,
          createdAt: l.createdAt ? new Date(l.createdAt).toLocaleDateString() : "Unknown",
          lastContacted: l.lastContactedAt ? new Date(l.lastContactedAt).toLocaleDateString() : (l.createdAt ? new Date(l.createdAt).toLocaleDateString() : "Never")
        }));
        setLeads(mapped);
        setTotalPages(json.data.totalPages || 1);
      } else {
        addToast(json.message || "Failed to load leads", "info");
      }
    } catch (err: any) {
      addToast(err.message || "Error connecting to server", "info");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_URL}/v1/leads/stats`, { headers: getAuthHeaders() });
      const json = await res.json();
      if (json.success && json.data) {
        const hotCount = (json.data.byStatus || []).find((s: any) => s._id === "Hot Lead")?.count || 0;
        const newCount = (json.data.byStatus || []).find((s: any) => s._id === "New lead")?.count || 0;
        const closedCount = (json.data.byStatus || []).find((s: any) => s._id === "Closed")?.count || 0;
        setStats({
          total: json.data.total,
          hot: hotCount,
          new: newCount,
          closed: closedCount
        });
      }
    } catch (err) {
      console.error("Failed to load stats", err);
    }
  };

  useEffect(() => {
    fetchLeads();
    fetchStats();
  }, [currentPage, searchQuery, statusFilter]);

  // KPI Computations based on dynamic stats state
  const totalHotLeads = stats.hot;
  const followUpsToday = stats.new;
  const closedThisMonth = stats.closed;

  // Dynamic search and filter logic
  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      (lead.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (lead.source || "").toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "All status" ||
      (lead.status || "").toLowerCase() === statusFilter.toLowerCase();

    const matchesAssignEmployee =
      assignEmployeeFilter === "All employees" ||
      (lead.assignEmployee || "").toLowerCase() === assignEmployeeFilter.toLowerCase();

    return matchesSearch && matchesStatus && matchesAssignEmployee;
  });

  // Action handlers
  const handleDeleteLead = async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/v1/leads/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      const json = await res.json();
      if (json.success) {
        addToast("Lead deleted successfully!", "success");
        fetchLeads();
        fetchStats();
      } else {
        addToast(json.message || "Failed to delete lead", "info");
      }
    } catch (err: any) {
      addToast(err.message || "Error deleting lead", "info");
    }
    setActiveRowActionId(null);
  };

  const handleChangeLeadStatus = async (id: string, newStatus: "Hot Lead" | "Closed" | "New lead") => {
    try {
      let mappedStatus = "NEW";
      if (newStatus === "Hot Lead") mappedStatus = "QUALIFIED";
      if (newStatus === "Closed") mappedStatus = "WON";

      const res = await fetch(`${API_URL}/v1/leads/${id}/status`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({ status: mappedStatus }),
      });
      const json = await res.json();
      if (json.success) {
        addToast(`Lead status updated successfully`, "success");
        fetchLeads();
        fetchStats();
      } else {
        addToast(json.message || "Failed to update status", "info");
      }
    } catch (err: any) {
      addToast(err.message || "Error updating lead status", "info");
    }
    setActiveRowActionId(null);
  };

  const handleAddLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeadName.trim()) {
      addToast("Please enter a lead name", "info");
      return;
    }
    if (!newLeadPhone.trim() || !/^\d{10}$/.test(newLeadPhone)) {
      addToast("Please enter a valid 10-digit phone number", "info");
      return;
    }

    try {
      const payload: any = {
        name: newLeadName.trim(),
        phone: newLeadPhone.trim(),
        source: newLeadSource,
      };
      if (newLeadEmail.trim()) payload.email = newLeadEmail.trim();
      if (newLeadBudget.trim()) payload.budgetRange = newLeadBudget.trim();
      if (newLeadProperty.trim()) payload.propertyType = newLeadProperty.trim();

      const res = await fetch(`${API_URL}/v1/leads`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success) {
        addToast(`Successfully added "${newLeadName}"!`, "success");
        setNewLeadName("");
        setNewLeadEmail("");
        setNewLeadPhone("");
        setNewLeadBudget("");
        setNewLeadProperty("");
        setNewLeadSource("Google Ads");
        setNewLeadStatus("New lead");
        setIsAddModalOpen(false);
        fetchLeads();
        fetchStats();
      } else {
        addToast(json.message || "Failed to add lead", "info");
      }
    } catch (err: any) {
      addToast(err.message || "Error submitting lead", "info");
    }
  };

  const handleExportFile = async () => {
    setExportLoading(true);
    try {
      addToast("Generating leads export report...", "info");
      const blob = await exportLeads();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = `RisingSpaces_Leads_${Date.now()}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      addToast("Leads exported successfully!", "success");
    } catch (e) {
      console.error(e);
      addToast("Failed to export leads", "info");
    } finally {
      setExportLoading(false);
    }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportLoading(true);
    try {
      await importLeads(file);
      addToast("Leads imported successfully!", "success");
      fetchLeads();
    } catch (err: any) {
      addToast(err.message || "Import failed", "info");
    } finally {
      setImportLoading(false);
      if (importInputRef.current) importInputRef.current.value = "";
    }
  };

  const handleDownloadCrmTemplate = async () => {
    try {
      await downloadCrmTemplateExcel();
      addToast("CRM template downloaded!", "success");
    } catch (err: any) {
      addToast(err.message || "Failed to download CRM template", "info");
    }
  };

  return (
    <div className={PAGE_CONTAINER_CLASS}>
      <PageHeader
        title="Leads"
        subtitle="Here's what requires your attention today"
        actions={
          <>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              style={{ display: 'none' }}
              ref={importInputRef}
              onChange={handleImportFile}
            />
            <button
              onClick={() => importInputRef.current?.click()}
              disabled={importLoading}
              className={PRIMARY_ACTION_BTN_CLASS}
            >
              <UploadIcon className="text-white w-4 h-4 mr-2" />
              Import Leads
            </button>
            <button onClick={handleExportFile} disabled={exportLoading} className={PRIMARY_ACTION_BTN_CLASS}>
              <DownloadIcon className="text-white w-4 h-4 mr-2" />
              Export Leads
            </button>
            {user && (user.role === "SUPER_ADMIN" || user.role === "ADMIN" || user.role === "SALES_MANAGER") && (
              <button onClick={handleDownloadCrmTemplate} className={PRIMARY_ACTION_BTN_CLASS}>
                <DownloadIcon className="text-white w-4 h-4 mr-2" />
                Download CRM Template
              </button>
            )}
            <button onClick={() => setIsAddModalOpen(true)} className={PRIMARY_ACTION_BTN_CLASS}>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Add New Lead
            </button>
          </>
        }
      />

      {/* 3 KPI Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KPICard title="Total Hotleads" value={totalHotLeads} trend="+12.5% vs last month" isUp={true} subtext="Qualified leads" accentColor="#EB3539" />
        <KPICard title="Follow-ups today" value={followUpsToday} trend="+3.5% vs last month" isUp={true} subtext="Pending tasks" accentColor="#3b82f6" />
        <KPICard title="Closed this month" value={closedThisMonth} trend="-2.5% need reviews" isUp={false} subtext="Successfully closed" accentColor="#f59e0b" />
      </div>

      {/* Table Filters Panel */}
      <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center gap-4 justify-between">
        <div className="relative flex-1 max-w-md">
          <span className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400">
            <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Search by name or source..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#F3F2F1]/70 text-slate-700 pl-11 pr-4 py-2.5 rounded-2xl text-[14px] border-none outline-none focus:ring-2 focus:ring-brand/20 focus:bg-white transition-all font-semibold"
          />
        </div>

        {/* Dropdown Filters Action Group */}
        <div className="flex flex-wrap items-center gap-3">

          {/* Status Select dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setShowStatusDropdown(!showStatusDropdown);
                setShowTimeDropdown(false);
              }}
              className="bg-[#F3F2F1]/70 text-slate-700 font-medium px-4 py-2.5 rounded-2xl text-[13.5px] flex items-center gap-2 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              {statusFilter}
              <svg className={`w-4.5 h-4.5 text-slate-500 transition-transform ${showStatusDropdown ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
            </button>

            {showStatusDropdown && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowStatusDropdown(false)} />
                <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 p-2 animate-scale-up font-medium text-[13.5px]">
                  {["All status", "Hot Lead", "Closed", "New lead"].map((st) => (
                    <button
                      key={st}
                      onClick={() => {
                        setStatusFilter(st);
                        setShowStatusDropdown(false);
                        addToast(`Filter applied: ${st}`, "info");
                      }}
                      className="w-full text-left px-3.5 py-2 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-slate-900 cursor-pointer"
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Time Range Select dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setShowTimeDropdown(!showTimeDropdown);
                setShowStatusDropdown(false);
              }}
              className="bg-[#F3F2F1]/70 text-slate-700 font-semibold px-4 py-2.5 rounded-2xl text-[13.5px] flex items-center gap-2.5 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <svg className="w-4.5 h-4.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {timeRange}
            </button>

            {showTimeDropdown && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowTimeDropdown(false)} />
                <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 p-2 animate-scale-up font-medium text-[13.5px]">
                  {["Last 7 days", "Last 30 days", "This Month", "This Quarter"].map((tr) => (
                    <button
                      key={tr}
                      onClick={() => {
                        setTimeRange(tr);
                        setShowTimeDropdown(false);
                        addToast(`Period adjusted to ${tr}`, "info");
                      }}
                      className="w-full text-left px-3.5 py-2 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-slate-900 cursor-pointer"
                    >
                      {tr}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Filter CTA Button */}
          <button
            onClick={() => {
              setSearchQuery("");
              setStatusFilter("All status");
              addToast("All filter settings cleared!", "info");
            }}
            className="bg-[#FDF2F2] text-brand font-semibold px-5 py-2.5 rounded-2xl text-[13.5px] flex items-center gap-2 hover:bg-red-100/50 transition-colors cursor-pointer font-sans"
          >
            <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filter
          </button>
        </div>
      </div>

      {/* Dynamic Table Card Grid Container */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-visible">

        {/* Desktop and Tablet table presentation */}
        <div className="hidden sm:block overflow-visible">
          <table className="w-full min-w-[700px] border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="py-4.5 px-6 font-medium text-[14px] text-brand uppercase tracking-wider">Name</th>
                <th className="py-4.5 px-6 font-medium text-[14px] text-brand uppercase tracking-wider">Property interest</th>
                <th className="py-4.5 px-6 font-medium text-[14px] text-brand uppercase tracking-wider">Source</th>
                <th className="py-4.5 px-6 font-medium text-[14px] text-brand uppercase tracking-wider">Assign Employee</th>
                <th className="py-4.5 px-6 font-medium text-[14px] text-brand uppercase tracking-wider">Status</th>
                <th className="py-4.5 px-6 font-medium text-[14px] text-brand uppercase tracking-wider">Last contacted</th>
                <th className="py-4.5 px-6 font-medium text-[14px] text-brand uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold text-[14.5px] text-slate-700">
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-medium">
                    No leads matched your filters.
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => (
                  <tr key={lead.id} className={`hover:bg-slate-50/50 transition-colors group ${activeRowActionId === lead.id ? 'relative z-50' : 'relative z-0'}`}>
                    <td className="py-4 px-6 text-slate-800 font-medium hover:text-brand cursor-pointer" onClick={() => { setSelectedLead(lead); setIsDetailModalOpen(true); }}>{lead.name}</td>
                    <td className="py-4 px-6 text-slate-800 font-medium">{lead.propertyType !== "Not specified" ? lead.propertyType : "-"}</td>
                    <td className="py-4 px-6 text-slate-600">{lead.source !== "Not specified" ? lead.source : "Unknown"}</td>
                    <td className="py-4 px-6">
                      {lead.assignEmployee && lead.assignEmployee !== "Not specified" && lead.assignEmployee !== "-" ? (
                        <span className="text-slate-700 font-medium">{lead.assignEmployee}</span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5  text-[11.5px] font-medium text-slate-400 ">
                          Unassigned
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      {lead.status === "Hot Lead" ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-[12px] font-medium bg-[#FDF2F2] text-[#EB3539] border border-red-200/50 shadow-sm animate-pulse-subtle">
                          Hot Lead
                        </span>
                      ) : lead.status === "Closed" ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-[12px] font-medium bg-[#F0FDF4] text-[#15803d] border border-emerald-200/50 shadow-sm">
                          Closed
                        </span>
                      ) : lead.status === "New lead" ? (
                        <span className="inline-flex items-center px-3 py-1  text-[12px] font-medium   text-blue-600">
                          New lead
                        </span>
                      ) : lead.status ? (
                        <span className="inline-flex items-center px-3 py-1  text-[12px] font-medium  text-green-600 ">
                          {(lead.status as string).replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1  text-[12px] font-medium  text-green-400 ">
                          New
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-slate-500 font-medium">{lead.lastContacted}</td>
                    <td className="py-4 px-6 text-right relative">
                      <button
                        onClick={() => {
                          setActiveRowActionId(activeRowActionId === lead.id ? null : lead.id);
                        }}
                        className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" /></svg>
                      </button>

                      {/* {activeRowActionId === lead.id && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setActiveRowActionId(null)} />
                          <div className="absolute right-6 mt-1 w-48 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 p-2 animate-scale-up font-semibold text-[13px] text-left">

                            <span className="block px-3 py-1 text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1">Details</span>
                            <button
                              onClick={() => { setSelectedLead(lead); setIsDetailModalOpen(true); setActiveRowActionId(null); }}
                              className="w-full text-left px-3 py-1.5 rounded-xl text-blue-600 hover:bg-blue-50 cursor-pointer flex items-center gap-2"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                              View Details
                            </button>

                            <div className="my-1 border-t border-slate-100" />

                          
                            <span className="block px-3 py-1 text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1">Follow Up</span>
                            <button
                              onClick={() => { addToast("Follow-up scheduler opened", "info"); setActiveRowActionId(null); }}
                              className="w-full text-left px-3 py-1.5 rounded-xl text-violet-600 hover:bg-violet-50 cursor-pointer flex items-center gap-2"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                              Schedule Follow-up
                            </button>

                            <div className="my-1 border-t border-slate-100" />

                        
                            <span className="block px-3 py-1 text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1">Convert</span>
                            <button
                              onClick={() => { addToast(`Converting ${lead.name} to client...`, "success"); setActiveRowActionId(null); }}
                              className="w-full text-left px-3 py-1.5 rounded-xl text-emerald-600 hover:bg-emerald-50 cursor-pointer flex items-center gap-2"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                              Convert to Client
                            </button>

                            <div className="my-1 border-t border-slate-100" />

                       
                            <span className="block px-3 py-1 text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1">Update Status</span>
                            <button
                              onClick={() => handleChangeLeadStatus(lead.id, "Hot Lead")}
                              className="w-full text-left px-3 py-1.5 rounded-xl text-[#EB3539] hover:bg-red-50 cursor-pointer flex items-center gap-2"
                            >
                              <span className="w-2 h-2 rounded-full bg-[#EB3539]" /> Hot Lead
                            </button>
                            <button
                              onClick={() => handleChangeLeadStatus(lead.id, "New lead")}
                              className="w-full text-left px-3 py-1.5 rounded-xl text-[#1d4ed8] hover:bg-blue-50 cursor-pointer flex items-center gap-2"
                            >
                              <span className="w-2 h-2 rounded-full bg-[#1d4ed8]" /> New Lead
                            </button>
                            <button
                              onClick={() => handleChangeLeadStatus(lead.id, "Closed")}
                              className="w-full text-left px-3 py-1.5 rounded-xl text-[#15803d] hover:bg-emerald-50 cursor-pointer flex items-center gap-2"
                            >
                              <span className="w-2 h-2 rounded-full bg-[#15803d]" /> Closed
                            </button>

                            <div className="my-1 border-t border-slate-100" />

                            
                            <button
                              onClick={() => handleDeleteLead(lead.id)}
                              className="w-full text-left px-3 py-1.5 rounded-xl text-rose-600 hover:bg-rose-50 cursor-pointer flex items-center gap-2"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                              Delete Lead
                            </button>

                          </div>
                        </>
                      )} */}
                      {activeRowActionId === lead.id && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setActiveRowActionId(null)} />
                          <div className="absolute right-6 mt-1 w-44 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 p-2 animate-scale-up font-semibold text-[13px] text-left">

                            <button
                              onClick={() => { setSelectedLead(lead); setIsDetailModalOpen(true); setActiveRowActionId(null); }}
                              className="w-full text-left px-3 py-1.5 rounded-xl text-blue-600 hover:bg-blue-50 cursor-pointer flex items-center gap-2"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                              View Details
                            </button>

                            <button
                              onClick={() => { setSelectedLead(lead); setIsAssignModalOpen(true); setActiveRowActionId(null); }}
                              className="w-full text-left px-3 py-1.5 rounded-xl text-indigo-600 hover:bg-indigo-50 cursor-pointer flex items-center gap-2"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                              Assign
                            </button>

                            <button
                              onClick={() => { setSelectedLead(lead); setIsFollowUpModalOpen(true); setActiveRowActionId(null); }}
                              className="w-full text-left px-3 py-1.5 rounded-xl text-violet-600 hover:bg-violet-50 cursor-pointer flex items-center gap-2"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                              Follow-up
                            </button>

                            <div className="my-1 border-t border-slate-100" />

                            <select
                              defaultValue=""
                              onChange={async (e) => {
                                const status = e.target.value;
                                if (!status) return;
                                const res = await fetch(`${API_URL}/v1/leads/${lead.id}/status`, {
                                  method: "PATCH", headers: getAuthHeaders(),
                                  body: JSON.stringify({ status }),
                                });
                                const json = await res.json();
                                json.success
                                  ? (addToast(`Moved to ${status.replace(/_/g, " ")}`, "success"), fetchLeads(), fetchStats())
                                  : addToast(json.message || "Invalid transition", "info");
                                setActiveRowActionId(null);
                              }}
                              className="w-full px-3 py-1.5 rounded-xl bg-slate-50 text-slate-600 text-[13px] font-semibold border border-slate-200 cursor-pointer outline-none"
                            >
                              <option value="" disabled>Move Pipeline...</option>
                              <option value="CONTACTED">Contacted</option>
                              <option value="QUALIFIED">Qualified</option>
                              <option value="SITE_VISIT_SCHEDULED">Site Visit Scheduled</option>
                              <option value="SITE_VISIT_COMPLETED">Site Visit Completed</option>
                              <option value="INTERESTED">Interested</option>
                              <option value="NEGOTIATION">Negotiation</option>
                              <option value="BOOKING_IN_PROGRESS">Booking In Progress</option>
                              <option value="BOOKED">Booked</option>
                              <option value="PAYMENT_IN_PROGRESS">Payment In Progress</option>
                            </select>

                            <div className="my-1 border-t border-slate-100" />

                            <button
                              onClick={async () => {
                                if (lead.status !== "BOOKED") { addToast("Lead must be BOOKED to convert", "info"); setActiveRowActionId(null); return; }
                                const res = await fetch(`${API_URL}/v1/leads/${lead.id}/convert`, { method: "POST", headers: getAuthHeaders() });
                                const json = await res.json();
                                json.success
                                  ? (addToast(`${lead.name} converted to Client!`, "success"), fetchLeads(), fetchStats())
                                  : addToast(json.message || "Failed", "info");
                                setActiveRowActionId(null);
                              }}
                              className={`w-full text-left px-3 py-1.5 rounded-xl flex items-center gap-2 ${lead.status === "BOOKED" ? "text-emerald-600 hover:bg-emerald-50 cursor-pointer" : "text-slate-300 cursor-not-allowed"}`}
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                              Convert to Client
                            </button>

                            <div className="my-1 border-t border-slate-100" />

                            <button
                              onClick={() => handleDeleteLead(lead.id)}
                              className="w-full text-left px-3 py-1.5 rounded-xl text-rose-600 hover:bg-rose-50 cursor-pointer flex items-center gap-2"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                              Delete
                            </button>

                          </div>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Only Presentation */}
        <div className="block sm:hidden divide-y divide-slate-100">
          {filteredLeads.length === 0 ? (
            <div className="py-12 text-center text-slate-400 font-medium">
              No leads matched your filters.
            </div>
          ) : (
            filteredLeads.map((lead) => (
              <div key={lead.id} className={`p-4 hover:bg-slate-50/50 transition-colors relative flex flex-col gap-2 font-semibold ${activeRowActionId === lead.id ? 'relative z-50' : 'relative z-0'}`}>
                <div className="flex items-center justify-between">
                  <span className="text-[16px] text-slate-800 font-bold" onClick={() => { setSelectedLead(lead); setIsDetailModalOpen(true); }}>{lead.name}</span>

                  {/* Interactive row trigger */}
                  <div className="relative">
                    <button
                      onClick={() => {
                        setActiveRowActionId(activeRowActionId === lead.id ? null : lead.id);
                      }}
                      className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 cursor-pointer"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" /></svg>
                    </button>

                    {activeRowActionId === lead.id && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setActiveRowActionId(null)} />
                        <div className="absolute right-0 mt-1 w-44 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 p-2 animate-scale-up font-semibold text-[13px] text-left">
                          <span className="block px-3 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Actions</span>
                          <button
                            onClick={() => {
                              setSelectedLead(lead);
                              setIsDetailModalOpen(true);
                              setActiveRowActionId(null);
                            }}
                            className="w-full text-left px-3 py-1.5 rounded-xl text-blue-600 hover:bg-blue-50 cursor-pointer"
                          >
                            View Details
                          </button>
                          <div className="my-1 border-t border-slate-100"></div>
                          <span className="block px-3 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Update Status</span>
                          <button
                            onClick={() => handleChangeLeadStatus(lead.id, "Hot Lead")}
                            className="w-full text-left px-3 py-1.5 rounded-xl text-[#EB3539] hover:bg-red-50 cursor-pointer"
                          >
                            Hot Lead
                          </button>
                          <button
                            onClick={() => handleChangeLeadStatus(lead.id, "New lead")}
                            className="w-full text-left px-3 py-1.5 rounded-xl text-blue-600 hover:bg-blue-50 cursor-pointer"
                          >
                            New Lead
                          </button>
                          <button
                            onClick={() => handleChangeLeadStatus(lead.id, "Closed")}
                            className="w-full text-left px-3 py-1.5 rounded-xl text-emerald-600 hover:bg-emerald-50 cursor-pointer"
                          >
                            Closed
                          </button>
                          <div className="border-t border-slate-100 my-1" />
                          <button
                            onClick={() => handleDeleteLead(lead.id)}
                            className="w-full text-left px-3 py-1.5 rounded-xl text-rose-500 hover:bg-rose-50 flex items-center gap-1.5 cursor-pointer"
                          >
                            Delete Lead
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between text-[13px] mt-1">
                  <span className="text-slate-400">Source: <span className="text-slate-600 font-bold ml-1">{lead.source}</span></span>
                  <span className="text-slate-400">Contacted: <span className="text-slate-500 font-bold ml-1">{lead.lastContacted}</span></span>
                </div>

                <div className="mt-2.5">
                  {lead.status === "Hot Lead" && (
                    <span className="inline-flex items-center px-3 py-0.5 rounded-full text-[11.5px] font-bold bg-[#FDF2F2] text-[#EB3539] border border-red-100">
                      Hot Lead
                    </span>
                  )}
                  {lead.status === "Closed" && (
                    <span className="inline-flex items-center px-3 py-0.5 rounded-full text-[11.5px] font-bold bg-[#F0FDF4] text-[#15803d] border border-emerald-100">
                      Closed
                    </span>
                  )}
                  {lead.status === "New lead" && (
                    <span className="inline-flex items-center px-3 py-0.5 rounded-full text-[11.5px] font-bold bg-[#EFF6FF] text-[#1d4ed8] border border-blue-100">
                      New lead
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add New Lead Modal Overlay */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in font-sans">
          <div className="bg-white rounded-[32px] p-6 w-full max-w-lg border border-slate-100 shadow-2xl animate-scale-up">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <h3 className="text-xl font-semibold text-slate-800 tracking-tight">Add New Lead</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <svg className="w-5.5 h-5.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleAddLead} className="mt-5 space-y-4 font-semibold text-[14px]">
              <div>
                <label className="block text-slate-600 font-bold mb-1.5">Lead Name</label>
                <input
                  type="text"
                  placeholder="Enter full name (e.g. Rahul Sharma)"
                  value={newLeadName}
                  onChange={(e) => setNewLeadName(e.target.value)}
                  className="w-full border border-slate-200 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-brand/20 outline-none text-[14.5px] font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-600 font-bold mb-1.5">Email</label>
                  <input
                    type="email"
                    placeholder="Enter email address"
                    value={newLeadEmail}
                    onChange={(e) => setNewLeadEmail(e.target.value)}
                    className="w-full border border-slate-200 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-brand/20 outline-none text-[14.5px] font-medium"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1.5">Phone</label>
                  <input
                    type="text"
                    placeholder="10-digit number"
                    value={newLeadPhone}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setNewLeadPhone(val);
                    }}
                    className="w-full border border-slate-200 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-brand/20 outline-none text-[14.5px] font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-600 font-bold mb-1.5">Budget</label>
                  <select
                    value={newLeadBudget}
                    onChange={(e) => setNewLeadBudget(e.target.value)}
                    className="w-full border border-slate-200 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-brand/20 outline-none text-[14.5px] font-medium bg-white"
                  >
                    <option value="" disabled>Select budget range</option>
                    <option value="Under 25L">Under 25L</option>
                    <option value="25L-50L">25L-50L</option>
                    <option value="50L-1Cr">50L-1Cr</option>
                    <option value="1Cr-2Cr">1Cr-2Cr</option>
                    <option value="Above 2Cr">Above 2Cr</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1.5">Property Interested</label>
                  <select
                    value={newLeadProperty}
                    onChange={(e) => setNewLeadProperty(e.target.value)}
                    className="w-full border border-slate-200 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-brand/20 outline-none text-[14.5px] font-medium bg-white"
                  >
                    <option value="" disabled>Select property type</option>
                    <option value="1BHK">1BHK</option>
                    <option value="2BHK">2BHK</option>
                    <option value="3BHK">3BHK</option>
                    <option value="4+BHK">4+BHK</option>
                    <option value="Villa">Villa</option>
                    <option value="Banglow">Banglow</option>
                    <option value="Plot">Plot</option>
                    <option value="Residential">Residential</option>
                    <option value="Commercial">Commercial</option>
                    <option value="Apartment">Apartment</option>
                    <option value="Shop">Shop</option>
                    <option value="Office">Office</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1.5">Marketing Source</label>
                <select
                  value={newLeadSource}
                  onChange={(e) => setNewLeadSource(e.target.value)}
                  className="w-full border border-slate-200 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-brand/20 outline-none text-[14.5px] font-semibold"
                >
                  <option value="Google Ads">Google Ads</option>
                  <option value="Facebook">Facebook</option>
                  <option value="Referral">Referral</option>
                  <option value="Walk-In">Walk-In</option>
                  <option value="Website">Website</option>
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1.5">Initial Status</label>
                <div className="grid grid-cols-3 gap-3">
                  {(["New lead", "Hot Lead", "Closed"] as const).map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setNewLeadStatus(status)}
                      className={`py-2.5 px-3 rounded-xl border-2 transition-all font-semibold text-[12.5px] cursor-pointer ${newLeadStatus === status ? "border-brand bg-brand-light text-brand shadow-xs" : "border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50"}`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-3 justify-end">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-5 py-2.5 rounded-2xl text-slate-500 hover:bg-slate-100 font-bold cursor-pointer font-sans"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-2xl bg-brand hover:bg-brand-hover text-white font-bold shadow-md shadow-brand/10 cursor-pointer font-sans"
                >
                  Save Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Modal */}
      {isAssignModalOpen && selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in font-sans">
          <div className="bg-white rounded-[32px] p-6 w-full max-w-sm border border-slate-100 shadow-2xl animate-scale-up">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <h3 className="text-lg font-semibold text-slate-800 tracking-tight">Assign Lead</h3>
              <button
                onClick={() => setIsAssignModalOpen(false)}
                className="p-1 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <svg className="w-5.5 h-5.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mt-5">
              <p className="text-[14px] text-slate-600 mb-4 font-medium">Assign <span className="font-bold text-slate-800">{selectedLead.name}</span> to a team member:</p>

              <select
                className="w-full border border-slate-200 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-brand/20 outline-none text-[14.5px] font-semibold text-slate-700"
                id="assignEmployeeSelect"
                defaultValue=""
              >
                <option value="" disabled>Select Employee...</option>
                {users.map(u => <option key={u._id} value={u._id}>{u.name} ({u.role.replace(/_/g, " ")})</option>)}
              </select>

              <div className="flex gap-3 pt-6 justify-end">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="px-5 py-2.5 rounded-2xl text-slate-500 hover:bg-slate-100 font-bold cursor-pointer font-sans text-[14px]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const select = document.getElementById("assignEmployeeSelect") as HTMLSelectElement;
                    const empId = select.value;
                    if (!empId) { addToast("Please select an employee", "info"); return; }

                    try {
                      const res = await fetch(`${API_URL}/v1/leads/${selectedLead.id}/assign`, {
                        method: "PATCH",
                        headers: getAuthHeaders(),
                        body: JSON.stringify({ assignedTo: empId })
                      });
                      const json = await res.json();
                      if (json.success) {
                        addToast("Lead assigned successfully", "success");
                        setIsAssignModalOpen(false);
                        fetchLeads();
                      } else {
                        addToast(json.message || "Failed to assign lead", "info");
                      }
                    } catch (err: any) {
                      addToast(err.message || "Error assigning lead", "info");
                    }
                  }}
                  className="px-6 py-2.5 rounded-2xl bg-brand hover:bg-brand-hover text-white font-bold shadow-md shadow-brand/10 cursor-pointer font-sans text-[14px]"
                >
                  Assign
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Follow Up Modal */}
      {isFollowUpModalOpen && selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in font-sans">
          <div className="bg-white rounded-[32px] p-6 w-full max-w-md border border-slate-100 shadow-2xl animate-scale-up">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <h3 className="text-xl font-semibold text-slate-800 tracking-tight">Schedule Follow-up</h3>
              <button
                onClick={() => setIsFollowUpModalOpen(false)}
                className="p-1 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <svg className="w-5.5 h-5.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <label className="block text-slate-600 font-bold mb-1.5 text-[14px]">Follow-up Type</label>
                <select
                  value={followUpType}
                  onChange={(e) => setFollowUpType(e.target.value)}
                  className="w-full border border-slate-200 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-brand/20 outline-none text-[14.5px] font-semibold"
                >
                  <option value="Call">Call</option>
                  <option value="Email">Email</option>
                  <option value="Meeting">Meeting</option>
                  <option value="Site Visit">Site Visit</option>
                  <option value="WhatsApp">WhatsApp</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-600 font-bold mb-1.5 text-[14px]">Date</label>
                  <input
                    type="date"
                    value={followUpDate}
                    onChange={(e) => setFollowUpDate(e.target.value)}
                    className="w-full border border-slate-200 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-brand/20 outline-none text-[14.5px] font-medium"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1.5 text-[14px]">Time</label>
                  <input
                    type="time"
                    value={followUpTime}
                    onChange={(e) => setFollowUpTime(e.target.value)}
                    className="w-full border border-slate-200 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-brand/20 outline-none text-[14.5px] font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1.5 text-[14px]">Notes</label>
                <textarea
                  rows={3}
                  value={followUpNotes}
                  onChange={(e) => setFollowUpNotes(e.target.value)}
                  placeholder="Enter details..."
                  className="w-full border border-slate-200 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-brand/20 outline-none text-[14.5px] font-medium resize-none"
                />
              </div>

              <div className="flex gap-3 pt-3 justify-end">
                <button
                  type="button"
                  onClick={() => setIsFollowUpModalOpen(false)}
                  className="px-5 py-2.5 rounded-2xl text-slate-500 hover:bg-slate-100 font-bold cursor-pointer font-sans text-[14px]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (!followUpDate || !followUpTime) { addToast("Please select date and time", "info"); return; }
                    const scheduledAt = new Date(`${followUpDate}T${followUpTime}`).toISOString();

                    try {
                      const res = await fetch(`${API_URL}/v1/followups`, {
                        method: "POST",
                        headers: getAuthHeaders(),
                        body: JSON.stringify({
                          lead: selectedLead.id,
                          type: followUpType,
                          scheduledAt,
                          notes: followUpNotes,
                        })
                      });
                      const json = await res.json();
                      if (json.success) {
                        addToast("Follow-up scheduled!", "success");
                        setIsFollowUpModalOpen(false);
                        setFollowUpDate("");
                        setFollowUpTime("");
                        setFollowUpNotes("");
                      } else {
                        addToast(json.message || "Failed to schedule", "info");
                      }
                    } catch (err: any) {
                      addToast(err.message || "Error scheduling follow-up", "info");
                    }
                  }}
                  className="px-6 py-2.5 rounded-2xl bg-brand hover:bg-brand-hover text-white font-bold shadow-md shadow-brand/10 cursor-pointer font-sans text-[14px]"
                >
                  Schedule
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lead Detail Modal */}
      <LeadDetailModule
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedLead(null);
        }}
        lead={selectedLead}
        onSave={async (updated) => {
          try {
            // Backend update route is PUT /v1/leads/:id and its Joi schema rejects
            // unknown keys (id, status, createdAt...) and the UI's display
            // placeholders, so send only real, updatable values.
            const payload: Record<string, string> = {
              name: updated.name,
              notes: updated.notes || '',
            };
            if (updated.phone && /^[6-9]\d{9}$/.test(updated.phone)) payload.phone = updated.phone;
            if (updated.email && updated.email !== 'Not provided') payload.email = updated.email;
            if (updated.source && updated.source !== 'Unknown') payload.source = updated.source;
            if (updated.budgetRange && updated.budgetRange !== 'Not specified') payload.budgetRange = updated.budgetRange;
            if (updated.propertyType && updated.propertyType !== 'Not specified') payload.propertyType = updated.propertyType;
            if (updated.preferredLocation && updated.preferredLocation !== 'Not specified') payload.preferredLocation = updated.preferredLocation;

            const res = await fetch(`${API_URL}/v1/leads/${updated.id}`, {
              method: 'PUT',
              headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
            });
            const json = await res.json();
            if (json.success) {
              addToast('Lead updated successfully', 'success');
              fetchLeads();
              fetchStats();
            } else {
              addToast(json.message || 'Failed to update lead', 'info');
            }
          } catch (err: any) {
            addToast(err.message || 'Error updating lead', 'info');
          }
        }}
      />

    </div>
  );
}
