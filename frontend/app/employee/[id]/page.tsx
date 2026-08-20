"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  FunnelChart, Funnel,
} from "recharts";
import { generateMockEmployeeAnalytics } from "../../../lib/mockEmployeeData";
import { useDashboard } from "../../DashboardContext";
import { API_URL } from "../../../config/api.config";
import { getAuthHeaders } from "../../../lib/auth";
import { ROLE_LABELS } from "../../../lib/permissions";
import KPICard from "../../../Components/KPICard";

const COLORS = ["#EF4444", "#3B82F6", "#8B5CF6", "#10B981", "#F59E0B", "#EC4899"];

function formatRevenue(amount: number) {
  if (!amount) return "₹0";
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`;
  if (amount >= 100000) return `₹${Math.round(amount / 100000)}L`;
  if (amount >= 1000) return `₹${Math.round(amount / 1000)}K`;
  return `₹${amount}`;
}

export default function EmployeeDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { addToast } = useDashboard();

  const [activeTab, setActiveTab] = useState<"overview" | "projects" | "clients" | "analysis" | "performance">("overview");
  const [employee, setEmployee] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const employeeId = params.id as string;

  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        const res = await fetch(`${API_URL}/v1/users/${employeeId}`, {
          headers: getAuthHeaders(),
        });
        const json = await res.json();
        if (json.success) {
          setEmployee(json.data);
        } else {
          addToast(json.message || "Failed to load employee details", "info");
        }
      } catch (err) {
        addToast("Error fetching employee details", "info");
      } finally {
        setLoading(false);
      }
    };
    fetchEmployee();
  }, [employeeId]);

  // Use mock data for charts but pass the real employee name
  const mockData = generateMockEmployeeAnalytics(employeeId, employee?.name || "Loading...");

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center pb-10">
        <span className="w-10 h-10 rounded-full border-[3px] border-slate-200 border-t-[#38B6FF] animate-spin" />
        <p className="mt-4 text-slate-500 font-medium">Loading details...</p>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center pb-10">
        <p className="text-slate-500 font-medium">Employee not found.</p>
        <button onClick={() => router.back()} className="mt-4 px-6 py-2 bg-slate-900 text-white rounded-lg font-medium">Go Back</button>
      </div>
    );
  }

  const roleLabel = ROLE_LABELS[employee.role] || employee.role;
  const joinDate = new Date(employee.createdAt).toLocaleDateString("en-IN", {
    year: "numeric", month: "long", day: "numeric"
  });

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "projects", label: "Projects" },
    { id: "clients", label: "Clients" },
    { id: "analysis", label: "Analytics" },
    { id: "performance", label: "Performance" },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-12">
      {/* Header section - Clean & Professional */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
            >
              <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center text-white text-lg font-bold">
                {employee.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)}
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">{employee.name}</h1>
                <p className="text-sm font-medium text-slate-500">{roleLabel}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 text-xs font-bold rounded-full ${employee.isActive ? 'bg-[#DCFCE7] text-[#16A34A]' : 'bg-slate-100 text-slate-600'}`}>
              {employee.isActive ? 'Active' : 'Inactive'}
            </span>
            {employee.performanceTag && (
              <span className="px-3 py-1 text-xs font-bold rounded-full bg-[#EDE9FE] text-[#7C3AED]">
                {employee.performanceTag}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-8 space-y-6">
        {/* Profile Card & Real Stats */}

        <div className="space-y-6">
          <div className="bg-white rounded-[26px] p-6 border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between md:items-center gap-6">
            <div className="flex-1">
              <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-5">Contact Information</h3>
              <div className="flex flex-col sm:flex-row gap-6 sm:gap-12">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  </div>
                  <div>
                    <p className="text-[14px] font-bold text-slate-900">{employee.email}</p>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wide mt-0.5">Work Email</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                  </div>
                  <div>
                    <p className="text-[14px] font-bold text-slate-900">{employee.phone || "N/A"}</p>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wide mt-0.5">Mobile Number</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="md:border-l md:border-slate-100 md:pl-8 pt-5 md:pt-0 border-t border-slate-100 md:border-t-0 flex flex-col justify-center">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Joined On</p>
              <p className="text-sm font-bold text-slate-900 mt-1">{joinDate}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <KPICard title="Assigned Leads" value={employee.stats?.assignedLeads || 0} accentColor="#3b82f6" />
            <KPICard title="Deals Closed" value={employee.stats?.dealsClosed || 0} accentColor="#10B981" />
            <KPICard title="Conversion Rate" value={`${employee.stats?.conversionRate || 0}%`} accentColor="#8B5CF6" />
            <KPICard title="Revenue" value={formatRevenue(employee.stats?.revenueGenerated || 0)} accentColor="#F59E0B" />
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 overflow-x-auto pb-2 border-b border-slate-200 hide-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-5 py-2.5 rounded-full text-[13.5px] font-bold transition-all whitespace-nowrap cursor-pointer ${activeTab === tab.id
                  ? "bg-slate-900 text-white shadow-md"
                  : "bg-white text-slate-500 hover:text-slate-900 hover:bg-slate-100 border border-slate-200"
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content - Mostly Mock for Visual Representation */}
        <div className="pt-2">
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
                  <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-6">Performance Trend</h3>
                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={[
                          { period: "Last Year", score: mockData.monthlyComparison.lastYear },
                          { period: "Last 6M", score: mockData.monthlyComparison.last6Months },
                          { period: "Last 3M", score: mockData.monthlyComparison.last3Months },
                          { period: "Prev Month", score: mockData.monthlyComparison.previousMonth },
                          { period: "Current", score: mockData.monthlyComparison.currentMonth },
                        ]}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                        <XAxis dataKey="period" stroke="#94a3b8" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600 }} dy={10} />
                        <YAxis stroke="#94a3b8" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600 }} />
                        <Tooltip contentStyle={{ borderRadius: '16px', border: '1px solid #f1f5f9', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }} />
                        <Line type="monotone" dataKey="score" stroke="#0f172a" strokeWidth={3} dot={{ fill: "#0f172a", r: 4, strokeWidth: 2, stroke: "#fff" }} activeDot={{ r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
                  <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-6">Monthly Revenue Prediction</h3>
                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={mockData.chartData.monthlyRevenue}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                        <XAxis dataKey="month" stroke="#94a3b8" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600 }} dy={10} />
                        <YAxis stroke="#94a3b8" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600 }} />
                        <Tooltip formatter={(value: any) => formatRevenue(value as number)} cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '16px', border: '1px solid #f1f5f9', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }} />
                        <Bar dataKey="revenue" fill="#3b82f6" radius={[6, 6, 6, 6]} barSize={30} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Clean Leaderboard */}
              <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
                <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-6">Team Leaderboard (Mocked)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {mockData.leaderboard.map((emp) => (
                    <div key={emp.rank} className="flex items-center justify-between p-4 bg-[#F8FAFC] rounded-2xl border border-slate-100">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${emp.rank === 1 ? 'bg-amber-100 text-amber-700' : 'bg-white text-slate-700 shadow-sm'}`}>
                          #{emp.rank}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-[14px]">{emp.name}</p>
                          {emp.rank === 1 && <p className="text-[11px] font-bold text-amber-600 mt-0.5">Top Performer</p>}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-slate-900 text-lg">{emp.score}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Score</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "projects" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {mockData.projects.map((project) => (
                  <div key={project.projectId} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
                    <h4 className="text-[16px] font-bold text-slate-900 mb-6">{project.projectName}</h4>
                    <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                      <div>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Leads Generated</p>
                        <p className="text-xl font-bold text-slate-900 mt-1">{project.leadsGenerated}</p>
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Inquiries</p>
                        <p className="text-xl font-bold text-slate-900 mt-1">{project.inquiriesHandled}</p>
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Site Visits</p>
                        <p className="text-xl font-bold text-slate-900 mt-1">{project.siteVisits}</p>
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Bookings</p>
                        <p className="text-xl font-bold text-slate-900 mt-1">{project.bookingsCompleted}</p>
                      </div>
                      <div className="col-span-2 pt-4 border-t border-slate-100">
                        <div className="flex justify-between items-center mb-2">
                          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Conversion Rate</p>
                          <p className="text-[13px] font-bold text-[#16A34A]">{project.conversionRate}%</p>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-[#16A34A]" style={{ width: `${project.conversionRate}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "clients" && (
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden mt-4">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-[#F8FAFC] border-b border-slate-100 text-[11px] uppercase tracking-wider text-slate-400 font-bold">
                    <tr>
                      <th className="px-6 py-4">Client Name</th>
                      <th className="px-6 py-4">Lead ID</th>
                      <th className="px-6 py-4">Project</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Last Activity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {mockData.clients.map((client) => (
                      <tr key={client.clientId} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-bold text-slate-900">{client.clientName}</p>
                          <p className="text-xs text-slate-500 font-medium mt-0.5">{client.contactNumber}</p>
                        </td>
                        <td className="px-6 py-4 font-mono text-xs text-slate-500 font-medium">{client.leadId}</td>
                        <td className="px-6 py-4 font-bold text-slate-700">{client.projectInterested}</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-[11px] font-bold ${client.currentStatus === "Hot Lead" ? "bg-red-50 text-red-600" :
                              client.currentStatus === "Warm Lead" ? "bg-amber-50 text-amber-600" :
                                "bg-blue-50 text-blue-600"
                            }`}>
                            {client.currentStatus}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs font-medium text-slate-500">{client.lastActivityDate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "analysis" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
              <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
                <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-6">Conversion Funnel</h3>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <FunnelChart>
                      <Tooltip contentStyle={{ borderRadius: '16px', border: '1px solid #f1f5f9', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }} />
                      <Funnel dataKey="count" data={mockData.chartData.conversionFunnel} isAnimationActive>
                        {mockData.chartData.conversionFunnel.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Funnel>
                    </FunnelChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
                <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-6">Activity Summary</h3>
                <div className="space-y-4">
                  {[
                    { label: "Calls Made", value: mockData.activityLog.callsMade },
                    { label: "WhatsApp Conversations", value: mockData.activityLog.whatsappConversations },
                    { label: "Emails Sent", value: mockData.activityLog.emailsSent },
                    { label: "Follow-ups Completed", value: mockData.activityLog.followupsCompleted },
                    { label: "Site Visits Arranged", value: mockData.activityLog.siteVisitsArranged },
                  ].map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center pb-4 border-b border-slate-50 last:border-0 last:pb-0">
                      <span className="text-[13.5px] font-bold text-slate-600">{item.label}</span>
                      <span className="text-lg font-black text-slate-900">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "performance" && (
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm mt-4">
              <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-6">Targets vs Achievements</h3>
              <div className="space-y-6">
                {mockData.targets.map((target) => (
                  <div key={target.month} className="p-5 rounded-3xl bg-[#F8FAFC] border border-slate-100">
                    <h4 className="font-bold text-slate-900 mb-4">{target.month}</h4>
                    <div className="space-y-5">
                      <div>
                        <div className="flex justify-between text-[11px] font-bold mb-2">
                          <span className="text-slate-400 uppercase tracking-wide">Leads Target ({target.achievedLeads}/{target.targetLeads})</span>
                          <span className="text-slate-900 text-[13px]">{Math.round((target.achievedLeads / target.targetLeads) * 100)}%</span>
                        </div>
                        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div className="h-full bg-slate-900 rounded-full transition-all" style={{ width: `${Math.min((target.achievedLeads / target.targetLeads) * 100, 100)}%` }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-[11px] font-bold mb-2">
                          <span className="text-slate-400 uppercase tracking-wide">Revenue Target ({formatRevenue(target.achievedRevenue)} / {formatRevenue(target.targetRevenue)})</span>
                          <span className="text-slate-900 text-[13px]">{Math.round((target.achievedRevenue / target.targetRevenue) * 100)}%</span>
                        </div>
                        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div className="h-full bg-[#16A34A] rounded-full transition-all" style={{ width: `${Math.min((target.achievedRevenue / target.targetRevenue) * 100, 100)}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
