"use client";

import React, { useState, useEffect, useCallback } from "react";
import { API_URL } from "../config/api.config";
import { getAuthHeaders } from "../lib/auth";
import PageHeader from "../Components/PageHeader";
import { PAGE_CONTAINER_CLASS, PRIMARY_ACTION_BTN_CLASS } from "../lib/pageLayout";
import { useDashboard } from "./DashboardContext";

interface Task {
  id: string;
  priority: string;
  status: string;
  title: string;
  description: string;
  time: string;
  completed: boolean;
  type: "high" | "followup" | "sitevisit";
}

interface Activity {
  id: string;
  title: string;
  description: string;
  time: string;
  type: "enquiry" | "visit" | "payment" | "calendar";
  sortDate?: number;
}

interface KpiMetric {
  title: string;
  value: string;
  trend: string;
  isUp: boolean;
  colorCode: string;
}

interface ChartBar {
  label: string;
  closures: number;
  volume: number;
  closuresRaw: number;
  volumeRaw: number;
}

const CLOSED_STATUSES = ["CLOSED", "BOOKED", "Closed", "Converted"];

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount || 0);

const calcTrend = (current: number, previous: number) => {
  if (previous === 0) {
    const isUp = current >= 0;
    return { pct: current > 0 ? "+100%" : "0%", isUp, suffix: "vs last month" };
  }
  const change = ((current - previous) / previous) * 100;
  const sign = change >= 0 ? "+" : "";
  return {
    pct: `${sign}${change.toFixed(1)}%`,
    isUp: change >= 0,
    suffix: "vs last month",
  };
};

const timeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} Min Ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} Hr Ago`;
  const days = Math.floor(hrs / 24);
  return `${days} Day${days > 1 ? "s" : ""} Ago`;
};

const getFollowUpStatus = (scheduledAt: string, status: string) => {
  if (status === "COMPLETED") return "Done";
  const sched = new Date(scheduledAt);
  const now = new Date();
  if (sched < now) return "Overdue";
  const diffHrs = Math.floor((sched.getTime() - now.getTime()) / 3600000);
  if (diffHrs < 1) return "In <1hr";
  if (diffHrs < 24) return `In ${diffHrs}hr`;
  return sched.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
};

const mapFollowUpType = (type: string, isOverdue: boolean): Task["type"] => {
  if (type === "Site Visit") return "sitevisit";
  if (isOverdue) return "high";
  return "followup";
};

export default function Home() {
  const { userName, setUserName, addToast } = useDashboard();

  const [hoveredWeek, setHoveredWeek] = useState<number | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(userName);
  const [loading, setLoading] = useState(true);

  const [kpis, setKpis] = useState<KpiMetric[]>([]);
  const [chartBars, setChartBars] = useState<ChartBar[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);

  const buildKpis = (data: any, totalEnquiries: number): KpiMetric[] => {
    const leadStats = data.leadStats?.[0] || {};
    const bookingStats = data.bookingStats?.[0] || {};
    const leadsByStatus: { _id: string; count: number }[] = data.leadsByStatus || [];

    const totalLeads = leadStats.total || 0;
    const newThisMonth = leadStats.newThisMonth || 0;
    const newLastMonth = leadStats.newLastMonth || 0;

    const closedCount = leadsByStatus
      .filter((s) => CLOSED_STATUSES.includes(s._id))
      .reduce((sum, s) => sum + s.count, 0);

    const bookingsThisMonth = bookingStats.thisMonth || 0;
    const bookingsLastMonth = bookingStats.lastMonth || 0;
    const bookingsTotal = bookingStats.total || 0;

    const leadsTrend = calcTrend(newThisMonth, newLastMonth);
    const bookingsTrend = calcTrend(bookingsThisMonth, bookingsLastMonth);

    return [
      {
        title: "Total Enquiry",
        value: String(totalEnquiries),
        trend: "Total enquiries",
        isUp: true,
        colorCode: "border-t-brand",
      },
      {
        title: "Total Leads",
        value: String(totalLeads),
        trend: `${leadsTrend.pct} ${leadsTrend.suffix}`,
        isUp: leadsTrend.isUp,
        colorCode: "border-t-blue-500",
      },
      {
        title: "Bookings",
        value: String(bookingsTotal),
        trend: `${bookingsTrend.pct} ${bookingsTrend.suffix}`,
        isUp: bookingsTrend.isUp,
        colorCode: "border-t-amber-500",
      },
      {
        title: "Close Deals",
        value: String(closedCount),
        trend: "Total closed deals",
        isUp: true,
        colorCode: "border-t-emerald-500",
      },
    ];
  };

  const buildActivities = (dashboardData: any, enquiries: any[]): Activity[] => {
    const items: Activity[] = [];

    enquiries.forEach((e: any) => {
      items.push({
        id: `enquiry-${e._id}`,
        title: `New Enquiry${e.interestedProject?.name ? `: ${e.interestedProject.name}` : ""}`,
        description: `${e.name || "Unknown"} is interested${e.propertyType ? ` in ${e.propertyType}` : ""}`,
        time: timeAgo(e.createdAt),
        type: "enquiry",
        sortDate: new Date(e.createdAt).getTime(),
      });
    });

    (dashboardData.recentBookings || []).forEach((b: any) => {
      items.push({
        id: `booking-${b._id}`,
        title: "Site Visit Completed",
        description: `${b.client?.name || "Client"} booked at ${b.project?.name || "project"}`,
        time: timeAgo(b.createdAt),
        type: "visit",
        sortDate: new Date(b.createdAt).getTime(),
      });
    });

    (dashboardData.recentPayments || []).forEach((p: any) => {
      items.push({
        id: `payment-${p._id}`,
        title: "Payment Received",
        description: `${formatCurrency(p.amount || 0)} from ${p.client?.name || "client"}`,
        time: timeAgo(p.createdAt),
        type: "payment",
        sortDate: new Date(p.createdAt).getTime(),
      });
    });

    return items
      .sort((a, b) => b.sortDate - a.sortDate)
      .slice(0, 4)
      .map(({ sortDate: _, ...rest }) => rest);
  };

  const mapFollowUpsToTasks = (followUps: any[]): Task[] =>
    followUps
      .filter((f) => !["COMPLETED", "CANCELLED"].includes(f.status))
      .slice(0, 4)
      .map((f) => {
        const isOverdue = new Date(f.scheduledAt) < new Date() && f.status !== "COMPLETED";
        const leadName = f.lead?.name || "Lead";
        return {
          id: f._id,
          priority: f.type === "Site Visit" ? "Site Visit" : isOverdue ? "High Priority" : "Follow up",
          status: getFollowUpStatus(f.scheduledAt, f.status),
          title: `${f.type} with ${leadName}`,
          description: f.notes || `Scheduled follow-up for ${leadName}`,
          time: new Date(f.scheduledAt).toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          completed: f.status === "COMPLETED",
          type: mapFollowUpType(f.type, isOverdue),
        };
      });

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const headers = getAuthHeaders();
      const [dashboardRes, trendRes, followupsRes, enquiriesRes] = await Promise.all([
        fetch(`${API_URL}/v1/dashboard`, { headers }),
        fetch(`${API_URL}/v1/dashboard/bookings-trend`, { headers }),
        fetch(`${API_URL}/v1/followups?limit=8`, { headers }),
        fetch(`${API_URL}/v1/enquiries?limit=5`, { headers }),
      ]);

      const [dashboardJson, trendJson, followupsJson, enquiriesJson] = await Promise.all([
        dashboardRes.json(),
        trendRes.json(),
        followupsRes.json(),
        enquiriesRes.json(),
      ]);

      if (dashboardJson.success && dashboardJson.data) {
        const enquiriesTotal = enquiriesJson.success ? enquiriesJson.data?.total || 0 : 0;
        setKpis(buildKpis(dashboardJson.data, enquiriesTotal));
        const enquiryList = enquiriesJson.success ? enquiriesJson.data?.enquiries || [] : [];
        setActivities(buildActivities(dashboardJson.data, enquiryList));
      } else {
        addToast(dashboardJson.message || "Failed to load dashboard", "info");
      }

      if (trendJson.success && Array.isArray(trendJson.data)) {
        setChartBars(trendJson.data);
      }

      if (followupsJson.success) {
        setTasks(mapFollowUpsToTasks(followupsJson.data?.followUps || []));
      }
    } catch (err: any) {
      addToast(err.message || "Error connecting to server", "info");
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleSaveName = () => {
    if (tempName.trim()) {
      setUserName(tempName);
      localStorage.setItem("crm_username", tempName);
      setIsEditingName(false);
      addToast(`Profile name updated to "${tempName}"`, "success");
    }
  };

  const toggleTaskCompleted = async (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;

    if (!task.completed) {
      try {
        const res = await fetch(`${API_URL}/v1/followups/${id}/complete`, {
          method: "PATCH",
          headers: getAuthHeaders(),
          body: JSON.stringify({ outcome: "Completed from dashboard", notes: "" }),
        });
        const json = await res.json();
        if (json.success) {
          setTasks((prev) =>
            prev.map((t) => (t.id === id ? { ...t, completed: true, status: "Done" } : t))
          );
          addToast(`Completed task: "${task.title}"`, "success");
        } else {
          addToast(json.message || "Failed to complete task", "info");
        }
      } catch (err: any) {
        addToast(err.message || "Error completing task", "info");
      }
    } else {
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, completed: false, status: "Reopened" } : t))
      );
      addToast(`Reopened task: "${task.title}"`, "info");
    }
  };

  return (
    <div className={PAGE_CONTAINER_CLASS}>
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

      <div className="space-y-8 animate-fade-in-up">
        <PageHeader
          title={
            <>
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
            </>
          }
          subtitle="Here's what requires your attention today"
          actions={
            <>
              <button
                onClick={() => addToast("Exporting account statement PDF...", "success")}
                className={PRIMARY_ACTION_BTN_CLASS}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Export Statement
              </button>
              <button
                onClick={() => addToast("Creating new leads collection...", "success")}
                className={PRIMARY_ACTION_BTN_CLASS}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                New Collection
              </button>
            </>
          }
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {(loading && kpis.length === 0
            ? [
                { title: "Total Enquiry", value: "—", trend: "Loading...", isUp: true, colorCode: "border-t-brand" },
                { title: "Total Leads", value: "—", trend: "Loading...", isUp: true, colorCode: "border-t-blue-500" },
                { title: "Bookings", value: "—", trend: "Loading...", isUp: true, colorCode: "border-t-amber-500" },
                { title: "Close Deals", value: "—", trend: "Loading...", isUp: true, colorCode: "border-t-emerald-500" },
              ]
            : kpis
          ).map((kpi, idx) => {
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

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-sky-100 hover:border-sky-200 shadow-sm hover:shadow-lg transition-all flex flex-col justify-between relative overflow-hidden group">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-800 tracking-tight">Enquiry vs Leads</h3>
              <div className="flex items-center gap-5">
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-full bg-brand-pink block" />
                  <span className="text-slate-500 text-[13px] font-semibold">Enquiry</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-full bg-brand block" />
                  <span className="text-slate-500 text-[13px] font-semibold">Lead</span>
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
                {chartBars.length === 0 && !loading ? (
                  <p className="text-slate-400 text-sm font-medium w-full text-center self-center">No chart data available</p>
                ) : (
                  chartBars.map((bar, idx) => (
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
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="recent-activity-card lg:col-span-5 bg-brand text-white rounded-3xl p-6 shadow-xl shadow-brand/15 flex flex-col justify-between hover:shadow-2xl hover:shadow-brand/20 transition-all duration-300 relative overflow-hidden group">
            <div className="absolute -right-16 -top-16 w-48 h-48 bg-white/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700 pointer-events-none"></div>
            <div className="absolute -left-16 -bottom-16 w-48 h-48 bg-white/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700 pointer-events-none"></div>

            <div className="relative z-10 flex-1 flex flex-col justify-between text-white">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold tracking-wide !text-white">Recent Activity</h3>
                <button
                  onClick={() => addToast("Viewing all activity logs...", "info")}
                  className="text-[13px] font-extrabold !text-white hover:underline transition-colors active:scale-95 cursor-pointer"
                >
                  View All
                </button>
              </div>

              <div className="space-y-4 flex-1">
                {activities.length === 0 && !loading ? (
                  <p className="text-white/70 text-sm font-medium">No recent activity</p>
                ) : (
                  activities.map((act) => (
                    <div key={act.id} className="flex items-center justify-between gap-3 py-1 cursor-pointer">
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-11 h-11 rounded-full border border-white/40 flex items-center justify-center bg-transparent flex-shrink-0">
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
                        <div className="min-w-0">
                          <h4 className="font-bold text-[14.5px] leading-tight !text-white">{act.title}</h4>
                          <p className="text-[12.5px] !text-white/90 mt-0.5 leading-snug font-medium">{act.description}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span className="w-2 h-2 rounded-full bg-[#22C55E] shadow-sm"></span>
                        <span className="text-[11.5px] !text-white font-semibold whitespace-nowrap">{act.time}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

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
              {tasks.length === 0 && !loading ? (
                <p className="text-white/70 text-sm font-medium col-span-full">No upcoming tasks or reminders</p>
              ) : (
                tasks.map((task) => (
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
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
