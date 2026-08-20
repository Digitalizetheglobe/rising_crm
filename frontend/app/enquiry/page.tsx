"use client";

import React, { useState, useEffect } from "react";
import EnquiryDetailModule from "../../Components/enquiryDetailModule";
import PageHeader from "../../Components/PageHeader";
import { PAGE_CONTAINER_CLASS, PRIMARY_ACTION_BTN_CLASS } from "../../lib/pageLayout";
import { useDashboard } from "../DashboardContext";
import { API_URL } from "../../config/api.config";
import { getAuthHeaders } from "../../lib/auth";
import KPICard from "../../Components/KPICard";

// Interfaces
interface Enquiry {
  id: string;
  name: string;
  source: string;
  contactNo: string;
  status: "Pending" | "Converted lead";
  message: string;
  lastContacted: string;
  email?: string;
  budgetRange?: string;
  propertyType?: string;
  preferredLocation?: string;
  notes?: string;
  createdAt?: string;
  platform?: string;
}

export default function EnquiryPage() {
  const { searchQuery, addToast } = useDashboard();

  // Filter & Search states
  const [statusFilter, setStatusFilter] = useState("All status");
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [sourceFilter, setSourceFilter] = useState("All sources");
  const [showSourceDropdown, setShowSourceDropdown] = useState(false);
  const [showTimeDropdown, setShowTimeDropdown] = useState(false);
  const [timeRange, setTimeRange] = useState("Last 30 days");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);

  // Row Action Dropdown state
  const [activeRowActionId, setActiveRowActionId] = useState<string | null>(null);

  // Add Enquiry modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newEnquiryBudgetRange, setNewEnquiryBudgetRange] = useState("");
  const [newEnquiryName, setNewEnquiryName] = useState("");
  const [newEnquiryContact, setNewEnquiryContact] = useState("");
  const [newEnquirySource, setNewEnquirySource] = useState("Website");
  const [newEnquiryMessage, setNewEnquiryMessage] = useState("");
  const [newEnquiryStatus, setNewEnquiryStatus] = useState<"Pending" | "Converted lead">("Pending");

  // Detail Enquiry modal state
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedEnquiry, setSelectedEnquiry] = useState<Enquiry | null>(null);

  // Initial Enquiries list
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, pending: 0, converted: 0, today: 0 });


  const fetchEnquiries = async () => {
    setLoading(true);
    try {
      let url = `${API_URL}/v1/enquiries?page=${currentPage}&limit=10`;
      if (searchQuery) {
        url += `&search=${encodeURIComponent(searchQuery)}`;
      }
      if (statusFilter !== "All status") {
        const mappedStatus = statusFilter === "Converted lead" ? "Converted" : statusFilter;
        url += `&status=${mappedStatus}`;
      }
      if (sourceFilter !== "All sources") {
        url += `&source=${sourceFilter}`;
      }
      const res = await fetch(url, {
        headers: getAuthHeaders()
      });
      const json = await res.json();
      if (json.success && json.data) {
        const mapped = (json.data.enquiries || []).map((e: any) => ({
          id: e._id,
          name: e.name,
          source: e.source,
          contactNo: e.phone,
          status: e.status === "Converted" ? "Converted lead" : "Pending",
          message: e.message || "",
          lastContacted: e.lastContactedAt ? new Date(e.lastContactedAt).toLocaleDateString() : (e.createdAt ? new Date(e.createdAt).toLocaleDateString() : "Never"),
          email: e.email || "Not provided",
          budgetRange: e.budgetRange || "Not specified",
          propertyType: e.propertyType || "Not specified",
          preferredLocation: e.preferredLocation || "Not specified",
          notes: e.notes || "",
          createdAt: e.createdAt ? new Date(e.createdAt).toLocaleDateString() : "Unknown",
          platform: e.platform || null,
        }));
        setEnquiries(mapped);
        setTotalPages(json.data.totalPages || 1);
      } else {
        addToast(json.message || "Failed to load enquiries", "info");
      }
    } catch (err: any) {
      addToast(err.message || "Error connecting to server", "info");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      let url = `${API_URL}/v1/enquiries/stats?`;
      const params = new URLSearchParams();
      if (searchQuery) {
        params.append("search", searchQuery);
      }
      if (statusFilter !== "All status") {
        const mappedStatus = statusFilter === "Converted lead" ? "Converted" : statusFilter;
        params.append("status", mappedStatus);
      }
      if (sourceFilter !== "All sources") {
        params.append("source", sourceFilter);
      }
      const res = await fetch(`${url}${params.toString()}`, {
        headers: getAuthHeaders()
      });
      const json = await res.json();
      if (json.success && json.data) {
        const pendingCount = (json.data.byStatus || []).find((s: any) => s._id === "Pending")?.count || 0;
        setStats({
          total: json.data.total,
          pending: pendingCount,
          converted: json.data.converted,
          today: json.data.today || 0
        });
      }
    } catch (err) {
      console.error("Failed to load stats", err);
    }
  };

  useEffect(() => {
    fetchEnquiries();
    fetchStats();
  }, [currentPage, searchQuery, statusFilter, sourceFilter]);

  // KPI Computations based on dynamic stats state
  const totalEnquiriesCount = stats.total;
  const pendingCount = stats.pending;
  const convertedCount = stats.converted;
  const totalLeadsCount = convertedCount;
  const todayCount = stats.today;

  // Handle adding new enquiry
  const handleAddEnquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEnquiryName.trim() || !newEnquiryContact.trim()) {
      addToast("Please fill out name and contact details!", "info");
      return;
    }

    if (!/^[6-9]\d{9}$/.test(newEnquiryContact.trim())) {
      addToast("Enter a valid 10-digit Indian mobile number", "info");
      return;
    }

    try {
      // Include budgetRange in payload
      const payload = {
        name: newEnquiryName.trim(),
        phone: newEnquiryContact.trim(),
        source: newEnquirySource,
        message: newEnquiryMessage.trim(),
        budgetRange: newEnquiryBudgetRange,
      };

      const res = await fetch(`${API_URL}/v1/enquiries`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success) {
        addToast(`Successfully added Enquiry for "${payload.name}"`, "success");
        setIsAddModalOpen(false);
        setNewEnquiryName("");
        setNewEnquiryContact("");
        setNewEnquiryMessage("");
        fetchEnquiries();
        fetchStats();
      } else {
        addToast(json.message || "Failed to create enquiry", "info");
      }
    } catch (err: any) {
      addToast(err.message || "Error submitting enquiry", "info");
    }
  };

  // Delete Enquiry
  const handleDeleteEnquiry = async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/v1/enquiries/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      const json = await res.json();
      if (json.success) {
        addToast("Deleted Enquiry successfully", "success");
        fetchEnquiries();
        fetchStats();
      } else {
        addToast(json.message || "Failed to delete enquiry", "info");
      }
    } catch (err: any) {
      addToast(err.message || "Error deleting enquiry", "info");
    }
    setActiveRowActionId(null);
  };

  // Toggle/Change Status
  const handleChangeStatus = async (id: string, nextStatus: "Pending" | "Converted lead") => {
    try {
      if (nextStatus === "Converted lead") {
        // 1. Update status to Qualified first
        const statusRes = await fetch(`${API_URL}/v1/enquiries/${id}/status`, {
          method: "PATCH",
          headers: getAuthHeaders(),
          body: JSON.stringify({ status: "Qualified" }),
        });
        const statusJson = await statusRes.json();
        if (!statusJson.success) {
          addToast(statusJson.message || "Failed to qualify enquiry", "info");
          setActiveRowActionId(null);
          return;
        }

        // 2. Convert to Lead
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);

        const convertPayload = {
          assignedTo: "6a198f1ca92d2deb0c64a7cd", // SUPER_ADMIN ID
          followUpDate: tomorrow.toISOString(),
          followUpNotes: "Enquiry qualified and converted automatically from frontend.",
          priority: "Medium"
        };

        const convertRes = await fetch(`${API_URL}/v1/enquiries/${id}/convert`, {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify(convertPayload),
        });

        const convertJson = await convertRes.json();
        if (convertJson.success) {
          addToast("Enquiry successfully converted to lead!", "success");
          fetchEnquiries();
          fetchStats();
        } else {
          addToast(convertJson.message || "Failed to convert to lead", "info");
        }
      } else {
        // Mark as Pending
        const res = await fetch(`${API_URL}/v1/enquiries/${id}/status`, {
          method: "PATCH",
          headers: getAuthHeaders(),
          body: JSON.stringify({ status: "Pending" }),
        });
        const json = await res.json();
        if (json.success) {
          addToast("Updated status to Pending", "success");
          fetchEnquiries();
          fetchStats();
        } else {
          addToast(json.message || "Failed to update status", "info");
        }
      }
    } catch (err: any) {
      addToast(err.message || "Error changing status", "info");
    }
    setActiveRowActionId(null);
  };

  // Update Enquiry
  const handleUpdateEnquiry = async (updated: Enquiry) => {
    try {
      const payload = {
        name: updated.name,
        phone: updated.contactNo,
        email: updated.email,
        source: updated.source,
        message: updated.message,
        budgetRange: updated.budgetRange,
        propertyType: updated.propertyType,
        preferredLocation: updated.preferredLocation,
        notes: updated.notes,
      };

      console.log('Updating enquiry with payload:', payload);
      const res = await fetch(`${API_URL}/v1/enquiries/${updated.id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      console.log('Update enquiry response:', json);
      if (json.success) {
        addToast("Enquiry updated successfully", "success");
        setSelectedEnquiry(updated);
        fetchEnquiries();
        fetchStats();

        // If status changed in the modal, we also need to update status
        if (selectedEnquiry && updated.status !== selectedEnquiry.status) {
          handleChangeStatus(updated.id, updated.status);
        }
      } else {
        addToast(json.message || "Failed to update enquiry", "info");
      }
    } catch (err: any) {
      addToast(err.message || "Error updating enquiry", "info");
    }
  };

  // Filter reset helper
  const handleResetFilters = () => {
    setStatusFilter("All status");
    setSourceFilter("All sources");
    addToast("Enquiry filters reset!", "info");
  };

  // Local filtered search (fallback for offline/safety search checks)
  const filteredEnquiries = enquiries;

  return (
    <div className={PAGE_CONTAINER_CLASS}>
      <PageHeader
        title="Enquiry"
        subtitle="Manage property and plots incoming inquiries"
        actions={
          <button onClick={() => setIsAddModalOpen(true)} className={PRIMARY_ACTION_BTN_CLASS}>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add New Enquiry
          </button>
        }
      />

      {/* 4 KPI Metric Cards - Styled exactly like the user mockup */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard title="Today's Enquiries" value={todayCount} subtext={sourceFilter === "All sources" ? "Received today" : `Filtered by ${sourceFilter}`} accentColor="#8b5cf6" />
        <KPICard title="Total Enquiries" value={totalEnquiriesCount} subtext={sourceFilter === "All sources" ? "All time, all sources" : `Filtered by ${sourceFilter}`} accentColor="#38B6FF" />
        <KPICard title="Pending response" value={pendingCount} subtext="Awaiting follow-up" accentColor="#3b82f6" />
        <KPICard title="Converted leads" value={totalLeadsCount} subtext="Successfully converted" accentColor="#10b981" />
      </div>

      {/* Table Filters Panel matching mockup */}
      <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center gap-4 justify-between">
        <div className="text-[15px] font-medium text-slate-700">Enquiry Records</div>

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
              <svg className={`w-4.5 h-4.5 text-slate-500 transition-transform ${showStatusDropdown ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showStatusDropdown && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowStatusDropdown(false)} />
                <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 p-2 animate-scale-up font-medium text-[13.5px]">
                  {["All status", "Pending", "Converted lead"].map((st) => (
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

          {/* Source Select dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setShowSourceDropdown(!showSourceDropdown);
                setShowStatusDropdown(false);
                setShowTimeDropdown(false);
              }}
              className="bg-[#F3F2F1]/70 text-slate-700 font-medium px-4 py-2.5 rounded-2xl text-[13.5px] flex items-center gap-2 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              {sourceFilter}
              <svg className={`w-4.5 h-4.5 text-slate-500 transition-transform ${showSourceDropdown ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showSourceDropdown && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowSourceDropdown(false)} />
                <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 p-2 animate-scale-up font-medium text-[13.5px] max-h-64 overflow-y-auto">
                  {["All sources", "Website", "META_ADS", "Facebook", "Instagram", "Advertisement", "Referral", "Walk-In", "Phone", "WhatsApp", "Email", "Social Media", "Other"].map((src) => (
                    <button
                      key={src}
                      onClick={() => {
                        setSourceFilter(src);
                        setShowSourceDropdown(false);
                        addToast(`Filter applied: ${src}`, "info");
                      }}
                      className="w-full text-left px-3.5 py-2 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-slate-900 cursor-pointer"
                    >
                      {src === "META_ADS" ? "Meta Ads (FB/IG)" : src}
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
                setShowSourceDropdown(false);
              }}
              className="bg-[#F3F2F1]/70 text-slate-700 font-medium px-4 py-2.5 rounded-2xl text-[13.5px] flex items-center gap-2.5 hover:bg-slate-200 transition-colors cursor-pointer"
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
                  {["Last 30 days", "Last 3 months", "Last 12 months"].map((tr) => (
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

          {/* Filter Reset pill */}
          <button
            onClick={handleResetFilters}
            className="bg-[#FDF2F2] text-brand font-medium px-5 py-2.5 rounded-2xl text-[13.5px] flex items-center gap-2 hover:bg-red-100/50 transition-colors cursor-pointer font-sans"
          >
            <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filter
          </button>
        </div>
      </div>

      {/* Main Enquiries Interactive List Container */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-visible">

        {/* Desktop Table View */}
        <div className="hidden sm:block overflow-visible">
          {loading ? (
            <div className="py-20 text-center text-slate-400 font-bold flex flex-col items-center gap-3">
              <span className="w-8 h-8 rounded-full border-[3px] border-slate-200 border-t-brand animate-spin"></span>
              Loading enquiries database...
            </div>
          ) : (
            <table className="w-full min-w-[700px] text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-[#FCFBFB]">
                  <th className="py-4.5 px-6 font-medium text-[14px] text-brand uppercase tracking-wider">Client info</th>
                  <th className="py-4.5 px-6 font-medium text-[14px] text-brand uppercase tracking-wider">Source</th>
                  <th className="py-4.5 px-6 font-medium text-[14px] text-brand uppercase tracking-wider">Contact no</th>
                  <th className="py-4.5 px-6 font-medium text-[14px] text-brand uppercase tracking-wider">Status</th>
                  <th className="py-4.5 px-6 font-medium text-[14px] text-brand uppercase tracking-wider">Last contacted</th>
                  <th className="py-4.5 px-6 font-medium text-[14px] text-brand uppercase tracking-wider text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-[14.5px] text-slate-700">
                {filteredEnquiries.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 font-medium">
                      No enquiries match your current search/filter.
                    </td>
                  </tr>
                ) : (
                  filteredEnquiries.map((enq) => (
                    <tr key={enq.id} className={`hover:bg-slate-50/50 transition-colors ${activeRowActionId === enq.id ? 'relative z-50' : 'relative z-0'}`}>
                      <td onClick={() => { setSelectedEnquiry(enq); setIsDetailModalOpen(true); }} className="py-4 px-6 text-slate-800 font-semibold cursor-pointer hover:text-brand transition-colors">{enq.name}</td>
                      <td className="py-4 px-6 text-slate-600">
                        {enq.source === "META_ADS" || enq.platform ? (
                          <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${enq.platform === 'instagram' ? 'bg-pink-100 text-pink-700' : 'bg-blue-100 text-blue-700'}`}>
                            {enq.platform === 'instagram' ? 'Instagram' : 'Facebook'}
                          </span>
                        ) : (
                          enq.source
                        )}
                      </td>
                      <td className="py-4 px-6 text-slate-850 font-medium">{enq.contactNo}</td>
                      <td className="py-4 px-6">
                        {enq.status === "Pending" ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-[12px] font-semibold bg-sky-50 text-[#0284C7] border border-sky-200/50 shadow-xs">
                            Pending
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-[12px] font-medium bg-[#F0FDF4] text-[#15803d] border border-emerald-200/50 shadow-xs">
                            Converted lead
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-slate-500 font-medium">{enq.lastContacted}</td>
                      <td className="py-4 px-6 text-right relative font-sans">
                        <button
                          onClick={() => setActiveRowActionId(activeRowActionId === enq.id ? null : enq.id)}
                          className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                          </svg>
                        </button>

                        {activeRowActionId === enq.id && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setActiveRowActionId(null)} />
                            <div className="absolute right-6 mt-1 w-52 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 p-2 animate-scale-up font-semibold text-[13px] text-left">
                              <span className="block px-3 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Enquiry Actions</span>

                              {enq.status === "Pending" ? (
                                <button
                                  onClick={() => handleChangeStatus(enq.id, "Converted lead")}
                                  className="w-full text-left px-3.5 py-2.5 rounded-xl hover:bg-emerald-50 text-[#15803d] flex items-center gap-2 cursor-pointer font-sans"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                                  Convert to Lead
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleChangeStatus(enq.id, "Pending")}
                                  className="w-full text-left px-3.5 py-2.5 rounded-xl hover:bg-amber-50 text-amber-600 flex items-center gap-2 cursor-pointer font-sans"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 15.89M9 11l3-3 3 3m-3-3v12" /></svg>
                                  Mark as Pending
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  setActiveRowActionId(null);
                                  setSelectedEnquiry(enq);
                                  setIsDetailModalOpen(true);
                                }}
                                className="w-full text-left px-3.5 py-2.5 rounded-xl hover:bg-slate-50 text-slate-600 flex items-center gap-2 cursor-pointer font-sans"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                                View Details
                              </button>
                              <button
                                onClick={() => handleDeleteEnquiry(enq.id)}
                                className="w-full text-left px-3.5 py-2.5 rounded-xl hover:bg-rose-50 text-rose-600 flex items-center gap-2 cursor-pointer font-sans"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Delete Enquiry
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
          )}
        </div>

        {/* Mobile Viewports */}
        <div className="block sm:hidden divide-y divide-slate-100 bg-[#FCFBFB]">
          {loading ? (
            <div className="py-20 text-center text-slate-400 font-bold">Loading enquiries...</div>
          ) : filteredEnquiries.length === 0 ? (
            <div className="py-12 text-center text-slate-400 font-semibold px-4">
              No enquiries matched your filter search criteria.
            </div>
          ) : (
            filteredEnquiries.map((enq) => (
              <div key={enq.id} className="p-4 flex flex-col gap-3 bg-white">
                <div className="flex items-center justify-between">
                  <span className="text-slate-800 font-bold text-[16px]">{enq.name}</span>
                  {enq.status === "Pending" ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-sky-50 text-[#0284C7] border border-sky-200/50 shadow-xs">
                      Pending
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#F0FDF4] text-[#15803d] border border-emerald-200/50 shadow-xs">
                      Converted lead
                    </span>
                  )}
                </div>

                <div className="text-[13.5px] font-semibold text-slate-500 space-y-1">
                  <div className="flex justify-between">
                    <span>Source:</span>
                    <span className="text-slate-700 font-bold">
                      {enq.source === "META_ADS" || enq.platform ? (
                        <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${enq.platform === 'instagram' ? 'bg-pink-100 text-pink-700' : 'bg-blue-100 text-blue-700'}`}>
                          {enq.platform === 'instagram' ? 'Instagram' : 'Facebook'}
                        </span>
                      ) : (
                        enq.source
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Contact no:</span>
                    <span className="text-slate-800 font-medium">{enq.contactNo}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Last contacted:</span>
                    <span className="text-slate-400 font-semibold">{enq.lastContacted}</span>
                  </div>
                </div>

                <div className="bg-[#FAF9F9] rounded-xl p-3 border border-slate-100 text-[13.5px] text-slate-600 font-medium mt-1">
                  <span className="font-bold text-slate-800 block mb-0.5 text-[11px] uppercase tracking-wider">Enquiry Message</span>
                  {enq.message}
                </div>

                <div className="flex items-center gap-2 justify-end pt-2 border-t border-slate-100 mt-1">
                  {enq.status === "Pending" ? (
                    <button
                      onClick={() => handleChangeStatus(enq.id, "Converted lead")}
                      className="bg-emerald-50 text-[#15803d] hover:bg-emerald-100/70 text-[12px] font-bold px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all cursor-pointer font-sans"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      Convert to Lead
                    </button>
                  ) : (
                    <button
                      onClick={() => handleChangeStatus(enq.id, "Pending")}
                      className="bg-amber-50 text-amber-600 hover:bg-amber-100/70 text-[12px] font-bold px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all cursor-pointer font-sans"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 15.89M9 11l3-3 3 3m-3-3v12" />
                      </svg>
                      Mark Pending
                    </button>
                  )}

                  <button
                    onClick={() => handleDeleteEnquiry(enq.id)}
                    className="bg-rose-50 text-rose-600 hover:bg-rose-100/70 text-[12px] font-bold px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all cursor-pointer font-sans"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7" />
                    </svg>
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        <div className="py-4 px-6 border-t border-slate-100 bg-[#FCFBFB] flex items-center justify-center gap-1 flex-wrap">
          <button
            onClick={() => {
              if (currentPage > 1) {
                setCurrentPage(currentPage - 1);
                addToast(`Navigated to page ${currentPage - 1}`, "info");
              }
            }}
            className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-slate-500 transition-all ${currentPage === 1 ? "opacity-40 cursor-not-allowed" : "hover:bg-slate-100 hover:text-slate-800 cursor-pointer"}`}
            disabled={currentPage === 1}
          >
            <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => {
                setCurrentPage(page);
                addToast(`Navigated to page ${page}`, "info");
              }}
              className={`w-9 h-9 rounded-xl font-bold transition-all cursor-pointer ${currentPage === page ? "bg-brand text-white shadow-md shadow-brand/20" : "text-slate-600 hover:bg-slate-100"}`}
            >
              {page}
            </button>
          ))}

          <button
            onClick={() => {
              if (currentPage < totalPages) {
                setCurrentPage(currentPage + 1);
                addToast(`Navigated to page ${currentPage + 1}`, "info");
              }
            }}
            className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-slate-500 transition-all ${currentPage === totalPages ? "opacity-40 cursor-not-allowed" : "hover:bg-slate-100 hover:text-slate-800 cursor-pointer"}`}
            disabled={currentPage === totalPages}
          >
            <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Add New Enquiry Modal */}
      {
        isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
            <div className="bg-white rounded-[32px] w-full max-w-lg border border-slate-100 shadow-2xl p-6 md:p-8 animate-scale-up font-sans">
              <div className="flex justify-between items-center pb-4 border-b border-slate-100 mb-5">
                <h2 className="text-xl font-medium text-slate-900">Add New Enquiry</h2>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-1 rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 cursor-pointer"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleAddEnquiry} className="space-y-4 font-semibold text-[13.5px] text-slate-700">
                <div>
                  <label className="block text-slate-600 font-bold mb-1.5">Client Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Aniket patil"
                    value={newEnquiryName}
                    onChange={(e) => setNewEnquiryName(e.target.value)}
                    className="w-full border border-slate-200 rounded-2xl px-4 py-3 bg-white focus:ring-2 focus:ring-brand/20 outline-none placeholder:text-slate-400 font-medium"
                  />
                </div>
                <div className="mt-4">
                  <label className="block text-slate-600 font-bold mb-1.5">Budget Range</label>
                  <select
                    value={newEnquiryBudgetRange}
                    onChange={(e) => setNewEnquiryBudgetRange(e.target.value)}
                    className="w-full border border-slate-200 rounded-2xl px-4 py-3 bg-white focus:ring-2 focus:ring-brand/20 outline-none text-[14px] font-medium"
                  >
                    <option value="">Select...</option>
                    <option value="Under 25L">Under 25L</option>
                    <option value="25L-50L">25L-50L</option>
                    <option value="50L-1Cr">50L-1Cr</option>
                    <option value="1Cr-2Cr">1Cr-2Cr</option>
                    <option value="Above 2Cr">Above 2Cr</option>
                  </select>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-600 font-bold mb-1.5">Contact Number</label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 9445625435"
                      value={newEnquiryContact}
                      onChange={(e) => setNewEnquiryContact(e.target.value)}
                      className="w-full border border-slate-200 rounded-2xl px-4 py-3 bg-white focus:ring-2 focus:ring-brand/20 outline-none placeholder:text-slate-400 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-bold mb-1.5">Marketing Source</label>
                    <select
                      value={newEnquirySource}
                      onChange={(e) => setNewEnquirySource(e.target.value)}
                      className="w-full border border-slate-200 rounded-2xl px-4 py-3 bg-white focus:ring-2 focus:ring-brand/20 outline-none text-[14px] font-semibold"
                    >
                      <option value="Website">Website</option>
                      <option value="Advertisement">Advertisement</option>
                      <option value="Referral">Referral</option>
                      <option value="Walk-In">Walk-In</option>
                      <option value="Phone">Phone</option>
                      <option value="WhatsApp">WhatsApp</option>
                      <option value="Email">Email</option>
                      <option value="Social Media">Social Media</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1.5">Requirement Message</label>
                  <textarea
                    placeholder="e.g. interested in 3 bhk"
                    value={newEnquiryMessage}
                    onChange={(e) => setNewEnquiryMessage(e.target.value)}
                    rows={3}
                    className="w-full border border-slate-200 rounded-2xl px-4 py-3 bg-white focus:ring-2 focus:ring-brand/20 outline-none placeholder:text-slate-400 font-medium resize-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1.5">Initial Enquiry Status</label>
                  <div className="grid grid-cols-2 gap-3">
                    {(["Pending", "Converted lead"] as const).map((status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => setNewEnquiryStatus(status)}
                        className={`py-2.5 px-3 rounded-xl border-2 transition-all font-medium text-[12.5px] cursor-pointer ${newEnquiryStatus === status ? "border-brand bg-brand-light text-brand shadow-xs" : "border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50"}`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3.5 pt-4 justify-end">
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
                    Save Enquiry
                  </button>
                </div>
              </form>
            </div>
          </div>
        )
      }

      {/* Enquiry Detail Modal */}
      <EnquiryDetailModule
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedEnquiry(null);
        }}
        enquiry={selectedEnquiry}
        onSave={handleUpdateEnquiry}
      />
    </div >
  );
}
