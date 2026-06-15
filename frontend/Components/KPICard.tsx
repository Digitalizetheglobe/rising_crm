import React from "react";
import { ClipboardList, Sparkles, Bell, MapPin, FileCheck, Hourglass, Home as HomeIcon, TrendingUp, BarChart2, Users, DollarSign, Briefcase, CheckCircle2, Target } from "lucide-react";

const getCardIcon = (title: string) => {
  const t = title.toLowerCase();
  if (t.includes('staff') || t.includes('employee') || t.includes('executive') || t.includes('manager') || t.includes('admin')) return { icon: <Users className="w-5 h-5 text-indigo-500" />, bg: 'bg-indigo-50' };
  if (t.includes('total lead') || t.includes('total hotlead') || t.includes('total enquir') || t.includes('total client') || t.includes('total task') || t.includes('total project') || t.includes('total booking') || t.includes('total staff')) return { icon: <ClipboardList className="w-5 h-5 text-slate-600" />, bg: 'bg-slate-100' };
  if (t.includes('new') || t.includes('hot')) return { icon: <Sparkles className="w-5 h-5 text-purple-500" />, bg: 'bg-purple-50' };
  if (t.includes('follow') || t.includes('pending')) return { icon: <Bell className="w-5 h-5 text-orange-500" />, bg: 'bg-orange-50' };
  if (t.includes('visit')) return { icon: <MapPin className="w-5 h-5 text-emerald-500" />, bg: 'bg-emerald-50' };
  if (t.includes('book') || t.includes('close') || t.includes('convert') || t.includes('complet')) return { icon: <FileCheck className="w-5 h-5 text-emerald-500" />, bg: 'bg-emerald-50' };
  if (t.includes('payment') || t.includes('overdue') || t.includes('full payment') || t.includes('instalment') || t.includes('value')) return { icon: <DollarSign className="w-5 h-5 text-amber-500" />, bg: 'bg-amber-50' };
  if (t.includes('unit') || t.includes('available') || t.includes('sold')) return { icon: <HomeIcon className="w-5 h-5 text-blue-500" />, bg: 'bg-blue-50' };
  if (t.includes('conversion') || t.includes('active') || t.includes('rate')) return { icon: <TrendingUp className="w-5 h-5 text-indigo-500" />, bg: 'bg-indigo-50' };
  if (t.includes('yesterday')) return { icon: <Target className="w-5 h-5 text-violet-500" />, bg: 'bg-violet-50' };
  return { icon: <BarChart2 className="w-5 h-5 text-slate-500" />, bg: 'bg-slate-100' };
};

export const KPICard = ({ title, value, subtext = "", trend = "", isUp = true, accentColor = "#3b82f6" }: any) => {
  const { icon, bg } = getCardIcon(title);
  
  const hasTrend = trend && trend !== "" && trend !== "—";
  
  let trendColor = "text-emerald-600 bg-emerald-50";
  let trendIcon = "▲";

  if (hasTrend) {
    if (!isUp) {
      trendColor = "text-rose-600 bg-rose-50";
      trendIcon = "▼";
    } else if (trend.includes("progress") || trend.includes("open")) {
      trendColor = "text-slate-500 bg-slate-50";
      trendIcon = "—";
    }
  }

  const displayTrend = hasTrend ? trend.replace(/^[+-]/, '').trim() : "";

  return (
    <div className="bg-white rounded-[26px] p-5 shadow-sm hover:shadow-xl border border-slate-100 hover:border-slate-200 transition-all duration-300 transform hover:-translate-y-1.5 group cursor-default relative overflow-hidden">
      {/* Accent Bar */}
      <div className="absolute top-0 left-0 right-0 h-[6px] rounded-t-full" style={{ backgroundColor: accentColor }} />
      
      {/* Icon + Trend Row */}
      <div className="flex justify-between items-center mt-1 mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bg} shadow-sm`}>
          {icon}
        </div>
        {displayTrend ? (
          <div className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold ${trendColor}`}>
            <span>{trendIcon}</span>
            <span>{displayTrend}</span>
          </div>
        ) : null}
      </div>
      
      {/* Value */}
      <h3 className="text-[32px] font-extrabold text-[#1E293B] leading-none group-hover:scale-[1.02] transition-transform origin-left duration-300">{value}</h3>
      
      {/* Title */}
      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-2">{title}</p>
      
      {/* Subtext */}
      {subtext && (
        <p className="text-[12px] text-slate-400 mt-1">{subtext}</p>
      )}
    </div>
  );
};

export default KPICard;
