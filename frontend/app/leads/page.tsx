"use client";

import React, { useState } from "react";
import { useDashboard } from "../DashboardContext";

// Interfaces
interface Lead {
  id: string;
  name: string;
  source: string;
  status: "Hot Lead" | "Closed" | "New lead";
  lastContacted: string;
}

export default function LeadsPage() {
  const { searchQuery, setSearchQuery, addToast } = useDashboard();

  // Filter & Search states
  const [statusFilter, setStatusFilter] = useState("All status");
  const [timeRange, setTimeRange] = useState("Last 30 days");
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showTimeDropdown, setShowTimeDropdown] = useState(false);

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newLeadName, setNewLeadName] = useState("");
  const [newLeadSource, setNewLeadSource] = useState("Google Ads");
  const [newLeadStatus, setNewLeadStatus] = useState<"Hot Lead" | "Closed" | "New lead">("New lead");

  // Row Action Dropdown state
  const [activeRowActionId, setActiveRowActionId] = useState<string | null>(null);

  // Initial Leads list
  const [leads, setLeads] = useState<Lead[]>([
    { id: "1", name: "Aniket patil", source: "Google Ads", status: "Hot Lead", lastContacted: "2hr ago" },
    { id: "2", name: "Aniket patil", source: "Direct Mail", status: "Closed", lastContacted: "5hr ago" },
    { id: "3", name: "Aniket patil", source: "Referral", status: "New lead", lastContacted: "6hr ago" },
    { id: "4", name: "Aniket patil", source: "Direct Mail", status: "Closed", lastContacted: "6hr ago" },
    { id: "5", name: "Aniket patil", source: "Referral", status: "New lead", lastContacted: "6hr ago" },
    { id: "6", name: "Aniket patil", source: "Referral", status: "New lead", lastContacted: "6hr ago" },
    { id: "7", name: "Aniket patil", source: "Direct Mail", status: "Closed", lastContacted: "6hr ago" },
    { id: "8", name: "Aniket patil", source: "Google Ads", status: "Hot Lead", lastContacted: "6hr ago" },
    { id: "9", name: "Aniket patil", source: "Google Ads", status: "Hot Lead", lastContacted: "7hr ago" },
    { id: "10", name: "Aniket patil", source: "Direct Mail", status: "Closed", lastContacted: "7hr ago" }
  ]);

  // KPI Computations based on current leads array
  const totalHotLeads = leads.filter((l) => l.status === "Hot Lead").length * 10 + 28; // offset to match high mockup figures (128)
  const followUpsToday = leads.filter((l) => l.status === "New lead").length * 5 + 8; // offset to match mockup figures (28)
  const closedThisMonth = leads.filter((l) => l.status === "Closed").length * 2 + 4; // offset to match mockup figures (12)

  // Dynamic search and filter logic
  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.source.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus =
      statusFilter === "All status" ||
      lead.status.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  // Action handlers
  const handleDeleteLead = (id: string) => {
    setLeads((prev) => prev.filter((lead) => lead.id !== id));
    addToast("Lead deleted successfully!", "info");
    setActiveRowActionId(null);
  };

  const handleChangeLeadStatus = (id: string, newStatus: "Hot Lead" | "Closed" | "New lead") => {
    setLeads((prev) =>
      prev.map((lead) => (lead.id === id ? { ...lead, status: newStatus } : lead))
    );
    addToast(`Lead status updated to ${newStatus}`, "success");
    setActiveRowActionId(null);
  };

  const handleAddLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeadName.trim()) {
      addToast("Please enter a lead name", "info");
      return;
    }

    const newLead: Lead = {
      id: Date.now().toString(),
      name: newLeadName.trim(),
      source: newLeadSource,
      status: newLeadStatus,
      lastContacted: "Just now"
    };

    setLeads((prev) => [newLead, ...prev]);
    addToast(`Successfully added "${newLead.name}"!`, "success");
    
    // Reset form
    setNewLeadName("");
    setNewLeadSource("Google Ads");
    setNewLeadStatus("New lead");
    setIsAddModalOpen(false);
  };

  const handleExportFile = () => {
    addToast("Generating leads report spreadsheet...", "info");
    setTimeout(() => {
      const headers = "Name,Source,Status,Last Contacted\n";
      const rows = leads
        .map((l) => `"${l.name}","${l.source}","${l.status}","${l.lastContacted}"`)
        .join("\n");
      const blob = new Blob([headers + rows], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.setAttribute("href", url);
      a.setAttribute("download", `RisingSpaces_Leads_${Date.now()}.csv`);
      a.click();
      addToast("Leads list exported successfully!", "success");
    }, 1200);
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-6 bg-[#FDFCFB]">
      
      {/* Main Title & Action Row */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Leads</h1>
          <p className="text-slate-500 mt-1 text-[15px] font-semibold">Here's what requires your attention today</p>
        </div>

        {/* Action Buttons matching mockup */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportFile}
            className="bg-brand hover:bg-brand-hover text-white text-[14px] font-bold px-5 py-2.5 rounded-xl shadow-md shadow-brand/10 flex items-center gap-2 transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 cursor-pointer font-sans"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Export File
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-brand hover:bg-brand-hover text-white text-[14px] font-bold px-5 py-2.5 rounded-xl shadow-md shadow-brand/10 flex items-center gap-2 transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 cursor-pointer font-sans"
          >
            <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add New Lead
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Total Hotleads */}
        <div className="bg-white rounded-[26px] p-6 shadow-sm border border-slate-100 hover:border-slate-200 transition-all duration-300 transform hover:-translate-y-1 cursor-default relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[6px] bg-[#EB3539] rounded-t-full" />
          <span className="text-slate-800 font-bold text-[14.5px] uppercase tracking-wider block">Total Hotleads</span>
          <h3 className="text-[52px] font-extrabold text-slate-900 mt-2 mb-2 leading-none">{totalHotLeads}</h3>
          <div className="flex items-center gap-1.5 mt-2">
            <span className="text-[#22c55e] font-extrabold text-[14px] flex items-center bg-emerald-50 px-2 py-0.5 rounded-full">
              <svg className="w-4 h-4 mr-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
              </svg>
              +12.5%
            </span>
            <span className="text-slate-500 text-[13.5px] font-semibold">vs last month</span>
          </div>
        </div>

        {/* Card 2: Followups Today */}
        <div className="bg-white rounded-[26px] p-6 shadow-sm border border-slate-100 hover:border-slate-200 transition-all duration-300 transform hover:-translate-y-1 cursor-default relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[6px] bg-[#3b82f6] rounded-t-full" />
          <span className="text-slate-800 font-bold text-[14.5px] uppercase tracking-wider block">Follow - ups - today</span>
          <h3 className="text-[52px] font-extrabold text-slate-900 mt-2 mb-2 leading-none">{followUpsToday}</h3>
          <div className="flex items-center gap-1.5 mt-2">
            <span className="text-[#22c55e] font-extrabold text-[14px] flex items-center bg-emerald-50 px-2 py-0.5 rounded-full">
              <svg className="w-4 h-4 mr-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
              </svg>
              +3.5%
            </span>
            <span className="text-slate-500 text-[13.5px] font-semibold">vs last month</span>
          </div>
        </div>

        {/* Card 3: Closed this month */}
        <div className="bg-white rounded-[26px] p-6 shadow-sm border border-slate-100 hover:border-slate-200 transition-all duration-300 transform hover:-translate-y-1 cursor-default relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[6px] bg-[#f59e0b] rounded-t-full" />
          <span className="text-slate-800 font-bold text-[14.5px] uppercase tracking-wider block">Closed this month</span>
          <h3 className="text-[52px] font-extrabold text-slate-900 mt-2 mb-2 leading-none">{closedThisMonth}</h3>
          <div className="flex items-center gap-1.5 mt-2">
            <span className="text-[#ef4444] font-extrabold text-[14px] flex items-center bg-rose-50 px-2 py-0.5 rounded-full">
              <svg className="w-4 h-4 mr-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M12 13a1 1 0 110 2H7a1 1 0 01-1-1V9a1 1 0 112 0v2.586l4.293-4.293a1 1 0 011.414 0L12 9.586l4.293-4.293a1 1 0 111.414 1.414l-5 5a1 1 0 01-1.414 0L12 9.414 8.414 13H12z" clipRule="evenodd" />
              </svg>
              -2.5%
            </span>
            <span className="text-slate-500 text-[13.5px] font-semibold">need reviews</span>
          </div>
        </div>
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

        <div className="flex flex-wrap items-center gap-3">
          {/* Status Select dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setShowStatusDropdown(!showStatusDropdown);
                setShowTimeDropdown(false);
              }}
              className="bg-[#F3F2F1]/70 text-slate-700 font-bold px-4 py-2.5 rounded-2xl text-[13.5px] flex items-center gap-2 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              {statusFilter}
              <svg className={`w-4.5 h-4.5 text-slate-500 transition-transform ${showStatusDropdown ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showStatusDropdown && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowStatusDropdown(false)} />
                <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 p-2 animate-scale-up font-semibold text-[13.5px]">
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
              className="bg-[#F3F2F1]/70 text-slate-700 font-bold px-4 py-2.5 rounded-2xl text-[13.5px] flex items-center gap-2.5 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <svg className="w-4.5 h-4.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {timeRange}
            </button>

            {showTimeDropdown && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowTimeDropdown(false)} />
                <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 p-2 animate-scale-up font-semibold text-[13.5px]">
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
            className="bg-[#FDF2F2] text-brand font-extrabold px-5 py-2.5 rounded-2xl text-[13.5px] flex items-center gap-2 hover:bg-red-100/50 transition-colors cursor-pointer font-sans"
          >
            <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filter
          </button>
        </div>
      </div>

      {/* Table Card Grid Container */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        {/* Desktop and Tablet table presentation */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full min-w-[700px] border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="py-4.5 px-6 font-extrabold text-[14px] text-brand uppercase tracking-wider">Property interest</th>
                <th className="py-4.5 px-6 font-extrabold text-[14px] text-brand uppercase tracking-wider">Source</th>
                <th className="py-4.5 px-6 font-extrabold text-[14px] text-brand uppercase tracking-wider">Status</th>
                <th className="py-4.5 px-6 font-extrabold text-[14px] text-brand uppercase tracking-wider">Last contacted</th>
                <th className="py-4.5 px-6 font-extrabold text-[14px] text-brand uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold text-[14.5px] text-slate-700">
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400 font-medium">
                    No leads matched your filters.
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="py-4 px-6 text-slate-800 font-bold">{lead.name}</td>
                    <td className="py-4 px-6 text-slate-600">{lead.source}</td>
                    <td className="py-4 px-6">
                      {lead.status === "Hot Lead" && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-[12px] font-extrabold bg-[#FDF2F2] text-[#EB3539] border border-red-200/50 shadow-sm">
                          Hot Lead
                        </span>
                      )}
                      {lead.status === "Closed" && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-[12px] font-extrabold bg-[#F0FDF4] text-[#15803d] border border-emerald-200/50 shadow-sm">
                          Closed
                        </span>
                      )}
                      {lead.status === "New lead" && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-[12px] font-extrabold bg-[#EFF6FF] text-[#1d4ed8] border border-blue-200/50 shadow-sm">
                          New lead
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-slate-500 font-medium">{lead.lastContacted}</td>
                    <td className="py-4 px-6 text-right relative font-sans">
                      <button
                        onClick={() => {
                          setActiveRowActionId(activeRowActionId === lead.id ? null : lead.id);
                        }}
                        className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                        </svg>
                      </button>

                      {activeRowActionId === lead.id && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setActiveRowActionId(null)} />
                          <div className="absolute right-6 mt-1 w-44 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 p-2 animate-scale-up font-semibold text-[13px] text-left">
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
                              <svg className="w-3.8 h-3.8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              Delete Lead
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
              <div key={lead.id} className="p-4 hover:bg-slate-50/50 transition-colors relative flex flex-col gap-2 font-semibold">
                <div className="flex items-center justify-between">
                  <span className="text-[16px] text-slate-800 font-bold">{lead.name}</span>
                  
                  <div className="relative">
                    <button
                      onClick={() => {
                        setActiveRowActionId(activeRowActionId === lead.id ? null : lead.id);
                      }}
                      className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 cursor-pointer"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                      </svg>
                    </button>
                    
                    {activeRowActionId === lead.id && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setActiveRowActionId(null)} />
                        <div className="absolute right-0 mt-1 w-44 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 p-2 animate-scale-up font-semibold text-[13px] text-left">
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
          <div className="bg-white rounded-[32px] p-6 w-full max-w-md border border-slate-100 shadow-2xl animate-scale-up">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <h3 className="text-xl font-extrabold text-slate-800 tracking-tight">Add New Lead</h3>
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

              <div>
                <label className="block text-slate-600 font-bold mb-1.5">Source</label>
                <select
                  value={newLeadSource}
                  onChange={(e) => setNewLeadSource(e.target.value)}
                  className="w-full border border-slate-200 rounded-2xl px-4 py-3 bg-white focus:ring-2 focus:ring-brand/20 outline-none text-[14.5px] font-semibold"
                >
                  <option value="Google Ads">Google Ads</option>
                  <option value="Direct Mail">Direct Mail</option>
                  <option value="Referral">Referral</option>
                  <option value="Organic Search">Organic Search</option>
                  <option value="Social Media">Social Media</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1.5">Initial Status</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["New lead", "Hot Lead", "Closed"] as const).map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setNewLeadStatus(status)}
                      className={`py-2 px-3 rounded-xl border-2 transition-all font-extrabold text-[12.5px] cursor-pointer ${
                        newLeadStatus === status
                          ? "border-brand bg-brand-light text-brand shadow-sm"
                          : "border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50"
                      }`}
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
                  className="px-5 py-2.5 rounded-2xl text-slate-500 hover:bg-slate-100 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-2xl bg-brand hover:bg-brand-hover text-white font-bold shadow-md shadow-brand/10 cursor-pointer"
                >
                  Save Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
