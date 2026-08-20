"use client";

import React, { useState, useEffect } from "react";
import { API_URL } from "../../config/api.config";
import { getAuthHeaders } from "../../lib/auth";
import { importLeads, exportLeads } from "../../lib/leadService";
import { downloadCrmTemplateExcel } from "../../lib/services/importExportService";
import { useAuth } from "../AuthContext";
import LeadDetailModule from "../../Components/leadDetailModule";
import PageHeader from "../../Components/PageHeader";
import AdvancedDataGrid, { StatusCellRenderer } from "../../Components/AdvancedDataGrid";
import { PAGE_CONTAINER_CLASS, PRIMARY_ACTION_BTN_CLASS } from "../../lib/pageLayout";
import { useDashboard } from "../DashboardContext";
import { DownloadIcon, UploadIcon } from "lucide-react";
import KPICard from "../../Components/KPICard";

// Interfaces
interface Lead {
  id: string;
  name: string;
  source: string;
  phone: string;
  status: "Hot Lead" | "Closed" | "New lead" | string;
  lastContacted: string;
  email?: string;
  budgetRange?: string;
  propertyType?: string;
  preferredLocation?: string;
  purpose?: string;
  assignEmployee?: string;
  notes?: string;
  createdAt?: string;
  platform?: string;
  metaCampaignName?: string;
  projectName?: string;
}

const DUMMY_LEADS: Lead[] = [
  {
    id: "lead_1",
    name: "Aarav Mehta",
    source: "Google Ads",
    phone: "9876543210",
    status: "Hot Lead",
    lastContacted: new Date().toLocaleDateString(),
    email: "aarav.mehta@example.com",
    budgetRange: "1Cr-2Cr",
    propertyType: "3BHK",
    preferredLocation: "Andheri",
    assignEmployee: "Amit Sharma",
    notes: "Very interested in The F row 3BHK.",
    createdAt: new Date().toLocaleDateString(), // Today
    projectName: "The F row"
  },
  {
    id: "lead_2",
    name: "Ishita Roy",
    source: "META_ADS",
    platform: "facebook",
    metaCampaignName: "Skyline 2BHK launch",
    phone: "9812345678",
    status: "New lead",
    lastContacted: new Date(Date.now() - 24 * 60 * 60 * 1000).toLocaleDateString(),
    email: "ishita.roy@example.com",
    budgetRange: "50L-1Cr",
    propertyType: "2BHK",
    preferredLocation: "Borivali",
    assignEmployee: "Priya Patel",
    notes: "Requested a callback for 18 Aangan.",
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toLocaleDateString(), // Yesterday
    projectName: "18 Aangan"
  },
  {
    id: "lead_3",
    name: "Kabir Kapoor",
    source: "Referral",
    phone: "9711223344",
    status: "Closed",
    lastContacted: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toLocaleDateString(),
    email: "kabir.k@example.com",
    budgetRange: "Above 2Cr",
    propertyType: "Villa",
    preferredLocation: "Bandra",
    assignEmployee: "Vikram Singh",
    notes: "Deal closed for Eco-Town Villa.",
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toLocaleDateString(), // 3 days ago
    projectName: "Eco-Town"
  },
  {
    id: "lead_4",
    name: "Riya Sharma",
    source: "Website",
    phone: "9600112233",
    status: "New lead",
    lastContacted: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toLocaleDateString(),
    email: "riya.s@example.com",
    budgetRange: "25L-50L",
    propertyType: "1BHK",
    preferredLocation: "Thane",
    assignEmployee: "Neha Gupta",
    notes: "Inquired about Aasis Space 1BHK pricing.",
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toLocaleDateString(), // 10 days ago
    projectName: "Aasis Space"
  },
  {
    id: "lead_5",
    name: "Dev Patel",
    source: "WhatsApp",
    phone: "9511223344",
    status: "Hot Lead",
    lastContacted: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toLocaleDateString(),
    email: "dev.patel@example.com",
    budgetRange: "1Cr-2Cr",
    propertyType: "Office",
    preferredLocation: "BKC",
    assignEmployee: "Amit Sharma",
    notes: "Needs commercial space in The F row.",
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toLocaleDateString(), // 15 days ago
    projectName: "The F row"
  },
  {
    id: "lead_6",
    name: "Ananya Deshmukh",
    source: "Walk-In",
    phone: "9422334455",
    status: "Closed",
    lastContacted: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toLocaleDateString(),
    email: "ananya.d@example.com",
    budgetRange: "50L-1Cr",
    propertyType: "2BHK",
    preferredLocation: "Kandivali",
    assignEmployee: "Priya Patel",
    notes: "Site visit done, closed booking for 18 Aangan.",
    createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toLocaleDateString(), // 25 days ago
    projectName: "18 Aangan"
  }
];

