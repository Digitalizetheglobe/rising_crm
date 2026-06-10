"use client";

import React from "react";
import PageHeader from "../../Components/PageHeader";
import { PAGE_CONTAINER_CLASS } from "../../lib/pageLayout";

export default function ProjectsPage() {
  return (
    <div className={PAGE_CONTAINER_CLASS}>
      <PageHeader
        title="Projects"
        subtitle="Manage real estate projects portfolio"
      />
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-12 text-center text-slate-400 font-medium font-sans">
        Project management board coming soon.
      </div>
    </div>
  );
}
