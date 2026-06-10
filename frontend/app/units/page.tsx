"use client";

import React, { useState, useEffect } from "react";
import PageHeader from "../../Components/PageHeader";
import { PAGE_CONTAINER_CLASS } from "../../lib/pageLayout";
import { useDashboard } from "../DashboardContext";
import { API_URL } from "../../config/api.config";
import { getAuthHeaders } from "../../lib/auth";

interface ProjectOption {
  id: string;
  name: string;
}

interface UnitItem {
  id: string;
  floor: string;
  facing: string;
  unit: string;
  status: "Available" | "Booked" | "Sold";
  size: string;
  price: string;
}

interface UnitStats {
  totalProjects: number;
  totalUnits: number;
  availableUnits: number;
  soldUnits: number;
}

const formatFloor = (floor: number): string => {
  const suffix =
    floor % 10 === 1 && floor % 100 !== 11
      ? "st"
      : floor % 10 === 2 && floor % 100 !== 12
        ? "nd"
        : floor % 10 === 3 && floor % 100 !== 13
          ? "rd"
          : "th";
  return floor === 0 ? "Ground floor" : `${floor}${suffix} floor`;
};

const formatPrice = (price: number): string => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(price);
};

const statusStyles: Record<UnitItem["status"], string> = {
  Available: "bg-[#FFEBEB] text-[#EB3539]",
  Booked: "bg-[#E6F9EE] text-[#10B981]",
  Sold: "bg-[#EFF6FF] text-[#1d4ed8]",
};

