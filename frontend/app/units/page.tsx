"use client";

import React, { useState } from "react";
import { useDashboard } from "../DashboardContext";

interface UnitItem {
  floor: string;
  facing: string;
  unit: string;
  status: "Available" | "Booked";
  size: string;
  price: string;
}

export default function UnitsPage() {
  const { searchQuery, setSearchQuery } = useDashboard();

  // Filter & Search states
  const [projectFilter, setProjectFilter] = useState("Baner");
  const [timeRange, setTimeRange] = useState("Last 30 days");
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const [showTimeDropdown, setShowTimeDropdown] = useState(false);

  const mockUnitsData: UnitItem[] = [
    { floor: "3rd floor", facing: "East", unit: "Bindra recedency 3bhk", status: "Available", size: "1450 sq.ft", price: "1,60,000/-" },
    { floor: "3rd floor", facing: "West", unit: "Radha recedency 2bhk", status: "Booked", size: "1450 sq.ft", price: "1,30,000/-" },
    { floor: "3rd floor", facing: "North", unit: "Birla nivas 1bhk", status: "Available", size: "1450 sq.ft", price: "1,90,000/-" },
    { floor: "3rd floor", facing: "South", unit: "Radha recedency 2bhk", status: "Booked", size: "3000 sq.ft", price: "1,20,000/-" },
    { floor: "3rd floor", facing: "North", unit: "Radha recedency 2bhk", status: "Available", size: "3000 sq.ft", price: "1,80,000/-" },
    { floor: "5th floor", facing: "East", unit: "Birla nivas 1bhk", status: "Booked", size: "3000 sq.ft", price: "1,40,000" },
    { floor: "5th floor", facing: "South", unit: "Radha recedency 2bhk", status: "Available", size: "1450 sq.ft", price: "1,60,000/-" },
    { floor: "5th floor", facing: "West", unit: "Radha recedency 2bhk", status: "Booked", size: "1450 sq.ft", price: "1,60,000/-" },
    { floor: "5th floor", facing: "North", unit: "Radha recedency 2bhk", status: "Available", size: "1450 sq.ft", price: "1,60,000/-" },
    { floor: "5th floor", facing: "East", unit: "Radha recedency 2bhk", status: "Booked", size: "1450 sq.ft", price: "1,60,000/-" }
  ];

  return (
    <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-6 bg-[#FDFCFB]">
      
      {/* Main Title & Action Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Unit Management</h1>
          <p className="text-slate-500 mt-1 text-[15px] font-semibold">Track availability status of all units across projects</p>
        </div>
      </div>

      {/* 4 KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Card 1: Total projects */}
        <div className="bg-white rounded-[26px] p-6 shadow-sm border border-slate-100 hover:border-slate-200 transition-all duration-300 transform hover:-translate-y-1 cursor-default relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[6px] bg-[#64748b] rounded-t-full" />
          <span className="text-slate-800 font-bold text-[14.5px] uppercase tracking-wider block">Total projects</span>
          <h3 className="text-[52px] font-extrabold text-slate-900 mt-2 mb-2 leading-none">10</h3>
          <div className="flex items-center gap-1.5 mt-2 h-[24px]"></div>
        </div>

        {/* Card 2: Total units */}
        <div className="bg-white rounded-[26px] p-6 shadow-sm border border-slate-100 hover:border-slate-200 transition-all duration-300 transform hover:-translate-y-1 cursor-default relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[6px] bg-[#f59e0b] rounded-t-full" />
          <span className="text-slate-800 font-bold text-[14.5px] uppercase tracking-wider block">Total units</span>
          <h3 className="text-[52px] font-extrabold text-slate-900 mt-2 mb-2 leading-none">28</h3>
          <div className="flex items-center gap-1.5 mt-2 h-[24px]"></div>
        </div>

        {/* Card 3: Available units */}
        <div className="bg-white rounded-[26px] p-6 shadow-sm border border-slate-100 hover:border-slate-200 transition-all duration-300 transform hover:-translate-y-1 cursor-default relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[6px] bg-[#3b82f6] rounded-t-full" />
          <span className="text-slate-800 font-bold text-[14.5px] uppercase tracking-wider block">Available units</span>
          <h3 className="text-[52px] font-extrabold text-slate-900 mt-2 mb-2 leading-none">12</h3>
          <div className="flex items-center gap-1.5 mt-2 h-[24px]"></div>
        </div>

        {/* Card 4: Sold units */}
        <div className="bg-white rounded-[26px] p-6 shadow-sm border border-slate-100 hover:border-slate-200 transition-all duration-300 transform hover:-translate-y-1 cursor-default relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[6px] bg-[#10b981] rounded-t-full" />
          <span className="text-slate-800 font-bold text-[14.5px] uppercase tracking-wider block">Sold units</span>
          <h3 className="text-[52px] font-extrabold text-slate-900 mt-2 mb-2 leading-none">12 Cr</h3>
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
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#F3F2F1]/70 text-slate-700 pl-11 pr-4 py-2.5 rounded-2xl text-[14px] border-none outline-none focus:ring-2 focus:ring-brand/20 focus:bg-white transition-all font-semibold"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Project dropdown */}
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
                <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 p-2 animate-scale-up font-semibold text-[13.5px]">
                  {(["Baner", "Kothrud", "Wakad", "Aundh"] as const).map((proj) => (
                    <button
                      key={proj}
                      onClick={() => {
                        setProjectFilter(proj);
                        setShowProjectDropdown(false);
                      }}
                      className={`w-full text-left px-3.5 py-2.5 rounded-xl transition-colors cursor-pointer flex items-center justify-between ${projectFilter === proj ? "bg-brand-light text-brand font-bold" : "text-slate-600 hover:bg-slate-50"}`}
                    >
                      {proj}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Date-Range Dropdown */}
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

          {/* Filter Reset pill */}
          <button
            onClick={() => {
              setSearchQuery("");
              setProjectFilter("Baner");
              setTimeRange("Last 30 days");
            }}
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
        {/* Desktop Table View */}
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
              {mockUnitsData.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-4.5 px-6 text-center text-slate-800">{row.floor}</td>
                  <td className="py-4.5 px-6 text-center text-slate-600">{row.facing}</td>
                  <td className="py-4.5 px-6 text-center text-slate-900 font-bold">{row.unit}</td>
                  <td className="py-4.5 px-6 text-center">
                    <span className={`inline-flex px-3 py-1 rounded-full text-[12px] font-bold ${row.status === "Available" ? "bg-[#FFEBEB] text-[#EB3539]" : "bg-[#E6F9EE] text-[#10B981]"}`}>
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

        {/* Mobile View */}
        <div className="block sm:hidden divide-y divide-slate-100 bg-[#FCFBFB]">
          {mockUnitsData.map((row, idx) => (
            <div key={idx} className="p-4 flex flex-col gap-2 bg-white">
              <div className="flex justify-between items-center">
                <span className="text-[13px] font-bold text-slate-400 uppercase">{row.floor} • {row.facing}</span>
                <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-bold ${row.status === "Available" ? "bg-[#FFEBEB] text-[#EB3539]" : "bg-[#E6F9EE] text-[#10B981]"}`}>
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
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-center py-6 gap-2">
        <button className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-brand text-white font-bold shadow-md shadow-brand/20">
          1
        </button>
        <button className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
