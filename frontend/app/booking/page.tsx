"use client";

import React, { useState } from "react";
import { useDashboard } from "../DashboardContext";

export default function BookingPage() {
  const { searchQuery, setSearchQuery } = useDashboard();

  // Filter & Search states
  const [statusFilter, setStatusFilter] = useState("All Booking");
  const [timeRange, setTimeRange] = useState("Last 30 days");
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showTimeDropdown, setShowTimeDropdown] = useState(false);

  return (
    <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-6 bg-[#FDFCFB]">
      
      {/* Main Title & Action Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Booking</h1>
          <p className="text-slate-500 mt-1 text-[15px] font-semibold">Manage property booking and payment structure</p>
        </div>
      </div>

      {/* 4 KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Card 1: Total Booking (Orange top border) */}
        <div className="bg-white rounded-[26px] p-6 shadow-sm border border-slate-100 hover:border-slate-200 transition-all duration-300 transform hover:-translate-y-1 cursor-default relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[6px] bg-[#f59e0b] rounded-t-full" />
          <span className="text-slate-800 font-bold text-[14.5px] uppercase tracking-wider block">Total Booking</span>
          <h3 className="text-[52px] font-extrabold text-slate-900 mt-2 mb-2 leading-none">0</h3>
          <div className="flex items-center gap-1.5 mt-2 h-[24px]"></div>
        </div>

        {/* Card 2: Full Payment (Gray top border) */}
        <div className="bg-white rounded-[26px] p-6 shadow-sm border border-slate-100 hover:border-slate-200 transition-all duration-300 transform hover:-translate-y-1 cursor-default relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[6px] bg-[#e2e8f0] rounded-t-full" />
          <span className="text-slate-800 font-bold text-[14.5px] uppercase tracking-wider block">Full Payment</span>
          <h3 className="text-[52px] font-extrabold text-slate-900 mt-2 mb-2 leading-none">0</h3>
          <div className="flex items-center gap-1.5 mt-2 h-[24px]"></div>
        </div>

        {/* Card 3: Instalments (Blue top border) */}
        <div className="bg-white rounded-[26px] p-6 shadow-sm border border-slate-100 hover:border-slate-200 transition-all duration-300 transform hover:-translate-y-1 cursor-default relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[6px] bg-[#3b82f6] rounded-t-full" />
          <span className="text-slate-800 font-bold text-[14.5px] uppercase tracking-wider block">Instalments</span>
          <h3 className="text-[52px] font-extrabold text-slate-900 mt-2 mb-2 leading-none">0</h3>
          <div className="flex items-center gap-1.5 mt-2 h-[24px]"></div>
        </div>

        {/* Card 4: Total Value (Green top border) */}
        <div className="bg-white rounded-[26px] p-6 shadow-sm border border-slate-100 hover:border-slate-200 transition-all duration-300 transform hover:-translate-y-1 cursor-default relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[6px] bg-[#10b981] rounded-t-full" />
          <span className="text-slate-800 font-bold text-[14.5px] uppercase tracking-wider block">Total Value</span>
          <h3 className="text-[52px] font-extrabold text-slate-900 mt-2 mb-2 leading-none">$0</h3>
          <div className="flex items-center gap-1.5 mt-2 h-[24px]"></div>
        </div>
      </div>

      {/* Table Filters Panel matching mockup */}
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
          {/* Status dropdown selector */}
          <div className="relative">
            <button
              onClick={() => {
                setShowStatusDropdown(!showStatusDropdown);
                setShowTimeDropdown(false);
              }}
              className="bg-[#F3F2F1]/70 text-slate-700 font-bold px-4 py-2.5 rounded-2xl text-[13.5px] flex items-center gap-2 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              {statusFilter}
              <svg className={`w-4 h-4 transition-transform duration-200 ${showStatusDropdown ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showStatusDropdown && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowStatusDropdown(false)} />
                <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 p-2 animate-scale-up font-semibold text-[13.5px]">
                  {(["All Booking", "Full Payment", "Instalments", "Loan based"] as const).map((status) => (
                    <button
                      key={status}
                      onClick={() => {
                        setStatusFilter(status);
                        setShowStatusDropdown(false);
                      }}
                      className={`w-full text-left px-3.5 py-2.5 rounded-xl transition-colors cursor-pointer flex items-center justify-between ${statusFilter === status ? "bg-brand-light text-brand font-bold" : "text-slate-600 hover:bg-slate-50"}`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Date-Range filter capsule */}
          <div className="relative">
            <button
              onClick={() => {
                setShowTimeDropdown(!showTimeDropdown);
                setShowStatusDropdown(false);
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

          {/* Filter Reset trigger pill */}
          <button
            onClick={() => {
              setSearchQuery("");
              setStatusFilter("All Booking");
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

      {/* Main Bookings Interactive List Container */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        {/* Desktop and Tablet Responsive Data Table */}
        <div className="hidden sm:block overflow-x-auto min-h-[250px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-[#FCFBFB]">
                <th className="py-4.5 px-6 font-extrabold text-[14px] text-brand uppercase tracking-wider text-center">Client</th>
                <th className="py-4.5 px-6 font-extrabold text-[14px] text-brand uppercase tracking-wider text-center">Type</th>
                <th className="py-4.5 px-6 font-extrabold text-[14px] text-brand uppercase tracking-wider text-center">Unit</th>
                <th className="py-4.5 px-6 font-extrabold text-[14px] text-brand uppercase tracking-wider text-center">Status</th>
                <th className="py-4.5 px-6 font-extrabold text-[14px] text-brand uppercase tracking-wider text-center">Project</th>
                <th className="py-4.5 px-6 font-extrabold text-[14px] text-brand uppercase tracking-wider text-center">Amount</th>
                <th className="py-4.5 px-6 font-extrabold text-[14px] text-brand uppercase tracking-wider text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold text-[14.5px] text-slate-700">
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                  No bookings found matching filters.
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Mobile Viewports Empty State */}
        <div className="block sm:hidden divide-y divide-slate-100 bg-[#FCFBFB] min-h-[200px] flex items-center justify-center text-slate-400 font-medium">
          No bookings found matching filters.
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
