"use client";

import React, { useState, useEffect, useCallback } from "react";
import { API_URL } from "../config/api.config";
import { getAuthHeaders } from "../lib/auth";
import PageHeader from "../Components/PageHeader";
import { PAGE_CONTAINER_CLASS, PRIMARY_ACTION_BTN_CLASS } from "../lib/pageLayout";
import { useDashboard } from "./DashboardContext";
import { Download, Upload, ClipboardList, Sparkles, Bell, MapPin, FileCheck, Hourglass, Home as HomeIcon, TrendingUp, BarChart2, ChevronDown } from "lucide-react";

import KPICard from "../Components/KPICard";

// --- Helper Functions ---
const formatCurrencyCr = (val: number) => {
  if (!val) return "₹0";
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)} Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(1)} L`;
  return `₹${val.toLocaleString("en-IN")}`;
};

const formatCurrencyLakh = (val: number) => {
  if (!val) return "₹0";
  if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
  return `₹${val.toLocaleString("en-IN")}`;
};

export default function Home() {
  const { userName, addToast } = useDashboard();
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState("all");

  const [summary, setSummary] = useState<any>({});
  const [inventory, setInventory] = useState<any[]>([]);
  const [employeePerf, setEmployeePerf] = useState<any[]>([]);
  const [topPerformers, setTopPerformers] = useState<any[]>([]);
  const [visits, setVisits] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [leadTrends, setLeadTrends] = useState<any[]>([]);
  const [leadFunnel, setLeadFunnel] = useState<any[]>([]);
  const [leadSources, setLeadSources] = useState<any[]>([]);
  const [todayWork, setTodayWork] = useState<any>({});
  const [reminders, setReminders] = useState<any[]>([]);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);

    if (selectedProject !== 'all') {
      setTimeout(() => {
        setSummary({
          totalLeads: Math.floor(Math.random() * 500) + 100,
          newLeadsToday: Math.floor(Math.random() * 20),
          newLeadsTrendPct: Math.floor(Math.random() * 20) - 5,
          todayFollowUps: Math.floor(Math.random() * 30),
          todayFollowUpsDone: Math.floor(Math.random() * 15),
          todayVisits: Math.floor(Math.random() * 10),
          yesterdayBookings: Math.floor(Math.random() * 5),
          pendingPayments: Math.floor(Math.random() * 50),
          overduePayments: Math.floor(Math.random() * 10),
          conversionRate: (Math.random() * 15 + 5).toFixed(1)
        });
        setInventory([{ totalUnits: 100, available: Math.floor(Math.random() * 50) + 10 }]);
        setEmployeePerf([]);
        setTopPerformers([]);
        setVisits([]);
        setPayments([]);
        setLeadTrends([
          { leads: Math.floor(Math.random() * 10) + 5, date: new Date(Date.now() - 4 * 86400000).toISOString() },
          { leads: Math.floor(Math.random() * 20) + 5, date: new Date(Date.now() - 3 * 86400000).toISOString() },
          { leads: Math.floor(Math.random() * 15) + 5, date: new Date(Date.now() - 2 * 86400000).toISOString() },
          { leads: Math.floor(Math.random() * 35) + 10, date: new Date(Date.now() - 86400000).toISOString() },
          { leads: Math.floor(Math.random() * 25) + 10, date: new Date().toISOString() }
        ]);
        setLeadFunnel([
          { status: 'NEW', count: Math.floor(Math.random() * 200) + 50 },
          { status: 'CONTACTED', count: Math.floor(Math.random() * 100) + 20 },
          { status: 'INTERESTED', count: Math.floor(Math.random() * 50) + 10 },
          { status: 'SITE_VISIT_COMPLETED', count: Math.floor(Math.random() * 20) + 5 },
          { status: 'BOOKED', count: Math.floor(Math.random() * 10) + 2 },
          { status: 'CLOSED', count: Math.floor(Math.random() * 5) + 1 }
        ]);
        setLeadSources([
          { source: 'Facebook', count: Math.floor(Math.random() * 100) + 20, percentage: 40 },
          { source: 'Google', count: Math.floor(Math.random() * 50) + 10, percentage: 20 },
          { source: 'Referral', count: Math.floor(Math.random() * 30) + 5, percentage: 10 }
        ]);
        setTodayWork({});
        setReminders([]);
        setLoading(false);
      }, 500);
      return;
    }

    try {
      const headers = getAuthHeaders();
      const requests = [
        fetch(`${API_URL}/v1/dashboard/summary`, { headers }).then(r => r.ok ? r.json() : null),
        fetch(`${API_URL}/v1/dashboard/project-inventory`, { headers }).then(r => r.ok ? r.json() : null),
        fetch(`${API_URL}/v1/dashboard/employee-performance`, { headers }).then(r => r.ok ? r.json() : null),
        fetch(`${API_URL}/v1/dashboard/top-performers`, { headers }).then(r => r.ok ? r.json() : null),
        fetch(`${API_URL}/v1/dashboard/today-visits`, { headers }).then(r => r.ok ? r.json() : null),
        fetch(`${API_URL}/v1/dashboard/payment-alerts`, { headers }).then(r => r.ok ? r.json() : null),
        fetch(`${API_URL}/v1/dashboard/lead-trends?period=daily&range=7`, { headers }).then(r => r.ok ? r.json() : null),
        fetch(`${API_URL}/v1/dashboard/lead-funnel`, { headers }).then(r => r.ok ? r.json() : null),
        fetch(`${API_URL}/v1/dashboard/lead-sources?period=thisMonth`, { headers }).then(r => r.ok ? r.json() : null),
        fetch(`${API_URL}/v1/dashboard/today-work`, { headers }).then(r => r.ok ? r.json() : null),
        fetch(`${API_URL}/v1/dashboard/reminders`, { headers }).then(r => r.ok ? r.json() : null),
      ];

      const [sumData, invData, empData, topData, visData, payData, trendData, funnelData, srcData, workData, remData] = await Promise.all(requests);

      if (sumData?.success) setSummary(sumData.data || {});
      if (invData?.success) setInventory(invData.data || []);
      if (empData?.success) setEmployeePerf(empData.data || []);
      if (topData?.success) setTopPerformers(topData.data || []);
      if (visData?.success) setVisits(visData.data || []);
      if (payData?.success) setPayments(payData.data || []);
      if (trendData?.success) setLeadTrends(trendData.data || []);
      if (funnelData?.success) setLeadFunnel(funnelData.data || []);
      if (srcData?.success) setLeadSources(srcData.data || []);
      if (workData?.success) setTodayWork(workData.data || {});
      if (remData?.success) {
        // reminders returns { upcoming: [...], overdue: [...] }
        const upcoming = (remData.data?.upcoming || []).map((r: any) => ({ ...r, isOverdue: false }));
        const overdue  = (remData.data?.overdue  || []).map((r: any) => ({ ...r, isOverdue: true  }));
        setReminders([...overdue, ...upcoming]);
      }

    } catch (err: any) {
      console.error(err);
      addToast(err.message || "Error connecting to server", "info");
    } finally {
      setLoading(false);
    }
  }, [addToast, selectedProject]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Derived metrics
  const totalUnits = inventory.reduce((sum, inv) => sum + (inv.totalUnits || 0), 0);
  const unitsAvailable = inventory.reduce((sum, inv) => sum + (inv.available || 0), 0);
  const openPct = totalUnits > 0 ? Math.round((unitsAvailable / totalUnits) * 100) : 0;
  
  const teamDeals = topPerformers.reduce((sum, p) => sum + (p.dealsClosedMonth || 0), 0);
  const teamRevenue = topPerformers.reduce((sum, p) => sum + (p.revenue || 0), 0);
  const teamAvgConv = topPerformers.length > 0 ? (topPerformers.reduce((sum, p) => sum + (p.conversionRate || 0), 0) / topPerformers.length).toFixed(1) : "0";

  return (
    <div className={PAGE_CONTAINER_CLASS}>
      <div className="space-y-6 animate-fade-in-up">
        <PageHeader
          title={<>Welcome Back, <span className="text-brand">{userName}</span></>}
          subtitle="Here's what requires your attention today"
          actions={
            <div className="flex items-center gap-2 bg-white border border-rose-200 hover:border-[#EB3539]/50 shadow-sm rounded-xl px-4 py-2.5 relative transition-all group w-[280px] cursor-pointer">
              <span className="text-slate-500 text-[13px] font-medium whitespace-nowrap">Project:</span>
              <select 
                className="bg-transparent border-none text-[#EB3539] font-bold text-[14px] outline-none cursor-pointer pr-8 focus:ring-0 appearance-none flex-1 w-full"
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
              >
                <option value="all" className="text-slate-800 font-medium">All Projects</option>
                <option value="the_f_row" className="text-slate-800 font-medium">The F row</option>
                <option value="18_aangan" className="text-slate-800 font-medium">18 Aangan</option>
                <option value="eco_town" className="text-slate-800 font-medium">Eco-Town</option>
                <option value="aasis_scahe" className="text-slate-800 font-medium">aasis scahe</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 bg-rose-50 rounded-md flex items-center justify-center group-hover:bg-[#EB3539] transition-colors">
                <ChevronDown className="w-3.5 h-3.5 text-[#EB3539] group-hover:text-white transition-colors" />
              </div>
            </div>
          }
        />

        {/* 8 KPI Cards — inner alignment updated to match Image 2 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <KPICard
            title="Total Leads"
            value={(summary.totalLeads || 0).toLocaleString('en-IN')}
            trend={summary.newLeadsTrendPct != null ? `${summary.newLeadsTrendPct > 0 ? '+' : ''}${summary.newLeadsTrendPct}% vs last mo.` : "—"}
            isUp={(summary.newLeadsTrendPct ?? 0) >= 0}
            subtext="All time, all sources"
            accentColor="#3b82f6"
          />
          <KPICard
            title="New Leads Today"
            value={summary.newLeadsToday || 0}
            trend="+3 vs yesterday"
            isUp={true}
            subtext="Captured since midnight"
            accentColor="#f59e0b"
          />
          <KPICard
            title="Today's Follow-Ups"
            value={summary.todayFollowUps || 0}
            trend="In progress"
            isUp={true}
            subtext={`${summary.todayFollowUpsDone || 0} completed so far`}
            accentColor="#EB3539"
          />
          <KPICard
            title="Today's Site Visits"
            value={summary.todayVisits || 0}
            trend="+2 vs yesterday"
            isUp={true}
            subtext="Scheduled & confirmed"
            accentColor="#10b981"
          />
          <KPICard
            title="Yesterday's Bookings"
            value={summary.yesterdayBookings || 0}
            trend="+1 vs prev. day"
            isUp={true}
            subtext="Confirmed deals"
            accentColor="#6366f1"
          />
          <KPICard
            title="Pending Payments"
            value={summary.pendingPayments || 0}
            trend={`${summary.overduePayments || 0} overdue`}
            isUp={(summary.overduePayments ?? 0) === 0}
            subtext="Due within 7 days"
            accentColor="#f97316"
          />
          <KPICard
            title="Units Available"
            value={unitsAvailable || 0}
            trend={`${openPct}% open`}
            isUp={true}
            subtext={`of ${totalUnits || 0} total units`}
            accentColor="#14b8a6"
          />
          <KPICard
            title="Conversion Rate"
            value={`${summary.conversionRate || 0}%`}
            trend="+1.2% this week"
            isUp={true}
            subtext="Lead-to-booking ratio"
            accentColor="#a855f7"
          />
        </div>

        {/* ROW 2: Lead Trend + Lead Funnel + Lead Sources */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Lead Trend — last 7 days */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-[16px] font-bold text-slate-900">Lead trend — last 7 days</h3>
              {leadTrends.length > 0 && (() => {
                const last = leadTrends[leadTrends.length - 1]?.leads || 0;
                const prev = leadTrends[leadTrends.length - 2]?.leads || 0;
                const up = last >= prev;
                return (
                  <span className={`text-[11px] px-2.5 py-1 rounded-full font-semibold flex items-center gap-1 ${up ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-500'}`}>
                    {up ? '↑' : '↓'} {up ? 'Recovering' : 'Dipping'}
                  </span>
                );
              })()}
            </div>
            {leadTrends.length === 0 ? (
              <div className="flex items-center justify-center h-[150px]">
                <p className="text-sm text-slate-400">No trend data available</p>
              </div>
            ) : (() => {
              const maxVal = Math.max(...leadTrends.map((d: any) => d.leads), 1);
              const minVal = Math.min(...leadTrends.map((d: any) => d.leads));
              const W = 300; const H = 140; const padX = 10; const padTop = 16; const padBottom = 26;
              const pts = leadTrends.map((d: any, i: number) => {
                const x = padX + (i / Math.max(leadTrends.length - 1, 1)) * (W - padX * 2);
                const range = maxVal - minVal || 1;
                const y = padTop + ((maxVal - d.leads) / range) * (H - padTop - padBottom);
                return { x, y, d };
              });
              const path = pts.map((p: any, i: number) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
              const area = `${path} L${pts[pts.length-1].x.toFixed(1)},${(H - padBottom).toFixed(1)} L${pts[0].x.toFixed(1)},${(H - padBottom).toFixed(1)} Z`;
              return (
                <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 150 }}>
                  <defs>
                    <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2563eb" stopOpacity="0.18"/>
                      <stop offset="100%" stopColor="#2563eb" stopOpacity="0"/>
                    </linearGradient>
                  </defs>
                  <path d={area} fill="url(#trendGrad)"/>
                  <path d={path} fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  {pts.map((p: any, i: number) => (
                    <circle key={i} cx={p.x} cy={p.y} r="4" fill="white" stroke="#2563eb" strokeWidth="2"/>
                  ))}
                  {pts.map((p: any, i: number) => (
                    <text key={`lbl${i}`} x={p.x} y={H - 4} textAnchor="middle" fontSize="10" fill="#94a3b8" fontWeight="500">
                      {p.d.date ? new Date(p.d.date).toLocaleDateString('en-IN', { weekday: 'short' }) : p.d.week || p.d.month || ''}
                    </text>
                  ))}
                </svg>
              );
            })()}
          </div>

          {/* Lead Funnel */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-[16px] font-bold text-slate-900">Lead funnel</h3>
              <span className="text-[13px] font-medium text-slate-400">This month</span>
            </div>
            {leadFunnel.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-10">No funnel data</p>
            ) : (
              <div className="space-y-2">
                {(() => {
                  const COLORS = ['#2563eb','#7c3aed','#d97706','#059669','#dc2626','#0891b2','#be185d'];
                  const funnelStages = ['NEW','CONTACTED','INTERESTED','SITE_VISIT_COMPLETED','BOOKED','CLOSED'];
                  const filtered = funnelStages
                    .map(key => leadFunnel.find((f: any) => f.status === key))
                    .filter(Boolean) as any[];
                  const topCount = filtered[0]?.count || 1;
                  return filtered.map((f: any, i: number) => {
                    const pct = Math.round((f.count / topCount) * 100);
                    const clr = COLORS[i % COLORS.length];
                    const passRate = i > 0 ? `${Math.round((f.count / (filtered[i-1]?.count || 1)) * 100)}% pass` : '';
                    const shortLabel: Record<string,string> = {NEW:'Total Leads',CONTACTED:'Contacted',INTERESTED:'Interested',SITE_VISIT_COMPLETED:'Site Visited',BOOKED:'Booked',CLOSED:'Closed/Won'};
                    return (
                      <div key={f.status} className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-500 w-[76px] text-right flex-shrink-0">{shortLabel[f.status] || f.label}</span>
                        <div className="flex-1 h-5 bg-slate-50 rounded overflow-hidden">
                          <div className="h-full rounded flex items-center pl-2" style={{width:`${Math.max(pct,8)}%`, background:`${clr}22`}}>
                            <span className="text-[11px] font-medium" style={{color:clr}}>{f.count.toLocaleString()}</span>
                          </div>
                        </div>
                        <span className="text-[10px] text-slate-400 w-[42px] flex-shrink-0">{passRate}</span>
                      </div>
                    );
                  });
                })()}
              </div>
            )}
          </div>

          {/* Lead Sources */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-[16px] font-bold text-slate-900">Lead sources</h3>
              <span className="text-[13px] font-medium text-slate-400">This month</span>
            </div>
            {leadSources.length === 0 ? (
              <div className="flex items-center justify-center h-[150px]">
                <p className="text-sm text-slate-400">No source data available</p>
              </div>
            ) : (() => {
              const SRC_COLORS = ['#2563eb','#16a34a','#7c3aed','#d97706','#94a3b8','#dc2626','#0891b2'];
              const total = leadSources.reduce((s: number, d: any) => s + d.count, 0) || 1;
              const R = 52; const cx = 64; const cy = 64;
              const innerR = R * 0.58;
              let startAngle = -Math.PI / 2;
              const slices = leadSources.slice(0, 6).map((src: any, i: number) => {
                const pct = src.count / total;
                const sweep = pct * 2 * Math.PI;
                const x1 = cx + R * Math.cos(startAngle);
                const y1 = cy + R * Math.sin(startAngle);
                const endA = startAngle + sweep;
                const x2 = cx + R * Math.cos(endA);
                const y2 = cy + R * Math.sin(endA);
                const large = sweep > Math.PI ? 1 : 0;
                // Donut arc path: outer arc then inner arc back
                const d = [
                  `M${(cx + innerR * Math.cos(startAngle)).toFixed(2)},${(cy + innerR * Math.sin(startAngle)).toFixed(2)}`,
                  `L${x1.toFixed(2)},${y1.toFixed(2)}`,
                  `A${R},${R} 0 ${large} 1 ${x2.toFixed(2)},${y2.toFixed(2)}`,
                  `L${(cx + innerR * Math.cos(endA)).toFixed(2)},${(cy + innerR * Math.sin(endA)).toFixed(2)}`,
                  `A${innerR},${innerR} 0 ${large} 0 ${(cx + innerR * Math.cos(startAngle)).toFixed(2)},${(cy + innerR * Math.sin(startAngle)).toFixed(2)}`,
                  'Z'
                ].join(' ');
                const slice = { d, clr: SRC_COLORS[i % SRC_COLORS.length], src, pct };
                startAngle = endA;
                return slice;
              });
              return (
                <div className="flex flex-col items-center gap-5">
                  {/* Centered Donut */}
                  <svg viewBox="0 0 128 128" style={{ width: 130, height: 130 }}>
                    <circle cx={cx} cy={cy} r={R} fill="#f1f5f9"/>
                    {slices.map((sl, i) => (
                      <path key={i} d={sl.d} fill={sl.clr} stroke="#fff" strokeWidth="2"/>
                    ))}
                  </svg>
                  {/* Horizontal legend row at bottom */}
                  <div className="flex items-start justify-around w-full">
                    {slices.map((sl, i) => (
                      <div key={i} className="flex flex-col items-center gap-1 flex-1 min-w-0 px-1">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: sl.clr }}/>
                        <span className="text-[11px] font-medium text-slate-500 text-center leading-tight w-full truncate">{sl.src.source}</span>
                        <span className="text-[13px] font-bold text-slate-800">{sl.src.percentage}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* ROW 3: Today's Work + Today's Reminders */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Today's Work */}
          <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-900">Today's work</h3>
              <span className="text-[13px] text-slate-500">
                {((todayWork.followUps?.length || 0) + (todayWork.visits?.length || 0) + (todayWork.newLeadsAssigned?.length || 0))} items
              </span>
            </div>
            <div className="space-y-1">
              {(todayWork.followUps || []).slice(0, 3).map((f: any) => (
                <div key={f.id} className="flex items-center gap-2 py-2 border-b border-slate-50">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0"></span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-slate-800 truncate">{f.type} — {f.leadName}</p>
                    <p className="text-[11px] text-slate-500">{new Date(f.time).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}</p>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 font-medium">Follow-up</span>
                </div>
              ))}
              {(todayWork.visits || []).slice(0, 2).map((v: any) => (
                <div key={v.id} className="flex items-center gap-2 py-2 border-b border-slate-50">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0"></span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-slate-800 truncate">Site Visit — {v.leadName}</p>
                    <p className="text-[11px] text-slate-500">{v.projectName} · {new Date(v.time).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}</p>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 font-medium">Visit</span>
                </div>
              ))}
              {(todayWork.newLeadsAssigned || []).slice(0, 2).map((l: any) => (
                <div key={l.id} className="flex items-center gap-2 py-2 border-b border-slate-50">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0"></span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-slate-800 truncate">New Lead — {l.name}</p>
                    <p className="text-[11px] text-slate-500">{l.source} · {l.phone}</p>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 font-medium">New</span>
                </div>
              ))}
              {!loading && !todayWork.followUps?.length && !todayWork.visits?.length && !todayWork.newLeadsAssigned?.length && (
                <p className="text-sm text-slate-400 py-6 text-center">All clear — nothing pending today!</p>
              )}
            </div>
          </div>

          {/* Today's Reminders */}
          <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-900">Today's reminders</h3>
            </div>
            <div className="space-y-1">
              {reminders.length === 0 && !loading && (
                <p className="text-sm text-slate-400 py-6 text-center">No reminders for today</p>
              )}
              {reminders.slice(0, 6).map((r: any) => {
                const isVisit = r.type === 'Site Visit';
                const isOverdue = r.isOverdue;
                const badgeBg = isOverdue ? 'bg-rose-50 text-rose-600' : isVisit ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600';
                return (
                  <div key={r.id} className="flex items-start gap-3 py-2 border-b border-slate-50 last:border-0">
                    <span className="text-[11px] font-medium text-slate-500 w-[56px] pt-0.5 flex-shrink-0">
                      {new Date(r.scheduledAt || r.time).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-slate-800 truncate">{r.type} — {r.leadName || r.clientName}</p>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">{r.notes || r.projectName || ''}</p>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium mt-1.5 inline-block ${badgeBg}`}>
                        {isOverdue ? 'urgent' : isVisit ? 'visit' : 'call'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Lower Section (Employee Follow-Ups, Top Performers, Site Visits, Payment Alerts) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* Employee Follow-Ups */}
          <div className="lg:col-span-4 bg-white rounded-xl border border-slate-100 p-6 shadow-sm flex flex-col">
            <h3 className="text-lg font-bold text-slate-900">Employee Follow-Ups Today</h3>
            <p className="text-[13px] text-slate-500 mb-6">Real-time progress per team member</p>
            <div className="space-y-5 flex-1">
              {employeePerf.length === 0 && !loading && <p className="text-sm text-slate-500">No data available.</p>}
              {employeePerf.map((emp) => {
                const pct = emp.todayFollowUps > 0 ? (emp.followUpsDone / emp.todayFollowUps) * 100 : 0;
                const barColor = pct === 100 ? 'bg-emerald-500' : 'bg-[#1E293B]';
                return (
                  <div key={emp.id} className="flex items-center gap-3">
                    <div className="relative flex-shrink-0">
                      <div className="w-[38px] h-[38px] rounded-full bg-[#1E293B] text-white flex items-center justify-center font-medium text-[13px]">
                        {emp.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
                      </div>
                      <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-end mb-1.5">
                        <div className="truncate pr-2">
                          <p className="text-[13px] font-medium text-slate-800 truncate">{emp.name}</p>
                          <p className="text-[11px] text-slate-500 truncate">{emp.role.replace(/_/g, ' ')}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-[12px] font-medium text-slate-800">{emp.followUpsDone}/{emp.todayFollowUps}</p>
                          <p className="text-[10px] text-slate-400">Calls <span className="font-medium text-slate-800">{emp.callsMade}</span></p>
                        </div>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-[5px] overflow-hidden">
                        <div className={`${barColor} rounded-full h-full transition-all duration-500`} style={{ width: `${pct}%` }}></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top Performers */}
          <div className="lg:col-span-4 bg-white rounded-xl border border-slate-100 p-6 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Top Performers</h3>
              <p className="text-[13px] text-slate-500 mb-6">This month - by deals closed</p>
              <div className="space-y-4">
                {topPerformers.length === 0 && !loading && <p className="text-sm text-slate-500">No data available.</p>}
                {topPerformers.map((emp, idx) => {
                  const rankColors = [
                    "bg-amber-100 text-amber-600",
                    "bg-slate-200 text-slate-600",
                    "bg-orange-100 text-orange-600",
                    "bg-slate-100 text-slate-500",
                    "bg-slate-100 text-slate-500"
                  ];
                  return (
                    <div key={emp.userId} className="flex items-center gap-3">
                      <div className={`w-[22px] h-[22px] rounded-full flex items-center justify-center text-[11px] font-medium flex-shrink-0 ${rankColors[idx] || rankColors[4]}`}>
                        {idx + 1}
                      </div>
                      <div className="relative flex-shrink-0">
                        <div className="w-[30px] h-[30px] rounded-full bg-[#1E293B] text-white flex items-center justify-center font-medium text-[11px]">
                          {emp.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium text-slate-800 truncate">{emp.name}</p>
                        <p className="text-[11px] text-slate-500">{emp.conversionRate}% conversion</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-[13px] font-medium text-slate-800">{emp.dealsClosedMonth}</p>
                        <p className="text-[10px] text-slate-400">deals</p>
                      </div>
                      <div className="text-right w-16 flex-shrink-0">
                        <p className="text-[13px] font-medium text-emerald-600">{formatCurrencyCr(emp.revenue)}</p>
                        <p className="text-[10px] text-slate-400">revenue</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div className="mt-6 pt-4 border-t border-slate-100">
              <p className="text-[11px] text-slate-400 font-medium mb-2 uppercase tracking-wide">Team this month</p>
              <div className="flex justify-between items-center mb-1">
                <span className="text-[12px] text-slate-500 font-medium">Total Deals</span>
                <span className="text-[14px] font-medium text-slate-800">{teamDeals}</span>
              </div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-[12px] text-slate-500 font-medium">Total Revenue</span>
                <span className="text-[14px] font-medium text-slate-800">{formatCurrencyCr(teamRevenue)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[12px] text-slate-500 font-medium">Avg. Conversion</span>
                <span className="text-[14px] font-medium text-slate-800">{teamAvgConv}%</span>
              </div>
            </div>
          </div>

          {/* Right Column: Site Visits & Payment Alerts */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            
            {/* Today's Site Visits */}
            <div className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm flex-1">
              <h3 className="text-lg font-bold text-slate-900">Today's Site Visits</h3>
              <p className="text-[13px] text-slate-500 mb-5">Scheduled appointments</p>
              <div className="space-y-4">
                {visits.length === 0 && !loading && <p className="text-sm text-slate-500">No visits scheduled today.</p>}
                {visits.slice(0, 4).map(v => (
                  <div key={v.id} className="flex gap-3 items-start">
                    <div className="w-[60px] flex-shrink-0 pt-0.5">
                      <p className="text-[11px] font-medium text-slate-800">
                        {new Date(v.time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                      </p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-slate-800 truncate">{v.clientName}</p>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">{v.projectName} {v.unitNumber ? `- ${v.unitNumber}` : ''}</p>
                      <p className="text-[11px] text-slate-500 truncate">with {v.executiveName}</p>
                    </div>
                    <div className="flex-shrink-0">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${v.status === 'confirmed' ? 'bg-emerald-50 text-emerald-600' : v.status === 'completed' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'}`}>
                        {v.status === 'confirmed' ? 'Confirmed' : v.status === 'completed' ? 'Completed' : 'Pending'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Alerts */}
            <div className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900">Payment Alerts</h3>
              <p className="text-[13px] text-slate-500 mb-5">Overdue & due within 48hrs</p>
              <div className="space-y-3">
                {payments.length === 0 && !loading && <p className="text-sm text-slate-500">No urgent payments.</p>}
                {payments.slice(0, 4).map(p => (
                  <div key={p.id} className={`pl-3 py-1 border-l-2 ${p.status === 'Overdue' ? 'border-rose-500' : 'border-amber-400'} flex justify-between items-start`}>
                    <div className="min-w-0 flex-1 pr-2">
                      <p className="text-[13px] font-medium text-slate-800 truncate">{p.clientName}</p>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">{p.paymentType || 'Installment'} - <span className={`font-medium ${p.status === 'Overdue' ? 'text-rose-500' : 'text-amber-500'}`}>{p.dueLabel}</span></p>
                    </div>
                    <div className="flex-shrink-0">
                      <p className={`text-[13px] font-medium ${p.status === 'Overdue' ? 'text-rose-600' : 'text-amber-500'}`}>
                        {formatCurrencyLakh(p.amount)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
