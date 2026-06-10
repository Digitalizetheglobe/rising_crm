"use client";

import PageHeader from "../../Components/PageHeader";
import { PAGE_CONTAINER_CLASS } from "../../lib/pageLayout";

export default function PaymentsPage() {
  return (
    <div className={PAGE_CONTAINER_CLASS}>
      <PageHeader title="Payments" subtitle="Manage payment records, transactions, and invoices" />
      <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center">
        <p className="text-slate-500 text-[15px]">
          Payment management module — view and manage payment records, transactions, invoices, and payment statuses.
        </p>
      </div>
    </div>
  );
}
