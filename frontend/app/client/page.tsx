"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import PageHeader from "../../Components/PageHeader";
import { PAGE_CONTAINER_CLASS, PRIMARY_ACTION_BTN_CLASS } from "../../lib/pageLayout";
import { useDashboard } from "../DashboardContext";
import { API_URL } from "../../config/api.config";
import { getAuthHeaders } from "../../lib/auth";
import {
  Calendar,
  Edit3,
  Mail,
  Phone,
  Plus,
  Star,
} from "lucide-react";

type TabKey = "timeline" | "booking" | "documents" | "feedback";

interface ClientListItem {
  id: string;
  name: string;
  phone: string;
  email?: string;
  status: string;
  leadStatus?: string;
  notes?: string;
}

interface SourceLead {
  _id?: string;
  name?: string;
  phone?: string;
  status?: string;
  propertyType?: string;
  preferredLocation?: string;
  budgetRange?: string;
  priority?: string;
  nextFollowUpDate?: string;
}

interface ClientDetail {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  alternatePhone?: string;
  notes?: string;
  status: string;
  kycVerified: boolean;
  aadhaarNumber?: string;
  panNumber?: string;
  aadhaarDocument?: string;
  panDocument?: string;
  sourceLead?: SourceLead;
  activityLog?: Array<{
    _id: string;
    action: string;
    description: string;
    performedAt: string;
    performedBy?: { name?: string };
  }>;
}

interface CallItem {
  _id: string;
  callDate: string;
  direction: string;
  purpose: string;
  outcome: string;
  notes?: string;
  nextCallDate?: string;
  duration?: number;
  loggedBy?: { name?: string };
}

interface BookingItem {
  _id: string;
  bookingDate: string;
  status: string;
  finalAmount: number;
  bookingAmount: number;
  project?: { name?: string; location?: string };
  unit?: { unitNumber?: string; floor?: number };
}

interface PaymentItem {
  _id: string;
  amount: number;
  status: string;
  paymentType: string;
  dueDate: string;
  paidDate?: string;
}

interface FeedbackItem {
  _id: string;
  rating: number;
  category: string;
  comment?: string;
  status: string;
  createdAt: string;
}

interface TimelineEvent {
  id: string;
  type: "activity" | "call" | "payment" | "booking";
  title: string;
  date: string;
  description: string;
  amount?: string;
}

const TABS: { key: TabKey; label: string }[] = [
  { key: "timeline", label: "Timeline" },
  { key: "booking", label: "Booking & payment" },
  { key: "documents", label: "Documents" },
  { key: "feedback", label: "Feedback" },
];

