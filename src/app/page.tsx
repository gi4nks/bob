"use client";

import React, { useState } from "react";
import { useAppStore } from "@/lib/store";
import { ChevronLeft, ChevronRight, Users, Briefcase, Info } from "lucide-react";
import { isOverlapping, getWeeksForMonth } from "@/lib/dateUtils";

export default function Home() {
  const { developers, allocations, projects, leaves } = useAppStore();
  const [currentDate, setCurrentDate] = useState(new Date(2026, 0, 1)); // Start at Jan 2026
  const [showDrafts, setShowDrafts] = useState(true);

  const weeks = getWeeksForMonth(currentDate);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const monthLabel = currentDate.toLocaleString('default', { month: 'long' });
  const yearLabel = currentDate.getFullYear().toString();

  // Helper to get project details
  const getProject = (id: string) => projects.find((p) => p.id === id);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tight flex items-center gap-3 uppercase">
            Timeline Dashboard
          </h1>
          <p className="text-base-content/60 font-medium mt-1 uppercase text-[10px] tracking-widest opacity-40">Weekly engineering allocation & capacity pulse.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="form-control bg-base-100 p-1 px-4 rounded-xl border border-base-300 shadow-sm h-10 flex items-center justify-center">
            <label className="label cursor-pointer gap-3 p-0">
              <span className="label-text font-black text-[9px] uppercase opacity-60 tracking-widest">What-If Mode</span>
              <input 
                type="checkbox" 
                className="toggle toggle-primary toggle-xs" 
                checked={showDrafts} 
                onChange={(e) => setShowDrafts(e.target.checked)} 
              />
            </label>
          </div>

          <div className="join bg-base-100 shadow-sm border border-base-300 h-10">
            <button onClick={handlePrevMonth} className="btn btn-sm join-item btn-ghost h-full">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="px-6 flex items-center text-xs font-black uppercase tracking-widest border-x border-base-300 min-w-[160px] justify-center">
              {monthLabel} {yearLabel}
            </div>
            <button onClick={handleNextMonth} className="btn btn-sm join-item btn-ghost h-full">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="bg-base-100 rounded-3xl shadow-2xl border border-base-300 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table w-full border-collapse">
            <thead>
              <tr className="bg-base-200/50 border-b border-base-300">
                <th className="w-72 sticky left-0 bg-base-200/80 backdrop-blur-md z-20 p-6">
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] opacity-40">
                    <Users className="w-3 h-3" /> Engineering Squad
                  </div>
                </th>
                {weeks.map((week) => (
                  <th key={week.id} className="text-center p-0 border-l border-base-300/50 min-w-[140px]">
                    <div className="py-4 px-2">
                      <div className="text-xs font-black uppercase tracking-tighter text-primary">{week.label}</div>
                      <div className="text-[9px] font-bold opacity-30 tracking-widest">
                        {currentDate.toLocaleString('default', { month: 'short' })} {week.displayStart}-{week.displayEnd}
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {developers.map((dev) => {
                const devAllocations = allocations.filter((a) => a.developerId === dev.id);
                const devLeaves = leaves.filter((l) => l.developerId === dev.id);

                const monthStart = weeks[0].start;
                const monthEnd = weeks[weeks.length - 1].end;

                const visibleAllocations = devAllocations.filter(a => isOverlapping(a.startDate, a.endDate, monthStart, monthEnd));
                const uniqueProjectIds = Array.from(new Set(visibleAllocations.map(a => a.projectId))).sort((idA, idB) => {
                  const nameA = getProject(idA)?.name || "";
                  const nameB = getProject(idB)?.name || "";
                  return nameA.localeCompare(nameB);
                });

                return (
                  <tr key={dev.id} className="group hover:bg-base-200/20 transition-colors border-b border-base-200 last:border-0">
                    <td className="sticky left-0 bg-base-100 group-hover:bg-base-200/50 backdrop-blur-md z-10 p-0">
                      <div className="p-6 flex items-center gap-4">
                        <div className={`avatar ${dev.isPlaceholder ? 'placeholder' : ''}`}>
                          <div className={`mask mask-squircle w-12 h-12 shadow-md ${dev.isPlaceholder ? 'bg-neutral text-neutral-content' : ''}`}>
                            <img src={dev.avatarUrl} alt={dev.name} />
                          </div>
                        </div>
                        <div className="overflow-hidden">
                          <div className="font-black text-sm uppercase tracking-tight truncate flex items-center gap-2">
                            {dev.name}
                            {dev.isPlaceholder && <span className="badge badge-xs badge-neutral font-black uppercase text-[7px]">Plan</span>}
                          </div>
                          <div className="text-[10px] font-bold opacity-40 uppercase truncate">{dev.role}</div>
                        </div>
                      </div>
                    </td>

                    {weeks.map((week) => {
                      const weekAllocations = devAllocations.filter((a) => {
                        const isVisible = showDrafts || a.status === "Confirmed";
                        return isVisible && isOverlapping(a.startDate, a.endDate, week.start, week.end);
                      });
                      const weekLeaves = devLeaves.filter((l) => isOverlapping(l.startDate, l.endDate, week.start, week.end));

                      const totalLoad = weekAllocations.reduce((sum, a) => sum + a.load, 0);
                      const devCapacityPercent = dev.capacity * 100;
                      const hasLeaveConflict = weekAllocations.some(a => 
                        weekLeaves.some(l => isOverlapping(a.startDate, a.endDate, l.startDate, l.endDate))
                      );
                      const isOverload = totalLoad > devCapacityPercent || hasLeaveConflict;

                      return (
                        <td key={week.id} className="border-l border-base-300/50 align-top h-28 p-1">
                          <div className="flex flex-col gap-1 h-full pt-0.5">
                            {/* Slot 1: Status Badge */}
                            <div className="h-3.5 w-full px-1">
                              {isOverload ? (
                                <div className="badge badge-error w-full font-black animate-pulse border-none text-[7px] h-3.5 leading-none rounded-md shadow-sm">
                                  {hasLeaveConflict ? "CONFLICT" : `OVERLOAD ${totalLoad}%`}
                                </div>
                              ) : null}
                            </div>

                            {/* Slot 2: Leaves */}
                            <div className="h-4.5 w-full px-1">
                              {weekLeaves.length > 0 ? (
                                <div className="bg-amber-100 text-amber-800 border-amber-200 p-0.5 rounded-md text-[8px] font-black text-center border border-dashed h-4.5 flex items-center justify-center shadow-sm">
                                  🌴 {weekLeaves[0].type.toUpperCase()}
                                </div>
                              ) : null}
                            </div>

                            {/* Slot 3: Project Layers */}
                            <div className="space-y-1 px-1">
                              {uniqueProjectIds.map(projectId => {
                                const alloc = weekAllocations.find(a => a.projectId === projectId);
                                const project = getProject(projectId);
                                
                                return (
                                  <div key={projectId} className="h-7 w-full">
                                    {alloc ? (
                                      <div className="tooltip tooltip-bottom w-full h-full" data-tip={`${project?.name}${alloc.status === 'Draft' ? ' (DRAFT)' : ''}: ${alloc.load}%`}>
                                        <div className={`${project?.color} text-white p-1 rounded-lg text-[9px] font-black truncate shadow-md cursor-help hover:scale-[1.02] transition-all h-full flex items-center justify-center border border-white/10 ${alloc.status === 'Draft' ? 'border-dashed opacity-70 italic' : ''}`}>
                                          {project?.name} ({alloc.load}%)
                                        </div>
                                      </div>
                                    ) : null}
                                  </div>
                                );
                              })}
                            </div>
                            
                            {weekAllocations.length === 0 && weekLeaves.length === 0 && (
                              <div className="flex-1 flex items-center justify-center min-h-[20px]">
                                <span className="text-[8px] font-black opacity-10 uppercase tracking-[0.2em] italic">Standby</span>
                              </div>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer Legend */}
        <div className="bg-base-200/30 p-4 border-t border-base-300 flex items-center justify-between gap-8">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-error shadow-sm"></div>
              <span className="text-[10px] font-bold uppercase opacity-50">Overload / Conflict</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-amber-100 border border-amber-200"></div>
              <span className="text-[10px] font-bold uppercase opacity-50">Leave Period</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-black opacity-30 italic uppercase tracking-widest">
            <Info className="w-3 h-3" /> Click any project bar to view detailed roadmap
          </div>
        </div>
      </div>
    </div>
  );
}