export default function UnitsPage() {
  const { searchQuery, setSearchQuery, addToast } = useDashboard();

  const [projectFilter, setProjectFilter] = useState("All projects");
  const [projectFilterId, setProjectFilterId] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState("Last 30 days");
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const [showTimeDropdown, setShowTimeDropdown] = useState(false);

  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [units, setUnits] = useState<UnitItem[]>([]);
  const [stats, setStats] = useState<UnitStats>({
    totalProjects: 0,
    totalUnits: 0,
    availableUnits: 0,
    soldUnits: 0,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchProjects = async () => {
    try {
      const res = await fetch(`${API_URL}/v1/projects?limit=100`, {
        headers: getAuthHeaders(),
      });
      const json = await res.json();
      if (json.success && json.data) {
        const mapped = (json.data.projects || []).map((p: { _id: string; name: string }) => ({
          id: p._id,
          name: p.name,
        }));
        setProjects(mapped);
        setStats((prev) => ({ ...prev, totalProjects: json.data.total || mapped.length }));
      }
    } catch (err) {
      console.error("Failed to load projects", err);
    }
  };

  const fetchUnits = async () => {
    setLoading(true);
    try {
      let url = `${API_URL}/v1/units?page=${currentPage}&limit=10`;
      if (searchQuery) {
        url += `&search=${encodeURIComponent(searchQuery)}`;
      }
      if (projectFilterId) {
        url += `&projectId=${projectFilterId}`;
      }
      const res = await fetch(url, { headers: getAuthHeaders() });
      const json = await res.json();
      if (json.success && json.data) {
        const mapped = (json.data.units || []).map(
          (u: {
            _id: string;
            floor: number;
            facing?: string;
            unitNumber: string;
            type: string;
            status: UnitItem["status"];
            area: number;
            price: number;
            project?: { name?: string };
          }) => ({
            id: u._id,
            floor: formatFloor(u.floor),
            facing: u.facing || "—",
            unit: `${u.project?.name || "Unknown"} ${u.type} (${u.unitNumber})`,
            status: u.status,
            size: `${u.area.toLocaleString("en-IN")} sq.ft`,
            price: formatPrice(u.price),
          })
        );
        setUnits(mapped);
        setTotalPages(json.data.pagination?.totalPages || 1);
      } else {
        addToast(json.message || "Failed to load units", "info");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error connecting to server";
      addToast(message, "info");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      let url = `${API_URL}/v1/units/stats`;
      if (projectFilterId) {
        url += `?projectId=${projectFilterId}`;
      }
      const res = await fetch(url, { headers: getAuthHeaders() });
      const json = await res.json();
      if (json.success && json.data) {
        setStats((prev) => ({
          ...prev,
          totalUnits: json.data.totalUnits || 0,
          availableUnits: json.data.availableUnits || 0,
          soldUnits: json.data.soldUnits || 0,
        }));
      }
    } catch (err) {
      console.error("Failed to load unit stats", err);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    fetchUnits();
    fetchStats();
  }, [currentPage, searchQuery, projectFilterId]);

  const handleProjectSelect = (name: string, id: string | null) => {
    setProjectFilter(name);
    setProjectFilterId(id);
    setCurrentPage(1);
    setShowProjectDropdown(false);
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    handleProjectSelect("All projects", null);
    setTimeRange("Last 30 days");
    setCurrentPage(1);
  };

  return (
    <div className={PAGE_CONTAINER_CLASS}>
      <PageHeader
        title="Units"
        subtitle="Track availability status of all units across projects"
      />

      {/* 4 KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-[26px] p-6 shadow-sm border border-slate-100 hover:border-slate-200 transition-all duration-300 transform hover:-translate-y-1 cursor-default relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[6px] bg-[#64748b] rounded-t-full" />
          <span className="text-slate-800 font-bold text-[14.5px] uppercase tracking-wider block">Total projects</span>
          <h3 className="text-[52px] font-extrabold text-slate-900 mt-2 mb-2 leading-none">{stats.totalProjects}</h3>
          <div className="flex items-center gap-1.5 mt-2 h-[24px]"></div>
        </div>

        <div className="bg-white rounded-[26px] p-6 shadow-sm border border-slate-100 hover:border-slate-200 transition-all duration-300 transform hover:-translate-y-1 cursor-default relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[6px] bg-[#f59e0b] rounded-t-full" />
          <span className="text-slate-800 font-bold text-[14.5px] uppercase tracking-wider block">Total units</span>
          <h3 className="text-[52px] font-extrabold text-slate-900 mt-2 mb-2 leading-none">{stats.totalUnits}</h3>
          <div className="flex items-center gap-1.5 mt-2 h-[24px]"></div>
        </div>

        <div className="bg-white rounded-[26px] p-6 shadow-sm border border-slate-100 hover:border-slate-200 transition-all duration-300 transform hover:-translate-y-1 cursor-default relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[6px] bg-[#3b82f6] rounded-t-full" />
          <span className="text-slate-800 font-bold text-[14.5px] uppercase tracking-wider block">Available units</span>
          <h3 className="text-[52px] font-extrabold text-slate-900 mt-2 mb-2 leading-none">{stats.availableUnits}</h3>
          <div className="flex items-center gap-1.5 mt-2 h-[24px]"></div>
        </div>

        <div className="bg-white rounded-[26px] p-6 shadow-sm border border-slate-100 hover:border-slate-200 transition-all duration-300 transform hover:-translate-y-1 cursor-default relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[6px] bg-[#10b981] rounded-t-full" />
          <span className="text-slate-800 font-bold text-[14.5px] uppercase tracking-wider block">Sold units</span>
          <h3 className="text-[52px] font-extrabold text-slate-900 mt-2 mb-2 leading-none">{stats.soldUnits}</h3>
          <div className="flex items-center gap-1.5 mt-2 h-[24px]"></div>
        </div>
      </div>

      {/* Table Filters Panel */}
      <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center gap-4 justify-between">
        <div className="relative w-full md:w-96">
          <span className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400">
            <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Search..."
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
                setShowProjectDropdown(!showProjectDropdown);
                setShowTimeDropdown(false);
              }}
              className="bg-[#F3F2F1]/70 text-slate-700 font-bold px-4 py-2.5 rounded-2xl text-[13.5px] flex items-center gap-2 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              {projectFilter}
              <svg className={`w-4 h-4 transition-transform duration-200 ${showProjectDropdown ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showProjectDropdown && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowProjectDropdown(false)} />
                <div className="absolute right-0 mt-2 w-56 max-h-64 overflow-y-auto bg-white border border-slate-100 rounded-2xl shadow-xl z-50 p-2 animate-scale-up font-semibold text-[13.5px]">
                  <button
                    onClick={() => handleProjectSelect("All projects", null)}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl transition-colors cursor-pointer flex items-center justify-between ${projectFilter === "All projects" ? "bg-brand-light text-brand font-bold" : "text-slate-600 hover:bg-slate-50"}`}
                  >
                    All projects
                  </button>
                  {projects.map((proj) => (
                    <button
                      key={proj.id}
                      onClick={() => handleProjectSelect(proj.name, proj.id)}
                      className={`w-full text-left px-3.5 py-2.5 rounded-xl transition-colors cursor-pointer flex items-center justify-between ${projectFilterId === proj.id ? "bg-brand-light text-brand font-bold" : "text-slate-600 hover:bg-slate-50"}`}
                    >
                      {proj.name}
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
                setShowProjectDropdown(false);
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
            className="bg-[#FDF2F2] text-brand font-extrabold px-5 py-2.5 rounded-2xl text-[13.5px] flex items-center gap-2 hover:bg-red-100/50 transition-colors cursor-pointer font-sans"
          >
            <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c.132 0 .263 0 .393.007a7.5 7.5 0 007.92 12.446a9 9 0 11-8.313-12.454z" />
            </svg>
            Filter
          </button>
        </div>
      </div>

      {/* Main Units Interactive List Container */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-400 font-medium">Loading units...</div>
        ) : units.length === 0 ? (
          <div className="py-16 text-center text-slate-400 font-medium">No units matched your filters.</div>
        ) : (
          <>
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-[#FCFBFB]">
                    <th className="py-4.5 px-6 font-extrabold text-[14px] text-brand uppercase tracking-wider text-center">Floor</th>
                    <th className="py-4.5 px-6 font-extrabold text-[14px] text-brand uppercase tracking-wider text-center">Facing</th>
                    <th className="py-4.5 px-6 font-extrabold text-[14px] text-brand uppercase tracking-wider text-center">Unit</th>
                    <th className="py-4.5 px-6 font-extrabold text-[14px] text-brand uppercase tracking-wider text-center">Status</th>
                    <th className="py-4.5 px-6 font-extrabold text-[14px] text-brand uppercase tracking-wider text-center">Size</th>
                    <th className="py-4.5 px-6 font-extrabold text-[14px] text-brand uppercase tracking-wider text-center">Price</th>
                    <th className="py-4.5 px-6 font-extrabold text-[14px] text-brand uppercase tracking-wider text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold text-[14.5px] text-slate-700">
                  {units.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4.5 px-6 text-center text-slate-800">{row.floor}</td>
                      <td className="py-4.5 px-6 text-center text-slate-600">{row.facing}</td>
                      <td className="py-4.5 px-6 text-center text-slate-900 font-bold">{row.unit}</td>
                      <td className="py-4.5 px-6 text-center">
                        <span className={`inline-flex px-3 py-1 rounded-full text-[12px] font-bold ${statusStyles[row.status]}`}>
                          {row.status}
                        </span>
                      </td>
                      <td className="py-4.5 px-6 text-center text-slate-600">{row.size}</td>
                      <td className="py-4.5 px-6 text-center text-slate-900 font-bold">{row.price}</td>
                      <td className="py-4.5 px-6 text-center">
                        <button className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="block sm:hidden divide-y divide-slate-100 bg-[#FCFBFB]">
              {units.map((row) => (
                <div key={row.id} className="p-4 flex flex-col gap-2 bg-white">
                  <div className="flex justify-between items-center">
                    <span className="text-[13px] font-bold text-slate-400 uppercase">{row.floor} • {row.facing}</span>
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-bold ${statusStyles[row.status]}`}>
                      {row.status}
                    </span>
                  </div>
                  <h4 className="font-extrabold text-[15px] text-slate-900">{row.unit}</h4>
                  <div className="flex justify-between items-center text-[13.5px] mt-1">
                    <span className="text-slate-500 font-semibold">{row.size}</span>
                    <span className="font-bold text-slate-900">{row.price}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center py-6 gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className={`w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 transition-colors ${currentPage === 1 ? "opacity-40 cursor-not-allowed" : "hover:bg-slate-100 cursor-pointer"}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`w-8 h-8 flex items-center justify-center rounded-lg font-bold transition-colors cursor-pointer ${currentPage === page ? "bg-brand text-white shadow-md shadow-brand/20" : "text-slate-500 hover:bg-slate-100"}`}
            >
              {page}
            </button>
          ))}

          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className={`w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 transition-colors ${currentPage === totalPages ? "opacity-40 cursor-not-allowed" : "hover:bg-slate-100 cursor-pointer"}`}
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
