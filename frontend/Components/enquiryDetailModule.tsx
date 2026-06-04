import React from 'react';

export interface EnquiryDetail {
  id: string;
  name: string;
  source: string;
  contactNo: string;
  status: "Pending" | "Converted lead";
  message: string;
  lastContacted: string;
  email?: string;
  budgetRange?: string;
  propertyType?: string;
  preferredLocation?: string;
  notes?: string;
  createdAt?: string;
}

interface EnquiryDetailModuleProps {
  isOpen: boolean;
  onClose: () => void;
  enquiry: EnquiryDetail | null;
}

export default function EnquiryDetailModule({ isOpen, onClose, enquiry }: EnquiryDetailModuleProps) {
  if (!isOpen || !enquiry) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-[32px] w-full max-w-3xl max-h-[90vh] flex flex-col border border-slate-100 shadow-2xl animate-scale-up">
        
        {/* Header (Sticky) */}
        <div className="flex justify-between items-center px-8 py-5 border-b border-slate-100 flex-shrink-0">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">Enquiry Details</h2>
            <p className="text-[13px] font-semibold text-slate-400 mt-0.5">ID: {enquiry.id}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 cursor-pointer transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-6 md:p-8 space-y-6 font-medium text-[14.5px] text-slate-700 overflow-y-auto flex-1">
          
          {/* Section 1: Client Information */}
          <div>
            <h3 className="text-[14px] font-bold text-slate-900 mb-3 uppercase tracking-wider flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-brand"></span>
              Client Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-[#FAF9F9] rounded-2xl p-4 border border-slate-100">
                <span className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Full Name</span>
                <span className="font-bold text-slate-800 text-[15px]">{enquiry.name}</span>
              </div>
              <div className="bg-[#FAF9F9] rounded-2xl p-4 border border-slate-100">
                <span className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Contact Number</span>
                <span className="font-bold text-slate-800 text-[15px]">{enquiry.contactNo}</span>
              </div>
              <div className="bg-[#FAF9F9] rounded-2xl p-4 border border-slate-100">
                <span className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Email Address</span>
                <span className="font-bold text-slate-800 text-[15px] truncate block" title={enquiry.email}>{enquiry.email}</span>
              </div>
            </div>
          </div>

          {/* Section 2: Enquiry Preferences */}
          <div>
            <h3 className="text-[14px] font-bold text-slate-900 mb-3 uppercase tracking-wider flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
              Preferences & Budget
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-[#FAF9F9] rounded-2xl p-4 border border-slate-100">
                <span className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Property Type</span>
                <span className="font-bold text-slate-800 text-[15px]">{enquiry.propertyType}</span>
              </div>
              <div className="bg-[#FAF9F9] rounded-2xl p-4 border border-slate-100">
                <span className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Budget Range</span>
                <span className="font-bold text-slate-800 text-[15px]">{enquiry.budgetRange}</span>
              </div>
              <div className="bg-[#FAF9F9] rounded-2xl p-4 border border-slate-100">
                <span className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Preferred Location</span>
                <span className="font-bold text-slate-800 text-[15px]">{enquiry.preferredLocation}</span>
              </div>
            </div>
          </div>

          {/* Section 3: Status & Tracking */}
          <div>
            <h3 className="text-[14px] font-bold text-slate-900 mb-3 uppercase tracking-wider flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Tracking Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-[#FAF9F9] rounded-2xl p-4 border border-slate-100">
                <span className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Status</span>
                <span className="block mt-0.5">
                  {enquiry.status === "Pending" ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-extrabold bg-[#FDF2F2] text-[#EB3539] border border-red-200/50 shadow-sm">
                      Pending
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-extrabold bg-[#F0FDF4] text-[#15803d] border border-emerald-200/50 shadow-sm">
                      Converted lead
                    </span>
                  )}
                </span>
              </div>
              <div className="bg-[#FAF9F9] rounded-2xl p-4 border border-slate-100">
                <span className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Source</span>
                <span className="font-bold text-slate-800 text-[15px]">{enquiry.source}</span>
              </div>
              <div className="bg-[#FAF9F9] rounded-2xl p-4 border border-slate-100">
                <span className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Created Date</span>
                <span className="font-bold text-slate-800 text-[15px]">{enquiry.createdAt}</span>
              </div>
              <div className="bg-[#FAF9F9] rounded-2xl p-4 border border-slate-100">
                <span className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Last Contacted</span>
                <span className="font-bold text-slate-800 text-[15px]">{enquiry.lastContacted}</span>
              </div>
            </div>
          </div>

          {/* Section 4: Messages & Notes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#FAF9F9] rounded-2xl p-4 border border-slate-100 flex flex-col h-full">
              <span className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">Message / Requirements</span>
              <p className="text-slate-600 leading-relaxed bg-white p-3.5 rounded-xl border border-slate-100 flex-1 whitespace-pre-wrap">
                {enquiry.message || "No specific message provided."}
              </p>
            </div>
            
            {enquiry.notes && (
              <div className="bg-[#FAF9F9] rounded-2xl p-4 border border-slate-100 flex flex-col h-full">
                <span className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">Internal Notes</span>
                <p className="text-slate-600 leading-relaxed bg-white p-3.5 rounded-xl border border-slate-100 flex-1 whitespace-pre-wrap">
                  {enquiry.notes}
                </p>
              </div>
            )}
          </div>

        </div>

        {/* Footer (Sticky) */}
        <div className="flex gap-3.5 px-8 py-5 border-t border-slate-100 bg-[#FCFBFB] justify-end flex-shrink-0 rounded-b-[32px]">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-2xl bg-brand hover:bg-brand-hover text-white font-bold shadow-md shadow-brand/10 cursor-pointer transition-colors w-full sm:w-auto"
          >
            Close Details
          </button>
        </div>

      </div>
    </div>
  );
}