const formatDate = (value?: string) => {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const formatDateShort = (value?: string) => {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);

const leadStatusLabel = (status?: string) => {
  if (!status) return "Active lead";
  const map: Record<string, string> = {
    NEW: "New lead",
    CONTACTED: "Active lead",
    QUALIFIED: "Qualified",
    SITE_VISIT_SCHEDULED: "Site visit scheduled",
    SITE_VISIT_COMPLETED: "Site visit done",
    INTERESTED: "Interested",
    NEGOTIATION: "In negotiation",
    BOOKING_IN_PROGRESS: "Booking in progress",
    BOOKED: "Booked",
    PAYMENT_IN_PROGRESS: "Payment in progress",
    CLOSED: "Closed",
    HOLD: "On hold",
    LOST: "Lost",
  };
  return map[status] || status.replace(/_/g, " ").toLowerCase();
};

const getInitials = (name: string) =>
  name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const computeProfileCompletion = (client: ClientDetail | null) => {
  if (!client) return 0;
  const fields = [
    client.name,
    client.phone,
    client.email,
    client.alternatePhone,
    client.aadhaarNumber,
    client.panNumber,
    client.aadhaarDocument,
    client.panDocument,
    client.notes,
  ];
  const filled = fields.filter(Boolean).length;
  return Math.round((filled / fields.length) * 100);
};

export default function ClientPage() {
  const { searchQuery, addToast } = useDashboard();

  const [clients, setClients] = useState<ClientListItem[]>([]);
  const [selectedClientId, setSelectedClientId  ] = useState<string | null>(null);
  const [clientDetail, setClientDetail] = useState<ClientDetail | null>(null);
  const [calls, setCalls] = useState<CallItem[]>([]);
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [activeTab, setActiveTab] = useState<TabKey>("timeline");
  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isNoteOpen, setIsNoteOpen] = useState(false);
  const [isCallOpen, setIsCallOpen] = useState(false);

  const [editForm, setEditForm] = useState({ name: "", email: "", phone: "", alternatePhone: "" });
  const [noteText, setNoteText] = useState("");
  const [callForm, setCallForm] = useState({
    direction: "OUTBOUND",
    purpose: "FOLLOW_UP",
    outcome: "ANSWERED",
    notes: "",
    duration: "",
    nextCallDate: "",
  });

  const fetchClients = useCallback(async () => {
    setLoadingList(true);
    try {
      let url = `${API_URL}/v1/clients?limit=50`;
      if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;

      const res = await fetch(url, { headers: getAuthHeaders() });
      const json = await res.json();

      if (json.success && json.data) {
        const mapped: ClientListItem[] = (json.data.clients || []).map((c: any) => ({
          id: c._id,
          name: c.name,
          phone: c.phone,
          email: c.email,
          status: c.status,
          leadStatus: c.sourceLead?.status,
          notes: c.notes,
        }));
        setClients(mapped);
        if (mapped.length > 0) {
          // Keep null to show list initially
        } else {
          setSelectedClientId(null);
          setClientDetail(null);
        }
      } else {
        addToast(json.message || "Failed to load clients", "info");
      }
    } catch (err: any) {
      addToast(err.message || "Error loading clients", "info");
    } finally {
      setLoadingList(false);
    }
  }, [searchQuery, addToast]);

  const fetchClientDetail = useCallback(
    async (clientId: string) => {
      setLoadingDetail(true);
      try {
        const [detailRes, callsRes, bookingsRes, paymentsRes, feedbackRes] = await Promise.all([
          fetch(`${API_URL}/v1/clients/${clientId}`, { headers: getAuthHeaders() }),
          fetch(`${API_URL}/v1/calls/client/${clientId}?limit=50`, { headers: getAuthHeaders() }),
          fetch(`${API_URL}/v1/clients/${clientId}/bookings`, { headers: getAuthHeaders() }),
          fetch(`${API_URL}/v1/clients/${clientId}/payments`, { headers: getAuthHeaders() }),
          fetch(`${API_URL}/v1/feedbacks/client/${clientId}?limit=20`, { headers: getAuthHeaders() }),
        ]);

        const [detailJson, callsJson, bookingsJson, paymentsJson, feedbackJson] = await Promise.all([
          detailRes.json(),
          callsRes.json(),
          bookingsRes.json(),
          paymentsRes.json(),
          feedbackRes.json(),
        ]);

        if (detailJson.success) {
          setClientDetail(detailJson.data);
          setEditForm({
            name: detailJson.data.name || "",
            email: detailJson.data.email || "",
            phone: detailJson.data.phone || "",
            alternatePhone: detailJson.data.alternatePhone || "",
          });
          setNoteText(detailJson.data.notes || "");
        }

        setCalls(callsJson.success ? callsJson.data.calls || [] : []);
        setBookings(bookingsJson.success ? bookingsJson.data || [] : []);
        setPayments(paymentsJson.success ? paymentsJson.data || [] : []);
        setFeedbacks(feedbackJson.success ? feedbackJson.data.feedbacks || feedbackJson.data || [] : []);
      } catch (err: any) {
        addToast(err.message || "Error loading client details", "info");
      } finally {
        setLoadingDetail(false);
      }
    },
    [addToast]
  );

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  useEffect(() => {
    if (selectedClientId) fetchClientDetail(selectedClientId);
  }, [selectedClientId, fetchClientDetail]);

  const preferenceTags = useMemo(() => {
    const lead = clientDetail?.sourceLead;
    if (!lead) return [];
    return [lead.propertyType, lead.preferredLocation, lead.budgetRange, lead.priority].filter(Boolean) as string[];
  }, [clientDetail]);

  const profileCompletion = useMemo(() => computeProfileCompletion(clientDetail), [clientDetail]);

  const nextScheduled = useMemo(() => {
    const upcomingCalls = calls
      .filter((c) => c.nextCallDate && new Date(c.nextCallDate) > new Date())
      .sort((a, b) => new Date(a.nextCallDate!).getTime() - new Date(b.nextCallDate!).getTime());

    if (upcomingCalls.length > 0) {
      const call = upcomingCalls[0];
      return {
        title: `${call.purpose.replace(/_/g, " ")} call`,
        date: call.nextCallDate!,
        type: "call" as const,
      };
    }

    const leadFollowUp = clientDetail?.sourceLead?.nextFollowUpDate;
    if (leadFollowUp && new Date(leadFollowUp) > new Date()) {
      return {
        title: "Lead follow-up",
        date: leadFollowUp,
        type: "followup" as const,
      };
    }

    return null;
  }, [calls, clientDetail]);

  const timelineEvents = useMemo<TimelineEvent[]>(() => {
    const events: TimelineEvent[] = [];

    (clientDetail?.activityLog || []).forEach((item) => {
      events.push({
        id: `activity-${item._id}`,
        type: "activity",
        title: item.action.replace(/_/g, " "),
        date: item.performedAt,
        description: item.description,
      });
    });

    calls.forEach((call) => {
      events.push({
        id: `call-${call._id}`,
        type: "call",
        title: `${call.direction === "INBOUND" ? "Inbound" : "Outbound"} call — ${call.purpose.replace(/_/g, " ")}`,
        date: call.callDate,
        description: call.notes || `Outcome: ${call.outcome.replace(/_/g, " ")}`,
      });
    });

    bookings.forEach((booking) => {
      const location = booking.project?.location || booking.project?.name || "property";
      events.push({
        id: `booking-${booking._id}`,
        type: "booking",
        title: `Site visit: ${location}`,
        date: booking.bookingDate,
        description: `Booking status: ${booking.status}. Unit ${booking.unit?.unitNumber || "—"}.`,
      });
    });

    payments
      .filter((p) => p.status === "Paid" || p.paidDate)
      .forEach((payment) => {
        events.push({
          id: `payment-${payment._id}`,
          type: "payment",
          title: "Deposit received",
          date: payment.paidDate || payment.dueDate,
          description: `${payment.paymentType.replace(/_/g, " ")} payment recorded.`,
          amount: formatCurrency(payment.amount),
        });
      });

    return events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [clientDetail, calls, bookings, payments]);

  const handleUpdateClient = async () => {
    if (!selectedClientId) return;
    try {
      const res = await fetch(`${API_URL}/v1/clients/${selectedClientId}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(editForm),
      });
      const json = await res.json();
      if (json.success) {
        addToast("Client updated successfully", "success");
        setIsEditOpen(false);
        fetchClients();
        fetchClientDetail(selectedClientId);
      } else {
        addToast(json.message || "Update failed", "info");
      }
    } catch (err: any) {
      addToast(err.message || "Update failed", "info");
    }
  };

  const handleSaveNote = async () => {
    if (!selectedClientId) return;
    try {
      const res = await fetch(`${API_URL}/v1/clients/${selectedClientId}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ notes: noteText }),
      });
      const json = await res.json();
      if (json.success) {
        addToast("Note saved", "success");
        setIsNoteOpen(false);
        fetchClientDetail(selectedClientId);
      } else {
        addToast(json.message || "Failed to save note", "info");
      }
    } catch (err: any) {
      addToast(err.message || "Failed to save note", "info");
    }
  };

  const handleLogCall = async () => {
    if (!selectedClientId) return;
    try {
      const payload: Record<string, unknown> = {
        client: selectedClientId,
        callDate: new Date().toISOString(),
        direction: callForm.direction,
        purpose: callForm.purpose,
        outcome: callForm.outcome,
        notes: callForm.notes,
      };
      if (callForm.duration) payload.duration = Number(callForm.duration);
      if (callForm.nextCallDate) payload.nextCallDate = new Date(callForm.nextCallDate).toISOString();

      const res = await fetch(`${API_URL}/v1/calls`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success) {
        addToast("Call logged successfully", "success");
        setIsCallOpen(false);
        setCallForm({
          direction: "OUTBOUND",
          purpose: "FOLLOW_UP",
          outcome: "ANSWERED",
          notes: "",
          duration: "",
          nextCallDate: "",
        });
        fetchClientDetail(selectedClientId);
      } else {
        addToast(json.message || "Failed to log call", "info");
      }
    } catch (err: any) {
      addToast(err.message || "Failed to log call", "info");
    }
  };

  const timelineIcon = (type: TimelineEvent["type"]) => {
    if (type === "payment") {
      return (
        <div className="w-10 h-10 rounded-full bg-[#10B981] text-white flex items-center justify-center shrink-0">
          <span className="text-sm font-bold">₹</span>
        </div>
      );
    }
    if (type === "call") {
      return (
        <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
          <Phone className="w-4 h-4" />
        </div>
      );
    }
    if (type === "booking") {
      return (
        <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
          <Calendar className="w-4 h-4" />
        </div>
      );
    }
    return (
      <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center shrink-0 text-xs font-semibold">
        •
      </div>
    );
  };

  return (
    <div className={PAGE_CONTAINER_CLASS}>
      <PageHeader title="Clients" subtitle="Manage and track" />

      {selectedClientId && (
        <div className="mb-4">
          <button
            onClick={() => {
              setSelectedClientId(null);
              setClientDetail(null);
            }}
            className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-brand transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            Back to Clients List
          </button>
        </div>
      )}

      {!selectedClientId ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col justify-center">
              <span className="text-slate-500 text-sm font-medium mb-1">Total Clients</span>
              <span className="text-2xl font-bold text-slate-800">{clients.length}</span>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col justify-center">
              <span className="text-slate-500 text-sm font-medium mb-1">New Leads</span>
              <span className="text-2xl font-bold text-slate-800">{clients.filter(c => c.leadStatus === 'NEW').length}</span>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col justify-center">
              <span className="text-slate-500 text-sm font-medium mb-1">Site Visits</span>
              <span className="text-2xl font-bold text-slate-800">{clients.filter(c => c.leadStatus === 'SITE_VISIT_SCHEDULED' || c.leadStatus === 'SITE_VISIT_COMPLETED').length}</span>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col justify-center">
              <span className="text-slate-500 text-sm font-medium mb-1">Booked</span>
              <span className="text-2xl font-bold text-slate-800">{clients.filter(c => c.leadStatus === 'BOOKED' || c.leadStatus === 'BOOKING_IN_PROGRESS').length}</span>
            </div>
          </div>
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-visible mt-6">
            <div className="hidden sm:block overflow-visible">
            <table className="w-full min-w-[700px] border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="py-4.5 px-6 font-medium text-[14px] text-brand uppercase tracking-wider">Name</th>
                  <th className="py-4.5 px-6 font-medium text-[14px] text-brand uppercase tracking-wider">Phone</th>
                  <th className="py-4.5 px-6 font-medium text-[14px] text-brand uppercase tracking-wider">Email</th>
                  <th className="py-4.5 px-6 font-medium text-[14px] text-brand uppercase tracking-wider">Status</th>
                  <th className="py-4.5 px-6 font-medium text-[14px] text-brand uppercase tracking-wider">Lead Status</th>
                  <th className="py-4.5 px-6 font-medium text-[14px] text-brand uppercase tracking-wider text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-[14.5px] text-slate-700">
                {loadingList ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500 text-sm">Loading clients...</td>
                  </tr>
                ) : clients.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 font-medium">No clients found.</td>
                  </tr>
                ) : (
                  clients.map((client) => (
                    <tr key={client.id} className="hover:bg-slate-50/50 transition-colors group relative z-0">
                      <td className="py-4 px-6 text-slate-800 font-medium hover:text-brand cursor-pointer" onClick={() => setSelectedClientId(client.id)}>{client.name}</td>
                      <td className="py-4 px-6 text-slate-600">{client.phone}</td>
                      <td className="py-4 px-6 text-slate-600">{client.email || "-"}</td>
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-[12px] font-medium bg-[#F0FDF4] text-[#15803d] border border-emerald-200/50 shadow-sm">
                          {client.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-slate-500">{client.leadStatus ? leadStatusLabel(client.leadStatus) : "-"}</td>
                      <td className="py-4 px-6 text-right relative">
                        <button
                          onClick={() => setSelectedClientId(client.id)}
                          className="px-3 py-1.5 rounded-xl text-brand hover:bg-brand/10 transition-colors text-sm font-semibold"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="block sm:hidden divide-y divide-slate-100">
            {loadingList ? (
              <div className="py-12 text-center text-slate-500 text-sm">Loading clients...</div>
            ) : clients.length === 0 ? (
              <div className="py-12 text-center text-slate-400 font-medium">No clients found.</div>
            ) : (
              clients.map((client) => (
                <div key={client.id} className="p-4 hover:bg-slate-50/50 transition-colors relative flex flex-col gap-2 font-semibold z-0" onClick={() => setSelectedClientId(client.id)}>
                  <div className="flex items-center justify-between">
                    <span className="text-[16px] text-slate-800 font-bold">{client.name}</span>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-[12px] font-medium bg-[#F0FDF4] text-[#15803d] border border-emerald-200/50 shadow-sm">{client.status}</span>
                  </div>
                  <div className="text-sm text-slate-500">{client.phone}</div>
                </div>
              ))
            )}
          </div>
        </div>
        </>
      ) : null}

      {clientDetail && (
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6">
          {/* Main column */}
          <div className="space-y-6">
            {/* Profile card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col sm:flex-row sm:items-center gap-5">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-xl font-bold text-slate-600 shrink-0">
                {getInitials(clientDetail.name)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-xl font-semibold text-slate-900">{clientDetail.name}</h2>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#E6F9EE] text-[#10B981]">
                    {leadStatusLabel(clientDetail.sourceLead?.status)}
                  </span>
                </div>
                <p className="text-slate-500 text-sm mt-1">
                  {clientDetail.notes || clientDetail.sourceLead?.propertyType || "Client profile"}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(true)}
                  className="bg-brand hover:bg-brand-hover text-white text-sm font-semibold px-4 py-2 rounded-xl flex items-center gap-2 transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => setIsNoteOpen(true)}
                  className="bg-brand hover:bg-brand-hover text-white text-sm font-semibold px-4 py-2 rounded-xl flex items-center gap-2 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add note
                </button>
                <button
                  type="button"
                  onClick={() => setIsCallOpen(true)}
                  className={PRIMARY_ACTION_BTN_CLASS}
                >
                  <Phone className="w-4 h-4 mr-2" />
                  Log call
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-slate-200 flex gap-8 overflow-x-auto">
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`pb-3 text-sm font-semibold whitespace-nowrap transition-colors ${
                    activeTab === tab.key
                      ? "text-slate-900 border-b-2 border-brand"
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 min-h-[360px]">
              {loadingDetail ? (
                <p className="text-slate-500 text-sm">Loading details...</p>
              ) : activeTab === "timeline" ? (
                timelineEvents.length === 0 ? (
                  <p className="text-slate-500 text-sm">No timeline activity yet. Log a call to get started.</p>
                ) : (
                  <div className="space-y-0">
                    {timelineEvents.map((event, index) => (
                      <div key={event.id} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          {timelineIcon(event.type)}
                          {index < timelineEvents.length - 1 && (
                            <div className="w-px flex-1 bg-slate-200 my-2 min-h-[24px]" />
                          )}
                        </div>
                        <div className="pb-8 flex-1">
                          <div className="flex flex-wrap items-baseline gap-2">
                            <h3 className="font-semibold text-slate-900">{event.title}</h3>
                            <span className="text-xs text-slate-400">{formatDate(event.date)}</span>
                          </div>
                          <p className="text-slate-600 text-sm mt-2 leading-relaxed">{event.description}</p>
                          {event.amount && (
                            <p className="text-[#10B981] font-semibold text-sm mt-2">{event.amount}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : activeTab === "booking" ? (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-3">Bookings</h3>
                    {bookings.length === 0 ? (
                      <p className="text-slate-500 text-sm">No bookings yet.</p>
                    ) : (
                      <div className="space-y-3">
                        {bookings.map((b) => (
                          <div key={b._id} className="border border-slate-100 rounded-xl p-4">
                            <div className="flex justify-between gap-3">
                              <div>
                                <p className="font-medium text-slate-900">
                                  {b.project?.name || "Project"} — Unit {b.unit?.unitNumber || "—"}
                                </p>
                                <p className="text-sm text-slate-500 mt-1">{formatDate(b.bookingDate)}</p>
                              </div>
                              <span className="text-sm font-semibold text-brand">{b.status}</span>
                            </div>
                            <p className="text-sm text-slate-600 mt-2">
                              Final amount: {formatCurrency(b.finalAmount)}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-3">Payments</h3>
                    {payments.length === 0 ? (
                      <p className="text-slate-500 text-sm">No payments yet.</p>
                    ) : (
                      <div className="space-y-3">
                        {payments.map((p) => (
                          <div key={p._id} className="border border-slate-100 rounded-xl p-4 flex justify-between gap-3">
                            <div>
                              <p className="font-medium text-slate-900">{p.paymentType.replace(/_/g, " ")}</p>
                              <p className="text-sm text-slate-500 mt-1">Due: {formatDate(p.dueDate)}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-[#10B981]">{formatCurrency(p.amount)}</p>
                              <p className="text-xs text-slate-500 mt-1">{p.status}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : activeTab === "documents" ? (
                <div className="space-y-4">
                  <div className="border border-slate-100 rounded-xl p-4">
                    <p className="text-sm text-slate-500">Aadhaar</p>
                    <p className="font-medium text-slate-900 mt-1">{clientDetail.aadhaarNumber || "Not uploaded"}</p>
                    {clientDetail.aadhaarDocument && (
                      <a href={clientDetail.aadhaarDocument} target="_blank" rel="noreferrer" className="text-brand text-sm mt-1 inline-block">
                        View document
                      </a>
                    )}
                  </div>
                  <div className="border border-slate-100 rounded-xl p-4">
                    <p className="text-sm text-slate-500">PAN</p>
                    <p className="font-medium text-slate-900 mt-1">{clientDetail.panNumber || "Not uploaded"}</p>
                    {clientDetail.panDocument && (
                      <a href={clientDetail.panDocument} target="_blank" rel="noreferrer" className="text-brand text-sm mt-1 inline-block">
                        View document
                      </a>
                    )}
                  </div>
                  <p className="text-sm text-slate-500">
                    KYC status:{" "}
                    <span className={clientDetail.kycVerified ? "text-[#10B981] font-semibold" : "text-amber-600 font-semibold"}>
                      {clientDetail.kycVerified ? "Verified" : "Pending"}
                    </span>
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {feedbacks.length === 0 ? (
                    <p className="text-slate-500 text-sm">No feedback recorded yet.</p>
                  ) : (
                    feedbacks.map((fb) => (
                      <div key={fb._id} className="border border-slate-100 rounded-xl p-4">
                        <div className="flex items-center gap-2">
                          <div className="flex">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${i < fb.rating ? "text-amber-400 fill-amber-400" : "text-slate-200"}`}
                              />
                            ))}
                          </div>
                          <span className="text-xs text-slate-500">{fb.category}</span>
                        </div>
                        <p className="text-slate-700 text-sm mt-2">{fb.comment || "No comment"}</p>
                        <p className="text-xs text-slate-400 mt-2">{formatDate(fb.createdAt)}</p>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            {nextScheduled && (
              <div className="bg-brand rounded-2xl p-5 text-white">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-2 h-2 rounded-full bg-[#10B981]" />
                  <p className="text-sm font-semibold">Next Scheduled Action</p>
                </div>
                <p className="font-medium">{nextScheduled.title}</p>
                <div className="flex items-center gap-2 mt-3 text-sm text-white/90">
                  <Calendar className="w-4 h-4" />
                  {formatDateShort(nextScheduled.date)}
                </div>
                <button
                  type="button"
                  onClick={() => setIsCallOpen(true)}
                  className="mt-4 w-full bg-white text-brand font-semibold text-sm py-2.5 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Confirm attendance
                </button>
              </div>
            )}

            <div className="bg-white rounded-2xl border border-slate-200 border-t-4 border-t-blue-500 p-5">
              <h3 className="font-semibold text-slate-900 mb-4">Contact Information</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3 text-slate-600">
                  <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>{clientDetail.email || "—"}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-600">
                  <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>{clientDetail.phone}</span>
                </div>
                {clientDetail.alternatePhone && (
                  <div className="flex items-center gap-3 text-slate-600">
                    <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>{clientDetail.alternatePhone}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 border-t-4 border-t-[#10B981] p-5">
              <h3 className="font-semibold text-slate-900 mb-4">Preferences</h3>
              {preferenceTags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {preferenceTags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 rounded-full text-xs font-medium bg-[#FFEBEB] text-[#EB3539]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 text-sm">No preferences from lead yet.</p>
              )}
              <div className="mt-5">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-600">Profile completion</span>
                  <span className="font-semibold text-slate-900">{profileCompletion}%</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand rounded-full transition-all"
                    style={{ width: `${profileCompletion}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Edit client</h3>
            <div className="space-y-3">
              {(["name", "email", "phone", "alternatePhone"] as const).map((field) => (
                <input
                  key={field}
                  type={field === "email" ? "email" : "text"}
                  placeholder={field.replace(/([A-Z])/g, " $1")}
                  value={editForm[field]}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, [field]: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20"
                />
              ))}
            </div>
            <div className="flex gap-3 mt-6">
              <button type="button" onClick={() => setIsEditOpen(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium">
                Cancel
              </button>
              <button type="button" onClick={handleUpdateClient} className="flex-1 py-2.5 rounded-xl bg-brand text-white text-sm font-semibold">
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Note modal */}
      {isNoteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Add note</h3>
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              rows={5}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 resize-none"
              placeholder="Write a note about this client..."
            />
            <div className="flex gap-3 mt-6">
              <button type="button" onClick={() => setIsNoteOpen(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium">
                Cancel
              </button>
              <button type="button" onClick={handleSaveNote} className="flex-1 py-2.5 rounded-xl bg-brand text-white text-sm font-semibold">
                Save note
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Log call modal */}
      {isCallOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Log call</h3>
            <div className="space-y-3">
              <select
                value={callForm.direction}
                onChange={(e) => setCallForm((p) => ({ ...p, direction: e.target.value }))}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm"
              >
                <option value="OUTBOUND">Outbound</option>
                <option value="INBOUND">Inbound</option>
              </select>
              <select
                value={callForm.purpose}
                onChange={(e) => setCallForm((p) => ({ ...p, purpose: e.target.value }))}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm"
              >
                <option value="FOLLOW_UP">Follow up</option>
                <option value="SITE_VISIT_CONFIRMATION">Site visit confirmation</option>
                <option value="PAYMENT_REMINDER">Payment reminder</option>
                <option value="FEEDBACK">Feedback</option>
                <option value="GENERAL_INQUIRY">General inquiry</option>
                <option value="OTHER">Other</option>
              </select>
              <select
                value={callForm.outcome}
                onChange={(e) => setCallForm((p) => ({ ...p, outcome: e.target.value }))}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm"
              >
                <option value="ANSWERED">Answered</option>
                <option value="NO_ANSWER">No answer</option>
                <option value="BUSY">Busy</option>
                <option value="VOICEMAIL">Voicemail</option>
                <option value="CALLBACK_REQUESTED">Callback requested</option>
                <option value="WRONG_NUMBER">Wrong number</option>
              </select>
              <input
                type="number"
                placeholder="Duration (seconds)"
                value={callForm.duration}
                onChange={(e) => setCallForm((p) => ({ ...p, duration: e.target.value }))}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm"
              />
              <input
                type="datetime-local"
                value={callForm.nextCallDate}
                onChange={(e) => setCallForm((p) => ({ ...p, nextCallDate: e.target.value }))}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm"
              />
              <textarea
                value={callForm.notes}
                onChange={(e) => setCallForm((p) => ({ ...p, notes: e.target.value }))}
                rows={3}
                placeholder="Call notes"
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm resize-none"
              />
            </div>
            <div className="flex gap-3 mt-6">
              <button type="button" onClick={() => setIsCallOpen(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium">
                Cancel
              </button>
              <button type="button" onClick={handleLogCall} className="flex-1 py-2.5 rounded-xl bg-brand text-white text-sm font-semibold">
                Log call
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
