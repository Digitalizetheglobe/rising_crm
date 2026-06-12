"use client";

import React, { useState, useEffect } from "react";
import PageHeader from "../../Components/PageHeader";
import { PAGE_CONTAINER_CLASS, PRIMARY_ACTION_BTN_CLASS } from "../../lib/pageLayout";
import { useDashboard } from "../DashboardContext";
import { API_URL } from "../../config/api.config";
import { getAuthHeaders } from "../../lib/auth";

interface Lead {
  _id: string;
  name: string;
  phone: string;
}

interface FollowUp {
  _id: string;
  type: string;
  status: string;
  scheduledAt: string;
  notes?: string;
  outcome?: string;
  lead?: Lead;
}

export default function FollowUpPage() {
  const { searchQuery, addToast } = useDashboard();
  const [followups, setFollowups] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(true);

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    completed: 0,
    overdue: 0,
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
      const [listRes, statsRes] = await Promise.all([
        fetch(`${API_URL}/v1/followups?limit=50`, { headers: getAuthHeaders() }),
        fetch(`${API_URL}/v1/followups/stats`, { headers: getAuthHeaders() }),
      ]);
      const listJson = await listRes.json();
      const statsJson = await statsRes.json();

      if (listJson.success) {
        setFollowups(listJson.data.followUps || []);
      }
      if (statsJson.success) {
        setStats({
          total: statsJson.data.total || 0,
          pending: statsJson.data.pending || 0,
          completed: statsJson.data.completed || 0,
          overdue: statsJson.data.overdue || 0,
        });
      }
    } catch (err: any) {
      addToast("Failed to load follow-ups", "info");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filtered = searchQuery
    ? followups.filter((f) =>
        f.lead?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.status.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : followups;

  const handleComplete = async () => {
    if (!selectedId) return;
    try {
      const res = await fetch(`${API_URL}/v1/followups/${selectedId}/complete`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({ outcome }),
      });
      const json = await res.json();
      if (json.success) {
        addToast("Follow-up marked as completed", "success");
        setCompleteModalOpen(false);
        setOutcome("");
        fetchData();
      } else {
        addToast(json.message || "Failed to complete", "info");
      }
    } catch (err) {
      addToast("Error completing follow-up", "info");
    }
  };

  const handleReschedule = async () => {
    if (!selectedId || !newDate || !newTime) {
      addToast("Please select new date and time", "info");
      return;
    }
    const scheduledAt = new Date(`${newDate}T${newTime}`).toISOString();
    try {
      const res = await fetch(`${API_URL}/v1/followups/${selectedId}/reschedule`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({ scheduledAt, reason: rescheduleReason }),
      });
      const json = await res.json();
      if (json.success) {
        addToast("Follow-up rescheduled", "success");
        setRescheduleModalOpen(false);
        setNewDate("");
        setNewTime("");
        setRescheduleReason("");
        fetchData();
      } else {
        addToast(json.message || "Failed to reschedule", "info");
      }
    } catch (err) {
      addToast("Error rescheduling follow-up", "info");
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm("Are you sure you want to cancel this follow-up?")) return;
    try {
      const res = await fetch(`${API_URL}/v1/followups/${id}/cancel`, {
        method: "PATCH",
        headers: getAuthHeaders(),
      });
      const json = await res.json();
      if (json.success) {
        addToast("Follow-up cancelled", "success");
        fetchData();
      } else {
        addToast(json.message || "Failed to cancel", "info");
      }
    } catch (err) {
      addToast("Error cancelling follow-up", "info");
    }
  };

  return (
    <div className={PAGE_CONTAINER_CLASS}>
      <PageHeader title="Follow-ups" subtitle="Track and manage all your scheduled tasks" />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        {[
          { label: "Total Tasks", value: stats.total, color: "bg-slate-800" },
          { label: "Pending", value: stats.pending, color: "bg-[#3B82F6]" },
          { label: "Overdue", value: stats.overdue, color: "bg-[#EF4444]" },
          { label: "Completed", value: stats.completed, color: "bg-[#10B981]" },
        ].map((card) => (
          <div
            key={card.label}
            className="bg-white rounded-[26px] p-6 shadow-sm border border-slate-100 hover:border-slate-200 transition-all duration-300 transform hover:-translate-y-1 cursor-default relative overflow-hidden"
          >
            <div className={`absolute top-0 left-0 right-0 h-[6px] ${card.color} rounded-t-full`} />
            <span className="text-slate-800 font-bold text-[14.5px] uppercase tracking-wider block mt-1">
              {card.label}
            </span>
            <h3 className="text-[52px] font-medium text-slate-900 mt-2 mb-2 leading-none">
              {card.value}
            </h3>
            <div className="h-[24px]" />
          </div>
        ))}
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-visible mt-6">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="py-4.5 px-6 font-medium text-[14px] text-brand uppercase tracking-wider">Lead</th>
                <th className="py-4.5 px-6 font-medium text-[14px] text-brand uppercase tracking-wider">Type</th>
                <th className="py-4.5 px-6 font-medium text-[14px] text-brand uppercase tracking-wider">Status</th>
                <th className="py-4.5 px-6 font-medium text-[14px] text-brand uppercase tracking-wider">Scheduled At</th>
                <th className="py-4.5 px-6 font-medium text-[14px] text-brand uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold text-[14.5px] text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500 text-sm">
                    Loading follow-ups...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400 font-medium">
                    No follow-ups found.
                  </td>
                </tr>
              ) : (
                filtered.map((f) => (
                  <tr key={f._id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="py-4 px-6">
                      <div className="text-slate-800 font-medium">{f.lead?.name || "Unknown"}</div>
                      <div className="text-slate-500 text-xs mt-0.5">{f.lead?.phone}</div>
                    </td>
                    <td className="py-4 px-6">{f.type}</td>
                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-[12px] font-medium border shadow-sm
                        ${
                          f.status === "COMPLETED"
                            ? "bg-[#F0FDF4] text-[#15803d] border-emerald-200/50"
                            : f.status === "SCHEDULED" || f.status === "PENDING"
                            ? "bg-amber-50 text-amber-600 border-amber-200/50"
                            : f.status === "MISSED" || f.status === "CANCELLED"
                            ? "bg-rose-50 text-rose-600 border-rose-200/50"
                            : "bg-blue-50 text-blue-600 border-blue-200/50"
                        }`}
                      >
                        {f.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-slate-600">
                      {new Date(f.scheduledAt).toLocaleString("en-IN", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="py-4 px-6 text-right">
                      {f.status !== "COMPLETED" && f.status !== "CANCELLED" && (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedId(f._id);
                              setCompleteModalOpen(true);
                            }}
                            className="px-3 py-1.5 rounded-xl text-emerald-600 hover:bg-emerald-50 transition-colors text-sm font-semibold border border-emerald-100"
                          >
                            Complete
                          </button>
                          <button
                            onClick={() => {
                              setSelectedId(f._id);
                              setRescheduleModalOpen(true);
                            }}
                            className="px-3 py-1.5 rounded-xl text-blue-600 hover:bg-blue-50 transition-colors text-sm font-semibold border border-blue-100"
                          >
                            Reschedule
                          </button>
                          <button
                            onClick={() => handleCancel(f._id)}
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
            <h3 className="text-xl font-bold text-slate-800 mb-4">Complete Follow-up</h3>
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
