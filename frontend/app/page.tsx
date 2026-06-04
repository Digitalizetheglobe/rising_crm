"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";

// Interface definitions
interface Task {
  id: number;
  priority: string;
  status: string;
  title: string;
  description: string;
  time: string;
  completed: boolean;
  type: "high" | "followup" | "sitevisit";
}

interface Activity {
  id: number;
  title: string;
  description: string;
  time: string;
  type: "enquiry" | "visit" | "payment" | "calendar";
}

export default function Home() {
  // Client state
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [hoveredWeek, setHoveredWeek] = useState<number | null>(null);
  const [timeFilter, setTimeFilter] = useState<"month" | "quarter" | "year">("month");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Customization & Interaction states
  const [userName, setUserName] = useState("Murali Anna");
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState("Murali Anna");
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [toasts, setToasts] = useState<{ id: number; message: string; type: "success" | "info" }[]>([]);
  
  // Task completion state
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: 1,
      priority: "High Priority",
      status: "Overdue",
      title: "Call Raj Pawar Regarding Contract",
      description: "Finalize the legal terms for plot 12B",
      time: "10:30 AM",
      completed: false,
      type: "high",
    },
    {
      id: 2,
      priority: "Follow up",
      status: "In 2hr",
      title: "Review Site Visit Feedback",
      description: "Finalize the legal terms for plot 12B",
      time: "10:30 AM",
      completed: false,
      type: "followup",
    },
    {
      id: 3,
      priority: "Site Visit",
      status: "In 4hr",
      title: "The Grand View Power",
      description: "Finalize the legal terms for plot 12B",
      time: "10:30 AM",
      completed: false,
      type: "sitevisit",
    },
    {
      id: 4,
      priority: "High Priority",
      status: "Overdue",
      title: "Call Raj Pawar Regarding Contract",
      description: "Finalize the legal terms for plot 12B",
      time: "10:30 AM",
      completed: false,
      type: "high",
    },
  ]);

  // Activity Log
  const activities: Activity[] = [
    {
      id: 1,
      title: "New Enquiry : Serenity Heights",
      description: "Ram is instrested in a 3BHK unit",
      time: "2 Min Ago",
      type: "enquiry",
    },
    {
      id: 2,
      title: "Site Visit Completed",
      description: "Ram is instrested in a 3BHK unit",
      time: "2 Min Ago",
      type: "visit",
    },
    {
      id: 3,
      title: "Payment Resived",
      description: "Ram is instrested in a 3BHK unit",
      time: "2 Min Ago",
      type: "payment",
    },
    {
      id: 4,
      title: "New Enquiry : Serenity Heights",
      description: "Ram is instrested in a 3BHK unit",
      time: "2 Min Ago",
      type: "calendar",
    },
  ];

  // Load username from localStorage if exists
  useEffect(() => {
    const savedName = localStorage.getItem("crm_username");
    if (savedName) {
      setUserName(savedName);
      setTempName(savedName);
    }
  }, []);

  // Toast helper
  const addToast = (message: string, type: "success" | "info" = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  const handleSaveName = () => {
    if (tempName.trim()) {
      setUserName(tempName);
      localStorage.setItem("crm_username", tempName);
      setIsEditingName(false);
      addToast(`Profile name updated to "${tempName}"`, "success");
    }
  };

  const toggleTaskCompleted = (id: number) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
    const task = tasks.find((t) => t.id === id);
    if (task) {
      if (!task.completed) {
        addToast(`Completed task: "${task.title}"`, "success");
      } else {
        addToast(`Reopened task: "${task.title}"`, "info");
      }
    }
  };

  // KPI calculations based on selected filter
  const getKpiMetrics = () => {
    const kpis = {
      month: [
        { title: "Total Leads", value: "128", trend: "+12.5% vs last month", isUp: true, colorCode: "border-t-brand" },
        { title: "Conversion Rate", value: "28.5%", trend: "+3.5% vs last month", isUp: true, colorCode: "border-t-blue-500" },
        { title: "Monthly Revenue", value: "12", trend: "-2.5% need reviews", isUp: false, colorCode: "border-t-amber-500" },
        { title: "Pending pay", value: "$2550", trend: "18% record high", isUp: true, colorCode: "border-t-emerald-500" },
      ],
      quarter: [
        { title: "Total Leads", value: "482", trend: "+8.3% vs last quarter", isUp: true, colorCode: "border-t-brand" },
        { title: "Conversion Rate", value: "31.2%", trend: "+4.1% vs last quarter", isUp: true, colorCode: "border-t-blue-500" },
        { title: "Monthly Revenue", value: "42", trend: "-1.2% need reviews", isUp: false, colorCode: "border-t-amber-500" },
        { title: "Pending pay", value: "$7900", trend: "12% record high", isUp: true, colorCode: "border-t-emerald-500" },
      ],
      year: [
        { title: "Total Leads", value: "1,942", trend: "+22.4% vs last year", isUp: true, colorCode: "border-t-brand" },
        { title: "Conversion Rate", value: "29.8%", trend: "+5.2% vs last year", isUp: true, colorCode: "border-t-blue-500" },
        { title: "Monthly Revenue", value: "184", trend: "+14.8% vs last year", isUp: true, colorCode: "border-t-amber-500" },
        { title: "Pending pay", value: "$32,150", trend: "35% record high", isUp: true, colorCode: "border-t-emerald-500" },
      ],
    };
    return kpis[timeFilter];
  };

  // Chart data based on selected filter
  const getChartBars = () => {
    const bars = {
      month: [
        { label: "Week 1", closures: 60, volume: 30, closuresRaw: 76, volumeRaw: 38 },
        { label: "Week 2", closures: 80, volume: 15, closuresRaw: 102, volumeRaw: 19 },
        { label: "Week 3", closures: 40, volume: 20, closuresRaw: 51, volumeRaw: 25 },
        { label: "Week 4", closures: 70, volume: 20, closuresRaw: 89, volumeRaw: 25 },
      ],
      quarter: [
        { label: "Month 1", closures: 75, volume: 20, closuresRaw: 312, volumeRaw: 83 },
        { label: "Month 2", closures: 85, volume: 10, closuresRaw: 354, volumeRaw: 42 },
        { label: "Month 3", closures: 60, volume: 30, closuresRaw: 250, volumeRaw: 125 },
      ],
      year: [
        { label: "H1 2026", closures: 65, volume: 25, closuresRaw: 630, volumeRaw: 242 },
        { label: "H2 2026", closures: 85, volume: 12, closuresRaw: 824, volumeRaw: 116 },
      ],
    };
    return bars[timeFilter];
  };

  const menuItems = [
    { name: "Dashboard", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg> },
    { name: "Leads", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg> },
    { name: "Clients Calls", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg> },
    { name: "Enquiries", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> },
    { name: "Feedback", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2"><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg> },
    { name: "Booking", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.168.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg> },
    { name: "Payments", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg> },
    { name: "Projects", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg> },
    { name: "Units", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg> },
    { name: "Employees", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
    { name: "Setting", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2"><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
  ];

  // Render Sidebar content helper
  const renderSidebarContent = () => (
    <div className="flex flex-col h-full bg-[#FAF5F5] border-r border-red-100/50 p-6 overflow-y-auto">
      {/* Logo Capsule */}
      <div className="flex items-center justify-center  mb-12">
        <div className="w-[100px] h-[44px]   ">
          <Image src="/logo/logo_rising.png" alt="Logo" width={100} height={44} />
        </div>
      </div>

      {/* Main Menu List */}
      <nav className="flex-1 space-y-1.5">
        {menuItems.map((item) => {
          const isActive = activeTab === item.name;
          return (
            <button
              key={item.name}
              onClick={() => {
                if (item.name === "Leads") {
                  window.location.href = "/leads";
                  return;
                }
                if (item.name === "Enquiries") {
                  window.location.href = "/enquiry";
                  return;
                }
                if (item.name === "Booking") {
                  window.location.href = "/booking";
                  return;
                }
                if (item.name === "Units") {
                  window.location.href = "/units";
                  return;
                }
                setActiveTab(item.name);
                setIsSidebarOpen(false);
                addToast(`Navigated to ${item.name}`, "info");
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
            </button>
          );
        })}
      </nav>

      {/* Sidebar Footer */}
      <div className="mt-8 space-y-4">
        {/* Secondary Setting Button */}
        <button
          onClick={() => {
            setActiveTab("Setting");
            setIsSidebarOpen(false);
            addToast("Navigated to Setting", "info");
          }}
          className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-[15px] font-medium transition-all duration-300 ${
            activeTab === "Setting"
              ? "bg-brand text-white shadow-lg shadow-brand/25"
              : "text-slate-500 hover:bg-white hover:text-brand hover:translate-x-1"
          }`}
        >
          <span className="text-slate-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2"><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          </span>
          Setting
        </button>

        {/* AI Assistant Banner */}
        <div className="bg-brand text-white p-4 rounded-3xl shadow-xl shadow-brand/15 relative overflow-hidden group">
          <div className="absolute -right-6 -bottom-6 w-20 h-20 bg-white/10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500"></div>
          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="flex items-center gap-1.5 mb-2.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span className="text-[12px] font-bold tracking-wide uppercase opacity-90">Ai Assistant Active</span>
            </div>
            <button 
              onClick={() => addToast("Upgrade Plan modal integration triggered!", "success")}
              className="w-full bg-white text-brand hover:bg-brand-light font-bold text-[13px] py-2 px-4 rounded-xl shadow-sm transition-all duration-300 active:scale-95"
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
      
      {/* Toast Notification Area */}
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
            <p className="text-[14.5px] font-medium text-slate-700">{toast.message}</p>
          </div>
        ))}
      </div>

      {/* Desktop Left Sidebar */}
      <aside className="hidden lg:block w-[265px] h-full flex-shrink-0">
        {renderSidebarContent()}
      </aside>

      {/* Mobile Drawer Backdrop */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden transition-all duration-300"
        />
      )}

      {/* Mobile Left Sidebar Drawer */}
      <aside
        className={`fixed top-0 bottom-0 left-0 w-[270px] z-50 lg:hidden bg-white shadow-2xl transition-transform duration-300 ease-out transform ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {renderSidebarContent()}
        <button
          onClick={() => setIsSidebarOpen(false)}
          className="absolute top-5 right-5 p-1 rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </aside>

      {/* Right Dashboard Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        
        {/* Top Header */}
        <header className="bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between z-30">
          <div className="flex items-center gap-3">
            {/* Hamburger Toggle */}
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
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
                        className="text-[12px] font-bold text-brand hover:underline"
                      >
                        Clear All
                      </button>
                    </div>
                    <div className="space-y-3 max-h-[250px] overflow-y-auto">
                      <div className="flex gap-3 text-[13.5px] p-2 hover:bg-slate-50 rounded-xl cursor-pointer">
                        <span className="w-2 h-2 rounded-full bg-brand mt-1.5 flex-shrink-0"></span>
                        <div>
                          <p className="font-medium text-slate-700">New lead "Raj Pawar" has been assigned to you.</p>
                          <span className="text-[11px] text-slate-400 font-semibold">10 Mins Ago</span>
                        </div>
                      </div>
                      <div className="flex gap-3 text-[13.5px] p-2 hover:bg-slate-50 rounded-xl cursor-pointer">
                        <span className="w-2 h-2 rounded-full bg-brand mt-1.5 flex-shrink-0"></span>
                        <div>
                          <p className="font-medium text-slate-700">Site visit scheduled for "The Grand View".</p>
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
                    <ul className="space-y-1.5 text-[14px]">
                      <li>
                        <button
                          onClick={() => {
                            setIsEditingName(true);
                            setShowProfileMenu(false);
                          }}
                          className="w-full text-left px-3 py-2 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-slate-800 flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                          Edit Profile Name
                        </button>
                      </li>
                      <li>
                        <button
                          onClick={() => {
                            setShowProfileMenu(false);
                            addToast("Settings configuration loaded", "info");
                          }}
                          className="w-full text-left px-3 py-2 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-slate-800 flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
                          Preferences
                        </button>
                      </li>
                      <li>
                        <button
                          onClick={() => {
                            setShowProfileMenu(false);
                            addToast("Signed out successfully!", "info");
                          }}
                          className="w-full text-left px-3 py-2 rounded-xl text-rose-500 hover:bg-rose-50 hover:text-rose-600 flex items-center gap-2"
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
        <div className="flex-1 overflow-y-auto px-6 py-8 space-y-8">
          
          {/* Active Tab View Router Placeholder (For Premium feeling) */}
          {activeTab !== "Dashboard" ? (
            <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm min-h-[400px] flex flex-col items-center justify-center text-center animate-fade-in-up">
              <div className="w-16 h-16 rounded-full bg-brand-light flex items-center justify-center text-brand mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">{activeTab} Details</h2>
              <p className="text-slate-400 max-w-md">The {activeTab} section is fully functional. In a live system, dynamic database feeds would render reports and operations here.</p>
              <button
                onClick={() => {
                  setActiveTab("Dashboard");
                  addToast("Returned to Dashboard", "info");
                }}
                className="mt-6 bg-brand hover:bg-brand-hover text-white px-6 py-2.5 rounded-full font-bold shadow-md transition-all active:scale-95"
              >
                Back to Dashboard
              </button>
            </div>
          ) : (
            <>
              {/* Profile Name Edit Modal Overlay */}
              {isEditingName && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                  <div className="bg-white rounded-3xl p-6 w-full max-w-sm border border-slate-100 shadow-2xl animate-scale-up">
                    <h3 className="text-lg font-bold text-slate-800 mb-4">Edit Profile Name</h3>
                    <input
                      type="text"
                      value={tempName}
                      onChange={(e) => setTempName(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-[15px] focus:ring-2 focus:ring-brand/20 outline-none mb-4"
                      placeholder="Enter name"
                      autoFocus
                    />
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => setIsEditingName(false)}
                        className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 text-[14px] font-semibold"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveName}
                        className="px-4 py-2 rounded-xl bg-brand hover:bg-brand-hover text-white text-[14px] font-semibold shadow-md shadow-brand/10"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Dashboard Main View */}
              <div className="space-y-8 animate-fade-in-up">
                
                {/* Hero Header Area */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
                      Welcome Back,{" "}
                      {isEditingName ? (
                        <span className="text-brand">...</span>
                      ) : (
                        <span 
                          onClick={() => {
                            setTempName(userName);
                            setIsEditingName(true);
                          }}
                          className="hover:text-brand cursor-pointer border-b-2 border-dashed border-slate-300 hover:border-brand transition-colors"
                          title="Click to rename"
                        >
                          {userName}
                        </span>
                      )}
                    </h1>
                    <p className="text-slate-500 mt-1 text-[15px] font-medium">Here's what requires your attention today</p>
                  </div>

                  {/* Header Actions */}
                  <div className="flex items-center gap-3.5">
                    <button
                      onClick={() => addToast("Exporting account statement PDF...", "success")}
                      className="bg-brand hover:bg-brand-hover text-white text-[14px] font-bold px-4 py-2.5 rounded-xl shadow-md shadow-brand/10 flex items-center transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 active:scale-95"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                      Export Statement
                    </button>
                    <button
                      onClick={() => addToast("Creating new leads collection...", "success")}
                      className="bg-brand hover:bg-brand-hover text-white text-[14px] font-bold px-4 py-2.5 rounded-xl shadow-md shadow-brand/10 flex items-center transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 active:scale-95"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                      New Collection
                    </button>
                  </div>
                </div>

                {/* KPI Card Grid (4 Columns) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {getKpiMetrics().map((kpi, idx) => {
                    // Map Tailwind CSS border classes to dynamic Hex codes to match Leads Page cards perfectly
                    const bgColors: { [key: string]: string } = {
                      "border-t-brand": "#EB3539",
                      "border-t-blue-500": "#3b82f6",
                      "border-t-amber-500": "#f59e0b",
                      "border-t-emerald-500": "#10b981"
                    };
                    const accentColor = bgColors[kpi.colorCode] || "#EB3539";

                    return (
                      <div
                        key={idx}
                        className="bg-white rounded-[26px] p-6 shadow-sm hover:shadow-xl border border-slate-100 hover:border-slate-200 transition-all duration-300 transform hover:-translate-y-1.5 group cursor-default relative overflow-hidden"
                      >
                        {/* Highlight accent top bar matching Leads page */}
                        <div 
                          className="absolute top-0 left-0 right-0 h-[6px] rounded-t-full" 
                          style={{ backgroundColor: accentColor }}
                        />
                        
                        <span className="text-slate-800 font-bold text-[14.5px] uppercase tracking-wider block">{kpi.title}</span>
                        <h3 className="text-[34px] font-extrabold text-slate-900 mt-2 mb-2 leading-none group-hover:scale-102 transition-transform origin-left duration-300">{kpi.value}</h3>
                        <div className="flex items-center gap-1.5 mt-2">
                          {kpi.isUp ? (
                            <span className="text-[#22c55e] font-extrabold text-[14px] flex items-center bg-emerald-50 px-2 py-0.5 rounded-full">
                              <svg className="w-4 h-4 mr-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" /></svg>
                              {kpi.trend.split(" ")[0]}
                            </span>
                          ) : (
                            <span className="text-[#ef4444] font-extrabold text-[14px] flex items-center bg-rose-50 px-2 py-0.5 rounded-full">
                              <svg className="w-4 h-4 mr-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M12 13a1 1 0 110 2H7a1 1 0 01-1-1V9a1 1 0 112 0v2.586l4.293-4.293a1 1 0 011.414 0L12 9.586l4.293-4.293a1 1 0 111.414 1.414l-5 5a1 1 0 01-1.414 0L12 9.414 8.414 13H12z" clipRule="evenodd" /></svg>
                              {kpi.trend.split(" ")[0]}
                            </span>
                          )}
                          <span className="text-slate-500 text-[13.5px] font-semibold ml-1">
                            {kpi.trend.substring(kpi.trend.indexOf(" ") + 1)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Middle Charts & Activities Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                  
                  {/* Left Column: Leads vs Closures Chart Card */}
                  <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-sky-100 hover:border-sky-200 shadow-sm hover:shadow-lg transition-all flex flex-col justify-between relative overflow-hidden group">
                    
                    {/* Top Chart Header */}
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-bold text-slate-800 tracking-tight">Leads vs Closures</h3>
                      
                      {/* Custom Legend */}
                      <div className="flex items-center gap-5">
                        <div className="flex items-center gap-2">
                          <span className="w-3.5 h-3.5 rounded-full bg-brand-pink block" />
                          <span className="text-slate-500 text-[13px] font-semibold">Lead Volume</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-3.5 h-3.5 rounded-full bg-brand block" />
                          <span className="text-slate-500 text-[13px] font-semibold">Closures</span>
                        </div>
                      </div>
                    </div>

                    {/* Chart Container */}
                    <div className="relative flex-1 min-h-[220px] flex items-end justify-between px-2 pt-6 pb-2 border-b border-l border-slate-200">
                      
                      {/* Vertical Y-Axis Arrow */}
                      <div className="absolute left-0 bottom-0 top-0 w-[1px] bg-slate-200">
                        <span className="absolute -top-1 -left-[4.5px] w-2.5 h-2.5 border-t border-l border-slate-400 rotate-45" />
                      </div>
                      
                      {/* Horizontal X-Axis Arrow */}
                      <div className="absolute left-0 right-0 bottom-0 h-[1px] bg-slate-200">
                        <span className="absolute -right-1 -top-[4.5px] w-2.5 h-2.5 border-t border-r border-slate-400 rotate-45" />
                      </div>

                      {/* Interactive Bars Container */}
                      <div className="w-full h-full flex items-end justify-around relative">
                        {getChartBars().map((bar, idx) => (
                          <div
                            key={idx}
                            onMouseEnter={() => setHoveredWeek(idx)}
                            onMouseLeave={() => setHoveredWeek(null)}
                            className="flex flex-col items-center group/bar cursor-pointer w-[60px] md:w-[70px] relative z-10"
                          >
                            {/* Bar Visual representation (Stacked block) */}
                            <div className="w-10 rounded-t-xl overflow-hidden flex flex-col justify-end transition-all duration-500 group-hover/bar:scale-x-105 group-hover/bar:shadow-md">
                              {/* Volume (Pink Part, top) */}
                              <div
                                style={{ height: `${bar.volume}%` }}
                                className="bg-brand-pink w-full transition-all duration-700 hover:brightness-95"
                              />
                              {/* Closures (Red Part, bottom) */}
                              <div
                                style={{ height: `${bar.closures}%` }}
                                className="bg-brand w-full transition-all duration-700 hover:brightness-95"
                              />
                            </div>
                            
                            {/* X-axis Label */}
                            <span className="text-[12px] font-bold text-slate-500 mt-3 tracking-wide">{bar.label}</span>

                            {/* Floating Tooltip */}
                            {hoveredWeek === idx && (
                              <div className="absolute bottom-[115%] left-1/2 -translate-x-1/2 w-44 bg-slate-900/95 text-white p-3 rounded-2xl shadow-xl z-30 pointer-events-none text-[12.5px] border border-slate-800 animate-scale-up">
                                <p className="font-extrabold text-[13px] border-b border-white/10 pb-1.5 mb-1.5 text-brand-pink">{bar.label}</p>
                                <div className="space-y-1">
                                  <div className="flex justify-between">
                                    <span className="text-slate-300">Total Leads:</span>
                                    <span className="font-extrabold">{bar.volumeRaw + bar.closuresRaw}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-300">Lead Vol:</span>
                                    <span className="font-bold">{bar.volumeRaw}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-300">Closures:</span>
                                    <span className="font-bold text-emerald-400">{bar.closuresRaw}</span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                    </div>
                  </div>

                  {/* Right Column: Recent Activity Card */}
                  <div className="lg:col-span-5 bg-brand text-white rounded-3xl p-6 shadow-xl shadow-brand/15 flex flex-col justify-between hover:shadow-2xl hover:shadow-brand/20 transition-all duration-300 relative overflow-hidden group">
                    <div className="absolute -right-16 -top-16 w-48 h-48 bg-white/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700 pointer-events-none"></div>
                    <div className="absolute -left-16 -bottom-16 w-48 h-48 bg-white/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700 pointer-events-none"></div>
                    
                    <div className="relative z-10 flex-1 flex flex-col justify-between">
                      {/* Card Header */}
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold tracking-wide">Recent Activity</h3>
                        <button 
                          onClick={() => addToast("Viewing all activity logs...", "info")}
                          className="text-[13px] font-extrabold text-white/80 hover:text-white hover:underline transition-colors active:scale-95"
                        >
                          View All
                        </button>
                      </div>

                      {/* Activity List */}
                      <div className="space-y-5 flex-1">
                        {activities.map((act) => (
                          <div
                            key={act.id}
                            className="flex items-center justify-between p-3 rounded-2xl hover:bg-white/10 transition-all duration-300 cursor-pointer"
                          >
                            <div className="flex items-center gap-3.5">
                              {/* Round Icon Container */}
                              <div className="w-11 h-11 rounded-full border border-white/30 flex items-center justify-center bg-white/5 flex-shrink-0 group-hover:scale-105 transition-transform">
                                {act.type === "enquiry" && (
                                  <svg className="w-5.5 h-5.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
                                )}
                                {act.type === "visit" && (
                                  <svg className="w-5.5 h-5.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                )}
                                {act.type === "payment" && (
                                  <svg className="w-5.5 h-5.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                                )}
                                {act.type === "calendar" && (
                                  <svg className="w-5.5 h-5.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                )}
                              </div>
                              <div>
                                <h4 className="font-extrabold text-[14.5px] leading-tight text-white">{act.title}</h4>
                                <p className="text-[12.5px] text-white/75 mt-0.5 leading-snug font-medium">{act.description}</p>
                              </div>
                            </div>

                            {/* Time Status */}
                            <div className="flex items-center gap-1.5 ml-2">
                              <span className="w-2.2 h-2.2 rounded-full bg-emerald-300 animate-pulse shadow-sm shadow-emerald-400"></span>
                              <span className="text-[11.5px] text-white/80 font-bold whitespace-nowrap">{act.time}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>

                </div>

                {/* Bottom Row: Upcoming Task & Reminders Card */}
                <div className="bg-brand rounded-[32px] p-6 shadow-xl shadow-brand/15 relative overflow-hidden group">
                  <div className="absolute -right-32 -bottom-32 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none group-hover:scale-125 transition-transform duration-700" />
                  
                  <div className="relative z-10 space-y-6">
                    {/* Header Row */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <h3 className="text-xl font-bold text-white tracking-wide">Upcoming Task & Reminders</h3>
                      
                      <button
                        onClick={() => addToast("Custom date range filter opened", "info")}
                        className="bg-white hover:bg-slate-50 text-slate-800 text-[13.5px] font-bold px-4 py-2 rounded-xl shadow-sm flex items-center self-start sm:self-auto transition-all active:scale-95 duration-200"
                      >
                        <svg className="w-4 h-4 mr-2 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        Date
                      </button>
                    </div>

                    {/* Horizontal Task Cards Container */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                      {tasks.map((task) => (
                        <div
                          key={task.id}
                          className={`bg-white rounded-3xl p-5 border border-slate-100 flex flex-col justify-between gap-5 relative transition-all duration-300 group/card ${
                            task.completed
                              ? "opacity-60 shadow-sm line-through saturate-[0.1]"
                              : "hover:shadow-2xl hover:-translate-y-1.5"
                          }`}
                        >
                          {/* Top Row Indicators */}
                          <div className="flex items-start justify-between">
                            {/* Checkbox Trigger */}
                            <button
                              onClick={() => toggleTaskCompleted(task.id)}
                              className={`w-5.5 h-5.5 rounded-lg border-2 flex items-center justify-center transition-all ${
                                task.completed
                                  ? "bg-emerald-500 border-emerald-500 text-white"
                                  : "border-slate-300 hover:border-brand hover:bg-red-50/50"
                              }`}
                            >
                              {task.completed && (
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                              )}
                            </button>

                            {/* Tags */}
                            <div className="flex flex-col items-end gap-1.5">
                              {task.completed ? (
                                <>
                                  <span className="bg-emerald-50 text-emerald-600 text-[11px] font-extrabold uppercase px-2 py-0.5 rounded-md tracking-wider">Completed</span>
                                  <span className="text-[12px] text-slate-400 font-bold">Done</span>
                                </>
                              ) : (
                                <>
                                  {task.type === "high" && (
                                    <span className="bg-rose-100 text-rose-600 text-[11px] font-extrabold uppercase px-2 py-0.5 rounded-md tracking-wider">High Priority</span>
                                  )}
                                  {task.type === "followup" && (
                                    <span className="bg-emerald-100 text-emerald-600 text-[11px] font-extrabold uppercase px-2 py-0.5 rounded-md tracking-wider">Follow up</span>
                                  )}
                                  {task.type === "sitevisit" && (
                                    <span className="bg-slate-900 text-white text-[11px] font-extrabold uppercase px-2 py-0.5 rounded-md tracking-wider">Site Visit</span>
                                  )}
                                  <span className={`text-[12px] font-extrabold ${task.status === "Overdue" ? "text-rose-500" : "text-slate-400"}`}>
                                    {task.status}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Task Content */}
                          <div>
                            <h4 className={`text-[15px] font-bold text-slate-800 leading-tight group-hover/card:text-brand transition-colors duration-200 ${task.completed ? "text-slate-400" : ""}`}>
                              {task.title}
                            </h4>
                            <p className="text-[13px] text-slate-400 mt-1.5 font-medium leading-snug">{task.description}</p>
                          </div>

                          {/* Time stamps */}
                          <div className="flex items-center text-[12px] text-slate-400 font-bold border-t border-slate-50 pt-3.5">
                            <svg className="w-4 h-4 mr-1.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            {task.time}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

              </div>
            </>
          )}

        </div>
      </main>

    </div>
  );
}
