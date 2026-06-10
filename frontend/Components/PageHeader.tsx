import React from "react";
import {
  PAGE_ACTIONS_CLASS,
  PAGE_HEADER_ROW_CLASS,
  PAGE_SUBTITLE_CLASS,
  PAGE_TITLE_CLASS,
} from "../lib/pageLayout";

interface PageHeaderProps {
  title: React.ReactNode;
  subtitle?: string;
  actions?: React.ReactNode;
}

export default function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className={PAGE_HEADER_ROW_CLASS}>
      <div className="min-w-0">
        <h1 className={PAGE_TITLE_CLASS}>{title}</h1>
        {subtitle ? <p className={PAGE_SUBTITLE_CLASS}>{subtitle}</p> : null}
      </div>
      {actions ? <div className={PAGE_ACTIONS_CLASS}>{actions}</div> : null}
    </div>
  );
}
