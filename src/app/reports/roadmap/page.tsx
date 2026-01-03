"use client";

import React, { useState, useMemo, Suspense } from "react";
import { useAppStore } from "@/lib/store";
import { isOverlapping, formatDate } from "@/lib/dateUtils";
import { 
  Briefcase, 
  LayoutGrid, 
  ChevronLeft, 
  ChevronRight, 
  Calendar,
  Users,
  Flag,
  Search,
  Filter,
  ArrowRight,
  Info
} from "lucide-react";
import Link from "next/link";

function RoadmapContent() {
  const { projects, allocations, developers } = useAppStore();
  const [startMonth, setStartMonth] = useState(new Date(2026, 0, 1)); // Start at Jan 2026
  const [monthsToShow] = useState(8);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // 1. Generate Timeline Headers
  const timelineMonths = useMemo(() => {
    const months = [];
    for (let i = 0; i < monthsToShow; i++) {
      const d = new Date(startMonth.getFullYear(), startMonth.getMonth() + i, 1);
      months.push({
        label: d.toLocaleString('default', { month: 'long' }),
        subLabel: d.getFullYear().toString(),
        start: new Date(d.getFullYear(), d.getMonth(), 1),
        end: new Date(d.getFullYear(), d.getMonth() + 1, 0),
      });
    }
    return months;
  }, [startMonth, monthsToShow]);

  const viewRangeStart = timelineMonths[0].start;
  const viewRangeEnd = timelineMonths[timelineMonths.length - 1].end;

  // 2. Filter Projects
  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            p.client.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "All" || p.status === statusFilter;
      
      // Only show projects that overlap with the visible timeline
      const hasTimeline = p.startDate && p.endDate;
      const overlapsTimeline = hasTimeline ? isOverlapping(p.startDate!, p.endDate!, viewRangeStart, viewRangeEnd) : true;

      return matchesSearch && matchesStatus && overlapsTimeline;
    }).sort((a, b) => {
        if (!a.startDate) return 1;
        if (!b.startDate) return -1;
        return a.startDate.getTime() - b.startDate.getTime();
    });
  }, [projects, searchQuery, statusFilter, viewRangeStart, viewRangeEnd]);

  // 3. Helper to calculate bar positions
  const getPositionStyles = (start: Date, end: Date) => {
    const totalDays = (viewRangeEnd.getTime() - viewRangeStart.getTime()) / (1000 * 60 * 60 * 24);
    
    const startDiff = (start.getTime() - viewRangeStart.getTime()) / (1000 * 60 * 60 * 24);
    const duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24) + 1;

    const left = Math.max(0, (startDiff / totalDays) * 100);
    const width = Math.min(100 - left, (duration / totalDays) * 100);

    return { left: `${left}%`, width: `${width}%` };
  };

  const handlePrev = () => setStartMonth(new Date(startMonth.getFullYear(), startMonth.getMonth() - 2, 1));
  const handleNext = () => setStartMonth(new Date(startMonth.getFullYear(), startMonth.getMonth() + 2, 1));

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tight flex items-center gap-3">
            <LayoutGrid className="w-10 h-10 text-primary" /> Portfolio Roadmap
          </h1>
          <p className="text-base-content/60 font-medium mt-1">High-level project pipeline and phase orchestration.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Navigation */}
          <div className="join bg-base-100 shadow-sm border border-base-300">
            <button onClick={handlePrev} className="btn btn-sm join-item btn-ghost">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="px-4 flex items-center text-xs font-black uppercase tracking-widest border-x border-base-300">
              Timeline Shift
            </div>
            <button onClick={handleNext} className="btn btn-sm join-item btn-ghost">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="divider divider-horizontal mx-1"></div>

          {/* Search & Filter */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 opacity-30" />
              <input 
                type="text" 
                placeholder="Search roadmap..." 
                className="input input-sm input-bordered pl-10 w-48 h-10 font-bold text-xs"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <select 
              className="select select-sm select-bordered h-10 font-bold text-xs"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="Discovery">Discovery</option>
              <option value="On Hold">On Hold</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Roadmap Container */}
      <div className="bg-base-100 rounded-3xl shadow-2xl border border-base-300 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table table-fixed w-full border-collapse">
            <thead>
              <tr className="bg-base-200/50 border-b border-base-300">
                <th className="w-72 sticky left-0 bg-base-200/80 backdrop-blur-md z-20 p-6">
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] opacity-40">
                    <Briefcase className="w-3 h-3" /> Project Identity
                  </div>
                </th>
                {timelineMonths.map((m, i) => (
                  <th key={i} className="text-center p-0 border-l border-base-300/50 min-w-[140px]">
                    <div className="py-4 px-2">
                      <div className="text-xs font-black uppercase tracking-tighter text-primary">{m.label}</div>
                      <div className="text-[9px] font-bold opacity-30 tracking-widest">{m.subLabel}</div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredProjects.map((project) => {
                const projectAllocations = allocations.filter(a => a.projectId === project.id);
                const activeDevs = Array.from(new Set(projectAllocations.map(a => a.developerId))).length;
                const totalFTE = (projectAllocations.reduce((sum, a) => sum + a.load, 0) / 100).toFixed(1);

                return (
                  <tr key={project.id} className="group hover:bg-base-200/20 transition-colors border-b border-base-200 last:border-0">
                    {/* Project Info Column */}
                    <td className="sticky left-0 bg-base-100 group-hover:bg-base-200/50 backdrop-blur-md z-10 p-0">
                      <div className="p-6 space-y-2">
                        <Link href={`/projects/${project.id}`} className="group/link flex items-center gap-3">
                          <div className={`w-3 h-10 rounded-full ${project.color} shadow-lg group-hover/link:scale-y-110 transition-transform`}></div>
                          <div className="overflow-hidden">
                            <div className="font-black text-sm uppercase tracking-tight truncate group-hover/link:text-primary transition-colors">{project.name}</div>
                            <div className="text-[10px] font-bold opacity-40 truncate">{project.client}</div>
                          </div>
                        </Link>
                        <div className="flex items-center gap-3 pt-1">
                          <div className="flex items-center gap-1.5 px-2 py-1 bg-base-200 rounded-lg" title="Active Squad Size">
                            <Users className="w-3 h-3 opacity-40" />
                            <span className="text-[10px] font-black">{activeDevs}</span>
                          </div>
                          <div className="flex items-center gap-1.5 px-2 py-1 bg-primary/10 text-primary rounded-lg" title="Total Effort">
                            <span className="text-[10px] font-black">{totalFTE} FTE</span>
                          </div>
                          <div className={`badge badge-ghost text-[8px] font-black uppercase tracking-tighter h-5`}>{project.status}</div>
                        </div>
                      </div>
                    </td>

                    {/* Gantt Timeline Area */}
                    <td colSpan={monthsToShow} className="p-0 relative h-full align-middle overflow-hidden">
                      {/* Vertical Grid Lines */}
                      <div className="absolute inset-0 flex pointer-events-none">
                        {timelineMonths.map((_, i) => (
                          <div key={i} className="flex-1 border-l border-base-200 last:border-r" />
                        ))}
                      </div>

                      {/* The Project Bar */}
                      <div className="relative h-20 w-full flex items-center px-2">
                        {project.startDate && project.endDate && (
                          <div className="relative w-full h-12 flex items-center">
                            {/* Main Project Bar Container */}
                            <div 
                              className="absolute h-10 rounded-2xl bg-base-200 border-2 border-base-300 overflow-hidden shadow-md flex items-center"
                              style={getPositionStyles(project.startDate, project.endDate)}
                            >
                              {/* Background color based on project theme */}
                              <div className={`absolute inset-0 opacity-20 ${project.color}`}></div>
                              
                              {/* Render Phases as Segments */}
                              {project.phases?.map(phase => {
                                const styles = getPositionStyles(phase.startDate, phase.endDate);
                                return (
                                  <div 
                                    key={phase.id}
                                    className={`absolute h-full flex items-center justify-center border-x border-base-100/20 ${phase.color} shadow-sm transition-all hover:brightness-110 cursor-help group/phase`}
                                    style={styles}
                                    title={`${phase.name}: ${formatDate(phase.startDate)} to ${formatDate(phase.endDate)}`}
                                  >
                                    <span className="px-2 text-[9px] font-black uppercase tracking-tight truncate drop-shadow-md">
                                      {phase.name}
                                    </span>
                                  </div>
                                );
                              })}

                              {/* If no phases, just show a hint */}
                              {(!project.phases || project.phases.length === 0) && (
                                <div className="flex-1 h-full flex items-center px-4 italic text-[10px] opacity-20 font-bold">
                                  No defined phases
                                </div>
                              )}
                            </div>

                            {/* Start/End Pins */}
                            <div 
                              className="absolute -top-1 w-1 h-12 bg-base-300 opacity-0 group-hover:opacity-100 transition-opacity"
                              style={{ left: getPositionStyles(project.startDate, project.endDate).left }}
                            />
                          </div>
                        )}
                        {!project.startDate && (
                          <div className="flex items-center gap-2 px-8 italic text-xs opacity-20 font-bold">
                            <Flag className="w-3 h-3" /> TBD - Needs Scheduling
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {filteredProjects.length === 0 && (
          <div className="p-24 text-center">
            <div className="opacity-10 mb-4">
              <Briefcase className="w-24 h-24 mx-auto" />
            </div>
            <h3 className="text-xl font-bold opacity-40">No projects found in this timeframe</h3>
            <p className="text-sm opacity-30 mt-1 italic">Try shifting the timeline or adjusting your search filters.</p>
          </div>
        )}

        {/* Footer Legend */}
        <div className="bg-base-200/30 p-4 border-t border-base-300 flex items-center justify-between gap-8">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-primary shadow-sm"></div>
              <span className="text-[10px] font-bold uppercase opacity-50">Timeline Duration</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-blue-400 shadow-sm"></div>
              <span className="text-[10px] font-bold uppercase opacity-50">Phase Segment</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-black opacity-30 italic uppercase tracking-widest">
            <Info className="w-3 h-3" /> Roadmap derived from active portfolio metadata
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RoadmapPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen w-full items-center justify-center">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    }>
      <RoadmapContent />
    </Suspense>
  );
}