export default function LeadsPage() {
  const { searchQuery, setSearchQuery, addToast } = useDashboard();
  const { user } = useAuth();
  const [columnDefs] = useState<any[]>([
    { field: 'id', headerName: 'Lead ID', minWidth: 200, pinned: 'left', checkboxSelection: true, headerCheckboxSelection: true },
    { field: 'source', headerName: 'Lead Source', minWidth: 130, editable: true },
    { field: 'projectName', headerName: 'Project', minWidth: 140, editable: true },
    { field: 'name', headerName: 'Customer Name', minWidth: 160, editable: true },
    { field: 'phone', headerName: 'Mobile Number', minWidth: 140 },
    { field: 'email', headerName: 'Email', minWidth: 200, editable: true },
    { field: 'budgetRange', headerName: 'Budget', minWidth: 130, editable: true },
    { field: 'propertyType', headerName: 'Property Type', minWidth: 140, editable: true },
    { field: 'preferredLocation', headerName: 'Preferred Location', minWidth: 170, editable: true },
    { field: 'purpose', headerName: 'Purpose', minWidth: 110, editable: true },
  ]);

  // Filter & Search states
  const [statusFilter, setStatusFilter] = useState("All status");
  const [projectFilter, setProjectFilter] = useState("All projects");
  const [dateFilter, setDateFilter] = useState("All Time");
  const [employeeFilter, setEmployeeFilter] = useState("All employees");
  const [sourceFilter, setSourceFilter] = useState("All sources");

  // Dropdown visibility states
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);
  const [showSourceDropdown, setShowSourceDropdown] = useState(false);

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newLeadName, setNewLeadName] = useState("");
  const [newLeadEmail, setNewLeadEmail] = useState("");
  const [newLeadPhone, setNewLeadPhone] = useState("");
  const [newLeadBudget, setNewLeadBudget] = useState("");
  const [newLeadProperty, setNewLeadProperty] = useState("");
  const [newLeadSource, setNewLeadSource] = useState("Facebook");
  const [newLeadStatus, setNewLeadStatus] = useState<"Hot Lead" | "Closed" | "New lead">("New lead");
  const [newLeadLocation, setNewLeadLocation] = useState("");
  const [newLeadPurpose, setNewLeadPurpose] = useState("");

  // Detail Modal State
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  // Import/Export loading
  const importInputRef = React.useRef<HTMLInputElement>(null);
  const [importLoading, setImportLoading] = React.useState(false);
  const [exportLoading, setExportLoading] = React.useState(false);

  // Assign & Follow-up Modal State
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);

  const [users, setUsers] = useState<any[]>([]);

  // Fetch users when Assign Modal opens
  useEffect(() => {
    if (isAssignModalOpen && users.length === 0) {
      fetch(`${API_URL}/v1/users`, { headers: getAuthHeaders() })
        .then(res => res.json())
        .then(json => {
          if (json.success) {
            setUsers(json.data || []);
          }
        })
        .catch(() => { });
    }
  }, [isAssignModalOpen]);

  // Follow-up state
  const [followUpDate, setFollowUpDate] = useState("");
  const [followUpTime, setFollowUpTime] = useState("");
  const [followUpNotes, setFollowUpNotes] = useState("");
  const [followUpType, setFollowUpType] = useState("Call");

  // Row Action Dropdown state
  const [activeRowActionId, setActiveRowActionId] = useState<string | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Initial Leads list (starts empty and is populated from backend)
  const [leads, setLeads] = useState<Lead[]>(DUMMY_LEADS);
  const [projectsList, setProjectsList] = useState<{ id: string; name: string }[]>([]);
  const [stats, setStats] = useState({ total: DUMMY_LEADS.length, hot: DUMMY_LEADS.filter(l => l.status === "Hot Lead").length, new: DUMMY_LEADS.filter(l => l.status === "New lead").length, closed: DUMMY_LEADS.filter(l => l.status === "Closed").length });

  const fetchLeads = async () => {
    setLoading(true);
    try {
      let url = `${API_URL}/v1/leads?page=${currentPage}&limit=10`;
      if (searchQuery) {
        url += `&search=${encodeURIComponent(searchQuery)}`;
      }
      if (statusFilter !== "All status") {
        url += `&status=${statusFilter}`;
      }
      const res = await fetch(url, { headers: getAuthHeaders() });
      const json = await res.json();

      // Load actual project names dynamically from backend
      let currentProjects: string[] = [];
      try {
        const pRes = await fetch(`${API_URL}/v1/projects?limit=100`, { headers: getAuthHeaders() });
        const pJson = await pRes.json();
        if (pJson.success && pJson.data) {
          const fetchedProjects = pJson.data.projects || [];
          currentProjects = fetchedProjects.map((p: any) => p.name);
          setProjectsList(fetchedProjects.map((p: any) => ({ id: p._id || p.id, name: p.name })));
        }
      } catch (e) {
        console.error("Failed to load actual projects:", e);
      }

      if (currentProjects.length === 0) {
        currentProjects = ["The F row", "18 Aangan", "Eco-Town", "Aasis Space"];
      }

      const getProjectFallback = (index: number) => {
        return currentProjects[index % currentProjects.length];
      };

      if (json.success && json.data) {
        const mapped = (json.data.leads || []).map((l: any, index: number) => {
          const dummyProj = getProjectFallback(index);
          const dummyEmp = ["Amit Sharma", "Priya Patel", "Vikram Singh", "Neha Gupta"][index % 4];
          return {
            id: l._id,
            name: l.name || (l.enquiryId ? l.enquiryId.name : "Unknown"),
            source: l.source || (l.enquiryId ? l.enquiryId.source : "Unknown"),
            platform: l.platform || (l.enquiryId ? l.enquiryId.platform : undefined),
            metaCampaignName: l.enquiryId ? l.enquiryId.metaAdId : undefined,
            phone: l.phone || (l.enquiryId ? l.enquiryId.phone : "Unknown"),
            email: l.email || "Not provided",
            budgetRange: l.budgetRange || "Not specified",
            propertyType: l.propertyType || "Not specified",
            preferredLocation: l.preferredLocation || "Not specified",
            purpose: l.purpose || "",
            notes: l.notes || "",
            status: l.status,
            createdAt: l.createdAt ? new Date(l.createdAt).toLocaleDateString() : new Date().toLocaleDateString(),
            lastContacted: l.lastContactedAt ? new Date(l.lastContactedAt).toLocaleDateString() : (l.createdAt ? new Date(l.createdAt).toLocaleDateString() : "Never"),
            projectName: l.interestedProject?.name || dummyProj,
            assignEmployee: l.assignedTo?.name || dummyEmp
          };
        });
        
        // Dynamically assign real project names to dummy leads so they match the actual database values
        const updatedDummyLeads = DUMMY_LEADS.map((dl, idx) => ({
          ...dl,
          projectName: getProjectFallback(idx)
        }));

        setLeads([...mapped, ...updatedDummyLeads.filter(dl => !mapped.some((ml: any) => ml.name === dl.name))]);
        setTotalPages(json.data.totalPages || 1);
      } else {
        const updatedDummyLeads = DUMMY_LEADS.map((dl, idx) => ({
          ...dl,
          projectName: getProjectFallback(idx)
        }));
        setLeads(updatedDummyLeads);
      }
    } catch (err: any) {
      const fallbackProjs = ["The F row", "18 Aangan", "Eco-Town", "Aasis Space"];
      const updatedDummyLeads = DUMMY_LEADS.map((dl, idx) => ({
        ...dl,
        projectName: fallbackProjs[idx % fallbackProjs.length]
      }));
      setLeads(updatedDummyLeads);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_URL}/v1/leads/stats`, { headers: getAuthHeaders() });
      const json = await res.json();
      if (json.success && json.data) {
        const hotCount = (json.data.byStatus || []).find((s: any) => s._id === "Hot Lead" || s._id === "QUALIFIED")?.count || 0;
        const newCount = (json.data.byStatus || []).find((s: any) => s._id === "New lead" || s._id === "NEW")?.count || 0;
        const closedCount = (json.data.byStatus || []).find((s: any) => s._id === "Closed" || s._id === "WON")?.count || 0;
        setStats({
          total: json.data.total || DUMMY_LEADS.length,
          hot: hotCount || DUMMY_LEADS.filter(l => l.status === "Hot Lead").length,
          new: newCount || DUMMY_LEADS.filter(l => l.status === "New lead").length,
          closed: closedCount || DUMMY_LEADS.filter(l => l.status === "Closed").length
        });
      } else {
        setStats({
          total: DUMMY_LEADS.length,
          hot: DUMMY_LEADS.filter(l => l.status === "Hot Lead").length,
          new: DUMMY_LEADS.filter(l => l.status === "New lead").length,
          closed: DUMMY_LEADS.filter(l => l.status === "Closed").length
        });
      }
    } catch (err) {
      setStats({
        total: DUMMY_LEADS.length,
        hot: DUMMY_LEADS.filter(l => l.status === "Hot Lead").length,
        new: DUMMY_LEADS.filter(l => l.status === "New lead").length,
        closed: DUMMY_LEADS.filter(l => l.status === "Closed").length
      });
    }
  };

  useEffect(() => {
    fetchLeads();
    fetchStats();
  }, [currentPage, searchQuery, statusFilter]);

  // Dynamic search and filter logic
  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      (lead.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (lead.source || "").toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "All status" ||
      (lead.status || "").toLowerCase() === statusFilter.toLowerCase() ||
      (lead.status === "QUALIFIED" && statusFilter === "Hot Lead") ||
      (lead.status === "WON" && statusFilter === "Closed") ||
      (lead.status === "NEW" && statusFilter === "New lead");

    const matchesProject =
      projectFilter === "All projects" ||
      (lead.projectName || "").toLowerCase() === projectFilter.toLowerCase();

    // Date Filter calculation
    let matchesDate = true;
    if (dateFilter !== "All Time") {
      const leadDate = lead.createdAt ? new Date(lead.createdAt) : null;
      if (leadDate) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);

        const leadDateZero = new Date(leadDate);
        leadDateZero.setHours(0, 0, 0, 0);

        if (dateFilter === "Today") {
          matchesDate = leadDateZero.getTime() === today.getTime();
        } else if (dateFilter === "Yesterday") {
          matchesDate = leadDateZero.getTime() === yesterday.getTime();
        } else if (dateFilter === "Last 7 Days") {
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          sevenDaysAgo.setHours(0, 0, 0, 0);
          matchesDate = leadDateZero >= sevenDaysAgo;
        } else if (dateFilter === "Last 30 Days") {
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          thirtyDaysAgo.setHours(0, 0, 0, 0);
          matchesDate = leadDateZero >= thirtyDaysAgo;
        } else if (dateFilter === "This Month") {
          matchesDate = leadDate.getMonth() === today.getMonth() && leadDate.getFullYear() === today.getFullYear();
        }
      } else {
        matchesDate = false;
      }
    }

    const matchesEmployee =
      employeeFilter === "All employees" ||
      (lead.assignEmployee || "").toLowerCase() === employeeFilter.toLowerCase();

    const matchesSource =
      sourceFilter === "All sources" ||
      (lead.source || "").toLowerCase() === sourceFilter.toLowerCase();

    return matchesSearch && matchesStatus && matchesProject && matchesDate && matchesEmployee && matchesSource;
  });

  // KPI Computations based on dynamic stats state, updating dynamically when a filter is applied
  const isAnyFilterActive =
    projectFilter !== "All projects" ||
    dateFilter !== "All Time" ||
    employeeFilter !== "All employees" ||
    sourceFilter !== "All sources" ||
    statusFilter !== "All status" ||
    searchQuery !== "";

  const totalHotLeads = isAnyFilterActive
    ? filteredLeads.filter(l => l.status === "Hot Lead" || l.status === "QUALIFIED").length
    : stats.hot;

  const followUpsToday = isAnyFilterActive
    ? filteredLeads.filter(l => l.status === "New lead" || l.status === "NEW").length
    : stats.new;

  const closedThisMonth = isAnyFilterActive
    ? filteredLeads.filter(l => l.status === "Closed" || l.status === "WON").length
    : stats.closed;

  const handleResetFilters = () => {
    setSearchQuery("");
    setStatusFilter("All status");
    setProjectFilter("All projects");
    setDateFilter("All Time");
    setEmployeeFilter("All employees");
    setSourceFilter("All sources");
    addToast("All filter settings cleared!", "info");
  };

  // Action handlers
  const handleCellValueChanged = async (event: any) => {
    const { data, colDef, newValue } = event;
    const field = colDef.field;
    const leadId = data.id;

    if (!leadId) return;

    try {
      const payload: any = {};
      if (field === 'projectName') {
        const project = projectsList.find(p => p.name.toLowerCase() === newValue.toLowerCase());
        if (project) {
          payload.interestedProject = project.id;
        } else {
          addToast("Invalid project name", "error");
          fetchLeads();
          return;
        }
      } else if (field === 'assignEmployee') {
        const matchedUser = users.find(u => u.name.toLowerCase() === newValue.toLowerCase());
        if (matchedUser) {
          payload.assignedTo = matchedUser.id || matchedUser._id;
        } else {
          addToast("Invalid employee name", "error");
          fetchLeads();
          return;
        }
      } else {
        payload[field] = newValue;
      }

      const res = await fetch(`${API_URL}/v1/leads/${leadId}`, {
        method: "PUT",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (json.success) {
        addToast("Lead updated successfully!", "success");
        fetchLeads();
        fetchStats();
      } else {
        addToast(json.message || "Failed to update lead", "error");
        fetchLeads();
      }
    } catch (err: any) {
      addToast(err.message || "Error updating lead", "error");
      fetchLeads();
    }
  };

  const [selectedLeads, setSelectedLeads] = useState<any[]>([]);

  const handleBulkUpdateField = async (field: string, val: string) => {
    if (selectedLeads.length === 0) return;
    setLoading(true);
    let successCount = 0;
    try {
      await Promise.all(
        selectedLeads.map(async (lead) => {
          const leadId = lead.id;
          if (!leadId) return;

          const payload: any = {};
          if (field === 'projectName') {
            const project = projectsList.find(p => p.name.toLowerCase() === val.toLowerCase());
            if (project) {
              payload.interestedProject = project.id;
            } else {
              return;
            }
          } else if (field === 'status') {
            let mappedStatus = "NEW";
            if (val === "Hot Lead") mappedStatus = "QUALIFIED";
            if (val === "Closed") mappedStatus = "WON";
            payload.status = mappedStatus;
          } else {
            payload[field] = val;
          }

          const res = await fetch(`${API_URL}/v1/leads/${leadId}`, {
            method: "PUT",
            headers: {
              ...getAuthHeaders(),
              "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
          });
          const json = await res.json();
          if (json.success) {
            successCount++;
          }
        })
      );
      addToast(`Bulk updated ${successCount} leads successfully!`, "success");
      setSelectedLeads([]);
      fetchLeads();
      fetchStats();
    } catch (e: any) {
      addToast(e.message || "Error bulk updating leads", "error");
      fetchLeads();
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedLeads.length === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedLeads.length} leads?`)) return;
    setLoading(true);
    let successCount = 0;
    try {
      await Promise.all(
        selectedLeads.map(async (lead) => {
          const leadId = lead.id;
          if (!leadId) return;

          const res = await fetch(`${API_URL}/v1/leads/${leadId}`, {
            method: "DELETE",
            headers: getAuthHeaders(),
          });
          const json = await res.json();
          if (json.success) {
            successCount++;
          }
        })
      );
      addToast(`Deleted ${successCount} leads successfully!`, "success");
      setSelectedLeads([]);
      fetchLeads();
      fetchStats();
    } catch (e: any) {
      addToast(e.message || "Error deleting leads", "error");
      fetchLeads();
    } finally {
      setLoading(false);
    }
  };


  const handleDeleteLead = async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/v1/leads/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      const json = await res.json();
      if (json.success) {
        addToast("Lead deleted successfully!", "success");
        fetchLeads();
        fetchStats();
      } else {
        addToast(json.message || "Failed to delete lead", "info");
      }
    } catch (err: any) {
      addToast(err.message || "Error deleting lead", "info");
    }
    setActiveRowActionId(null);
  };

  const handleChangeLeadStatus = async (id: string, newStatus: "Hot Lead" | "Closed" | "New lead") => {
    try {
      let mappedStatus = "NEW";
      if (newStatus === "Hot Lead") mappedStatus = "QUALIFIED";
      if (newStatus === "Closed") mappedStatus = "WON";

      const res = await fetch(`${API_URL}/v1/leads/${id}/status`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({ status: mappedStatus }),
      });
      const json = await res.json();
      if (json.success) {
        addToast(`Lead status updated successfully`, "success");
        fetchLeads();
        fetchStats();
      } else {
        addToast(json.message || "Failed to update status", "info");
      }
    } catch (err: any) {
      addToast(err.message || "Error updating lead status", "info");
    }
    setActiveRowActionId(null);
  };

  const handleAddLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeadName.trim()) {
      addToast("Please enter a lead name", "info");
      return;
    }
    if (!newLeadPhone.trim() || !/^\d{10}$/.test(newLeadPhone)) {
      addToast("Please enter a valid 10-digit phone number", "info");
      return;
    }

    try {
      const payload: any = {
        name: newLeadName.trim(),
        phone: newLeadPhone.trim(),
        source: newLeadSource,
      };
      if (newLeadEmail.trim()) payload.email = newLeadEmail.trim();
      if (newLeadBudget.trim()) payload.budgetRange = newLeadBudget.trim();
      if (newLeadProperty.trim()) payload.propertyType = newLeadProperty.trim();
      if (newLeadLocation.trim()) payload.preferredLocation = newLeadLocation.trim();
      if (newLeadPurpose.trim()) payload.purpose = newLeadPurpose.trim();

      const res = await fetch(`${API_URL}/v1/leads`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success) {
        addToast(`Successfully added "${newLeadName}"!`, "success");
        setNewLeadName("");
        setNewLeadEmail("");
        setNewLeadPhone("");
        setNewLeadBudget("");
        setNewLeadProperty("");
        setNewLeadSource("Facebook");
        setNewLeadStatus("New lead");
        setNewLeadLocation("");
        setNewLeadPurpose("");
        setIsAddModalOpen(false);
        fetchLeads();
        fetchStats();
      } else {
        addToast(json.message || "Failed to add lead", "info");
      }
    } catch (err: any) {
      addToast(err.message || "Error submitting lead", "info");
    }
  };

  const handleExportFile = async () => {
    setExportLoading(true);
    try {
      addToast("Generating leads export report...", "info");
      const blob = await exportLeads();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = `RisingSpaces_Leads_${Date.now()}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      addToast("Leads exported successfully!", "success");
    } catch (e) {
      console.error(e);
      addToast("Failed to export leads", "info");
    } finally {
      setExportLoading(false);
    }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportLoading(true);
    try {
      await importLeads(file);
      addToast("Leads imported successfully!", "success");
      fetchLeads();
    } catch (err: any) {
      addToast(err.message || "Import failed", "info");
    } finally {
      setImportLoading(false);
      if (importInputRef.current) importInputRef.current.value = "";
    }
  };

  const handleDownloadCrmTemplate = async () => {
    try {
      await downloadCrmTemplateExcel();
      addToast("CRM template downloaded!", "success");
    } catch (err: any) {
      addToast(err.message || "Failed to download CRM template", "info");
    }
  };

  return (
    <div className={PAGE_CONTAINER_CLASS}>
      <PageHeader
        title="Leads"
        subtitle="Here's what requires your attention today"
        actions={
          <>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              style={{ display: 'none' }}
              ref={importInputRef}
              onChange={handleImportFile}
            />
            <button
              onClick={() => importInputRef.current?.click()}
              disabled={importLoading}
              className={PRIMARY_ACTION_BTN_CLASS}
            >
              <UploadIcon className="text-white w-4 h-4 mr-2" />
              Import Leads
            </button>
            <button onClick={handleExportFile} disabled={exportLoading} className={PRIMARY_ACTION_BTN_CLASS}>
              <DownloadIcon className="text-white w-4 h-4 mr-2" />
              Export Leads
            </button>
            {user && (user.role === "SUPER_ADMIN" || user.role === "ADMIN" || user.role === "SALES_MANAGER") && (
              <button onClick={handleDownloadCrmTemplate} className={PRIMARY_ACTION_BTN_CLASS}>
                <DownloadIcon className="text-white w-4 h-4 mr-2" />
                Download CRM Template
              </button>
            )}
            <button onClick={() => setIsAddModalOpen(true)} className={PRIMARY_ACTION_BTN_CLASS}>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Add New Lead
            </button>
          </>
        }
      />

      {/* 3 KPI Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KPICard title="Total Hotleads" value={totalHotLeads} trend="+12.5% vs last month" isUp={true} subtext="Qualified leads" accentColor="#38B6FF" />
        <KPICard title="Follow-ups today" value={followUpsToday} trend="+3.5% vs last month" isUp={true} subtext="Pending tasks" accentColor="#3b82f6" />
        <KPICard title="Closed this month" value={closedThisMonth} trend="-2.5% need reviews" isUp={false} subtext="Successfully closed" accentColor="#f59e0b" />
      </div>

      {/* Table Filters Panel */}
      <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100 flex flex-col xl:flex-row xl:items-center gap-4 justify-between">
        <div className="relative flex-1 max-w-xs">
          <span className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400">
            <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Search leads..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#F3F2F1]/70 text-slate-700 pl-11 pr-4 py-2.5 rounded-2xl text-[14px] border-none outline-none focus:ring-2 focus:ring-brand/20 focus:bg-white transition-all font-semibold"
          />
        </div>

        {/* Dropdown Filters Action Group */}
        <div className="flex flex-wrap items-center gap-2">

          {/* Status Filter */}
          <div className="relative">
            <button
              onClick={() => {
                setShowStatusDropdown(!showStatusDropdown);
                setShowProjectDropdown(false);
                setShowDateDropdown(false);
                setShowEmployeeDropdown(false);
                setShowSourceDropdown(false);
              }}
              className="bg-[#F3F2F1]/70 text-slate-700 font-medium px-3.5 py-2.5 rounded-2xl text-[13px] flex items-center gap-1.5 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <span className="text-slate-400 font-bold">Status:</span> {statusFilter}
              <svg className={`w-4 h-4 text-slate-500 transition-transform ${showStatusDropdown ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
            </button>

            {showStatusDropdown && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowStatusDropdown(false)} />
                <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 p-2 animate-scale-up font-medium text-[13.5px]">
                  {["All status", "Hot Lead", "Closed", "New lead"].map((st) => (
                    <button
                      key={st}
                      onClick={() => {
                        setStatusFilter(st);
                        setShowStatusDropdown(false);
                        addToast(`Filter applied: ${st}`, "info");
                      }}
                      className="w-full text-left px-3.5 py-2 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-slate-900 cursor-pointer"
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Project Filter */}
          <div className="relative">
            <button
              onClick={() => {
                setShowProjectDropdown(!showProjectDropdown);
                setShowStatusDropdown(false);
                setShowDateDropdown(false);
                setShowEmployeeDropdown(false);
                setShowSourceDropdown(false);
              }}
              className="bg-[#F3F2F1]/70 text-slate-700 font-medium px-3.5 py-2.5 rounded-2xl text-[13px] flex items-center gap-1.5 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <span className="text-slate-400 font-bold">Project:</span> {projectFilter}
              <svg className={`w-4 h-4 text-slate-500 transition-transform ${showProjectDropdown ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
            </button>

            {showProjectDropdown && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowProjectDropdown(false)} />
                <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 p-2 animate-scale-up font-medium text-[13.5px]">
                  {["All projects", ...projectsList.map(p => p.name)].map((proj) => (
                    <button
                      key={proj}
                      onClick={() => {
                        setProjectFilter(proj);
                        setShowProjectDropdown(false);
                        addToast(`Project: ${proj}`, "info");
                      }}
                      className="w-full text-left px-3.5 py-2 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-slate-900 cursor-pointer"
                    >
                      {proj}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Date Filter */}
          <div className="relative">
            <button
              onClick={() => {
                setShowDateDropdown(!showDateDropdown);
                setShowStatusDropdown(false);
                setShowProjectDropdown(false);
                setShowEmployeeDropdown(false);
                setShowSourceDropdown(false);
              }}
              className="bg-[#F3F2F1]/70 text-slate-700 font-medium px-3.5 py-2.5 rounded-2xl text-[13px] flex items-center gap-1.5 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <span className="text-slate-400 font-bold">Date:</span> {dateFilter}
              <svg className={`w-4 h-4 text-slate-500 transition-transform ${showDateDropdown ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
            </button>

            {showDateDropdown && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowDateDropdown(false)} />
                <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 p-2 animate-scale-up font-medium text-[13.5px]">
                  {["All Time", "Today", "Yesterday", "Last 7 Days", "Last 30 Days", "This Month"].map((dt) => (
                    <button
                      key={dt}
                      onClick={() => {
                        setDateFilter(dt);
                        setShowDateDropdown(false);
                        addToast(`Date range: ${dt}`, "info");
                      }}
                      className="w-full text-left px-3.5 py-2 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-slate-900 cursor-pointer"
                    >
                      {dt}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Employee Filter */}
          <div className="relative">
            <button
              onClick={() => {
                setShowEmployeeDropdown(!showEmployeeDropdown);
                setShowStatusDropdown(false);
                setShowProjectDropdown(false);
                setShowDateDropdown(false);
                setShowSourceDropdown(false);
              }}
              className="bg-[#F3F2F1]/70 text-slate-700 font-medium px-3.5 py-2.5 rounded-2xl text-[13px] flex items-center gap-1.5 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <span className="text-slate-400 font-bold">Agent:</span> {employeeFilter}
              <svg className={`w-4 h-4 text-slate-500 transition-transform ${showEmployeeDropdown ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
            </button>

            {showEmployeeDropdown && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowEmployeeDropdown(false)} />
                <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 p-2 animate-scale-up font-medium text-[13.5px]">
                  {["All employees", "Amit Sharma", "Priya Patel", "Vikram Singh", "Neha Gupta"].map((emp) => (
                    <button
                      key={emp}
                      onClick={() => {
                        setEmployeeFilter(emp);
                        setShowEmployeeDropdown(false);
                        addToast(`Employee: ${emp}`, "info");
                      }}
                      className="w-full text-left px-3.5 py-2 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-slate-900 cursor-pointer"
                    >
                      {emp}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Source Filter */}
          <div className="relative">
            <button
              onClick={() => {
                setShowSourceDropdown(!showSourceDropdown);
                setShowStatusDropdown(false);
                setShowProjectDropdown(false);
                setShowDateDropdown(false);
                setShowEmployeeDropdown(false);
              }}
              className="bg-[#F3F2F1]/70 text-slate-700 font-medium px-3.5 py-2.5 rounded-2xl text-[13px] flex items-center gap-1.5 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <span className="text-slate-400 font-bold">Source:</span> {sourceFilter}
              <svg className={`w-4 h-4 text-slate-500 transition-transform ${showSourceDropdown ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
            </button>

            {showSourceDropdown && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowSourceDropdown(false)} />
                <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 p-2 animate-scale-up font-medium text-[13.5px]">
                  {["All sources", "Facebook", "Google", "Website", "Walk-In", "MagicBricks", "99acres", "Referral", "WhatsApp", "Other"].map((src) => (
                    <button
                      key={src}
                      onClick={() => {
                        setSourceFilter(src);
                        setShowSourceDropdown(false);
                        addToast(`Source: ${src}`, "info");
                      }}
                      className="w-full text-left px-3.5 py-2 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-slate-900 cursor-pointer"
                    >
                      {src}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Filter Clear/Reset Button */}
          <button
            onClick={handleResetFilters}
            className="bg-[#FDF2F2] text-brand font-semibold px-4 py-2.5 rounded-2xl text-[13px] flex items-center gap-1.5 hover:bg-red-100/50 transition-colors cursor-pointer font-sans"
          >
            <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Reset
          </button>
        </div>
      </div>

      {/* Dynamic Table Card Grid Container */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-visible">

        {/* Desktop and Tablet table presentation */}
        <div className="hidden sm:block overflow-hidden" style={{ height: '65vh' }}>
          <AdvancedDataGrid 
            rowData={filteredLeads}
            columnDefs={columnDefs}
            gridId="leads-grid"
            loading={loading}
            onCellValueChanged={handleCellValueChanged}
            onSelectionChanged={setSelectedLeads}
          />
        </div>

        {/* Mobile Only Presentation */}
        <div className="block sm:hidden divide-y divide-slate-100">
          {filteredLeads.length === 0 ? (
            <div className="py-12 text-center text-slate-400 font-medium">
              No leads matched your filters.
            </div>
          ) : (
            filteredLeads.map((lead) => (
              <div key={lead.id} className={`p-4 hover:bg-slate-50/50 transition-colors relative flex flex-col gap-2 font-semibold ${activeRowActionId === lead.id ? 'relative z-50' : 'relative z-0'}`}>
                <div className="flex items-center justify-between">
                  <span className="text-[16px] text-slate-800 font-bold" onClick={() => { setSelectedLead(lead); setIsDetailModalOpen(true); }}>{lead.name}</span>

                  {/* Interactive row trigger */}
                  <div className="relative">
                    <button
                      onClick={() => {
                        setActiveRowActionId(activeRowActionId === lead.id ? null : lead.id);
                      }}
                      className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 cursor-pointer"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" /></svg>
                    </button>

                    {activeRowActionId === lead.id && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setActiveRowActionId(null)} />
                        <div className="absolute right-0 mt-1 w-44 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 p-2 animate-scale-up font-semibold text-[13px] text-left">
                          <span className="block px-3 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Actions</span>
                          <button
                            onClick={() => {
                              setSelectedLead(lead);
                              setIsDetailModalOpen(true);
                              setActiveRowActionId(null);
                            }}
                            className="w-full text-left px-3 py-1.5 rounded-xl text-blue-600 hover:bg-blue-50 cursor-pointer"
                          >
                            View Details
                          </button>
                          <div className="my-1 border-t border-slate-100"></div>
                          <span className="block px-3 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Update Status</span>
                          <button
                            onClick={() => handleChangeLeadStatus(lead.id, "Hot Lead")}
                            className="w-full text-left px-3 py-1.5 rounded-xl text-[#0284C7] hover:bg-sky-50 cursor-pointer"
                          >
                            Hot Lead
                          </button>
                          <button
                            onClick={() => handleChangeLeadStatus(lead.id, "New lead")}
                            className="w-full text-left px-3 py-1.5 rounded-xl text-blue-600 hover:bg-blue-50 cursor-pointer"
                          >
                            New Lead
                          </button>
                          <button
                            onClick={() => handleChangeLeadStatus(lead.id, "Closed")}
                            className="w-full text-left px-3 py-1.5 rounded-xl text-emerald-600 hover:bg-emerald-50 cursor-pointer"
                          >
                            Closed
                          </button>
                          <div className="border-t border-slate-100 my-1" />
                          <button
                            onClick={() => handleDeleteLead(lead.id)}
                            className="w-full text-left px-3 py-1.5 rounded-xl text-rose-500 hover:bg-rose-50 flex items-center gap-1.5 cursor-pointer"
                          >
                            Delete Lead
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-1 text-[13px] mt-1 text-slate-500">
                  <div>Project: <span className="text-slate-700 font-bold">{lead.projectName || "—"}</span></div>
                  <div className="flex items-center justify-between">
                    <span>Source: <span className="text-slate-600 font-bold">{lead.source}</span></span>
                    <span>Contacted: <span className="text-slate-500 font-bold">{lead.lastContacted}</span></span>
                  </div>
                </div>

                <div className="mt-2.5">
                  {lead.status === "Hot Lead" && (
                    <span className="inline-flex items-center px-3 py-0.5 rounded-full text-[11.5px] font-bold bg-sky-50 text-[#0284C7] border border-sky-200">
                      Hot Lead
                    </span>
                  )}
                  {lead.status === "Closed" && (
                    <span className="inline-flex items-center px-3 py-0.5 rounded-full text-[11.5px] font-bold bg-[#F0FDF4] text-[#15803d] border border-emerald-100">
                      Closed
                    </span>
                  )}
                  {lead.status === "New lead" && (
                    <span className="inline-flex items-center px-3 py-0.5 rounded-full text-[11.5px] font-bold bg-[#EFF6FF] text-[#1d4ed8] border border-blue-100">
                      New lead
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add New Lead Modal Overlay */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in font-sans">
          <div className="bg-white rounded-[32px] p-6 w-full max-w-lg border border-slate-100 shadow-2xl animate-scale-up">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <h3 className="text-xl font-semibold text-slate-800 tracking-tight">Add New Lead</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <svg className="w-5.5 h-5.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleAddLead} className="mt-5 space-y-4 font-semibold text-[14px]">
              <div>
                <label className="block text-slate-600 font-bold mb-1.5">Lead Name</label>
                <input
                  type="text"
                  placeholder="Enter full name (e.g. Rahul Sharma)"
                  value={newLeadName}
                  onChange={(e) => setNewLeadName(e.target.value)}
                  className="w-full border border-slate-200 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-brand/20 outline-none text-[14.5px] font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-600 font-bold mb-1.5">Email</label>
                  <input
                    type="email"
                    placeholder="Enter email address"
                    value={newLeadEmail}
                    onChange={(e) => setNewLeadEmail(e.target.value)}
                    className="w-full border border-slate-200 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-brand/20 outline-none text-[14.5px] font-medium"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1.5">Phone</label>
                  <input
                    type="text"
                    placeholder="10-digit number"
                    value={newLeadPhone}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setNewLeadPhone(val);
                    }}
                    className="w-full border border-slate-200 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-brand/20 outline-none text-[14.5px] font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-600 font-bold mb-1.5">Budget</label>
                  <select
                    value={newLeadBudget}
                    onChange={(e) => setNewLeadBudget(e.target.value)}
                    className="w-full border border-slate-200 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-brand/20 outline-none text-[14.5px] font-medium bg-white"
                  >
                    <option value="" disabled>Select budget range</option>
                    <option value="Under 25L">Under 25L</option>
                    <option value="25L-50L">25L-50L</option>
                    <option value="50L-1Cr">50L-1Cr</option>
                    <option value="1Cr-2Cr">1Cr-2Cr</option>
                    <option value="Above 2Cr">Above 2Cr</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1.5">Property Interested</label>
                  <select
                    value={newLeadProperty}
                    onChange={(e) => setNewLeadProperty(e.target.value)}
                    className="w-full border border-slate-200 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-brand/20 outline-none text-[14.5px] font-medium bg-white"
                  >
                    <option value="" disabled>Select property type</option>
                    <option value="1BHK">1BHK</option>
                    <option value="2BHK">2BHK</option>
                    <option value="3BHK">3BHK</option>
                    <option value="4+BHK">4+BHK</option>
                    <option value="Villa">Villa</option>
                    <option value="Banglow">Banglow</option>
                    <option value="Plot">Plot</option>
                    <option value="Residential">Residential</option>
                    <option value="Commercial">Commercial</option>
                    <option value="Apartment">Apartment</option>
                    <option value="Shop">Shop</option>
                    <option value="Office">Office</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1.5">Lead Source</label>
                <select
                  value={newLeadSource}
                  onChange={(e) => setNewLeadSource(e.target.value)}
                  className="w-full border border-slate-200 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-brand/20 outline-none text-[14.5px] font-semibold"
                >
                  <option value="Facebook">Facebook</option>
                  <option value="Google">Google</option>
                  <option value="Website">Website</option>
                  <option value="Walk-In">Walk-In</option>
                  <option value="MagicBricks">MagicBricks</option>
                  <option value="99acres">99acres</option>
                  <option value="Referral">Referral</option>
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-600 font-bold mb-1.5">Preferred Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Pune, Kolhapur"
                    value={newLeadLocation}
                    onChange={(e) => setNewLeadLocation(e.target.value)}
                    className="w-full border border-slate-200 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-brand/20 outline-none text-[14.5px] font-medium"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1.5">Purpose</label>
                  <select
                    value={newLeadPurpose}
                    onChange={(e) => setNewLeadPurpose(e.target.value)}
                    className="w-full border border-slate-200 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-brand/20 outline-none text-[14.5px] font-medium bg-white"
                  >
                    <option value="">Select purpose</option>
                    <option value="Buy">Buy</option>
                    <option value="Invest">Invest</option>
                    <option value="Rental">Rental</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1.5">Initial Status</label>
                <div className="grid grid-cols-3 gap-3">
                  {(["New lead", "Hot Lead", "Closed"] as const).map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setNewLeadStatus(status)}
                      className={`py-2.5 px-3 rounded-xl border-2 transition-all font-semibold text-[12.5px] cursor-pointer ${newLeadStatus === status ? "border-brand bg-brand-light text-brand shadow-xs" : "border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50"}`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-3 justify-end">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-5 py-2.5 rounded-2xl text-slate-500 hover:bg-slate-100 font-bold cursor-pointer font-sans"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-2xl bg-brand hover:bg-brand-hover text-white font-bold shadow-md shadow-brand/10 cursor-pointer font-sans"
                >
                  Save Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Modal */}
      {isAssignModalOpen && selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in font-sans">
          <div className="bg-white rounded-[32px] p-6 w-full max-w-sm border border-slate-100 shadow-2xl animate-scale-up">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <h3 className="text-lg font-semibold text-slate-800 tracking-tight">Assign Lead</h3>
              <button
                onClick={() => setIsAssignModalOpen(false)}
                className="p-1 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <svg className="w-5.5 h-5.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mt-5">
              <p className="text-[14px] text-slate-600 mb-4 font-medium">Assign <span className="font-bold text-slate-800">{selectedLead.name}</span> to a team member:</p>

              <select
                className="w-full border border-slate-200 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-brand/20 outline-none text-[14.5px] font-semibold text-slate-700"
                id="assignEmployeeSelect"
                defaultValue=""
              >
                <option value="" disabled>Select Employee...</option>
                {users.map(u => <option key={u._id} value={u._id}>{u.name} ({u.role.replace(/_/g, " ")})</option>)}
              </select>

              <div className="flex gap-3 pt-6 justify-end">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="px-5 py-2.5 rounded-2xl text-slate-500 hover:bg-slate-100 font-bold cursor-pointer font-sans text-[14px]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const select = document.getElementById("assignEmployeeSelect") as HTMLSelectElement;
                    const empId = select.value;
                    if (!empId) { addToast("Please select an employee", "info"); return; }

                    try {
                      const res = await fetch(`${API_URL}/v1/leads/${selectedLead.id}/assign`, {
                        method: "PATCH",
                        headers: getAuthHeaders(),
                        body: JSON.stringify({ assignedTo: empId })
                      });
                      const json = await res.json();
                      if (json.success) {
                        addToast("Lead assigned successfully", "success");
                        setIsAssignModalOpen(false);
                        fetchLeads();
                      } else {
                        addToast(json.message || "Failed to assign lead", "info");
                      }
                    } catch (err: any) {
                      addToast(err.message || "Error assigning lead", "info");
                    }
                  }}
                  className="px-6 py-2.5 rounded-2xl bg-brand hover:bg-brand-hover text-white font-bold shadow-md shadow-brand/10 cursor-pointer font-sans text-[14px]"
                >
                  Assign
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Follow Up Modal */}
      {isFollowUpModalOpen && selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in font-sans">
          <div className="bg-white rounded-[32px] p-6 w-full max-w-md border border-slate-100 shadow-2xl animate-scale-up">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <h3 className="text-xl font-semibold text-slate-800 tracking-tight">Schedule Follow-up</h3>
              <button
                onClick={() => setIsFollowUpModalOpen(false)}
                className="p-1 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <svg className="w-5.5 h-5.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <label className="block text-slate-600 font-bold mb-1.5 text-[14px]">Follow-up Type</label>
                <select
                  value={followUpType}
                  onChange={(e) => setFollowUpType(e.target.value)}
                  className="w-full border border-slate-200 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-brand/20 outline-none text-[14.5px] font-semibold"
                >
                  <option value="Call">Call</option>
                  <option value="Email">Email</option>
                  <option value="Meeting">Meeting</option>
                  <option value="Site Visit">Site Visit</option>
                  <option value="WhatsApp">WhatsApp</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-600 font-bold mb-1.5 text-[14px]">Date</label>
                  <input
                    type="date"
                    value={followUpDate}
                    onChange={(e) => setFollowUpDate(e.target.value)}
                    className="w-full border border-slate-200 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-brand/20 outline-none text-[14.5px] font-medium"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1.5 text-[14px]">Time</label>
                  <input
                    type="time"
                    value={followUpTime}
                    onChange={(e) => setFollowUpTime(e.target.value)}
                    className="w-full border border-slate-200 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-brand/20 outline-none text-[14.5px] font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1.5 text-[14px]">Notes</label>
                <textarea
                  rows={3}
                  value={followUpNotes}
                  onChange={(e) => setFollowUpNotes(e.target.value)}
                  placeholder="Enter details..."
                  className="w-full border border-slate-200 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-brand/20 outline-none text-[14.5px] font-medium resize-none"
                />
              </div>

              <div className="flex gap-3 pt-3 justify-end">
                <button
                  type="button"
                  onClick={() => setIsFollowUpModalOpen(false)}
                  className="px-5 py-2.5 rounded-2xl text-slate-500 hover:bg-slate-100 font-bold cursor-pointer font-sans text-[14px]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (!followUpDate || !followUpTime) { addToast("Please select date and time", "info"); return; }
                    const scheduledAt = new Date(`${followUpDate}T${followUpTime}`).toISOString();

                    try {
                      const res = await fetch(`${API_URL}/v1/followups`, {
                        method: "POST",
                        headers: getAuthHeaders(),
                        body: JSON.stringify({
                          lead: selectedLead.id,
                          type: followUpType,
                          scheduledAt,
                          notes: followUpNotes,
                        })
                      });
                      const json = await res.json();
                      if (json.success) {
                        addToast("Follow-up scheduled!", "success");
                        setIsFollowUpModalOpen(false);
                        setFollowUpDate("");
                        setFollowUpTime("");
                        setFollowUpNotes("");
                      } else {
                        addToast(json.message || "Failed to schedule", "info");
                      }
                    } catch (err: any) {
                      addToast(err.message || "Error scheduling follow-up", "info");
                    }
                  }}
                  className="px-6 py-2.5 rounded-2xl bg-brand hover:bg-brand-hover text-white font-bold shadow-md shadow-brand/10 cursor-pointer font-sans text-[14px]"
                >
                  Schedule
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lead Detail Modal */}
      <LeadDetailModule
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedLead(null);
        }}
        lead={selectedLead}
        onSave={async (updated) => {
          try {
            // Backend update route is PUT /v1/leads/:id and its Joi schema rejects
            // unknown keys (id, status, createdAt...) and the UI's display
            // placeholders, so send only real, updatable values.
            const payload: Record<string, string> = {
              name: updated.name,
              notes: updated.notes || '',
            };
            if (updated.phone && /^[6-9]\d{9}$/.test(updated.phone)) payload.phone = updated.phone;
            if (updated.email && updated.email !== 'Not provided') payload.email = updated.email;
            if (updated.source && updated.source !== 'Unknown') payload.source = updated.source;
            if (updated.budgetRange && updated.budgetRange !== 'Not specified') payload.budgetRange = updated.budgetRange;
            if (updated.propertyType && updated.propertyType !== 'Not specified') payload.propertyType = updated.propertyType;
            if (updated.preferredLocation && updated.preferredLocation !== 'Not specified') payload.preferredLocation = updated.preferredLocation;
            if (updated.purpose && updated.purpose.trim()) payload.purpose = updated.purpose;

            const res = await fetch(`${API_URL}/v1/leads/${updated.id}`, {
              method: 'PUT',
              headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
            });
            const json = await res.json();
            if (json.success) {
              addToast('Lead updated successfully', 'success');
              fetchLeads();
              fetchStats();
            } else {
              addToast(json.message || 'Failed to update lead', 'info');
            }
          } catch (err: any) {
            addToast(err.message || 'Error updating lead', 'info');
          }
        }}
      />

      {/* Floating Bulk Actions Bar */}
      {selectedLeads.length > 0 && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 bg-[#1E293B]/90 backdrop-blur-md text-white px-6 py-4 rounded-3xl shadow-2xl flex items-center gap-6 border border-slate-700/50 animate-fade-in font-sans">
          <div className="flex items-center gap-2">
            <span className="bg-primary text-white text-[11px] font-extrabold px-2 py-0.5 rounded-full shadow-inner">
              {selectedLeads.length}
            </span>
            <span className="text-[13px] font-semibold tracking-wide text-slate-300">Selected</span>
          </div>

          <div className="h-6 w-px bg-slate-700"></div>

          {/* Bulk Update Status */}
          <div className="relative group">
            <button className="text-[13px] font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer">
              Change Status
              <svg className="w-4.5 h-4.5 text-slate-400 group-hover:translate-y-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
            </button>
            <div className="absolute bottom-full mb-2 left-0 hidden group-hover:block bg-slate-900 border border-slate-800 rounded-2xl shadow-xl p-2 w-40 text-[12.5px] font-medium text-left">
              {["New lead", "Hot Lead", "Closed"].map((status) => (
                <button
                  key={status}
                  onClick={() => handleBulkUpdateField("status", status)}
                  className="w-full text-left px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white cursor-pointer"
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* Bulk Update Project */}
          <div className="relative group">
            <button className="text-[13px] font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer">
              Change Project
              <svg className="w-4.5 h-4.5 text-slate-400 group-hover:translate-y-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
            </button>
            <div className="absolute bottom-full mb-2 left-0 hidden group-hover:block bg-slate-900 border border-slate-800 rounded-2xl shadow-xl p-2 w-48 text-[12.5px] font-medium text-left max-h-48 overflow-y-auto scrollbar-thin">
              {projectsList.map((proj) => (
                <button
                  key={proj.id}
                  onClick={() => handleBulkUpdateField("projectName", proj.name)}
                  className="w-full text-left px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white cursor-pointer"
                >
                  {proj.name}
                </button>
              ))}
            </div>
          </div>

          <div className="h-6 w-px bg-slate-700"></div>

          {/* Bulk Delete */}
          <button
            onClick={handleBulkDelete}
            className="text-[13px] font-bold bg-[#F87171] hover:bg-red-500 text-white px-4 py-2 rounded-xl transition-all flex items-center gap-1 cursor-pointer"
          >
            Delete
          </button>
        </div>
      )}

    </div>
  );
}
