"use client";

import React, { useState, useEffect } from "react";
import PageHeader from "../../Components/PageHeader";
import { PAGE_CONTAINER_CLASS } from "../../lib/pageLayout";
import { useDashboard } from "../DashboardContext";
import { API_URL } from "../../config/api.config";
import { getAuthHeaders } from "../../lib/auth";
import KPICard from "../../Components/KPICard";

interface Lead {
  _id: string;
  name: string;
  phone: string;
}

interface SiteVisit {
  _id: string;
  status: string;
  scheduledAt: string;
  notes?: string;
  outcome?: string;
  lead?: Lead;
}

export default function SiteVisitPage() {
  const { searchQuery, addToast } = useDashboard();
  const [siteVisits, setSiteVisits] = useState<SiteVisit[]>([]);
  const [loading, setLoading] = useState(true);

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    completed: 0,
    cancelled: 0,
  });

  // Modals
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Forms
  const [outcome, setOutcome] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");
  const [rescheduleReason, setRescheduleReason] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/v1/sitevisits?limit=100`, { headers: getAuthHeaders() });
      const json = await res.json();

      if (json.success) {
        const visits: SiteVisit[] = json.siteVisits || [];
        setSiteVisits(visits);
        
        let pending = 0;
        let completed = 0;
        let cancelled = 0;

        visits.forEach(v => {
          if (v.status === 'COMPLETED') completed++;
          else if (v.status === 'CANCELLED') cancelled++;
          else pending++;
        });

        setStats({
          total: visits.length,
          pending,
          completed,
          cancelled,
        });
      }
    } catch (err: any) {
      addToast("Failed to load site visits", "info");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filtered = searchQuery
    ? siteVisits.filter((v) =>
        v.lead?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.status.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.notes?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : siteVisits;

  const handleComplete = async () => {
    if (!selectedId) return;
    try {
      const res = await fetch(`${API_URL}/v1/sitevisits/${selectedId}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ status: "COMPLETED", outcome }),
      });
      const json = await res.json();
      if (json.success) {
        addToast("Site visit marked as completed", "success");
        setCompleteModalOpen(false);
        setOutcome("");
        fetchData();
      } else {
        addToast(json.message || "Failed to complete", "info");
      }
    } catch (err) {
      addToast("Error completing site visit", "info");
    }
  };

  const handleReschedule = async () => {
    if (!selectedId || !newDate || !newTime) {
      addToast("Please select new date and time", "info");
      return;
    }
    const scheduledAt = new Date(`${newDate}T${newTime}`).toISOString();
    try {
      const res = await fetch(`${API_URL}/v1/sitevisits/${selectedId}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ scheduledAt, notes: rescheduleReason ? `Rescheduled reason: ${rescheduleReason}` : undefined }),
      });
      const json = await res.json();
      if (json.success) {
        addToast("Site visit rescheduled", "success");
        setRescheduleModalOpen(false);
        setNewDate("");
        setNewTime("");
        setRescheduleReason("");
        fetchData();
      } else {
        addToast(json.message || "Failed to reschedule", "info");
      }
    } catch (err) {
      addToast("Error rescheduling site visit", "info");
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm("Are you sure you want to cancel this site visit?")) return;
    try {
      const res = await fetch(`${API_URL}/v1/sitevisits/${id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ status: "CANCELLED" }),
      });
      const json = await res.json();
      if (json.success) {
        addToast("Site visit cancelled", "success");
        fetchData();
      } else {
        addToast(json.message || "Failed to cancel", "info");
      }
    } catch (err) {
      addToast("Error cancelling site visit", "info");
    }
  };

  return (
    <div className={PAGE_CONTAINER_CLASS}>
      <PageHeader title="Site Visits" subtitle="Track and manage client site visits" />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
        <KPICard title="Total Visits" value={stats.total} subtext="All scheduled visits" accentColor="#1e293b" />
        <KPICard title="Pending" value={stats.pending} subtext="Upcoming visits" accentColor="#3B82F6" />
        <KPICard title="Cancelled" value={stats.cancelled} subtext="Visits cancelled" accentColor="#EF4444" />
        <KPICard title="Completed" value={stats.completed} subtext="Successfully finished" accentColor="#10B981" />
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-visible mt-6">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="py-4.5 px-6 font-medium text-[14px] text-brand uppercase tracking-wider">Lead</th>
                <th className="py-4.5 px-6 font-medium text-[14px] text-brand uppercase tracking-wider">Status</th>
                <th className="py-4.5 px-6 font-medium text-[14px] text-brand uppercase tracking-wider">Scheduled At</th>
                <th className="py-4.5 px-6 font-medium text-[14px] text-brand uppercase tracking-wider">Notes</th>
                <th className="py-4.5 px-6 font-medium text-[14px] text-brand uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold text-[14.5px] text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500 text-sm">
                    Loading site visits...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400 font-medium">
                    No site visits found.
                  </td>
                </tr>
              ) : (
                filtered.map((v) => (
                  <tr key={v._id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="py-4 px-6">
                      <div className="text-slate-800 font-medium">{v.lead?.name || "Unknown"}</div>
                      <div className="text-slate-500 text-xs mt-0.5">{v.lead?.phone}</div>
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-[12px] font-medium border shadow-sm
                        ${
                          v.status === "COMPLETED"
                            ? "bg-[#F0FDF4] text-[#15803d] border-emerald-200/50"
                            : v.status === "SCHEDULED" || v.status === "PENDING"
                            ? "bg-amber-50 text-amber-600 border-amber-200/50"
                            : v.status === "CANCELLED"
                            ? "bg-rose-50 text-rose-600 border-rose-200/50"
                            : "bg-blue-50 text-blue-600 border-blue-200/50"
                        }`}
                      >
                        {v.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-slate-600">
                      {new Date(v.scheduledAt).toLocaleString("en-IN", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="py-4 px-6">
                      <div className="max-w-[200px] truncate text-slate-500 text-sm" title={v.notes}>
                        {v.notes || "-"}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right">
                      {v.status !== "COMPLETED" && v.status !== "CANCELLED" && (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedId(v._id);
                              setCompleteModalOpen(true);
                            }}
                            className="px-3 py-1.5 rounded-xl text-emerald-600 hover:bg-emerald-50 transition-colors text-sm font-semibold border border-emerald-100"
                          >
                            Complete
                          </button>
                          <button
                            onClick={() => {
                              setSelectedId(v._id);
                              setRescheduleModalOpen(true);
                            }}
                            className="px-3 py-1.5 rounded-xl text-blue-600 hover:bg-blue-50 transition-colors text-sm font-semibold border border-blue-100"
                          >
                            Reschedule
                          </button>
                          <button
                            onClick={() => handleCancel(v._id)}
                            className="px-3 py-1.5 rounded-xl text-rose-600 hover:bg-rose-50 transition-colors text-sm font-semibold border border-rose-100"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Complete Modal */}
      {completeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-[32px] p-6 w-full max-w-sm border border-slate-100 shadow-2xl">
            <h3 className="text-xl font-bold text-slate-800 mb-4">Complete Site Visit</h3>
            <textarea
              value={outcome}
              onChange={(e) => setOutcome(e.target.value)}
              placeholder="Enter outcome / notes..."
              rows={3}
              className="w-full border border-slate-200 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-brand/20 outline-none text-[14.5px] font-medium resize-none mb-4"
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setCompleteModalOpen(false)}
                className="px-5 py-2.5 rounded-2xl text-slate-500 hover:bg-slate-100 font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleComplete}
                className="px-6 py-2.5 rounded-2xl bg-[#10B981] hover:bg-[#059669] text-white font-bold"
              >
                Mark Complete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {rescheduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-[32px] p-6 w-full max-w-sm border border-slate-100 shadow-2xl">
            <h3 className="text-xl font-bold text-slate-800 mb-4">Reschedule</h3>
            <div className="space-y-4 mb-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-bold mb-1.5 text-sm">New Date</label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full border border-slate-200 rounded-2xl px-4 py-2.5 focus:ring-2 focus:ring-brand/20 outline-none font-medium text-sm"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1.5 text-sm">New Time</label>
                  <input
                    type="time"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full border border-slate-200 rounded-2xl px-4 py-2.5 focus:ring-2 focus:ring-brand/20 outline-none font-medium text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-600 font-bold mb-1.5 text-sm">Reason (Optional)</label>
                <input
                  type="text"
                  value={rescheduleReason}
                  onChange={(e) => setRescheduleReason(e.target.value)}
                  placeholder="Why reschedule?"
                  className="w-full border border-slate-200 rounded-2xl px-4 py-2.5 focus:ring-2 focus:ring-brand/20 outline-none font-medium text-sm"
                />
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setRescheduleModalOpen(false)}
                className="px-5 py-2.5 rounded-2xl text-slate-500 hover:bg-slate-100 font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleReschedule}
                className="px-6 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold"
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
