import React, { useState } from 'react';
import { downloadCrmTemplateExcel } from '../lib/services/importExportService';

export default function LeadTemplateDownloadButton() {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    try {
      setLoading(true);
      await downloadCrmTemplateExcel();
    } catch (error) {
      console.error("Failed to download template:", error);
      alert("Failed to download template. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        background: loading ? '#e0e0e0' : '#107c41', // Microsoft Excel Green
        color: loading ? '#888' : '#ffffff',
        border: '1px solid #0e6c38',
        padding: '8px 16px',
        borderRadius: '6px',
        fontFamily: 'Inter, "Segoe UI", sans-serif',
        fontSize: '13px',
        fontWeight: 600,
        cursor: loading ? 'not-allowed' : 'pointer',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        transition: 'all 0.2s ease',
      }}
      onMouseEnter={e => !loading && (e.currentTarget.style.background = '#0e6c38')}
      onMouseLeave={e => !loading && (e.currentTarget.style.background = '#107c41')}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
      {loading ? "Generating Template..." : "Download Excel Template"}
    </button>
  );
}
