"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

// Interfaces
interface Lead {
  id: string;
  name: string;
  source: string;
  status: "Hot Lead" | "Closed" | "New lead";
  lastContacted: string;
}

export default function LeadsPage() {
  // Sidebar state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("Leads");

  // Interaction & UI states
  const [userName, setUserName] = useState("Murali Anna");
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState("Murali Anna");
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [toasts, setToasts] = useState<{ id: number; message: string; type: "success" | "info" }[]>([]);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState("");
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

  // Initial Leads list (exactly matching the user screenshot names and categories)
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

  // Load username from localStorage if exists
  useEffect(() => {
    const savedName = localStorage.getItem("crm_username");
    if (savedName) {
      setUserName(savedName);
      setTempName(savedName);
    }
  }, []);

  const handleSaveName = () => {
    if (tempName.trim()) {
      setUserName(tempName);
      localStorage.setItem("crm_username", tempName);
      setIsEditingName(false);
      addToast(`Profile name updated to "${tempName}"`, "success");
    }
  };

  // Toast notifier
  const addToast = (message: string, type: "success" | "info" = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

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
      // Create a mockup CSV data stream for download
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

  const menuItems = [
    { name: "Dashboard", href: "/", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg> },
    { name: "Leads", href: "/leads", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg> },
    { name: "Clients Calls", href: "#", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg> },
    { name: "Enquiries", href: "/enquiry", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> },
    { name: "Feedback", href: "#", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2"><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg> },
    { name: "Booking", href: "/booking", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.168.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg> },
    { name: "Payments", href: "#", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg> },
    { name: "Projects", href: "#", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg> },
    { name: "Units", href: "/units", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg> },
    { name: "Employees", href: "#", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
    { name: "Setting", href: "#", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2"><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
  ];

  // Render Sidebar Content Helper
  const renderSidebarContent = () => (
    <div className="flex flex-col h-full bg-[#FAF5F5] border-r border-red-100/50 p-6 overflow-y-auto">
      {/* Exact Logo visual recreation: Blue circular capsule containing white "Logo" inside a brand-red oval pill */}
      <div className="flex items-center mb-8">
        <div className="w-[100px] h-[44px] rounded-full border-[3px] border-blue-500 bg-white flex items-center justify-center p-[2px] shadow-sm transform hover:scale-105 transition-transform duration-200 cursor-pointer">
          <div className="bg-[#EB3539] text-white w-full h-full rounded-full flex items-center justify-center font-extrabold text-[16px] tracking-wider">
            Logo
          </div>
        </div>
      </div>

      {/* Main Navigation links */}
      <nav className="flex-1 space-y-1.5">
        {menuItems.map((item) => {
          const isActive = activeTab === item.name;
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => {
                setActiveTab(item.name);
                setIsSidebarOpen(false);
                addToast(`Loaded ${item.name} Panel`, "info");
              }}
              className={`w-full flex items-center cursor-pointer gap-3.5 px-4 py-3 rounded-2xl text-[15px] font-medium transition-all duration-300 ${
                isActive
                  ? "bg-brand text-white shadow-lg shadow-brand/25 scale-[1.02]"
                  : "text-slate-500 hover:bg-white hover:text-brand hover:shadow-sm hover:translate-x-1"
              }`}
            >
              <span className={`transition-colors duration-300 ${isActive ? "text-white" : "text-slate-400 group-hover:text-brand"}`}>
                {item.icon}
              </span>
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Sidebar Footer */}
      <div className="mt-8 space-y-4">
        {/* Secondary Setting Button */}
        <Link
          href="#"
          onClick={() => {
            setActiveTab("Setting");
            setIsSidebarOpen(false);
            addToast("Loaded configuration setting", "info");
          }}
          className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-[15px] font-semibold transition-all duration-300 ${
            activeTab === "Setting"
              ? "bg-brand text-white shadow-lg shadow-brand/25"
              : "text-slate-500 hover:bg-white hover:text-brand hover:translate-x-1"
          }`}
        >
          <span className="text-slate-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2"><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          </span>
          Setting
        </Link>

        {/* AI Assistant Capsule */}
        <div className="bg-brand text-white p-4 rounded-3xl shadow-xl shadow-brand/15 relative overflow-hidden group">
          <div className="absolute -right-6 -bottom-6 w-20 h-20 bg-white/10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500"></div>
          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="flex items-center gap-1.5 mb-2.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span className="text-[12px] font-bold tracking-wide uppercase opacity-90">Ai Assistant Active</span>
            </div>
            <button
              onClick={() => addToast("Upgrade premium plan integration triggered!", "success")}
              className="w-full bg-white text-brand hover:bg-brand-light font-bold text-[13px] py-2 px-4 rounded-xl shadow-sm transition-all duration-300 active:scale-95 cursor-pointer"
            >
              Upgrade Plan
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-[#FDFCFB] text-slate-800 overflow-hidden font-sans relative">
      
      {/* Toast popup alerts */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto flex items-center gap-3 bg-white p-4 rounded-2xl shadow-xl border border-slate-100 animate-slide-in-right"
          >
            {toast.type === "success" ? (
              <span className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              </span>
            ) : (
              <span className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </span>
            )}
            <p className="text-[14.5px] font-semibold text-slate-700">{toast.message}</p>
          </div>
        ))}
      </div>

      {/* Desktop Left Sidebar Panel */}
      <aside className="hidden lg:block w-[265px] h-full flex-shrink-0">
        {renderSidebarContent()}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden transition-all duration-300 animate-fade-in"
        />
      )}

      {/* Mobile Left Sidebar Drawer */}
      <aside
        className={`fixed top-0 bottom-0 left-0 w-[270px] z-50 lg:hidden bg-[#FAF5F5] shadow-2xl transition-transform duration-300 ease-out transform ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {renderSidebarContent()}
        <button
          onClick={() => setIsSidebarOpen(false)}
          className="absolute top-5 right-5 p-2 rounded-xl bg-white/80 text-slate-500 hover:bg-white shadow-sm border border-slate-200/50 cursor-pointer"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </aside>

      {/* Right Content Canvas */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        
        {/* Top Header */}
        <header className="bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between z-30">
          <div className="flex items-center gap-3">
            {/* Hamburger Button for Mobile & Tablet */}
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2.5 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>

            {/* Custom rounded search bar matching mockup */}
            <div className="relative w-44 sm:w-64 md:w-80 lg:w-[480px]">
              <span className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400">
                <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </span>
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#F3F2F1]/70 text-slate-700 pl-11 pr-4 py-2.5 rounded-full text-[14px] border-none outline-none focus:ring-2 focus:ring-brand/20 focus:bg-white transition-all font-medium"
              />
            </div>
          </div>

          <div className="flex items-center gap-4 relative">
            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  setShowProfileMenu(false);
                }}
                className="p-2.5 rounded-full hover:bg-slate-100 text-slate-600 hover:text-slate-800 transition-colors relative cursor-pointer"
              >
                <svg className="w-5.5 h-5.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                {/* Notification Badge */}
                <span className="absolute top-2 right-2.5 w-2 h-2 rounded-full bg-brand"></span>
              </button>

              {showNotifications && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                  <div className="absolute right-0 mt-2.5 w-80 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 p-4 animate-scale-up">
                    <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-100">
                      <h4 className="font-bold text-[15px] text-slate-800">Notifications</h4>
                      <button 
                        onClick={() => {
                          setShowNotifications(false);
                          addToast("All notifications read!", "success");
                        }} 
                        className="text-[12px] font-bold text-brand hover:underline"
                      >
                        Read All
                      </button>
                    </div>
                    <div className="space-y-3 max-h-[250px] overflow-y-auto">
                      <div className="flex gap-3 text-[13.5px] p-2 hover:bg-slate-50 rounded-xl cursor-pointer">
                        <span className="w-2 h-2 rounded-full bg-brand mt-1.5 flex-shrink-0"></span>
                        <div>
                          <p className="font-medium text-slate-700">New hot lead assigned by system.</p>
                          <span className="text-[11px] text-slate-400 font-semibold">5 Mins Ago</span>
                        </div>
                      </div>
                      <div className="flex gap-3 text-[13.5px] p-2 hover:bg-slate-50 rounded-xl cursor-pointer">
                        <span className="w-2 h-2 rounded-full bg-brand mt-1.5 flex-shrink-0"></span>
                        <div>
                          <p className="font-medium text-slate-700">Campaign "Google Ads" registered 4 new signups.</p>
                          <span className="text-[11px] text-slate-400 font-semibold">1 Hour Ago</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Profile Avatar & Dropdown matching mockup */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowProfileMenu(!showProfileMenu);
                  setShowNotifications(false);
                }}
                className="w-10 h-10 rounded-full overflow-hidden border border-slate-200 hover:border-brand/40 shadow-sm transition-all focus:outline-none flex items-center justify-center cursor-pointer"
              >
                <img
                  src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              </button>

              {showProfileMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)} />
                  <div className="absolute right-0 mt-2.5 w-60 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 p-4 animate-scale-up">
                    <div className="flex items-center gap-3 pb-3 mb-3 border-b border-slate-100">
                      <div className="w-10 h-10 rounded-full overflow-hidden">
                        <img
                          src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <p className="font-bold text-[14.5px] text-slate-800">{userName}</p>
                        <p className="text-[12px] text-slate-400 font-semibold">Executive Partner</p>
                      </div>
                    </div>
                    <ul className="space-y-1.5 text-[14px] font-medium">
                      <li>
                        <button
                          onClick={() => {
                            setIsEditingName(true);
                            setShowProfileMenu(false);
                          }}
                          className="w-full text-left px-3 py-2 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-slate-800 flex items-center gap-2 cursor-pointer"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                          Edit Profile Name
                        </button>
                      </li>
                      <li>
                        <button
                          onClick={() => {
                            setShowProfileMenu(false);
                            addToast("Settings configurations loaded", "info");
                          }}
                          className="w-full text-left px-3 py-2 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-slate-800 flex items-center gap-2 cursor-pointer"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
                          Preferences
                        </button>
                      </li>
                      <li>
                        <button
                          onClick={() => {
                            setShowProfileMenu(false);
                            addToast("Logout action successful!", "info");
                          }}
                          className="w-full text-left px-3 py-2 rounded-xl text-rose-500 hover:bg-rose-50 hover:text-rose-600 flex items-center gap-2 cursor-pointer"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                          Log Out
                        </button>
                      </li>
                    </ul>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Scrollable Dashboard Body */}
        <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-6">
          
          {/* Main Title & Action Row */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Leads</h1>
              <p className="text-slate-500 mt-1 text-[15px] font-semibold">Here's what requires your attention today</p>
            </div>

            {/* Action Buttons matching mockup */}
            <div className="flex items-center gap-3">
              {/* Export File Button */}
              <button
                onClick={handleExportFile}
                className="bg-brand text-white text-[14px] font-bold px-5 py-2.5 rounded-xl shadow-md shadow-brand/10 flex items-center gap-2 transition-all duration-300 hover:bg-brand-hover hover:-translate-y-0.5 active:translate-y-0 active:scale-95 cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                Export File
              </button>

              {/* Add New Lead Button */}
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="bg-brand text-white text-[14px] font-bold px-5 py-2.5 rounded-xl shadow-md shadow-brand/10 flex items-center gap-2 transition-all duration-300 hover:bg-brand-hover hover:-translate-y-0.5 active:translate-y-0 active:scale-95 cursor-pointer"
              >
                <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                Add New Lead
              </button>
            </div>
          </div>

          {/* 3 KPI Metric Cards - Styled exactly like the user mockup */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Card 1: Total Hotleads (Red top border) */}
            <div className="bg-white rounded-[26px] p-6 shadow-sm border border-slate-100 hover:border-slate-200 transition-all duration-300 transform hover:-translate-y-1 cursor-default relative overflow-hidden">
              {/* Highlight red accent top bar */}
              <div className="absolute top-0 left-0 right-0 h-[6px] bg-[#EB3539] rounded-t-full" />
              
              <span className="text-slate-800 font-bold text-[14.5px] uppercase tracking-wider block">Total Hotleads</span>
              <h3 className="text-[52px] font-extrabold text-slate-900 mt-2 mb-2 leading-none">{totalHotLeads}</h3>
              <div className="flex items-center gap-1.5 mt-2">
                <span className="text-[#22c55e] font-extrabold text-[14px] flex items-center bg-emerald-50 px-2 py-0.5 rounded-full">
                  <svg className="w-4 h-4 mr-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" /></svg>
                  +12.5%
                </span>
                <span className="text-slate-500 text-[13.5px] font-semibold">vs last month</span>
              </div>
            </div>

            {/* Card 2: Follow - ups - today (Blue top border) */}
            <div className="bg-white rounded-[26px] p-6 shadow-sm border border-slate-100 hover:border-slate-200 transition-all duration-300 transform hover:-translate-y-1 cursor-default relative overflow-hidden">
              {/* Highlight blue accent top bar */}
              <div className="absolute top-0 left-0 right-0 h-[6px] bg-[#3b82f6] rounded-t-full" />
              
              <span className="text-slate-800 font-bold text-[14.5px] uppercase tracking-wider block">Follow - ups - today</span>
              <h3 className="text-[52px] font-extrabold text-slate-900 mt-2 mb-2 leading-none">{followUpsToday}</h3>
              <div className="flex items-center gap-1.5 mt-2">
                <span className="text-[#22c55e] font-extrabold text-[14px] flex items-center bg-emerald-50 px-2 py-0.5 rounded-full">
                  <svg className="w-4 h-4 mr-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" /></svg>
                  +3.5%
                </span>
                <span className="text-slate-500 text-[13.5px] font-semibold">vs last month</span>
              </div>
            </div>

            {/* Card 3: Closed this month (Yellow/Orange top border) */}
            <div className="bg-white rounded-[26px] p-6 shadow-sm border border-slate-100 hover:border-slate-200 transition-all duration-300 transform hover:-translate-y-1 cursor-default relative overflow-hidden">
              {/* Highlight orange accent top bar */}
              <div className="absolute top-0 left-0 right-0 h-[6px] bg-[#f59e0b] rounded-t-full" />
              
              <span className="text-slate-800 font-bold text-[14.5px] uppercase tracking-wider block">Closed this month</span>
              <h3 className="text-[52px] font-extrabold text-slate-900 mt-2 mb-2 leading-none">{closedThisMonth}</h3>
              <div className="flex items-center gap-1.5 mt-2">
                <span className="text-[#ef4444] font-extrabold text-[14px] flex items-center bg-rose-50 px-2 py-0.5 rounded-full">
                  <svg className="w-4 h-4 mr-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M12 13a1 1 0 110 2H7a1 1 0 01-1-1V9a1 1 0 112 0v2.586l4.293-4.293a1 1 0 011.414 0L12 9.586l4.293-4.293a1 1 0 111.414 1.414l-5 5a1 1 0 01-1.414 0L12 9.414 8.414 13H12z" clipRule="evenodd" /></svg>
                  -2.5%
                </span>
                <span className="text-slate-500 text-[13.5px] font-semibold">need reviews</span>
              </div>
            </div>

          </div>

          {/* Table Filters Panel matching mockup */}
          <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center gap-4 justify-between">
            {/* Inline search filter bar */}
            <div className="relative flex-1 max-w-md">
              <span className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400">
                <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
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
                  className="bg-[#F3F2F1]/70 text-slate-700 font-bold px-4 py-2.5 rounded-2xl text-[13.5px] flex items-center gap-2 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  {statusFilter}
                  <svg className={`w-4.5 h-4.5 text-slate-500 transition-transform ${showStatusDropdown ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
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
                  <svg className="w-4.5 h-4.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
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

              {/* Filter CTA Button (Styling: pink background, brand red text and funnel icon) */}
              <button
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("All status");
                  addToast("All filter settings cleared!", "info");
                }}
                className="bg-[#FDF2F2] text-brand font-extrabold px-5 py-2.5 rounded-2xl text-[13.5px] flex items-center gap-2 hover:bg-red-100/50 transition-colors cursor-pointer"
              >
                <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
                Filter
              </button>

            </div>
          </div>

          {/* Dynamic Table Card Grid Container */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            
            {/* Desktop and Tablet table presentation */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full min-w-[700px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th className="py-4.5 px-6 font-extrabold text-[14px] text-brand uppercase tracking-wider">Property interest</th>
                    <th className="py-4.5 px-6 font-extrabold text-[14px] text-brand uppercase tracking-wider">Sourse</th>
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
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-[12px] font-extrabold bg-[#FDF2F2] text-[#EB3539] border border-red-200/50 shadow-sm animate-pulse-subtle">
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
                        <td className="py-4 px-6 text-right relative">
                          <button
                            onClick={() => {
                              setActiveRowActionId(activeRowActionId === lead.id ? null : lead.id);
                            }}
                            className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                          >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" /></svg>
                          </button>

                          {/* Row Actions Menu overlay */}
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
                                  <svg className="w-3.8 h-3.8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
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

            {/* Mobile Only Presentation: Transforms columns into elegant vertical cards */}
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

        </div>
      </main>

      {/* Add New Lead Modal Overlay - Styled premium, floating card */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-[32px] p-6 w-full max-w-md border border-slate-100 shadow-2xl animate-scale-up">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <h3 className="text-xl font-extrabold text-slate-800 tracking-tight">Add New Lead</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <svg className="w-5.5 h-5.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
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

      {/* Profile Name Edit Modal Overlay */}
      {isEditingName && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm border border-slate-100 shadow-2xl animate-scale-up">
            <h3 className="text-lg font-bold text-slate-800 mb-4 font-sans">Edit Profile Name</h3>
            <input
              type="text"
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-[15px] focus:ring-2 focus:ring-brand/20 outline-none mb-4 font-medium"
              placeholder="Enter name"
              autoFocus
            />
            <div className="flex gap-2 justify-end font-semibold text-[14px]">
              <button
                onClick={() => setIsEditingName(false)}
                className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveName}
                className="px-4 py-2 rounded-xl bg-brand hover:bg-brand-hover text-white cursor-pointer shadow-md shadow-brand/10"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
