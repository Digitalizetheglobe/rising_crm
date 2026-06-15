"use client";

import React, { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import PageHeader from "../../Components/PageHeader";
import { PAGE_CONTAINER_CLASS, PRIMARY_ACTION_BTN_CLASS } from "../../lib/pageLayout";
import { useDashboard } from "../DashboardContext";
import { API_URL } from "../../config/api.config";
import { getAuthHeaders, getToken } from "../../lib/auth";
import KPICard from "../../Components/KPICard";

const API_BASE = API_URL.replace(/\/api$/, "");

const PROJECT_TYPE_OPTIONS = [
  { value: "RESIDENTIAL", label: "Apartment complex" },
  { value: "COMMERCIAL", label: "Commercial" },
  { value: "MIXED_USE", label: "Mixed use" },
  { value: "PLOTTED", label: "Plotted development" },
] as const;

const PROJECT_STATUS_OPTIONS = [
  { value: "UPCOMING", label: "Upcoming" },
  { value: "ACTIVE", label: "Under construction" },
  { value: "COMPLETED", label: "Completed" },
  { value: "ON_HOLD", label: "On hold" },
] as const;

const AMENITY_OPTIONS = [
  "Swimming pool",
  "Gym",
  "Club house",
  "Children play area",
  "Garden",
  "Food store",
  "Parking",
  "Security",
  "Power backup",
];

const EMPTY_PROJECT_FORM = {
  name: "",
  location: "",
  description: "",
  type: "RESIDENTIAL",
  totalUnits: "",
  status: "ACTIVE",
  launchDate: "",
  completionDate: "",
  reraNumber: "",
  amenities: [] as string[],
};

interface ProjectCard {
  id: string;
  name: string;
  location: string;
  status: string;
  statusLabel: string;
  typeLabel: string;
  image: string | null;
  amenities: string[];
  completionDate: string;
  priceRange: string;
  occupancyPct: number;
  available: number;
  booked: number;
  sold: number;
}

interface PageStats {
  totalProjects: number;
  totalUnits: number;
  availableUnits: number;
  soldUnits: number;
}

const STATUS_LABELS: Record<string, string> = {
  UPCOMING: "Upcoming",
  ACTIVE: "Under construction",
  COMPLETED: "Completed",
  ON_HOLD: "On hold",
};

const TYPE_LABELS: Record<string, string> = {
  RESIDENTIAL: "Apartment complex",
  COMMERCIAL: "Commercial",
  MIXED_USE: "Mixed use",
  PLOTTED: "Plotted development",
};

const formatPriceCompact = (amount: number): string => {
  if (!amount) return "—";
  if (amount >= 10000000) {
    const cr = amount / 10000000;
    return `₹${cr % 1 === 0 ? cr.toFixed(0) : cr.toFixed(1)} Cr`;
  }
  if (amount >= 100000) return `₹${Math.round(amount / 100000)}L`;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatCompletionDate = (dateStr?: string): string => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-IN", { month: "short", year: "numeric" });
};

const ProjectPlaceholder = () => (
  <div className="w-full h-full flex items-center justify-center text-slate-300">
    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  </div>
);

function ProjectThumbnail({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);

  if (failed) return <ProjectPlaceholder />;

  return (
    <img
      src={src}
      alt={alt}
      className="absolute inset-0 w-full h-full object-cover"
      onError={() => setFailed(true)}
    />
  );
}

const getDateRange = (range: string): { startDate?: string; endDate?: string } => {
  const end = new Date();
  const start = new Date();
  if (range === "Last 3 months") start.setMonth(start.getMonth() - 3);
  else if (range === "Last 12 months") start.setFullYear(start.getFullYear() - 1);
  else start.setDate(start.getDate() - 30);

  return {
    startDate: start.toISOString().split("T")[0],
    endDate: end.toISOString().split("T")[0],
  };
};

export default function ProjectsPage() {
  const { searchQuery, setSearchQuery, addToast } = useDashboard();

  const [projects, setProjects] = useState<ProjectCard[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [locationFilter, setLocationFilter] = useState("All locations");
  const [timeRange, setTimeRange] = useState("Last 30 days");
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [showTimeDropdown, setShowTimeDropdown] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<PageStats>({
    totalProjects: 0,
    totalUnits: 0,
    availableUnits: 0,
    soldUnits: 0,
  });
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_PROJECT_FORM);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const fetchProjectStats = async (projectId: string) => {
    try {
      const res = await fetch(`${API_URL}/v1/projects/${projectId}/stats`, {
        headers: getAuthHeaders(),
      });
      const json = await res.json();
      if (json.success && json.data?.units) {
        return json.data.units as {
          total: number;
          available: number;
          booked: number;
          sold: number;
          occupancy: string;
          priceRange: { min: number; max: number };
        };
      }
    } catch {
      /* ignore per-card stats failure */
    }
    return null;
  };

  const mapProject = async (project: {
    _id: string;
    name: string;
    location: string;
    status: string;
    type: string;
    amenities?: string[];
    completionDate?: string;
    images?: string[];
  }): Promise<ProjectCard> => {
    const unitStats = await fetchProjectStats(project._id);
    const total = unitStats?.total || 0;
    const booked = unitStats?.booked || 0;
    const sold = unitStats?.sold || 0;
    const available = unitStats?.available || 0;
    const minPrice = unitStats?.priceRange?.min || 0;
    const maxPrice = unitStats?.priceRange?.max || 0;

    let occupancyPct = 0;
    if (unitStats?.occupancy) {
      occupancyPct = parseFloat(unitStats.occupancy.replace("%", "")) || 0;
    } else if (total > 0) {
      occupancyPct = Math.round(((booked + sold) / total) * 100);
    }

    const priceRange =
      minPrice && maxPrice
        ? `${formatPriceCompact(minPrice)} - ${formatPriceCompact(maxPrice)}`
        : "—";

    const image = project.images?.[0] || null;
    return {
      id: project._id,
      name: project.name,
      location: project.location,
      status: project.status,
      statusLabel: STATUS_LABELS[project.status] || project.status,
      typeLabel: TYPE_LABELS[project.type] || project.type,
      image,
      amenities: project.amenities || [],
      completionDate: formatCompletionDate(project.completionDate),
      priceRange,
      occupancyPct,
      available,
      booked,
      sold,
    };
  };

  const fetchLocations = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/v1/projects?limit=100`, { headers: getAuthHeaders() });
      const json = await res.json();
      if (json.success && json.data?.projects) {
        const unique = Array.from(
          new Set(
            (json.data.projects as { location: string }[])
              .map((p) => p.location?.trim())
              .filter(Boolean)
          )
        ).sort();
        setLocations(unique);
      }
    } catch {
      /* locations are optional for filters */
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const [projectsRes, unitsRes] = await Promise.all([
        fetch(`${API_URL}/v1/projects?limit=1`, { headers: getAuthHeaders() }),
        fetch(`${API_URL}/v1/units/stats`, { headers: getAuthHeaders() }),
      ]);
      const [projectsJson, unitsJson] = await Promise.all([projectsRes.json(), unitsRes.json()]);

      setStats({
        totalProjects: projectsJson.success ? projectsJson.data?.total || 0 : 0,
        totalUnits: unitsJson.success ? unitsJson.data?.totalUnits || 0 : 0,
        availableUnits: unitsJson.success ? unitsJson.data?.availableUnits || 0 : 0,
        soldUnits: unitsJson.success ? unitsJson.data?.soldUnits || 0 : 0,
      });
    } catch {
      /* stats fallback to zeros */
    }
  }, []);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const { startDate, endDate } = getDateRange(timeRange);
      let url = `${API_URL}/v1/projects?page=${currentPage}&limit=6&startDate=${startDate}&endDate=${endDate}`;
      if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;

      const res = await fetch(url, { headers: getAuthHeaders() });
      const json = await res.json();

      if (!json.success || !json.data) {
        addToast(json.message || "Failed to load projects", "info");
        setProjects([]);
        return;
      }

      let rawProjects = json.data.projects || [];
      if (locationFilter !== "All locations") {
        rawProjects = rawProjects.filter(
          (p: { location: string }) => p.location?.toLowerCase() === locationFilter.toLowerCase()
        );
      }

      const mapped = await Promise.all(rawProjects.map(mapProject));
      setProjects(mapped);
      setTotalPages(json.data.totalPages || 1);
      setStats((prev) => ({ ...prev, totalProjects: json.data.total || prev.totalProjects }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error connecting to server";
      addToast(message, "info");
    } finally {
      setLoading(false);
    }
  }, [addToast, currentPage, locationFilter, searchQuery, timeRange]);

  useEffect(() => {
    fetchLocations();
    fetchStats();
  }, [fetchLocations, fetchStats]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleResetFilters = () => {
    setSearchQuery("");
    setLocationFilter("All locations");
    setTimeRange("Last 30 days");
    setCurrentPage(1);
  };

  const updateForm = (field: keyof typeof EMPTY_PROJECT_FORM, value: string | string[]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const resetAddForm = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setForm({ ...EMPTY_PROJECT_FORM, amenities: [] });
    setImagePreview(null);
    setUploadedImageUrl(null);
  };

  const openAddModal = () => {
    resetAddForm();
    setIsAddModalOpen(true);
  };

  const closeAddModal = () => {
    setIsAddModalOpen(false);
    resetAddForm();
  };

  const toggleAmenity = (amenity: string) => {
    setForm((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter((a) => a !== amenity)
        : [...prev.amenities, amenity],
    }));
  };

  const uploadProjectImage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    const token = getToken();
    const res = await fetch(`${API_URL}/v1/uploads/single`, {
      method: "POST",
      headers: { Authorization: token ? (token.startsWith("Bearer ") ? token : `Bearer ${token}`) : "" },
      body: formData,
    });
    const json = await res.json();
    if (!json.success || !json.data?.path) {
      throw new Error(json.message || "Failed to upload image");
    }
    return `${API_BASE}${json.data.path}`;
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      addToast("Please select a valid image file", "info");
      return;
    }

    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(URL.createObjectURL(file));
    setUploadedImageUrl(null);
    setIsUploadingImage(true);

    try {
      const url = await uploadProjectImage(file);
      setUploadedImageUrl(url);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Image upload failed";
      addToast(message, "info");
      setImagePreview(null);
    } finally {
      setIsUploadingImage(false);
      e.target.value = "";
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();

    const totalUnits = parseInt(form.totalUnits, 10);
    if (!form.name.trim() || !form.location.trim() || !totalUnits || totalUnits < 1) {
      addToast("Please fill all required fields", "info");
      return;
    }

    if (form.launchDate && form.completionDate && form.completionDate <= form.launchDate) {
      addToast("Completion date must be after launch date", "info");
      return;
    }

    if (isUploadingImage) {
      addToast("Please wait for image upload to finish", "info");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        name: form.name.trim(),
        location: form.location.trim(),
        description: form.description.trim(),
        type: form.type,
        totalUnits,
        status: form.status,
        amenities: form.amenities,
      };

      if (form.launchDate) payload.launchDate = form.launchDate;
      if (form.completionDate) payload.completionDate = form.completionDate;
      if (form.reraNumber.trim()) payload.reraNumber = form.reraNumber.trim();
      if (uploadedImageUrl) payload.images = [uploadedImageUrl];

      const res = await fetch(`${API_URL}/v1/projects`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (json.success) {
        addToast(`Project "${form.name}" created successfully`, "success");
        closeAddModal();
        setCurrentPage(1);
        fetchProjects();
        fetchStats();
        fetchLocations();
      } else {
        addToast(json.message || "Failed to create project", "info");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error connecting to server";
      addToast(message, "info");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={PAGE_CONTAINER_CLASS}>
      <PageHeader
        title="Projects"
        subtitle="Monitor all projects and unit availability"
        actions={
          <button
            onClick={openAddModal}
            className={PRIMARY_ACTION_BTN_CLASS}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add new project
          </button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard title="Total projects" value={stats.totalProjects} subtext="All properties" accentColor="#64748b" />
        <KPICard title="Total units" value={stats.totalUnits} subtext="Total inventory" accentColor="#f59e0b" />
        <KPICard title="Available units" value={stats.availableUnits} subtext="Ready to sell" accentColor="#3b82f6" />
        <KPICard title="Sold units" value={stats.soldUnits} subtext="Successfully sold" accentColor="#10b981" />
      </div>

      <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100 flex flex-col lg:flex-row lg:items-center gap-4 justify-between">
        <div className="relative w-full lg:w-96">
          <span className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400">
            <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-[#F3F2F1]/70 text-slate-700 pl-11 pr-4 py-2.5 rounded-2xl text-[14px] border-none outline-none focus:ring-2 focus:ring-brand/20 focus:bg-white transition-all font-semibold"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <button
              onClick={() => {
                setShowLocationDropdown(!showLocationDropdown);
                setShowTimeDropdown(false);
              }}
              className="bg-[#F3F2F1]/70 text-slate-700 font-bold px-4 py-2.5 rounded-2xl text-[13.5px] flex items-center gap-2 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              {locationFilter}
              <svg className={`w-4 h-4 transition-transform duration-200 ${showLocationDropdown ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showLocationDropdown && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowLocationDropdown(false)} />
                <div className="absolute right-0 mt-2 w-56 max-h-64 overflow-y-auto bg-white border border-slate-100 rounded-2xl shadow-xl z-50 p-2 animate-scale-up font-semibold text-[13.5px]">
                  <button
                    onClick={() => {
                      setLocationFilter("All locations");
                      setCurrentPage(1);
                      setShowLocationDropdown(false);
                    }}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl transition-colors cursor-pointer ${locationFilter === "All locations" ? "bg-brand-light text-brand font-bold" : "text-slate-600 hover:bg-slate-50"}`}
                  >
                    All locations
                  </button>
                  {locations.map((loc) => (
                    <button
                      key={loc}
                      onClick={() => {
                        setLocationFilter(loc);
                        setCurrentPage(1);
                        setShowLocationDropdown(false);
                      }}
                      className={`w-full text-left px-3.5 py-2.5 rounded-xl transition-colors cursor-pointer ${locationFilter === loc ? "bg-brand-light text-brand font-bold" : "text-slate-600 hover:bg-slate-50"}`}
                    >
                      {loc}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => {
                setShowTimeDropdown(!showTimeDropdown);
                setShowLocationDropdown(false);
              }}
              className="bg-[#F3F2F1]/70 text-slate-700 font-bold px-4 py-2.5 rounded-2xl text-[13.5px] flex items-center gap-2.5 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {timeRange}
            </button>
            {showTimeDropdown && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowTimeDropdown(false)} />
                <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 p-2 animate-scale-up font-semibold text-[13.5px]">
                  {(["Last 30 days", "Last 3 months", "Last 12 months"] as const).map((range) => (
                    <button
                      key={range}
                      onClick={() => {
                        setTimeRange(range);
                        setCurrentPage(1);
                        setShowTimeDropdown(false);
                      }}
                      className={`w-full text-left px-3.5 py-2.5 rounded-xl transition-colors cursor-pointer ${timeRange === range ? "bg-brand-light text-brand font-bold" : "text-slate-600 hover:bg-slate-50"}`}
                    >
                      {range}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <button
            onClick={handleResetFilters}
            className="bg-[#FDF2F2] text-brand font-extrabold px-5 py-2.5 rounded-2xl text-[13.5px] flex items-center gap-2 hover:bg-red-100/50 transition-colors cursor-pointer"
          >
            <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c.132 0 .263 0 .393.007a7.5 7.5 0 007.92 12.446a9 9 0 11-8.313-12.454z" />
            </svg>
            Filter
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-400 font-medium">Loading projects...</div>
      ) : projects.length === 0 ? (
        <div className="py-20 text-center text-slate-400 font-medium">No projects matched your filters.</div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {projects.map((project) => (
            <div
              key={project.id}
              className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 sm:p-6 flex flex-col gap-5"
            >
              <div className="flex gap-4">
                <div className="w-[72px] h-[72px] sm:w-[88px] sm:h-[88px] rounded-2xl overflow-hidden bg-slate-100 flex-shrink-0 relative">
                  {project.image ? (
                    <ProjectThumbnail src={project.image} alt={project.name} />
                  ) : (
                    <ProjectPlaceholder />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <h3 className="text-[18px] sm:text-[20px] font-bold text-slate-900 leading-tight">{project.name}</h3>
                    <span className="text-[12px] font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full whitespace-nowrap">
                      {project.statusLabel}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1.5 text-slate-500 text-[13px] font-medium">
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="truncate">{project.location}</span>
                  </div>
                  <span className="inline-block mt-2 text-[12px] font-semibold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
                    {project.typeLabel}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[12px] text-slate-400 font-semibold uppercase tracking-wide">Price range</p>
                  <p className="text-[15px] font-bold text-slate-900 mt-1">{project.priceRange}</p>
                </div>
                <div>
                  <p className="text-[12px] text-slate-400 font-semibold uppercase tracking-wide">Completion</p>
                  <p className="text-[15px] font-bold text-slate-900 mt-1">{project.completionDate}</p>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-[13px] font-semibold mb-2">
                  <span className="text-slate-500">Units sold/booked</span>
                  <span className="text-slate-800">{project.occupancyPct}%</span>
                </div>
                <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(project.occupancyPct, 100)}%` }}
                  />
                </div>
              </div>

              {project.amenities.length > 0 && (
                <div>
                  <p className="text-[12px] text-slate-400 font-semibold mb-2">Amenities</p>
                  <div className="flex flex-wrap gap-2">
                    {project.amenities.slice(0, 6).map((amenity) => (
                      <span
                        key={amenity}
                        className="text-[12px] font-medium text-slate-600 border border-slate-200 px-2.5 py-1 rounded-lg"
                      >
                        {amenity}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-3 gap-3 pt-1">
                {[
                  { label: "Available", value: project.available },
                  { label: "Booked", value: project.booked },
                  { label: "Sold", value: project.sold },
                ].map((item) => (
                  <div key={item.label} className="text-center">
                    <p className="text-[12px] text-slate-400 font-semibold">{item.label}</p>
                    <p className="text-[22px] font-extrabold text-slate-900 mt-0.5">{item.value}</p>
                  </div>
                ))}
              </div>

              <button
                onClick={() => addToast(`Opening details for ${project.name}`, "info")}
                className="w-full bg-[#22c55e] hover:bg-[#16a34a] text-white font-bold text-[14px] py-3 rounded-2xl transition-colors cursor-pointer"
              >
                View Details
              </button>
            </div>
          ))}
        </div>
      )}

      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-[32px] w-full max-w-2xl border border-slate-100 shadow-2xl p-6 md:p-8 animate-scale-up font-sans max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 mb-5">
              <h2 className="text-xl font-bold text-slate-900">Add New Project</h2>
              <button
                type="button"
                onClick={closeAddModal}
                className="p-1 rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-5 font-semibold text-[13.5px] text-slate-700">
              <div>
                <label className="block text-slate-600 font-bold mb-2">Project Photo</label>
                <label className="relative block w-full h-44 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 hover:border-brand/40 hover:bg-brand-light/30 transition-colors cursor-pointer overflow-hidden">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleImageSelect}
                    className="sr-only"
                  />
                  {imagePreview ? (
                    <Image src={imagePreview} alt="Preview" fill className="object-cover" unoptimized />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 gap-2">
                      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-[13px] font-bold">Click to upload project photo</span>
                    </div>
                  )}
                  {isUploadingImage && (
                    <div className="absolute inset-0 bg-white/70 flex items-center justify-center text-brand font-bold text-[13px]">
                      Uploading...
                    </div>
                  )}
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-600 font-bold mb-1.5">Project Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sunrise residency"
                    value={form.name}
                    onChange={(e) => updateForm("name", e.target.value)}
                    className="w-full border border-slate-200 rounded-2xl px-4 py-3 bg-white focus:ring-2 focus:ring-brand/20 outline-none placeholder:text-slate-400 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1.5">Location *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Baner, Pune"
                    value={form.location}
                    onChange={(e) => updateForm("location", e.target.value)}
                    className="w-full border border-slate-200 rounded-2xl px-4 py-3 bg-white focus:ring-2 focus:ring-brand/20 outline-none placeholder:text-slate-400 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1.5">Description</label>
                <textarea
                  placeholder="Brief description about the project..."
                  value={form.description}
                  onChange={(e) => updateForm("description", e.target.value)}
                  rows={3}
                  className="w-full border border-slate-200 rounded-2xl px-4 py-3 bg-white focus:ring-2 focus:ring-brand/20 outline-none placeholder:text-slate-400 font-medium resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-600 font-bold mb-1.5">Project Type *</label>
                  <select
                    value={form.type}
                    onChange={(e) => updateForm("type", e.target.value)}
                    className="w-full border border-slate-200 rounded-2xl px-4 py-3 bg-white focus:ring-2 focus:ring-brand/20 outline-none font-semibold"
                  >
                    {PROJECT_TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1.5">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => updateForm("status", e.target.value)}
                    className="w-full border border-slate-200 rounded-2xl px-4 py-3 bg-white focus:ring-2 focus:ring-brand/20 outline-none font-semibold"
                  >
                    {PROJECT_STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-600 font-bold mb-1.5">Total Units *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    placeholder="e.g. 120"
                    value={form.totalUnits}
                    onChange={(e) => updateForm("totalUnits", e.target.value)}
                    className="w-full border border-slate-200 rounded-2xl px-4 py-3 bg-white focus:ring-2 focus:ring-brand/20 outline-none placeholder:text-slate-400 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1.5">RERA Number</label>
                  <input
                    type="text"
                    placeholder="Optional"
                    value={form.reraNumber}
                    onChange={(e) => updateForm("reraNumber", e.target.value)}
                    className="w-full border border-slate-200 rounded-2xl px-4 py-3 bg-white focus:ring-2 focus:ring-brand/20 outline-none placeholder:text-slate-400 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-600 font-bold mb-1.5">Launch Date</label>
                  <input
                    type="date"
                    value={form.launchDate}
                    onChange={(e) => updateForm("launchDate", e.target.value)}
                    className="w-full border border-slate-200 rounded-2xl px-4 py-3 bg-white focus:ring-2 focus:ring-brand/20 outline-none font-medium"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1.5">Completion Date</label>
                  <input
                    type="date"
                    value={form.completionDate}
                    onChange={(e) => updateForm("completionDate", e.target.value)}
                    className="w-full border border-slate-200 rounded-2xl px-4 py-3 bg-white focus:ring-2 focus:ring-brand/20 outline-none font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-2">Amenities</label>
                <div className="flex flex-wrap gap-2">
                  {AMENITY_OPTIONS.map((amenity) => (
                    <button
                      key={amenity}
                      type="button"
                      onClick={() => toggleAmenity(amenity)}
                      className={`px-3 py-1.5 rounded-xl border text-[12.5px] font-semibold transition-all cursor-pointer ${
                        form.amenities.includes(amenity)
                          ? "border-brand bg-brand-light text-brand"
                          : "border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      {amenity}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2 justify-end">
                <button
                  type="button"
                  onClick={closeAddModal}
                  className="px-5 py-2.5 rounded-2xl text-slate-500 hover:bg-slate-100 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || isUploadingImage}
                  className="px-6 py-2.5 rounded-2xl bg-brand hover:bg-brand-hover text-white font-bold shadow-md shadow-brand/10 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Creating..." : "Create Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center py-4 gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className={`w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 ${currentPage === 1 ? "opacity-40 cursor-not-allowed" : "hover:bg-slate-100 cursor-pointer"}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`w-8 h-8 flex items-center justify-center rounded-lg font-bold cursor-pointer ${currentPage === page ? "bg-brand text-white shadow-md shadow-brand/20" : "text-slate-500 hover:bg-slate-100"}`}
            >
              {page}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className={`w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 ${currentPage === totalPages ? "opacity-40 cursor-not-allowed" : "hover:bg-slate-100 cursor-pointer"}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
