"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

export default function BookingPage() {
  // Sidebar state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("Booking");

  // Interaction & UI states
  const [userName, setUserName] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Booking");
  const [timeRange, setTimeRange] = useState("Last 30 days");
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showTimeDropdown, setShowTimeDropdown] = useState(false);

  // Load username from localStorage if exists
  useEffect(() => {
    const savedName = localStorage.getItem("crm_username");
    if (savedName) {
      setUserName(savedName);
    }
  }, []);

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
              }}
              className={`w-full flex items-center cursor-pointer gap-3.5 px-4 py-3 rounded-2xl text-[15px] font-semibold transition-all duration-300 ${
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
                        }} 
                        className="text-[12px] font-bold text-brand hover:underline cursor-pointer"
                      >
                        Clear All
                      </button>
                    </div>
                    <div className="space-y-3 max-h-[250px] overflow-y-auto">
                      {/* Notifications empty state */}
                      <p className="text-slate-400 text-sm text-center py-4"></p>
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
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Booking</h1>
              <p className="text-slate-500 mt-1 text-[15px] font-semibold">Manage property booking and payment structure</p>
            </div>
          </div>

          {/* 4 KPI Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Card 1: Total Booking (Orange top border) */}
            <div className="bg-white rounded-[26px] p-6 shadow-sm border border-slate-100 hover:border-slate-200 transition-all duration-300 transform hover:-translate-y-1 cursor-default relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-[6px] bg-[#f59e0b] rounded-t-full" />
              <span className="text-slate-800 font-bold text-[14.5px] uppercase tracking-wider block">Total Booking</span>
              <h3 className="text-[52px] font-extrabold text-slate-900 mt-2 mb-2 leading-none"></h3>
              <div className="flex items-center gap-1.5 mt-2 h-[24px]"></div>
            </div>

            {/* Card 2: Full Payment (Gray top border) */}
            <div className="bg-white rounded-[26px] p-6 shadow-sm border border-slate-100 hover:border-slate-200 transition-all duration-300 transform hover:-translate-y-1 cursor-default relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-[6px] bg-[#e2e8f0] rounded-t-full" />
              <span className="text-slate-800 font-bold text-[14.5px] uppercase tracking-wider block">Full Payment</span>
              <h3 className="text-[52px] font-extrabold text-slate-900 mt-2 mb-2 leading-none"></h3>
              <div className="flex items-center gap-1.5 mt-2 h-[24px]"></div>
            </div>

            {/* Card 3: Instalments (Blue top border) */}
            <div className="bg-white rounded-[26px] p-6 shadow-sm border border-slate-100 hover:border-slate-200 transition-all duration-300 transform hover:-translate-y-1 cursor-default relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-[6px] bg-[#3b82f6] rounded-t-full" />
              <span className="text-slate-800 font-bold text-[14.5px] uppercase tracking-wider block">Instalments</span>
              <h3 className="text-[52px] font-extrabold text-slate-900 mt-2 mb-2 leading-none"></h3>
              <div className="flex items-center gap-1.5 mt-2 h-[24px]"></div>
            </div>

            {/* Card 4: Total Value (Green top border) */}
            <div className="bg-white rounded-[26px] p-6 shadow-sm border border-slate-100 hover:border-slate-200 transition-all duration-300 transform hover:-translate-y-1 cursor-default relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-[6px] bg-[#10b981] rounded-t-full" />
              <span className="text-slate-800 font-bold text-[14.5px] uppercase tracking-wider block">Total Value</span>
              <h3 className="text-[52px] font-extrabold text-slate-900 mt-2 mb-2 leading-none"></h3>
              <div className="flex items-center gap-1.5 mt-2 h-[24px]"></div>
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
                onChange={(e) => setSearchQuery(e.target.value)}
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
                      {(["All Booking", "Full Payment", "Instalments", "Loan based"] as const).map((status) => (
                        <button
                          key={status}
                          onClick={() => {
                            setStatusFilter(status);
                            setShowStatusDropdown(false);
                          }}
                          className={`w-full text-left px-3.5 py-2.5 rounded-xl transition-colors cursor-pointer flex items-center justify-between ${
                            statusFilter === status ? "bg-brand-light text-brand font-bold" : "text-slate-600 hover:bg-slate-50"
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
                          }}
                          className={`w-full text-left px-3.5 py-2.5 rounded-xl transition-colors cursor-pointer ${
                            timeRange === range ? "bg-brand-light text-brand font-bold" : "text-slate-600 hover:bg-slate-50"
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
                  setStatusFilter("All Booking");
                  setTimeRange("Last 30 days");
                }}
                className="bg-[#FDF2F2] text-brand font-extrabold px-5 py-2.5 rounded-2xl text-[13.5px] flex items-center gap-2 hover:bg-red-100/50 transition-colors cursor-pointer font-sans"
              >
                <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3c.132 0 .263 0 .393.007a7.5 7.5 0 007.92 12.446a9 9 0 11-8.313-12.454z" /></svg>
                Filter
              </button>

            </div>
          </div>

          {/* 5. Main Bookings Interactive List Container */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            
            {/* Desktop and Tablet Responsive Data Table */}
            <div className="hidden sm:block overflow-x-auto min-h-[400px]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-[#FCFBFB]">
                    <th className="py-4.5 px-6 font-extrabold text-[14px] text-brand uppercase tracking-wider text-center">Client</th>
                    <th className="py-4.5 px-6 font-extrabold text-[14px] text-brand uppercase tracking-wider text-center">Type</th>
                    <th className="py-4.5 px-6 font-extrabold text-[14px] text-brand uppercase tracking-wider text-center">Unit</th>
                    <th className="py-4.5 px-6 font-extrabold text-[14px] text-brand uppercase tracking-wider text-center">Status</th>
                    <th className="py-4.5 px-6 font-extrabold text-[14px] text-brand uppercase tracking-wider text-center">Project</th>
                    <th className="py-4.5 px-6 font-extrabold text-[14px] text-brand uppercase tracking-wider text-center">Amount</th>
                    <th className="py-4.5 px-6 font-extrabold text-[14px] text-brand uppercase tracking-wider text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold text-[14.5px] text-slate-700">
                  {/* Empty state per request */}
                </tbody>
              </table>
            </div>

            {/* Mobile Viewports Empty State */}
            <div className="block sm:hidden divide-y divide-slate-100 bg-[#FCFBFB] min-h-[400px]">
            </div>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-center py-6 gap-2">
            <button className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-brand text-white font-bold shadow-md shadow-brand/20">
              1
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 font-bold transition-colors">
              2
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 font-bold transition-colors">
              3
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 font-bold transition-colors">
              4
            </button>
            <span className="w-8 h-8 flex items-center justify-center text-slate-400 font-bold">
              ...
            </span>
            <button className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 font-bold transition-colors">
              25
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>

        </div>
      </main>
    </div>
  );
}
