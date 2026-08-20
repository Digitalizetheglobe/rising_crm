import React from "react";
import {
  Users,
  Sparkles,
  Bell,
  MapPin,
  FileCheck,
  TrendingUp,
  BarChart2,
  DollarSign,
  Home as HomeIcon,
  Activity,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

interface KPICardProps {
  title: string;
  value: string | number;
  subtext?: string;
  trend?: string;
  isUp?: boolean;
  accentColor?: string;
}

const getCardIcon = (title: string) => {
  const t = title.toLowerCase();
  if (t.includes("staff") || t.includes("employee") || t.includes("executive"))
    return <Users className="w-5 h-5" />;
  if (t.includes("campaign")) return <Activity className="w-5 h-5" />;
  if (t.includes("total lead") || t.includes("total hotlead")) return <Layers className="w-5 h-5" />;
  if (t.includes("new") || t.includes("hot")) return <Sparkles className="w-5 h-5" />;
  if (t.includes("follow") || t.includes("pending")) return <Bell className="w-5 h-5" />;
  if (t.includes("visit")) return <MapPin className="w-5 h-5" />;
  if (t.includes("book") || t.includes("close")) return <FileCheck className="w-5 h-5" />;
  if (t.includes("payment") || t.includes("revenue")) return <DollarSign className="w-5 h-5" />;
  if (t.includes("unit")) return <HomeIcon className="w-5 h-5" />;
  if (t.includes("dump") || t.includes("dead")) return <BarChart2 className="w-5 h-5" />;
  return <TrendingUp className="w-5 h-5" />;
};

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  subtext = "",
  trend = "",
  isUp = true,
  accentColor = "#38B6FF",
}) => {
  const icon = getCardIcon(title);
  const hasTrend = Boolean(trend && trend !== "" && trend !== "—");

  // Determine theme style based on accent color
  let iconGradient = "from-[#38B6FF] to-[#0284C7] shadow-[#38B6FF]/30";
  let bgGlow = "from-sky-500/10 via-transparent to-transparent";
  let hoverBorder = "hover:border-[#38B6FF]/40";

  if (accentColor === "#10b981") {
    iconGradient = "from-emerald-500 to-teal-600 shadow-emerald-500/30";
    bgGlow = "from-emerald-500/10 via-transparent to-transparent";
    hoverBorder = "hover:border-emerald-400/40";
  } else if (accentColor === "#ef4444") {
    iconGradient = "from-rose-500 to-red-600 shadow-rose-500/30";
    bgGlow = "from-rose-500/10 via-transparent to-transparent";
    hoverBorder = "hover:border-rose-400/40";
  } else if (accentColor === "#8b5cf6") {
    iconGradient = "from-purple-500 to-indigo-600 shadow-purple-500/30";
    bgGlow = "from-purple-500/10 via-transparent to-transparent";
    hoverBorder = "hover:border-purple-400/40";
  } else if (accentColor === "#2563eb") {
    iconGradient = "from-blue-500 to-sky-600 shadow-blue-500/30";
    bgGlow = "from-blue-500/10 via-transparent to-transparent";
    hoverBorder = "hover:border-blue-400/40";
  }

  return (
    <div
      className={`group relative bg-white rounded-[26px] p-6 border border-slate-200/80 ${hoverBorder} shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 transform hover:-translate-y-1 overflow-hidden cursor-default`}
    >
      {/* Subtle Background Glow Accent */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${bgGlow} opacity-50 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`}
      />

      {/* Top Header: Floating Gradient Icon + Trend Pill */}
      <div className="flex items-center justify-between mb-5 relative z-10">
        <div
          className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${iconGradient} text-white shadow-md flex items-center justify-center transition-transform duration-300 group-hover:scale-110`}
        >
          {icon}
        </div>

        {hasTrend && (
          <div
            className={`flex items-center gap-1 px-3 py-1 rounded-full text-[11.5px] font-bold border transition-colors ${
              isUp
                ? "bg-emerald-50 text-emerald-700 border-emerald-200/80"
                : "bg-rose-50 text-rose-700 border-rose-200/80"
            }`}
          >
            {isUp ? (
              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <ArrowDownRight className="w-3.5 h-3.5 text-rose-600" />
            )}
            <span>{trend.replace(/^[+-]/, "").trim()}</span>
          </div>
        )}
      </div>

      {/* Main Metric Value & Title */}
      <div className="relative z-10">
        <h3 className="text-3xl font-black text-slate-900 tracking-tight leading-none group-hover:text-slate-950 transition-colors">
          {value}
        </h3>
        <p className="text-[12px] font-bold text-slate-500 tracking-wider uppercase mt-2.5">
          {title}
        </p>
      </div>

      {/* Footer Subtext */}
      {subtext && (
        <div className="mt-4 pt-3 border-t border-slate-100/90 flex items-center gap-2 relative z-10">
          <span
            className="w-1.5 h-1.5 rounded-full transition-all duration-300 group-hover:scale-125"
            style={{ backgroundColor: accentColor }}
          />
          <p className="text-xs text-slate-500 font-medium truncate">{subtext}</p>
        </div>
      )}
    </div>
  );
};

export default KPICard;
