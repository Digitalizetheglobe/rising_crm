"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { API_URL } from "../config/api.config";
import { getAuthHeaders } from "../lib/auth";
import PageHeader from "../Components/PageHeader";
import { PAGE_CONTAINER_CLASS } from "../lib/pageLayout";
import { useDashboard } from "./DashboardContext";
import KPICard from "../Components/KPICard";
import {
  Users,
  Activity,
  Trash2,
  Megaphone,
  Sparkles,
  PhoneCall,
  MapPin,
  FileCheck,
  Calendar,
  ChevronDown,
  Clock,
  Building,
  CheckCircle2,
  ArrowRight,
  Filter,
} from "lucide-react";

// --- Date Filter Preset Options ---
const DATE_FILTER_OPTIONS = [
  { label: "Today", value: "today" },
  { label: "Yesterday", value: "yesterday" },
  { label: "This Week", value: "this_week" },
  { label: "This Month", value: "this_month" },
  { label: "This Year", value: "this_year" },
  { label: "All Time", value: "all" },
  { label: "Custom Range", value: "custom" },
];

const formatCurrency = (val: number) => {
  if (!val) return "₹0";
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(2)} L`;
  return `₹${val.toLocaleString("en-IN")}`;
};

export default function Home() {
  const { userName, addToast } = useDashboard();
  const [selectedProject, setSelectedProject] = useState("all");
  const [projectsList, setProjectsList] = useState<any[]>([]);

  // 1-3 & 8 Core Summaries
  const [summary, setSummary] = useState<any>({});
  const [loadingSummary, setLoadingSummary] = useState(true);

  // 4. New Leads (with Date Filter)
  const [newLeadsRange, setNewLeadsRange] = useState("today");
  const [newLeadsStart, setNewLeadsStart] = useState("");
  const [newLeadsEnd, setNewLeadsEnd] = useState("");
  const [newLeadsData, setNewLeadsData] = useState<{ count: number; leads: any[] }>({ count: 0, leads: [] });
  const [loadingNewLeads, setLoadingNewLeads] = useState(false);

  // 5. Follow-Ups (with Date Filter)
  const [followUpsRange, setFollowUpsRange] = useState("today");
  const [followUpsStart, setFollowUpsStart] = useState("");
  const [followUpsEnd, setFollowUpsEnd] = useState("");
  const [followUpsData, setFollowUpsData] = useState<{ count: number; completedCount: number; pendingCount: number; followups: any[] }>({
    count: 0,
    completedCount: 0,
    pendingCount: 0,
    followups: [],
  });
  const [loadingFollowUps, setLoadingFollowUps] = useState(false);

  // 6. Site Visits (with Date Filter)
  const [siteVisitsRange, setSiteVisitsRange] = useState("today");
  const [siteVisitsStart, setSiteVisitsStart] = useState("");
  const [siteVisitsEnd, setSiteVisitsEnd] = useState("");
  const [siteVisitsData, setSiteVisitsData] = useState<{ count: number; completedCount: number; confirmedCount: number; visits: any[] }>({
    count: 0,
    completedCount: 0,
    confirmedCount: 0,
    visits: [],
  });
  const [loadingSiteVisits, setLoadingSiteVisits] = useState(false);

  // 7. Bookings (with Date Filter)
  const [bookingsRange, setBookingsRange] = useState("today");
  const [bookingsStart, setBookingsStart] = useState("");
  const [bookingsEnd, setBookingsEnd] = useState("");
  const [bookingsData, setBookingsData] = useState<{ count: number; totalRevenue: number; bookings: any[] }>({
    count: 0,
    totalRevenue: 0,
    bookings: [],
  });
  const [loadingBookings, setLoadingBookings] = useState(false);

  // Active Campaigns List
  const [activeCampaignsData, setActiveCampaignsData] = useState<{ count: number; campaigns: any[] }>({ count: 0, campaigns: [] });

  // Safe fetch helper to handle network offline / connection errors gracefully
  const safeFetchJson = async (url: string) => {
    try {
      const res = await fetch(url, { headers: getAuthHeaders() });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  };

  // Load Projects List
  useEffect(() => {
    const fetchProjects = async () => {
      const json = await safeFetchJson(`${API_URL}/v1/projects?limit=100`);
      if (json?.success && json?.data) {
        setProjectsList(json.data.projects || []);
      }
    };
    fetchProjects();
  }, []);

  // Fetch Summary
  const fetchSummary = useCallback(async () => {
    setLoadingSummary(true);
    const json = await safeFetchJson(`${API_URL}/v1/dashboard/summary?projectId=${selectedProject}`);
    if (json?.success) {
      setSummary(json.data || {});
    }
    setLoadingSummary(false);
  }, [selectedProject]);

  // Fetch New Leads (Date Filtered)
  const fetchNewLeads = useCallback(async () => {
    setLoadingNewLeads(true);
    let url = `${API_URL}/v1/dashboard/new-leads?projectId=${selectedProject}&dateRange=${newLeadsRange}`;
    if (newLeadsRange === "custom" && newLeadsStart && newLeadsEnd) {
      url += `&startDate=${newLeadsStart}&endDate=${newLeadsEnd}`;
    }
    const json = await safeFetchJson(url);
    if (json?.success) {
      setNewLeadsData(json.data || { count: 0, leads: [] });
    }
    setLoadingNewLeads(false);
  }, [selectedProject, newLeadsRange, newLeadsStart, newLeadsEnd]);

  // Fetch Follow Ups (Date Filtered)
  const fetchFollowUps = useCallback(async () => {
    setLoadingFollowUps(true);
    let url = `${API_URL}/v1/dashboard/followups-filtered?projectId=${selectedProject}&dateRange=${followUpsRange}`;
    if (followUpsRange === "custom" && followUpsStart && followUpsEnd) {
      url += `&startDate=${followUpsStart}&endDate=${followUpsEnd}`;
    }
    const json = await safeFetchJson(url);
    if (json?.success) {
      setFollowUpsData(json.data || { count: 0, completedCount: 0, pendingCount: 0, followups: [] });
    }
    setLoadingFollowUps(false);
  }, [selectedProject, followUpsRange, followUpsStart, followUpsEnd]);

  // Fetch Site Visits (Date Filtered)
  const fetchSiteVisits = useCallback(async () => {
    setLoadingSiteVisits(true);
    let url = `${API_URL}/v1/dashboard/site-visits-filtered?projectId=${selectedProject}&dateRange=${siteVisitsRange}`;
    if (siteVisitsRange === "custom" && siteVisitsStart && siteVisitsEnd) {
      url += `&startDate=${siteVisitsStart}&endDate=${siteVisitsEnd}`;
    }
    const json = await safeFetchJson(url);
    if (json?.success) {
      setSiteVisitsData(json.data || { count: 0, completedCount: 0, confirmedCount: 0, visits: [] });
    }
    setLoadingSiteVisits(false);
  }, [selectedProject, siteVisitsRange, siteVisitsStart, siteVisitsEnd]);

  // Fetch Bookings (Date Filtered)
  const fetchBookings = useCallback(async () => {
    setLoadingBookings(true);
    let url = `${API_URL}/v1/dashboard/bookings-filtered?projectId=${selectedProject}&dateRange=${bookingsRange}`;
    if (bookingsRange === "custom" && bookingsStart && bookingsEnd) {
      url += `&startDate=${bookingsStart}&endDate=${bookingsEnd}`;
    }
    const json = await safeFetchJson(url);
    if (json?.success) {
      setBookingsData(json.data || { count: 0, totalRevenue: 0, bookings: [] });
    }
    setLoadingBookings(false);
  }, [selectedProject, bookingsRange, bookingsStart, bookingsEnd]);

  // Fetch Active Campaigns
  const fetchActiveCampaigns = useCallback(async () => {
    const json = await safeFetchJson(`${API_URL}/v1/dashboard/active-campaigns?projectId=${selectedProject}`);
    if (json?.success) {
      setActiveCampaignsData(json.data || { count: 0, campaigns: [] });
    }
  }, [selectedProject]);

  useEffect(() => {
    fetchSummary();
    fetchActiveCampaigns();
  }, [fetchSummary, fetchActiveCampaigns]);

  useEffect(() => {
    fetchNewLeads();
  }, [fetchNewLeads]);

  useEffect(() => {
    fetchFollowUps();
  }, [fetchFollowUps]);

  useEffect(() => {
    fetchSiteVisits();
  }, [fetchSiteVisits]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  return (
    <div className={PAGE_CONTAINER_CLASS}>
      <div className="space-y-6 animate-fade-in-up">
        {/* --- Top Header & Project Filter --- */}
        <PageHeader
          title={<>Welcome Back, <span className="text-[#38B6FF] font-extrabold">{userName}</span></>}
          subtitle="Real-time dashboard metrics and date-filtered activity"
          actions={
            <div className="relative w-[280px]">
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="w-full h-12 pl-4 pr-12 rounded-xl border border-sky-200 bg-white text-[#0284C7] font-semibold text-sm shadow-sm outline-none appearance-none hover:border-[#38B6FF]/50 focus:border-[#38B6FF] focus:ring-2 focus:ring-[#38B6FF]/20 cursor-pointer"
              >
                <option value="all">All Projects</option>
                {projectsList.map((p) => (
                  <option key={p._id || p.id} value={p._id || p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#38B6FF] pointer-events-none" />
            </div>
          }
        />

        {/* --- 8 Key Dashboard Cards Top Row (Items 1, 2, 3, 8) --- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* 1. Total Leads */}
          <KPICard
            title="Total Leads"
            value={(summary.totalLeads || 0).toLocaleString("en-IN")}
            trend="All time leads"
            isUp={true}
            subtext="Across all sources & statuses"
            accentColor="#2563eb"
          />

          {/* 2. Active Leads */}
          <KPICard
            title="Active Leads"
            value={(summary.activeLeads || 0).toLocaleString("en-IN")}
            trend="In Pipeline"
            isUp={true}
            subtext="Excludes Lost & Duplicate"
            accentColor="#10b981"
          />

          {/* 3. Dump Leads */}
          <KPICard
            title="Dump Leads"
            value={(summary.dumpLeads || 0).toLocaleString("en-IN")}
            trend="Dropped / Dead"
            isUp={false}
            subtext="Lost, Duplicate & Hold"
            accentColor="#ef4444"
          />

          <KPICard
            title="Active Campaigns"
            value={(summary.activeCampaigns ?? activeCampaignsData.count ?? 0).toLocaleString("en-IN")}
            trend="Running Ads"
            isUp={true}
            subtext="Meta / Marketing campaigns"
            accentColor="#8b5cf6"
          />
        </div>

        {/* --- Main Interactive Section (Items 4, 5, 6, 7 with Date-wise Filters) --- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* ============================================================ */}
          {/* ITEM 4: NEW LEADS (WITH DATE FILTER)                        */}
          {/* ============================================================ */}
          <div className="bg-white rounded-[28px] border border-slate-200/80 p-6 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 flex flex-col justify-between">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-3 mb-5 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-md shadow-amber-500/20 flex items-center justify-center">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">4. New Leads</h3>
                    <p className="text-xs text-slate-500 font-medium">Filtered date-wise</p>
                  </div>
                </div>

                {/* Date Filter Dropdown */}
                <div className="flex items-center gap-2">
                  <Filter className="w-3.5 h-3.5 text-slate-400" />
                  <select
                    value={newLeadsRange}
                    onChange={(e) => setNewLeadsRange(e.target.value)}
                    className="text-xs font-bold bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-3.5 py-1.5 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 cursor-pointer transition-all"
                  >
                    {DATE_FILTER_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Custom Date Picker Inputs */}
              {newLeadsRange === "custom" && (
                <div className="flex items-center gap-2 mb-4 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <input
                    type="date"
                    value={newLeadsStart}
                    onChange={(e) => setNewLeadsStart(e.target.value)}
                    className="text-xs border border-slate-300 rounded-lg px-2.5 py-1 outline-none bg-white font-medium"
                  />
                  <span className="text-xs text-slate-400 font-semibold">to</span>
                  <input
                    type="date"
                    value={newLeadsEnd}
                    onChange={(e) => setNewLeadsEnd(e.target.value)}
                    className="text-xs border border-slate-300 rounded-lg px-2.5 py-1 outline-none bg-white font-medium"
                  />
                </div>
              )}

              {/* Stat Highlight Banner */}
              <div className="flex items-center justify-between mb-4 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent rounded-2xl p-4 border border-amber-200/70">
                <div>
                  <span className="text-3xl font-black text-amber-600 leading-none">
                    {loadingNewLeads ? "..." : newLeadsData.count}
                  </span>
                  <p className="text-xs font-semibold text-amber-800 mt-1">New Leads captured in period</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-amber-100/80 flex items-center justify-center text-amber-600 font-bold text-xs">
                  ⚡
                </div>
              </div>

              {/* Item List */}
              <div className="space-y-2.5 max-h-[280px] overflow-y-auto pr-1">
                {loadingNewLeads ? (
                  <p className="text-xs text-slate-400 py-8 text-center font-medium">Loading new leads...</p>
                ) : newLeadsData.leads.length === 0 ? (
                  <p className="text-xs text-slate-400 py-8 text-center font-medium">No new leads found for selected date range</p>
                ) : (
                  newLeadsData.leads.map((lead: any) => (
                    <div key={lead.id} className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50/70 border border-slate-100 hover:bg-slate-100/70 hover:border-slate-200 transition-all">
                      <div className="min-w-0 flex-1 pr-2">
                        <p className="text-xs font-bold text-slate-800 truncate">{lead.name}</p>
                        <p className="text-[11px] text-slate-500 font-medium truncate">{lead.phone} • {lead.source || "Direct"}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="inline-block text-[10.5px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200/60">
                          {lead.status}
                        </span>
                        <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                          {new Date(lead.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="mt-4 pt-3.5 border-t border-slate-100">
              <Link href="/leads?status=NEW" className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center justify-center gap-1.5 py-1 transition-colors">
                <span>View All Leads</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>


          {/* ============================================================ */}
          {/* ITEM 5: FOLLOW-UPS (WITH DATE FILTER)                        */}
          {/* ============================================================ */}
          <div className="bg-white rounded-[28px] border border-slate-200/80 p-6 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 flex flex-col justify-between">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-3 mb-5 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md shadow-blue-500/20 flex items-center justify-center">
                    <PhoneCall className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">5. Follow-Ups</h3>
                    <p className="text-xs text-slate-500 font-medium">Filtered date-wise</p>
                  </div>
                </div>

                {/* Date Filter Dropdown */}
                <div className="flex items-center gap-2">
                  <Filter className="w-3.5 h-3.5 text-slate-400" />
                  <select
                    value={followUpsRange}
                    onChange={(e) => setFollowUpsRange(e.target.value)}
                    className="text-xs font-bold bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-3.5 py-1.5 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer transition-all"
                  >
                    {DATE_FILTER_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Custom Date Picker Inputs */}
              {followUpsRange === "custom" && (
                <div className="flex items-center gap-2 mb-4 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <input
                    type="date"
                    value={followUpsStart}
                    onChange={(e) => setFollowUpsStart(e.target.value)}
                    className="text-xs border border-slate-300 rounded-lg px-2.5 py-1 outline-none bg-white font-medium"
                  />
                  <span className="text-xs text-slate-400 font-semibold">to</span>
                  <input
                    type="date"
                    value={followUpsEnd}
                    onChange={(e) => setFollowUpsEnd(e.target.value)}
                    className="text-xs border border-slate-300 rounded-lg px-2.5 py-1 outline-none bg-white font-medium"
                  />
                </div>
              )}

              {/* Stat Highlight Banner */}
              <div className="flex items-center justify-between mb-4 bg-gradient-to-r from-blue-500/10 via-blue-500/5 to-transparent rounded-2xl p-4 border border-blue-200/70">
                <div>
                  <span className="text-3xl font-black text-blue-600 leading-none">
                    {loadingFollowUps ? "..." : followUpsData.count}
                  </span>
                  <p className="text-xs font-semibold text-blue-800 mt-1">Total Scheduled Follow-Ups</p>
                </div>
                <div className="flex gap-2">
                  <span className="text-[11px] px-3 py-1 rounded-full font-bold bg-emerald-100/90 text-emerald-700 border border-emerald-200/60">
                    {followUpsData.completedCount} Done
                  </span>
                  <span className="text-[11px] px-3 py-1 rounded-full font-bold bg-amber-100/90 text-amber-700 border border-amber-200/60">
                    {followUpsData.pendingCount} Pending
                  </span>
                </div>
              </div>

              {/* Item List */}
              <div className="space-y-2.5 max-h-[280px] overflow-y-auto pr-1">
                {loadingFollowUps ? (
                  <p className="text-xs text-slate-400 py-8 text-center font-medium">Loading follow-ups...</p>
                ) : followUpsData.followups.length === 0 ? (
                  <p className="text-xs text-slate-400 py-8 text-center font-medium">No follow-ups found for selected date range</p>
                ) : (
                  followUpsData.followups.map((fu: any) => (
                    <div key={fu.id} className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50/70 border border-slate-100 hover:bg-slate-100/70 hover:border-slate-200 transition-all">
                      <div className="min-w-0 flex-1 pr-2">
                        <p className="text-xs font-bold text-slate-800 truncate">{fu.leadName}</p>
                        <p className="text-[11px] text-slate-500 font-medium truncate">{fu.type} • {fu.assignedToName}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className={`inline-block text-[10.5px] font-bold px-2.5 py-0.5 rounded-full ${fu.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200/60' : 'bg-blue-100 text-blue-700 border border-blue-200/60'}`}>
                          {fu.status}
                        </span>
                        <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                          {new Date(fu.scheduledAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="mt-4 pt-3.5 border-t border-slate-100">
              <Link href="/followups" className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center justify-center gap-1.5 py-1 transition-colors">
                <span>View All Follow-Ups</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>


          {/* ============================================================ */}
          {/* ITEM 6: SITE VISITS (WITH DATE FILTER)                       */}
          {/* ============================================================ */}
          <div className="bg-white rounded-[28px] border border-slate-200/80 p-6 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 flex flex-col justify-between">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-3 mb-5 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/20 flex items-center justify-center">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">6. Site Visits</h3>
                    <p className="text-xs text-slate-500 font-medium">Filtered date-wise</p>
                  </div>
                </div>

                {/* Date Filter Dropdown */}
                <div className="flex items-center gap-2">
                  <Filter className="w-3.5 h-3.5 text-slate-400" />
                  <select
                    value={siteVisitsRange}
                    onChange={(e) => setSiteVisitsRange(e.target.value)}
                    className="text-xs font-bold bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-3.5 py-1.5 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer transition-all"
                  >
                    {DATE_FILTER_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Custom Date Picker Inputs */}
              {siteVisitsRange === "custom" && (
                <div className="flex items-center gap-2 mb-4 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <input
                    type="date"
                    value={siteVisitsStart}
                    onChange={(e) => setSiteVisitsStart(e.target.value)}
                    className="text-xs border border-slate-300 rounded-lg px-2.5 py-1 outline-none bg-white font-medium"
                  />
                  <span className="text-xs text-slate-400 font-semibold">to</span>
                  <input
                    type="date"
                    value={siteVisitsEnd}
                    onChange={(e) => setSiteVisitsEnd(e.target.value)}
                    className="text-xs border border-slate-300 rounded-lg px-2.5 py-1 outline-none bg-white font-medium"
                  />
                </div>
              )}

              {/* Stat Highlight Banner */}
              <div className="flex items-center justify-between mb-4 bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent rounded-2xl p-4 border border-emerald-200/70">
                <div>
                  <span className="text-3xl font-black text-emerald-600 leading-none">
                    {loadingSiteVisits ? "..." : siteVisitsData.count}
                  </span>
                  <p className="text-xs font-semibold text-emerald-800 mt-1">Total Site Visits Scheduled</p>
                </div>
                <div className="flex gap-2">
                  <span className="text-[11px] px-3 py-1 rounded-full font-bold bg-emerald-100 text-emerald-800 border border-emerald-200/60">
                    {siteVisitsData.completedCount} Completed
                  </span>
                  <span className="text-[11px] px-3 py-1 rounded-full font-bold bg-teal-100 text-teal-800 border border-teal-200/60">
                    {siteVisitsData.confirmedCount} Confirmed
                  </span>
                </div>
              </div>

              {/* Item List */}
              <div className="space-y-2.5 max-h-[280px] overflow-y-auto pr-1">
                {loadingSiteVisits ? (
                  <p className="text-xs text-slate-400 py-8 text-center font-medium">Loading site visits...</p>
                ) : siteVisitsData.visits.length === 0 ? (
                  <p className="text-xs text-slate-400 py-8 text-center font-medium">No site visits found for selected date range</p>
                ) : (
                  siteVisitsData.visits.map((vis: any) => (
                    <div key={vis.id} className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50/70 border border-slate-100 hover:bg-slate-100/70 hover:border-slate-200 transition-all">
                      <div className="min-w-0 flex-1 pr-2">
                        <p className="text-xs font-bold text-slate-800 truncate">{vis.clientName}</p>
                        <p className="text-[11px] text-slate-500 font-medium truncate">{vis.projectName} • {vis.executiveName}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className={`inline-block text-[10.5px] font-bold px-2.5 py-0.5 rounded-full ${vis.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200/60' : 'bg-teal-100 text-teal-700 border border-teal-200/60'}`}>
                          {vis.status}
                        </span>
                        <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                          {new Date(vis.scheduledAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="mt-4 pt-3.5 border-t border-slate-100">
              <Link href="/sitevisits" className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center justify-center gap-1.5 py-1 transition-colors">
                <span>View All Site Visits</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>


          {/* ============================================================ */}
          {/* ITEM 7: BOOKINGS (WITH DATE FILTER)                          */}
          {/* ============================================================ */}
          <div className="bg-white rounded-[28px] border border-slate-200/80 p-6 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 flex flex-col justify-between">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-3 mb-5 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/20 flex items-center justify-center">
                    <FileCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">7. Bookings</h3>
                    <p className="text-xs text-slate-500 font-medium">Filtered date-wise</p>
                  </div>
                </div>

                {/* Date Filter Dropdown */}
                <div className="flex items-center gap-2">
                  <Filter className="w-3.5 h-3.5 text-slate-400" />
                  <select
                    value={bookingsRange}
                    onChange={(e) => setBookingsRange(e.target.value)}
                    className="text-xs font-bold bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-3.5 py-1.5 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer transition-all"
                  >
                    {DATE_FILTER_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Custom Date Picker Inputs */}
              {bookingsRange === "custom" && (
                <div className="flex items-center gap-2 mb-4 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <input
                    type="date"
                    value={bookingsStart}
                    onChange={(e) => setBookingsStart(e.target.value)}
                    className="text-xs border border-slate-300 rounded-lg px-2.5 py-1 outline-none bg-white font-medium"
                  />
                  <span className="text-xs text-slate-400 font-semibold">to</span>
                  <input
                    type="date"
                    value={bookingsEnd}
                    onChange={(e) => setBookingsEnd(e.target.value)}
                    className="text-xs border border-slate-300 rounded-lg px-2.5 py-1 outline-none bg-white font-medium"
                  />
                </div>
              )}

              {/* Stat Highlight Banner */}
              <div className="flex items-center justify-between mb-4 bg-gradient-to-r from-indigo-500/10 via-indigo-500/5 to-transparent rounded-2xl p-4 border border-indigo-200/70">
                <div>
                  <span className="text-3xl font-black text-indigo-600 leading-none">
                    {loadingBookings ? "..." : bookingsData.count}
                  </span>
                  <p className="text-xs font-semibold text-indigo-800 mt-1">Total Confirmed Deals</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-extrabold text-indigo-600">
                    {formatCurrency(bookingsData.totalRevenue)}
                  </p>
                  <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Booking Revenue</p>
                </div>
              </div>

              {/* Item List */}
              <div className="space-y-2.5 max-h-[280px] overflow-y-auto pr-1">
                {loadingBookings ? (
                  <p className="text-xs text-slate-400 py-8 text-center font-medium">Loading bookings...</p>
                ) : bookingsData.bookings.length === 0 ? (
                  <p className="text-xs text-slate-400 py-8 text-center font-medium">No bookings found for selected date range</p>
                ) : (
                  bookingsData.bookings.map((bk: any) => (
                    <div key={bk.id} className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50/70 border border-slate-100 hover:bg-slate-100/70 hover:border-slate-200 transition-all">
                      <div className="min-w-0 flex-1 pr-2">
                        <p className="text-xs font-bold text-slate-800 truncate">{bk.clientName}</p>
                        <p className="text-[11px] text-slate-500 font-medium truncate">{bk.projectName} • Unit {bk.unitNumber}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="inline-block text-[11.5px] font-extrabold text-emerald-600">
                          {formatCurrency(bk.finalAmount)}
                        </span>
                        <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                          {new Date(bk.bookingDate).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="mt-4 pt-3.5 border-t border-slate-100">
              <Link href="/bookings" className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center justify-center gap-1.5 py-1 transition-colors">
                <span>View All Bookings</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

        </div>

        {/* --- Active Campaigns Details Section (Item 8 Breakdown) --- */}
        <div className="bg-white rounded-[28px] border border-slate-200/80 p-6 shadow-sm hover:shadow-xl hover:shadow-slate-200/40 transition-all duration-300">
          <div className="flex items-center justify-between mb-5 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-md shadow-purple-500/20 flex items-center justify-center">
                <Megaphone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">8. Active Campaigns Detail</h3>
                <p className="text-xs text-slate-500 font-medium">Live Meta / Lead Gen Ads connected to CRM</p>
              </div>
            </div>
            <span className="text-xs font-extrabold px-3.5 py-1.5 bg-purple-100 text-purple-700 rounded-full border border-purple-200/60">
              {activeCampaignsData.count} Active
            </span>
          </div>

          {activeCampaignsData.campaigns.length === 0 ? (
            <p className="text-xs text-slate-400 py-8 text-center font-medium">No active marketing campaigns running</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeCampaignsData.campaigns.map((camp: any) => (
                <div key={camp.id} className="p-4.5 rounded-2xl border border-purple-100 bg-gradient-to-br from-purple-50/50 via-purple-50/20 to-transparent hover:bg-purple-50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-extrabold text-purple-900 truncate max-w-[180px]">
                      {camp.campaignName}
                    </span>
                    <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200/60">
                      LIVE
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 font-semibold">Platform: {camp.platform}</p>
                  <p className="text-xs text-slate-500 mt-1 truncate">Form: {camp.formName}</p>
                  <p className="text-[11px] text-slate-400 mt-2 font-bold uppercase tracking-wide">Project: {camp.projectName}</p>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
