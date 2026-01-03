"use client";

import React from "react";
import { useAppStore } from "@/lib/store";
import { detectConflicts } from "@/lib/conflictUtils";
import { AlertTriangle, CheckCircle2, Wrench, ArrowRight, ShieldAlert, Calendar } from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/dateUtils";

export default function AlertsPage() {
  const { developers, allocations, projects, leaves } = useAppStore();
  
  const conflicts = detectConflicts(developers, allocations, leaves, projects);

  const getProjectName = (id: string) => projects.find(p => p.id === id)?.name || "Unknown Project";

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tight flex items-center gap-3">
            <AlertTriangle className="w-10 h-10 text-warning" /> Conflict Center
          </h1>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-40 mt-2">
            {conflicts.length} scheduling issues require resolution
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-6 bg-base-100 px-6 py-3 rounded-2xl border border-base-200 shadow-sm">
           <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-error shadow-[0_0_8px_rgba(239,68,68,0.4)]"></div>
              <span className="text-[10px] font-black uppercase tracking-widest opacity-60">High Priority</span>
           </div>
           <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-warning"></div>
              <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Medium Priority</span>
           </div>
        </div>
      </div>

      {conflicts.length > 0 ? (
        <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {conflicts.map((conflict) => {
             const dev = developers.find(d => d.id === conflict.developerId);
             const isHigh = conflict.severity === "HIGH";

             return (
              <div key={conflict.id} className="group bg-base-100 hover:bg-base-50 border border-base-200 rounded-2xl p-3 flex flex-col md:flex-row items-start md:items-center gap-4 shadow-sm hover:shadow-md transition-all">
                {/* Severity Strip & Identity */}
                <div className="flex items-center gap-4 min-w-[280px]">
                  <div className={`w-1.5 h-12 rounded-full shrink-0 ${isHigh ? 'bg-error shadow-[0_0_10px_rgba(239,68,68,0.4)]' : 'bg-warning'}`}></div>
                  <div className="avatar">
                    <div className="w-10 h-10 mask mask-squircle shadow-sm">
                      <img src={dev?.avatarUrl} alt={conflict.developerName} />
                    </div>
                  </div>
                  <div>
                    <div className="font-black text-sm uppercase tracking-tight leading-none">{conflict.developerName}</div>
                    <div className={`text-[9px] font-black uppercase tracking-widest mt-1 ${isHigh ? 'text-error' : 'text-warning-content'}`}>
                       {conflict.type === "LEAVE_CONFLICT" ? "Vacation Clash" : "Capacity Overload"}
                    </div>
                  </div>
                </div>

                {/* Context & details */}
                <div className="flex-1 md:border-l md:border-base-200 md:pl-4 min-w-0 w-full">
                  <div className="flex items-center gap-2 mb-1 opacity-50">
                    <Calendar className="w-3 h-3" />
                    <span className="text-[10px] font-bold uppercase tracking-widest font-mono">{conflict.periodLabel}</span>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                     <span className="text-xs font-medium truncate opacity-80 max-w-[300px] hidden lg:block">{conflict.details}</span>
                     <div className="flex items-center gap-1 flex-wrap">
                        {conflict.allocations.map((a: any) => (
                           <span key={a.id} className="badge badge-sm bg-base-200 border-base-300 text-[10px] font-bold px-2 h-6">
                              {getProjectName(a.projectId)} {a.load}%
                           </span>
                        ))}
                     </div>
                  </div>
                </div>

                {/* Action */}
                <div className="flex-none self-end md:self-center w-full md:w-auto">
                   <Link 
                      href={`/alerts/resolve?devId=${conflict.developerId}&start=${formatDate(conflict.startDate)}&end=${formatDate(conflict.endDate)}&type=${conflict.type}&period=${encodeURIComponent(conflict.periodLabel)}`}
                      className={`btn btn-sm w-full md:w-auto rounded-lg font-black uppercase tracking-widest px-6 shadow-sm border-none ${isHigh ? 'btn-error text-white' : 'btn-warning text-warning-content'}`}
                    >
                      Resolve
                    </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-32 bg-base-100 rounded-[3rem] border border-base-200 shadow-xl text-center">
          <div className="w-24 h-24 bg-success/10 rounded-full flex items-center justify-center mb-6 animate-bounce">
             <CheckCircle2 className="w-12 h-12 text-success" />
          </div>
          <h2 className="text-3xl font-black uppercase tracking-tight text-success">All Systems Nominal</h2>
          <p className="text-sm font-bold uppercase tracking-widest opacity-40 mt-2 max-w-md">
             Bob has detected zero scheduling conflicts across your portfolio.
          </p>
        </div>
      )}
    </div>
  );
}
