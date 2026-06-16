"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  FunnelChart,
  Funnel,
} from "recharts";
import { generateMockEmployeeAnalytics } from "../../../lib/mockEmployeeData";
import { useDashboard } from "../../DashboardContext";

const COLORS = [
  "#EF4444",
  "#3B82F6",
  "#8B5CF6",
  "#10B981",
  "#F59E0B",
  "#EC4899",
];

function formatRevenue(amount: number) {
  if (!amount) return "₹0";
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`;
  if (amount >= 100000) return `₹${Math.round(amount / 100000)}L`;
  if (amount >= 1000) return `₹${Math.round(amount / 1000)}K`;
  return `₹${amount}`;
}

function getPerformanceColor(score: number) {
  if (score >= 80) return "text-green-600";
  if (score >= 60) return "text-blue-600";
  if (score >= 40) return "text-yellow-600";
  return "text-red-600";
}

function getPerformanceBgColor(score: number) {
  if (score >= 80) return "bg-green-50";
  if (score >= 60) return "bg-blue-50";
  if (score >= 40) return "bg-yellow-50";
  return "bg-red-50";
}

export default function EmployeeDetailPage() {
  const router = useRouter();
  const params = useParams();
  useDashboard();
  const [activeTab, setActiveTab] = useState<
    "overview" | "projects" | "clients" | "analysis" | "performance"
  >("overview");

  const employeeId = params.id as string;
  const employeeName = `Employee ${employeeId}`;
  const data = generateMockEmployeeAnalytics(employeeId, employeeName);

  const conversionRate =
    data.metrics.leadsAssigned > 0
      ? Math.round(
          (data.metrics.dealsClosed / data.metrics.leadsAssigned) * 100
        )
      : 0;

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "projects", label: "Projects" },
    { id: "clients", label: "Clients" },
    { id: "analysis", label: "Analytics" },
    { id: "performance", label: "Performance" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 pb-10">
      {/* Header with Back Button */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <svg
              className="w-5 h-5 text-slate-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {data.employeeName}
            </h1>
            <p className="text-sm text-slate-600">{data.role}</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Performance Score Card */}
        <div
          className={`${getPerformanceBgColor(
            data.performanceScore
          )} rounded-3xl p-8 border-2 border-slate-200 shadow-sm`}
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <p className="text-slate-600 font-bold text-sm uppercase tracking-wide">
                Performance Score
              </p>
              <div className="flex items-baseline gap-2 mt-3">
                <p
                  className={`text-5xl font-bold ${getPerformanceColor(
                    data.performanceScore
                  )}`}
                >
                  {data.performanceScore}
                </p>
                <p className="text-slate-600 font-semibold">/100</p>
              </div>
              <p className="text-xs text-slate-600 mt-2">
                ★ Rank #{data.performanceRank} of {data.performanceRankTotal}
              </p>
            </div>

            <div>
              <p className="text-slate-600 font-bold text-sm uppercase tracking-wide">
                Deals Closed
              </p>
              <p className="text-4xl font-bold text-slate-900 mt-3">
                {data.metrics.dealsClosed}
              </p>
              <p className="text-xs text-slate-600 mt-2">This month</p>
            </div>

            <div>
              <p className="text-slate-600 font-bold text-sm uppercase tracking-wide">
                Conversion Rate
              </p>
              <p className="text-4xl font-bold text-slate-900 mt-3">
                {conversionRate}%
              </p>
              <p className="text-xs text-slate-600 mt-2">Lead to deal</p>
            </div>

            <div>
              <p className="text-slate-600 font-bold text-sm uppercase tracking-wide">
                Revenue Generated
              </p>
              <p className="text-3xl font-bold text-slate-900 mt-3">
                {formatRevenue(data.metrics.revenueGenerated)}
              </p>
              <p className="text-xs text-slate-600 mt-2">This month</p>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
            <p className="text-slate-600 text-xs font-bold uppercase tracking-wide">
              Leads Assigned
            </p>
            <p className="text-3xl font-bold text-slate-900 mt-2">
              {data.metrics.leadsAssigned}
            </p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
            <p className="text-slate-600 text-xs font-bold uppercase tracking-wide">
              Site Visits
            </p>
            <p className="text-3xl font-bold text-slate-900 mt-2">
              {data.metrics.siteVisitsCompleted}
            </p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
            <p className="text-slate-600 text-xs font-bold uppercase tracking-wide">
              Customer Satisfaction
            </p>
            <p className="text-3xl font-bold text-blue-600 mt-2">
              {data.metrics.customerSatisfaction}%
            </p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
            <p className="text-slate-600 text-xs font-bold uppercase tracking-wide">
              Task Completion
            </p>
            <p className="text-3xl font-bold text-green-600 mt-2">
              {data.metrics.taskCompletionRate}%
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-slate-200 bg-white rounded-t-2xl">
          <div className="flex overflow-x-auto px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-6 py-4 font-semibold text-sm border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? "border-red-500 text-red-600"
                    : "border-transparent text-slate-600 hover:text-slate-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div>
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="space-y-8">
              {/* Monthly Comparison */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 mb-6">
                  Performance Trend
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart
                    data={[
                      {
                        period: "Last Year",
                        score: data.monthlyComparison.lastYear,
                      },
                      {
                        period: "Last 6M",
                        score: data.monthlyComparison.last6Months,
                      },
                      {
                        period: "Last 3M",
                        score: data.monthlyComparison.last3Months,
                      },
                      {
                        period: "Prev Month",
                        score: data.monthlyComparison.previousMonth,
                      },
                      {
                        period: "Current",
                        score: data.monthlyComparison.currentMonth,
                      },
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="period" stroke="#64748b" />
                    <YAxis stroke="#64748b" />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="#EF4444"
                      strokeWidth={3}
                      dot={{ fill: "#EF4444", r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Monthly Revenue Chart */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 mb-6">
                  Monthly Revenue
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.chartData.monthlyRevenue}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="month" stroke="#64748b" />
                    <YAxis stroke="#64748b" />
                    <Tooltip
                      formatter={(value: any) => formatRevenue(value as number)}
                    />
                    <Bar dataKey="revenue" fill="#10B981" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Leaderboard */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 mb-6">
                  Team Leaderboard
                </h3>
                <div className="space-y-3">
                  {data.leaderboard.map((emp) => (
                    <div
                      key={emp.rank}
                      className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div
                          className={`w-10 h-10 rounded-full ${emp.avatar} flex items-center justify-center text-white font-bold`}
                        >
                          {emp.rank}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">
                            {emp.name}
                          </p>
                          <p className="text-xs text-slate-600">
                            {emp.rank === 1 ? "🏆 Top Performer" : ""}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-32 h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-red-500 to-orange-500"
                            style={{ width: `${emp.score}%` }}
                          />
                        </div>
                        <p className="font-bold text-slate-900 w-12 text-right">
                          {emp.score}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Projects Tab */}
          {activeTab === "projects" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
                {data.projects.map((project) => (
                  <div
                    key={project.projectId}
                    className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="text-lg font-bold text-slate-900 mb-4">
                          {project.projectName}
                        </h4>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-slate-600">
                              Leads Generated:
                            </span>
                            <span className="font-bold text-slate-900">
                              {project.leadsGenerated}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-slate-600">
                              Inquiries Handled:
                            </span>
                            <span className="font-bold text-slate-900">
                              {project.inquiriesHandled}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-slate-600">
                              Site Visits:
                            </span>
                            <span className="font-bold text-slate-900">
                              {project.siteVisits}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-slate-600">
                              Bookings:
                            </span>
                            <span className="font-bold text-slate-900">
                              {project.bookingsCompleted}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <div className="space-y-3">
                          <div>
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm font-semibold text-slate-700">
                                Conversion Rate
                              </span>
                              <span className="text-sm font-bold text-blue-600">
                                {project.conversionRate}%
                              </span>
                            </div>
                            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-blue-500"
                                style={{ width: `${project.conversionRate}%` }}
                              />
                            </div>
                          </div>
                          <div className="border-t border-slate-200 pt-3 mt-3">
                            <p className="text-sm text-slate-600">
                              Revenue Generated
                            </p>
                            <p className="text-2xl font-bold text-slate-900">
                              {formatRevenue(project.revenueGenerated)}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-slate-600">
                              Property Value Sold
                            </p>
                            <p className="text-2xl font-bold text-slate-900">
                              {formatRevenue(project.propertyValueSold)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Project-wise Sales Chart */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 mb-6">
                  Project-wise Sales
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.chartData.projectWiseSales}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="project" stroke="#64748b" />
                    <YAxis stroke="#64748b" />
                    <Tooltip formatter={(value: any) => formatRevenue(value as number)} />
                    <Bar dataKey="sales" fill="#8B5CF6" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Clients Tab */}
          {activeTab === "clients" && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-4 text-left font-bold text-slate-900">
                          Client Name
                        </th>
                        <th className="px-6 py-4 text-left font-bold text-slate-900">
                          Lead ID
                        </th>
                        <th className="px-6 py-4 text-left font-bold text-slate-900">
                          Project
                        </th>
                        <th className="px-6 py-4 text-left font-bold text-slate-900">
                          Status
                        </th>
                        <th className="px-6 py-4 text-left font-bold text-slate-900">
                          Last Activity
                        </th>
                        <th className="px-6 py-4 text-left font-bold text-slate-900">
                          Conversion
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.clients.map((client, idx) => (
                        <tr
                          key={client.clientId}
                          className={`border-b border-slate-200 hover:bg-slate-50 transition-colors ${
                            idx % 2 === 0 ? "bg-white" : "bg-slate-50"
                          }`}
                        >
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-semibold text-slate-900">
                                {client.clientName}
                              </p>
                              <p className="text-xs text-slate-600 mt-0.5">
                                {client.contactNumber}
                              </p>
                            </div>
                          </td>
                          <td className="px-6 py-4 font-mono text-xs text-slate-600">
                            {client.leadId}
                          </td>
                          <td className="px-6 py-4 text-slate-900">
                            {client.projectInterested}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-bold ${
                                client.currentStatus === "Hot Lead"
                                  ? "bg-red-100 text-red-700"
                                  : client.currentStatus === "Warm Lead"
                                  ? "bg-yellow-100 text-yellow-700"
                                  : client.currentStatus === "Cold Lead"
                                  ? "bg-slate-100 text-slate-700"
                                  : "bg-blue-100 text-blue-700"
                              }`}
                            >
                              {client.currentStatus}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-600">
                            {client.lastActivityDate}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-bold ${
                                client.conversionStatus === "Converted"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-orange-100 text-orange-700"
                              }`}
                            >
                              {client.conversionStatus}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Client Details Expandable */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 mb-6">
                  Recent Client Interactions
                </h3>
                <div className="space-y-4">
                  {data.clients.slice(0, 5).map((client) => (
                    <div
                      key={client.clientId}
                      className="border border-slate-200 rounded-xl p-4 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-bold text-slate-900">
                            {client.clientName}
                          </h4>
                          <p className="text-sm text-slate-600">
                            {client.projectInterested}
                          </p>
                        </div>
                        <span className="text-xs font-bold bg-slate-100 text-slate-700 px-2 py-1 rounded">
                          {client.leadSource}
                        </span>
                      </div>
                      <div className="space-y-2">
                        {client.followupHistory.map((followup, idx) => (
                          <p
                            key={idx}
                            className="text-sm text-slate-600 flex items-start gap-2"
                          >
                            <span className="text-slate-400 flex-shrink-0">
                              •
                            </span>
                            <span>
                              <strong>{followup.date}</strong>: {followup.notes}
                            </span>
                          </p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === "analysis" && (
            <div className="space-y-8">
              {/* Conversion Funnel */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 mb-6">
                  Conversion Funnel
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <FunnelChart data={data.chartData.conversionFunnel}>
                    <Tooltip />
                    <Funnel
                      dataKey="count"
                      data={data.chartData.conversionFunnel}
                      fill="#8B5CF6"
                    >
                      {data.chartData.conversionFunnel.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Funnel>
                  </FunnelChart>
                </ResponsiveContainer>
              </div>

              {/* Lead Source Distribution */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-900 mb-6">
                    Lead Source Distribution
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={data.chartData.leadSource}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry: any) =>
                          `${entry.payload?.source}: ${entry.value}`
                        }
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {data.chartData.leadSource.map((_, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Activity Log */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-900 mb-6">
                    Activity Summary
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center pb-3 border-b border-slate-200">
                      <span className="text-slate-600 font-medium">
                        Calls Made
                      </span>
                      <span className="text-2xl font-bold text-slate-900">
                        {data.activityLog.callsMade}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pb-3 border-b border-slate-200">
                      <span className="text-slate-600 font-medium">
                        WhatsApp Conversations
                      </span>
                      <span className="text-2xl font-bold text-slate-900">
                        {data.activityLog.whatsappConversations}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pb-3 border-b border-slate-200">
                      <span className="text-slate-600 font-medium">
                        Emails Sent
                      </span>
                      <span className="text-2xl font-bold text-slate-900">
                        {data.activityLog.emailsSent}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pb-3 border-b border-slate-200">
                      <span className="text-slate-600 font-medium">
                        Follow-ups Completed
                      </span>
                      <span className="text-2xl font-bold text-slate-900">
                        {data.activityLog.followupsCompleted}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pb-3 border-b border-slate-200">
                      <span className="text-slate-600 font-medium">
                        Site Visits Arranged
                      </span>
                      <span className="text-2xl font-bold text-slate-900">
                        {data.activityLog.siteVisitsArranged}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 font-medium">
                        Tasks Completed
                      </span>
                      <span className="text-2xl font-bold text-slate-900">
                        {data.activityLog.tasksCompleted}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Performance Tab */}
          {activeTab === "performance" && (
            <div className="space-y-8">
              {/* Targets & Achievements */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 mb-6">
                  Monthly Targets & Achievements
                </h3>
                <div className="space-y-6">
                  {data.targets.map((target) => {
                    const leadsAchievement = Math.round(
                      (target.achievedLeads / target.targetLeads) * 100
                    );
                    const revenueAchievement = Math.round(
                      (target.achievedRevenue / target.targetRevenue) * 100
                    );

                    return (
                      <div
                        key={target.month}
                        className="border border-slate-200 rounded-xl p-4"
                      >
                        <div className="flex justify-between items-center mb-4">
                          <h4 className="font-bold text-slate-900">
                            {target.month}
                          </h4>
                          <div className="flex gap-4">
                            <div>
                              <p className="text-xs text-slate-600 uppercase tracking-wide">
                                Leads
                              </p>
                              <p className="font-bold text-slate-900">
                                {target.achievedLeads}/{target.targetLeads}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-600 uppercase tracking-wide">
                                Revenue
                              </p>
                              <p className="font-bold text-slate-900">
                                {formatRevenue(target.achievedRevenue)}/
                                {formatRevenue(target.targetRevenue)}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-slate-600">
                                Leads Achievement
                              </span>
                              <span className="font-bold text-slate-900">
                                {leadsAchievement}%
                              </span>
                            </div>
                            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-blue-500 transition-all"
                                style={{ width: `${Math.min(leadsAchievement, 100)}%` }}
                              />
                            </div>
                          </div>

                          <div>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-slate-600">
                                Revenue Achievement
                              </span>
                              <span className="font-bold text-slate-900">
                                {revenueAchievement}%
                              </span>
                            </div>
                            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-green-500 transition-all"
                                style={{
                                  width: `${Math.min(revenueAchievement, 100)}%`,
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* AI Insights */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-200 shadow-sm">
                <h3 className="text-lg font-bold text-blue-900 mb-4 flex items-center gap-2">
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  Key Insights
                </h3>
                <ul className="space-y-3">
                  {data.insights.map((insight, idx) => (
                    <li
                      key={idx}
                      className="flex gap-3 text-blue-900 text-sm font-medium"
                    >
                      <span className="text-xl">💡</span>
                      <span>{insight}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* AI Recommendations */}
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 border border-green-200 shadow-sm">
                <h3 className="text-lg font-bold text-green-900 mb-4 flex items-center gap-2">
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M6.267 3.455a3.066 3.066 0 001.745-2.77 3.066 3.066 0 00-3.58 3.03A3.066 3.066 0 006.267 3.455zm9.8 9.687a3.066 3.066 0 01-3.03 3.58 3.066 3.066 0 002.77-1.745 3.066 3.066 0 00.26-1.835zm5.023-9.67a3.066 3.066 0 00-4.722-1.051 3.066 3.066 0 001.974 5.904c.566-.026 1.126-.226 1.628-.577a3.066 3.066 0 00.12-4.276zM5.072 12.256a3.066 3.066 0 013.58 3.03 3.066 3.066 0 01-1.745-2.77 3.066 3.066 0 01-1.835-.26zm5.916 4.953a3.066 3.066 0 01-3.03-3.58 3.066 3.066 0 011.745 2.77 3.066 3.066 0 011.285.81z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Recommendations
                </h3>
                <ul className="space-y-3">
                  {data.recommendations.map((rec, idx) => (
                    <li
                      key={idx}
                      className="flex gap-3 text-green-900 text-sm font-medium"
                    >
                      <span className="text-xl">✓</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Export Button */}
              <div className="flex gap-4">
                <button className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-xl transition-colors shadow-sm">
                  📥 Download PDF Report
                </button>
                <button className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-xl transition-colors shadow-sm">
                  📊 Export to Excel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
