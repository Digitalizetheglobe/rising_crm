"use client";

import React, { useState } from "react";
import { useDashboard } from "./DashboardContext";

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
  const { userName, setUserName, addToast } = useDashboard();

  // Client state
  const [hoveredWeek, setHoveredWeek] = useState<number | null>(null);
  const [timeFilter, setTimeFilter] = useState<"month" | "quarter" | "year">("month");
  
  // Customization & Interaction states
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(userName);
  
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

  return (
    <div className="flex-1 overflow-y-auto px-6 py-8 space-y-8 bg-[#FDFCFB]">
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
                className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 text-[14px] font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveName}
                className="px-4 py-2 rounded-xl bg-brand hover:bg-brand-hover text-white text-[14px] font-semibold shadow-md shadow-brand/10 cursor-pointer"
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
            {/* Filter Time selector */}
            <div className="flex bg-[#F3F2F1]/80 rounded-xl p-1 shadow-inner font-semibold border border-slate-100">
              <button
                onClick={() => {
                  setTimeFilter("month");
                  addToast("KPI view adjusted to Monthly", "info");
                }}
                className={`text-[12.5px] px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                  timeFilter === "month"
                    ? "bg-white text-brand shadow-sm scale-102 font-bold"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Month
              </button>
              <button
                onClick={() => {
                  setTimeFilter("quarter");
                  addToast("KPI view adjusted to Quarterly", "info");
                }}
                className={`text-[12.5px] px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                  timeFilter === "quarter"
                    ? "bg-white text-brand shadow-sm scale-102 font-bold"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Quarter
              </button>
              <button
                onClick={() => {
                  setTimeFilter("year");
                  addToast("KPI view adjusted to Yearly", "info");
                }}
                className={`text-[12.5px] px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                  timeFilter === "year"
                    ? "bg-white text-brand shadow-sm scale-102 font-bold"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Year
              </button>
            </div>

            <button
              onClick={() => addToast("Exporting account statement PDF...", "success")}
              className="bg-brand hover:bg-brand-hover text-white text-[14px] font-bold px-4 py-2.5 rounded-xl shadow-md shadow-brand/10 flex items-center transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 cursor-pointer"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Export Statement
            </button>
            <button
              onClick={() => addToast("Creating new leads collection...", "success")}
              className="bg-brand hover:bg-brand-hover text-white text-[14px] font-bold px-4 py-2.5 rounded-xl shadow-md shadow-brand/10 flex items-center transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 cursor-pointer"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              New Collection
            </button>
          </div>
        </div>

        {/* KPI Card Grid (4 Columns) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {getKpiMetrics().map((kpi, idx) => {
            const bgColors: { [key: string]: string } = {
              "border-t-brand": "#EB3539",
              "border-t-blue-500": "#3b82f6",
              "border-t-amber-500": "#f59e0b",
              "border-t-emerald-500": "#10b981",
            };
            const accentColor = bgColors[kpi.colorCode] || "#EB3539";

            return (
              <div
                key={idx}
                className="bg-white rounded-[26px] p-6 shadow-sm hover:shadow-xl border border-slate-100 hover:border-slate-200 transition-all duration-300 transform hover:-translate-y-1.5 group cursor-default relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 right-0 h-[6px] rounded-t-full" style={{ backgroundColor: accentColor }} />
                <span className="text-slate-800 font-bold text-[14.5px] uppercase tracking-wider block">{kpi.title}</span>
                <h3 className="text-[34px] font-extrabold text-slate-900 mt-2 mb-2 leading-none group-hover:scale-102 transition-transform origin-left duration-300">
                  {kpi.value}
                </h3>
                <div className="flex items-center gap-1.5 mt-2">
                  {kpi.isUp ? (
                    <span className="text-[#22c55e] font-extrabold text-[14px] flex items-center bg-emerald-50 px-2 py-0.5 rounded-full">
                      <svg className="w-4 h-4 mr-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
                      </svg>
                      {kpi.trend.split(" ")[0]}
                    </span>
                  ) : (
                    <span className="text-[#ef4444] font-extrabold text-[14px] flex items-center bg-rose-50 px-2 py-0.5 rounded-full">
                      <svg className="w-4 h-4 mr-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M12 13a1 1 0 110 2H7a1 1 0 01-1-1V9a1 1 0 112 0v2.586l4.293-4.293a1 1 0 011.414 0L12 9.586l4.293-4.293a1 1 0 111.414 1.414l-5 5a1 1 0 01-1.414 0L12 9.414 8.414 13H12z" clipRule="evenodd" />
                      </svg>
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
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-800 tracking-tight">Leads vs Closures</h3>
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

            <div className="relative flex-1 min-h-[220px] flex items-end justify-between px-2 pt-6 pb-2 border-b border-l border-slate-200">
              <div className="absolute left-0 bottom-0 top-0 w-[1px] bg-slate-200">
                <span className="absolute -top-1 -left-[4.5px] w-2.5 h-2.5 border-t border-l border-slate-400 rotate-45" />
              </div>
              <div className="absolute left-0 right-0 bottom-0 h-[1px] bg-slate-200">
                <span className="absolute -right-1 -top-[4.5px] w-2.5 h-2.5 border-t border-r border-slate-400 rotate-45" />
              </div>

              <div className="w-full h-full flex items-end justify-around relative">
                {getChartBars().map((bar, idx) => (
                  <div
                    key={idx}
                    onMouseEnter={() => setHoveredWeek(idx)}
                    onMouseLeave={() => setHoveredWeek(null)}
                    className="flex flex-col items-center group/bar cursor-pointer w-[60px] md:w-[70px] relative z-10"
                  >
                    <div className="w-10 rounded-t-xl overflow-hidden flex flex-col justify-end transition-all duration-500 group-hover/bar:scale-x-105 group-hover/bar:shadow-md">
                      <div style={{ height: `${bar.volume}%` }} className="bg-brand-pink w-full transition-all duration-700 hover:brightness-95" />
                      <div style={{ height: `${bar.closures}%` }} className="bg-brand w-full transition-all duration-700 hover:brightness-95" />
                    </div>
                    <span className="text-[12px] font-bold text-slate-500 mt-3 tracking-wide">{bar.label}</span>

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
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold tracking-wide">Recent Activity</h3>
                <button
                  onClick={() => addToast("Viewing all activity logs...", "info")}
                  className="text-[13px] font-extrabold text-white/80 hover:text-white hover:underline transition-colors active:scale-95 cursor-pointer"
                >
                  View All
                </button>
              </div>

              <div className="space-y-5 flex-1">
                {activities.map((act) => (
                  <div key={act.id} className="flex items-center justify-between p-3 rounded-2xl hover:bg-white/10 transition-all duration-300 cursor-pointer">
                    <div className="flex items-center gap-3.5">
                      <div className="w-11 h-11 rounded-full border border-white/30 flex items-center justify-center bg-white/5 flex-shrink-0 group-hover:scale-105 transition-transform">
                        {act.type === "enquiry" && (
                          <svg className="w-5.5 h-5.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                          </svg>
                        )}
                        {act.type === "visit" && (
                          <svg className="w-5.5 h-5.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        )}
                        {act.type === "payment" && (
                          <svg className="w-5.5 h-5.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                        )}
                        {act.type === "calendar" && (
                          <svg className="w-5.5 h-5.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        )}
                      </div>
                      <div>
                        <h4 className="font-extrabold text-[14.5px] leading-tight text-white">{act.title}</h4>
                        <p className="text-[12.5px] text-white/75 mt-0.5 leading-snug font-medium">{act.description}</p>
                      </div>
                    </div>

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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h3 className="text-xl font-bold text-white tracking-wide">Upcoming Task & Reminders</h3>
              <button
                onClick={() => addToast("Custom date range filter opened", "info")}
                className="bg-white hover:bg-slate-50 text-slate-800 text-[13.5px] font-bold px-4 py-2 rounded-xl shadow-sm flex items-center self-start sm:self-auto transition-all active:scale-95 duration-200 cursor-pointer"
              >
                <svg className="w-4 h-4 mr-2 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Date
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className={`bg-white rounded-3xl p-5 border border-slate-100 flex flex-col justify-between gap-5 relative transition-all duration-300 group/card ${
                    task.completed ? "opacity-60 shadow-sm line-through saturate-[0.1]" : "hover:shadow-2xl hover:-translate-y-1.5"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <button
                      onClick={() => toggleTaskCompleted(task.id)}
                      className={`w-5.5 h-5.5 rounded-lg border-2 flex items-center justify-center transition-all cursor-pointer ${
                        task.completed ? "bg-emerald-500 border-emerald-500 text-white" : "border-slate-300 hover:border-brand hover:bg-red-50/50"
                      }`}
                    >
                      {task.completed && (
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>

                    <div className="flex flex-col items-end gap-1.5">
                      {task.completed ? (
                        <>
                          <span className="bg-emerald-50 text-emerald-600 text-[11px] font-extrabold uppercase px-2 py-0.5 rounded-md tracking-wider">
                            Completed
                          </span>
                          <span className="text-[12px] text-slate-400 font-bold">Done</span>
                        </>
                      ) : (
                        <>
                          {task.type === "high" && (
                            <span className="bg-rose-100 text-rose-600 text-[11px] font-extrabold uppercase px-2 py-0.5 rounded-md tracking-wider">
                              High Priority
                            </span>
                          )}
                          {task.type === "followup" && (
                            <span className="bg-emerald-100 text-emerald-600 text-[11px] font-extrabold uppercase px-2 py-0.5 rounded-md tracking-wider">
                              Follow up
                            </span>
                          )}
                          {task.type === "sitevisit" && (
                            <span className="bg-slate-900 text-white text-[11px] font-extrabold uppercase px-2 py-0.5 rounded-md tracking-wider">
                              Site Visit
                            </span>
                          )}
                          <span className={`text-[12px] font-extrabold ${task.status === "Overdue" ? "text-rose-500" : "text-slate-400"}`}>
                            {task.status}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4
                      className={`text-[15px] font-bold text-slate-800 leading-tight group-hover/card:text-brand transition-colors duration-200 ${
                        task.completed ? "text-slate-400" : ""
                      }`}
                    >
                      {task.title}
                    </h4>
                    <p className="text-[13px] text-slate-400 mt-1.5 font-medium leading-snug">{task.description}</p>
                  </div>

                  <div className="flex items-center text-[12px] text-slate-400 font-bold border-t border-slate-50 pt-3.5">
                    <svg className="w-4 h-4 mr-1.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {task.time}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
