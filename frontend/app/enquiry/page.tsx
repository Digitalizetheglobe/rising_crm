"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import EnquiryDetailModule from "../../Components/enquiryDetailModule";

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
}

export default function EnquiryPage() {
  // Sidebar state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("Enquiries");

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
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showTimeDropdown, setShowTimeDropdown] = useState(false);
  const [timeRange, setTimeRange] = useState("Last 30 days");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);

  // Row Action Dropdown state
  const [activeRowActionId, setActiveRowActionId] = useState<string | null>(null);

  // Add Enquiry modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newEnquiryName, setNewEnquiryName] = useState("");
  const [newEnquirySource, setNewEnquirySource] = useState("Website");
  const [newEnquiryContact, setNewEnquiryContact] = useState("");
  const [newEnquiryMessage, setNewEnquiryMessage] = useState("");
  const [newEnquiryStatus, setNewEnquiryStatus] = useState<"Pending" | "Converted lead">("Pending");

  // Detail Enquiry modal state
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedEnquiry, setSelectedEnquiry] = useState<Enquiry | null>(null);

  // Initial Enquiries list (starts empty and is populated from backend)
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, pending: 0, converted: 0 });

  const getAuthHeaders = () => {
    const token = localStorage.getItem("crm_token");
    return {
      "Content-Type": "application/json",
      "Authorization": token ? (token.startsWith("Bearer ") ? token : `Bearer ${token}`) : "",
    };
  };

  const fetchEnquiries = async () => {
    setLoading(true);
    try {
      let url = `http://localhost:5000/api/v1/enquiries?page=${currentPage}&limit=10`;
      if (searchQuery) {
        url += `&search=${encodeURIComponent(searchQuery)}`;
      }
      if (statusFilter !== "All status") {
        const mappedStatus = statusFilter === "Converted lead" ? "Converted" : statusFilter;
        url += `&status=${mappedStatus}`;
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
      const res = await fetch(`http://localhost:5000/api/v1/enquiries/stats`, {
        headers: getAuthHeaders()
      });
      const json = await res.json();
      if (json.success && json.data) {
        const pendingCount = (json.data.byStatus || []).find((s: any) => s._id === "Pending")?.count || 0;
        setStats({
          total: json.data.total,
          pending: pendingCount,
          converted: json.data.converted
        });
      }
    } catch (err) {
      console.error("Failed to load stats", err);
    }
  };

  // Sync token and load data
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (!localStorage.getItem("crm_token")) {
        localStorage.setItem("crm_token", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJVc2VySWQiOiI2YTE5OGYxY2E5MmQyZGViMGM2NGE3Y2QiLCJyb2xlIjoiU1VQRVJfQURNSU4iLCJpYXQiOjE3ODA1NjU3NTUsImV4cCI6MTgxMjEwMTc1NX0._QWpjMR0kNPIQtgzGZYJg3ESfU4ZRY3yI4dNbMQdMP4");
      }
    }
    fetchEnquiries();
    fetchStats();
  }, [currentPage, searchQuery, statusFilter]);

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

  // KPI Computations based on dynamic stats state
  const totalEnquiriesCount = stats.total;
  const pendingCount = stats.pending;
  const convertedCount = stats.converted;
  const totalLeadsCount = convertedCount;

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
      const payload = {
        name: newEnquiryName.trim(),
        phone: newEnquiryContact.trim(),
        source: newEnquirySource,
        message: newEnquiryMessage.trim(),
      };

      const res = await fetch("http://localhost:5000/api/v1/enquiries", {
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
      const res = await fetch(`http://localhost:5000/api/v1/enquiries/${id}`, {
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
        // 1. Update status to Qualified first (requirement of convertToLeadService)
        const statusRes = await fetch(`http://localhost:5000/api/v1/enquiries/${id}/status`, {
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

        const convertRes = await fetch(`http://localhost:5000/api/v1/enquiries/${id}/convert`, {
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
        const res = await fetch(`http://localhost:5000/api/v1/enquiries/${id}/status`, {
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
      addToast(err.message || "Error updating status", "info");
    }
    setActiveRowActionId(null);
  };

  // Filtered Enquiries
  const filteredEnquiries = enquiries;

  // Sidebar Menu Items
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
  ];

  // Render Sidebar Content Helper
  const renderSidebarContent = () => (
    <div className="flex flex-col h-full bg-[#FAF5F5] border-r border-red-100/50 p-6 overflow-y-auto">
      {/* Exact Logo visual recreation */}
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
              className={`w-full flex items-center cursor-pointer gap-3.5 px-4 py-3 rounded-2xl text-[15px] font-semibold transition-all duration-300 ${isActive
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
          className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-[15px] font-semibold transition-all duration-300 ${activeTab === "Setting"
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
              className="w-full bg-white text-brand hover:bg-brand-light font-bold text-[13px] py-2 px-4 rounded-xl shadow-sm transition-all duration-300 active:scale-95 cursor-pointer font-sans"
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

      {/* 1. Desktop Sticky Left Sidebar (Hidden on Mobile/Tablet) */}
      <aside className="hidden lg:block w-72 h-full flex-shrink-0">
        {renderSidebarContent()}
      </aside>

      {/* 2. Mobile/Tablet Collapsible Drawer Sidebar (Animated Slide-in) */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          {/* Overlay mask */}
          <div
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300"
          />
          {/* Drawer container */}
          <aside className="relative w-72 max-w-xs h-full bg-[#FAF5F5] z-10 shadow-2xl animate-slide-in-right">
            {renderSidebarContent()}
            {/* Close drawer button */}
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="absolute top-5 right-5 p-1 rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </aside>
        </div>
      )}

      {/* 3. Toast Notifications rendering anchor */}
      <div className="fixed bottom-6 right-6 z-50 space-y-2 max-w-sm pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center gap-3 px-5 py-4 rounded-2xl shadow-xl border border-slate-100/50 bg-white/95 backdrop-blur-md animate-scale-up`}
          >
            {toast.type === "success" ? (
              <span className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              </span>
            ) : (
              <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </span>
            )}
            <p className="text-[14.5px] font-semibold text-slate-700">{toast.message}</p>
          </div>
        ))}
      </div>

      {/* 4. Right CRM Workspace Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">

        {/* Top Header */}
        <header className="bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between z-30">
          <div className="flex items-center gap-3">
            {/* Hamburger Toggle */}
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
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

              {/* Notification Dropdown Menu */}
              {showNotifications && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                  <div className="absolute right-0 mt-2.5 w-80 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 p-4 animate-scale-up font-semibold">
                    <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-100 font-bold">
                      <h4 className="font-bold text-[15px] text-slate-800">Notifications</h4>
                      <button
                        onClick={() => {
                          setShowNotifications(false);
                          addToast("Cleared all notifications", "success");
                        }}
                        className="text-[12px] font-bold text-brand hover:underline cursor-pointer"
                      >
                        Clear All
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

            {/* Profile Avatar */}
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

              {/* Profile Dropdown Menu */}
              {showProfileMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)} />
                  <div className="absolute right-0 mt-2.5 w-60 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 p-4 animate-scale-up font-semibold text-[14px]">
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
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
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
                            addToast("Logout simulation completed", "info");
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
        <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-6 bg-[#FDFCFB]">

          {/* Main Title & Action Row */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Enquiries</h1>
              <p className="text-slate-500 mt-1 text-[15px] font-semibold">Capture and convert enquiries into leads</p>
            </div>

            {/* Quick Action Button to Add Enquiry */}
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="bg-brand hover:bg-brand-hover text-white text-[14px] font-bold px-5 py-2.5 rounded-xl shadow-md shadow-brand/10 flex items-center gap-2 self-start sm:self-auto transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer font-sans"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
              Add Enquiry
            </button>
          </div>

          {/* 4 KPI Metric Cards - Visual representation of the 4 card blocks */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

            {/* Card 1: Total Enquiries (Dark Gray top border) */}
            <div className="bg-white rounded-[26px] p-6 shadow-sm border border-slate-100 hover:border-slate-200 transition-all duration-300 transform hover:-translate-y-1 cursor-default relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-[6px] bg-[#1e293b] rounded-t-full" />
              <span className="text-slate-800 font-bold text-[14.5px] uppercase tracking-wider block">Total Enquiries</span>
              <h3 className="text-[52px] font-extrabold text-slate-900 mt-2 mb-2 leading-none">{totalEnquiriesCount}</h3>
              <div className="flex items-center gap-1.5 mt-2">
                <span className="text-slate-500 font-extrabold text-[14px] flex items-center bg-slate-50 px-2 py-0.5 rounded-full">
                  <svg className="w-4 h-4 mr-0.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  2hr ago
                </span>
              </div>
            </div>

            {/* Card 2: Pending (Orange top border) */}
            <div className="bg-white rounded-[26px] p-6 shadow-sm border border-slate-100 hover:border-slate-200 transition-all duration-300 transform hover:-translate-y-1 cursor-default relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-[6px] bg-[#f59e0b] rounded-t-full" />
              <span className="text-slate-800 font-bold text-[14.5px] uppercase tracking-wider block">Pending</span>
              <h3 className="text-[52px] font-extrabold text-slate-900 mt-2 mb-2 leading-none">{pendingCount}</h3>
              <div className="flex items-center gap-1.5 mt-2">
                <span className="text-slate-500 font-extrabold text-[14px] flex items-center bg-amber-50/50 px-2 py-0.5 rounded-full">
                  <svg className="w-4 h-4 mr-0.5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                  Called : yesterday
                </span>
              </div>
            </div>

            {/* Card 3: Converted to lead (Blue top border) */}
            <div className="bg-white rounded-[26px] p-6 shadow-sm border border-slate-100 hover:border-slate-200 transition-all duration-300 transform hover:-translate-y-1 cursor-default relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-[6px] bg-[#3b82f6] rounded-t-full" />
              <span className="text-slate-800 font-bold text-[14.5px] uppercase tracking-wider block">Converted to lead</span>
              <h3 className="text-[52px] font-extrabold text-slate-900 mt-2 mb-2 leading-none">{convertedCount}</h3>
              <div className="flex items-center gap-1.5 mt-2">
                <span className="text-slate-500 font-extrabold text-[14px] flex items-center bg-blue-50/50 px-2 py-0.5 rounded-full">
                  <svg className="w-4 h-4 mr-0.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
                  Tour booked : 14 may
                </span>
              </div>
            </div>

            {/* Card 4: Total leads (Green top border) */}
            <div className="bg-white rounded-[26px] p-6 shadow-sm border border-slate-100 hover:border-slate-200 transition-all duration-300 transform hover:-translate-y-1 cursor-default relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-[6px] bg-[#10b981] rounded-t-full" />
              <span className="text-slate-800 font-bold text-[14.5px] uppercase tracking-wider block">Total leads</span>
              <h3 className="text-[52px] font-extrabold text-slate-900 mt-2 mb-2 leading-none">{totalLeadsCount}</h3>
              <div className="flex items-center gap-1.5 mt-2">
                <span className="text-slate-500 font-extrabold text-[14px] flex items-center bg-emerald-50/50 px-2 py-0.5 rounded-full">
                  <svg className="w-4 h-4 mr-0.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
                  Tour booked : 14 may
                </span>
              </div>
            </div>

          </div>

          {/* Table Filters Panel matching mockup */}
          <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center gap-4 justify-between">
            {/* Left side search input bar */}
            <div className="relative w-full md:w-96">
              <span className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400">
                <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </span>
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-[#F3F2F1]/70 text-slate-700 pl-11 pr-4 py-2.5 rounded-2xl text-[14px] border-none outline-none focus:ring-2 focus:ring-brand/20 focus:bg-white transition-all font-semibold"
              />
            </div>

            {/* Right side dropdown options */}
            <div className="flex flex-wrap items-center gap-3">

              {/* Status dropdown selector */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowStatusDropdown(!showStatusDropdown);
                    setShowTimeDropdown(false);
                  }}
                  className="bg-[#F3F2F1]/70 text-slate-700 font-bold px-4 py-2.5 rounded-2xl text-[13.5px] flex items-center gap-2 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  {statusFilter}
                  <svg className={`w-4 h-4 transition-transform duration-200 ${showStatusDropdown ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                </button>

                {showStatusDropdown && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowStatusDropdown(false)} />
                    <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 p-2 animate-scale-up font-semibold text-[13.5px]">
                      {(["All status", "Pending", "Converted lead"] as const).map((status) => (
                        <button
                          key={status}
                          onClick={() => {
                            setStatusFilter(status);
                            setShowStatusDropdown(false);
                            setCurrentPage(1);
                            addToast(`Filter status changed to "${status}"`, "info");
                          }}
                          className={`w-full text-left px-3.5 py-2.5 rounded-xl transition-colors cursor-pointer flex items-center justify-between ${statusFilter === status ? "bg-brand-light text-brand font-bold" : "text-slate-600 hover:bg-slate-50"
                            }`}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Date-Range filter capsule */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowTimeDropdown(!showTimeDropdown);
                    setShowStatusDropdown(false);
                  }}
                  className="bg-[#F3F2F1]/70 text-slate-700 font-bold px-4 py-2.5 rounded-2xl text-[13.5px] flex items-center gap-2.5 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  {timeRange}
                </button>

                {showTimeDropdown && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowTimeDropdown(false)} />
                    <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 p-2 animate-scale-up font-semibold text-[13.5px]">
                      {(["Last 30 days", "Last 3 months", "Last 12 months"] as const).map((range) => (
                        <button
                          key={range}
                          onClick={() => {
                            setTimeRange(range);
                            setShowTimeDropdown(false);
                            addToast(`Date range set to ${range}`, "info");
                          }}
                          className={`w-full text-left px-3.5 py-2.5 rounded-xl transition-colors cursor-pointer ${timeRange === range ? "bg-brand-light text-brand font-bold" : "text-slate-600 hover:bg-slate-50"
                            }`}
                        >
                          {range}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Pink Filter Reset trigger pill */}
              <button
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("All status");
                  setTimeRange("Last 30 days");
                  addToast("All filter inputs reset to defaults", "info");
                }}
                className="bg-[#FDF2F2] text-brand font-extrabold px-5 py-2.5 rounded-2xl text-[13.5px] flex items-center gap-2 hover:bg-red-100/50 transition-colors cursor-pointer font-sans"
              >
                <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3c.132 0 .263 0 .393.007a7.5 7.5 0 007.92 12.446a9 9 0 11-8.313-12.454z" /></svg>
                Filter
              </button>

            </div>
          </div>

          {/* 5. Main Enquiries Interactive List Container */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm ">

            {/* Desktop and Tablet Responsive Data Table */}
            <div className="hidden sm:block overflow-visible">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-[#FCFBFB]">
                    <th className="py-4.5 px-6 font-extrabold text-[14px] text-brand uppercase tracking-wider">Name</th>
                    <th className="py-4.5 px-6 font-extrabold text-[14px] text-brand uppercase tracking-wider">Sourse</th>
                    <th className="py-4.5 px-6 font-extrabold text-[14px] text-brand uppercase tracking-wider">Contact no</th>
                    <th className="py-4.5 px-6 font-extrabold text-[14px] text-brand uppercase tracking-wider">Status</th>
                    <th className="py-4.5 px-6 font-extrabold text-[14px] text-brand uppercase tracking-wider">Message</th>
                    <th className="py-4.5 px-6 font-extrabold text-[14px] text-brand uppercase tracking-wider">Last contacted</th>
                    <th className="py-4.5 px-6 font-extrabold text-[14px] text-brand uppercase tracking-wider text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold text-[14.5px] text-slate-700">
                  {filteredEnquiries.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                        No enquiries matched your filter search criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredEnquiries.map((enq) => (
                      <tr
                        key={enq.id}
                        // onClick={() => { setSelectedEnquiry(enq); setIsDetailModalOpen(true); }}
                        className={`hover:bg-slate-50/50 transition-colors group ${activeRowActionId === enq.id ? 'relative z-50' : 'relative z-0'}`}
                      >
                        {/* Name column */}
                        <td className="py-4 px-6 text-slate-800 font-bold">{enq.name}</td>

                        {/* Source column */}
                        <td className="py-4 px-6 text-slate-500 font-medium">{enq.source}</td>

                        {/* Contact no column */}
                        <td className="py-4 px-6 text-slate-600 font-bold">{enq.contactNo}</td>

                        {/* Status badge pill */}
                        <td className="py-4 px-6">
                          {enq.status === "Pending" ? (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-[12px] font-extrabold bg-[#FDF2F2] text-[#EB3539] border border-red-200/50 shadow-sm animate-pulse-subtle">
                              Pending
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-[12px] font-extrabold bg-[#F0FDF4] text-[#15803d] border border-emerald-200/50 shadow-sm">
                              Converted lead
                            </span>
                          )}
                        </td>

                        {/* Message column */}
                        <td className="py-4 px-6 text-slate-500 max-w-xs truncate font-medium" title={enq.message}>
                          {enq.message}
                        </td>

                        {/* Last contacted column */}
                        <td className="py-4 px-6 text-slate-400 font-semibold">{enq.lastContacted}</td>

                        {/* Action three dots menu */}
                        <td className="py-4 px-6 text-right relative">
                          <button
                            onClick={() => setActiveRowActionId(activeRowActionId === enq.id ? null : enq.id)}
                            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
                          </button>

                          {activeRowActionId === enq.id && (
                            <>
                              <div className="fixed inset-0 z-45" onClick={() => setActiveRowActionId(null)} />
                              <div className="absolute right-6 mt-1 w-44 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 p-1.5 text-left font-semibold text-[13.5px] animate-scale-up">
                                {enq.status === "Pending" ? (
                                  <button
                                    onClick={() => handleChangeStatus(enq.id, "Converted lead")}
                                    className="w-full text-left px-3.5 py-2.5 rounded-xl hover:bg-emerald-50 text-emerald-600 flex items-center gap-2 cursor-pointer font-sans"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    Convert to Lead
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleChangeStatus(enq.id, "Pending")}
                                    className="w-full text-left px-3.5 py-2.5 rounded-xl hover:bg-amber-50 text-amber-600 flex items-center gap-2 cursor-pointer font-sans"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 15.89M9 11l3-3 3 3m-3-3v12" /></svg>
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
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                                  View Details
                                </button>
                                <button
                                  onClick={() => handleDeleteEnquiry(enq.id)}
                                  className="w-full text-left px-3.5 py-2.5 rounded-xl hover:bg-rose-50 text-rose-600 flex items-center gap-2 cursor-pointer font-sans"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
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
            </div>

            {/* Mobile Viewports: Vertical card-based visual lists instead of horizontal tables */}
            <div className="block sm:hidden divide-y divide-slate-100 bg-[#FCFBFB]">
              {filteredEnquiries.length === 0 ? (
                <div className="py-12 text-center text-slate-400 font-semibold px-4">
                  No enquiries matched your filter search criteria.
                </div>
              ) : (
                filteredEnquiries.map((enq) => (
                  <div key={enq.id} className="p-4 flex flex-col gap-3 bg-white">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-800 font-bold text-[16px]">{enq.name}</span>

                      {/* Status badge */}
                      {enq.status === "Pending" ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-[#FDF2F2] text-[#EB3539] border border-red-200/50 shadow-xs">
                          Pending
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-[#F0FDF4] text-[#15803d] border border-emerald-200/50 shadow-xs">
                          Converted lead
                        </span>
                      )}
                    </div>

                    <div className="text-[13.5px] font-semibold text-slate-500 space-y-1">
                      <div className="flex justify-between">
                        <span>Source:</span>
                        <span className="text-slate-700 font-bold">{enq.source}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Contact no:</span>
                        <span className="text-slate-800 font-extrabold">{enq.contactNo}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Last contacted:</span>
                        <span className="text-slate-400 font-semibold">{enq.lastContacted}</span>
                      </div>
                    </div>

                    {/* Message section */}
                    <div className="bg-[#FAF9F9] rounded-xl p-3 border border-slate-100 text-[13.5px] text-slate-600 font-medium mt-1">
                      <span className="font-bold text-slate-800 block mb-0.5 text-[11px] uppercase tracking-wider">Enquiry Message</span>
                      {enq.message}
                    </div>

                    {/* Action buttons inside card */}
                    <div className="flex items-center gap-2 justify-end pt-2 border-t border-slate-100 mt-1">
                      {enq.status === "Pending" ? (
                        <button
                          onClick={() => handleChangeStatus(enq.id, "Converted lead")}
                          className="bg-emerald-50 text-[#15803d] hover:bg-emerald-100/70 text-[12px] font-bold px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all cursor-pointer font-sans"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                          Convert to Lead
                        </button>
                      ) : (
                        <button
                          onClick={() => handleChangeStatus(enq.id, "Pending")}
                          className="bg-amber-50 text-amber-600 hover:bg-amber-100/70 text-[12px] font-bold px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all cursor-pointer font-sans"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 15.89M9 11l3-3 3 3m-3-3v12" /></svg>
                          Mark Pending
                        </button>
                      )}

                      <button
                        onClick={() => handleDeleteEnquiry(enq.id)}
                        className="bg-rose-50 text-rose-600 hover:bg-rose-100/70 text-[12px] font-bold px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all cursor-pointer font-sans"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7" /></svg>
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Premium, Interactive Pagination Component */}
            <div className="py-4 px-6 border-t border-slate-100 bg-[#FCFBFB] flex items-center justify-center gap-1 flex-wrap">
              <button
                onClick={() => {
                  if (currentPage > 1) {
                    setCurrentPage(currentPage - 1);
                    addToast(`Navigated to page ${currentPage - 1}`, "info");
                  }
                }}
                className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-slate-500 transition-all ${currentPage === 1 ? "opacity-40 cursor-not-allowed" : "hover:bg-slate-100 hover:text-slate-800 cursor-pointer"
                  }`}
                disabled={currentPage === 1}
              >
                <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => {
                    setCurrentPage(page);
                    addToast(`Navigated to page ${page}`, "info");
                  }}
                  className={`w-9 h-9 rounded-xl font-bold transition-all cursor-pointer ${currentPage === page
                    ? "bg-brand text-white shadow-md shadow-brand/20"
                    : "text-slate-600 hover:bg-slate-100"
                    }`}
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
                className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-slate-500 transition-all ${currentPage === totalPages ? "opacity-40 cursor-not-allowed" : "hover:bg-slate-100 hover:text-slate-800 cursor-pointer"
                  }`}
                disabled={currentPage === totalPages}
              >
                <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>

          </div>

        </div>
      </main>

      {/* 6. "Add New Enquiry" Modal overlay form */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-[32px] w-full max-w-lg border border-slate-100 shadow-2xl p-6 md:p-8 animate-scale-up">

            <div className="flex justify-between items-center pb-4 border-b border-slate-100 mb-5">
              <h2 className="text-xl font-extrabold text-slate-900">Add New Enquiry</h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
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
                  placeholder="e.g. inserted in 3 bhk"
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
                      className={`py-2.5 px-3 rounded-xl border-2 transition-all font-extrabold text-[12.5px] cursor-pointer ${newEnquiryStatus === status
                        ? "border-brand bg-brand-light text-brand shadow-xs"
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
      )}

      {/* 7. Profile Name Edit Modal Overlay */}
      {isEditingName && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
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
                className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 cursor-pointer font-sans"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveName}
                className="px-4 py-2 rounded-xl bg-brand hover:bg-brand-hover text-white cursor-pointer shadow-md shadow-brand/10 font-sans"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. Enquiry Detail Modal */}
      <EnquiryDetailModule
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedEnquiry(null);
        }}
        enquiry={selectedEnquiry}
      />

    </div>
  );
}
