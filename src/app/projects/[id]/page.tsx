"use client";

import React, { use, useState, useEffect, useMemo } from "react";
import { useAppStore } from "@/lib/store";
import Link from "next/link";
import { 
  Calendar, 
  Users, 
  BarChart3, 
  CalendarDays, 
  LayoutTemplate, 
  Plus, 
  Trash2, 
  Pencil, 
  Search, 
  MoreVertical, 
  ArrowRight, 
  ShieldAlert, 
  X, 
  CheckCircle2, 
  Circle, 
  Target, 
  Trophy, 
  Hash, 
  Box
} from "lucide-react";
import { notFound } from "next/navigation";
import { isOverlapping, formatDate } from "@/lib/dateUtils";
import NewAllocationModal from "@/components/NewAllocationModal";
import NewPhaseModal from "@/components/NewPhaseModal";
import NewRequirementModal from "@/components/NewRequirementModal";
import NewOutcomeModal from "@/components/NewOutcomeModal";
import { Allocation, Phase, RequiredSkill, Outcome } from "@/types";

export default function ProjectDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { 
    projects, allocations, developers, leaves, 
    deleteAllocation, addAllocation, deletePhase, deleteRequirement,
    addOutcome, updateOutcome, deleteOutcome 
  } = useAppStore();
  
  // UI State
  const [activeTab, setActiveTab] = useState<"schedule" | "deliverables">("schedule");
  
  // Modals State
  const [isAllocationModalOpen, setIsAllocationModalOpen] = useState(false);
  const [editingAllocation, setEditingAllocation] = useState<Allocation | null>(null);
  const [isPhaseModalOpen, setIsPhaseModalOpen] = useState(false);
  const [editingPhase, setEditingPhase] = useState<Phase | null>(null);
  const [isOutcomeModalOpen, setIsOutcomeModalOpen] = useState(false);
  const [editingOutcome, setEditingOutcome] = useState<Outcome | null>(null);
  const [targetPhaseId, setTargetPhaseId] = useState<string | null>(null);
  const [isReqModalOpen, setIsReqModalOpen] = useState(false);

  const [squadSearch, setSquadSearch] = useState("");
  const [managingDevId, setManagingDevId] = useState<string | null>(null);
  const [selectedPhaseId, setSelectedPhaseId] = useState<string | null>(null);

  
  const project = projects.find((p) => p.id === id);

  if (!project) {
    notFound();
  }

  // Auto-select first phase
  useEffect(() => {
    if (!selectedPhaseId && project.phases && project.phases.length > 0) {
      const sorted = [...project.phases].sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
      setSelectedPhaseId(sorted[0].id);
    }
  }, [project.phases, selectedPhaseId]);

  const selectedPhase = project.phases?.find(p => p.id === selectedPhaseId);

  // Initial Filtering State
  const [filterStart, setFilterStart] = useState("2026-01-01");
  const [filterEnd, setFilterEnd] = useState("2026-01-31");
  const [scheduleView, setScheduleView] = useState<"weeks" | "months">("weeks");

  const allProjectAllocations = allocations.filter((a) => a.projectId === project.id);
  
  useEffect(() => {
    if (allProjectAllocations.length > 0) {
      const startDates = allProjectAllocations.map(a => a.startDate.getTime());
      const endDates = allProjectAllocations.map(a => a.endDate.getTime());
      const earliest = new Date(Math.min(...startDates));
      const latest = new Date(Math.max(...endDates));
      setFilterStart(formatDate(earliest));
      setFilterEnd(formatDate(latest));
      if ((Math.max(...endDates) - Math.min(...startDates)) / (1000 * 60 * 60 * 24) > 90) {
        setScheduleView("months");
      }
    }
  }, [id]);

  const filteredAllocations = allProjectAllocations.filter(a => isOverlapping(a.startDate, a.endDate, filterStart, filterEnd));
  const activeDeveloperIds = Array.from(new Set(filteredAllocations.map((a) => a.developerId)));
  const team = developers.filter((d) => activeDeveloperIds.includes(d.id));
  const totalFTE = (filteredAllocations.reduce((sum, a) => sum + a.load, 0) / 100).toFixed(1);

  const ganttColumns = useMemo(() => {
    const start = new Date(filterStart);
    const end = new Date(filterEnd);
    const cols = [];
    let current = new Date(start);
    let idCounter = 1;

    if (scheduleView === "weeks") {
      while (current <= end) {
        const weekStart = new Date(current);
        const weekEnd = new Date(current);
        weekEnd.setDate(weekEnd.getDate() + 6);
        cols.push({
          id: idCounter++, label: `W${idCounter - 1}`,
          start: weekStart, end: weekEnd, displayStart: weekStart.getDate(), displayEnd: weekEnd.getDate(),
          displayMonth: weekStart.toLocaleString('default', { month: 'short' }), type: 'week'
        });
        current.setDate(current.getDate() + 7);
      }
    } else {
      current.setDate(1);
      while (current <= end || (current.getMonth() <= end.getMonth() && current.getFullYear() === end.getFullYear())) {
        if (current > end && current.getDate() === 1) break;
        const monthEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0);
        cols.push({
          id: idCounter++, label: current.toLocaleString('default', { month: 'short' }),
          start: new Date(current), end: monthEnd, displayStart: 1, displayEnd: monthEnd.getDate(),
          displayMonth: current.getFullYear().toString(), type: 'month'
        });
        current.setMonth(current.getMonth() + 1);
      }
    }
    return cols;
  }, [filterStart, filterEnd, scheduleView]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
        <div className="flex items-center gap-6">
          <div className={`w-16 h-16 rounded-[1.25rem] ${project.color} shadow-2xl flex items-center justify-center text-white text-3xl font-black italic uppercase tracking-tighter`}>
            {project.name.charAt(0)}
          </div>
          <div>
            <h1 className="text-4xl font-black tracking-tight uppercase leading-none">{project.name}</h1>
            <p className="text-base-content/50 font-bold uppercase text-xs tracking-[0.2em] mt-2">{project.client}</p>
          </div>
        </div>

        <div className="tabs tabs-lifted bg-base-100 p-1 rounded-2xl border border-base-300 shadow-xl">
          <button onClick={() => setActiveTab("schedule")} className={`tab tab-lg font-black uppercase text-[10px] tracking-widest px-8 h-12 ${activeTab === 'schedule' ? 'tab-active !text-primary' : 'opacity-40'}`}>Schedule & Squad</button>
          <button onClick={() => setActiveTab("deliverables")} className={`tab tab-lg font-black uppercase text-[10px] tracking-widest px-8 h-12 ${activeTab === 'deliverables' ? 'tab-active !text-primary' : 'opacity-40'}`}>Status Report</button>
        </div>
      </div>

      {activeTab === "schedule" ? (
        <>
          {/* Top KPIs */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
            <div className="stat bg-base-100 rounded-[2rem] shadow-xl border border-base-200">
              <div className="stat-figure text-primary"><Users className="w-8 h-8 opacity-20" /></div>
              <div className="stat-title text-[10px] font-black uppercase tracking-widest opacity-50">Squad Size</div>
              <div className="stat-value text-2xl font-black">{team.length}</div>
              <div className="stat-desc font-bold text-[10px]">Active engineers</div>
            </div>
            <div className="stat bg-base-100 rounded-[2rem] shadow-xl border border-base-200">
              <div className="stat-figure text-secondary"><BarChart3 className="w-8 h-8 opacity-20" /></div>
              <div className="stat-title text-[10px] font-black uppercase tracking-widest opacity-50">Project Effort</div>
              <div className="stat-value text-2xl font-black">{totalFTE} <span className="text-sm font-normal opacity-50 text-[10px]">FTE</span></div>
              <div className="stat-desc font-bold text-[10px]">Period commitment</div>
            </div>
            <div className="lg:col-span-2 card bg-base-100 shadow-xl border border-base-200 rounded-[2rem] overflow-hidden">
              <div className="card-body p-6 flex flex-col justify-center">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[10px] font-black uppercase opacity-40 tracking-widest flex items-center gap-2"><CalendarDays className="w-3 h-3 text-primary" /> Roadmap Window</h3>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <input type="date" className="input input-sm input-bordered flex-1 h-10 bg-base-200/20 font-black text-xs uppercase rounded-xl border-base-300" value={filterStart} onChange={(e) => setFilterStart(e.target.value)} />
                  <ArrowRight className="w-4 h-4 opacity-20 hidden sm:block" />
                  <input type="date" className="input input-sm input-bordered flex-1 h-10 bg-base-200/20 font-black text-xs uppercase rounded-xl border-base-300" value={filterEnd} onChange={(e) => setFilterEnd(e.target.value)} />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-8 mb-8">
            {/* Roadmap Cockpit */}
            <div className="card bg-base-100 shadow-xl border border-base-200 rounded-[2.5rem] overflow-hidden flex flex-col min-h-[500px]">
              {/* Header */}
              <div className="px-8 py-6 border-b border-base-200 flex items-center justify-between bg-base-100/50 backdrop-blur-md sticky top-0 z-20">
                <h3 className="font-black flex items-center gap-3 uppercase text-xs tracking-widest opacity-40">
                  <LayoutTemplate className="w-4 h-4 text-primary" /> Roadmap Cockpit
                </h3>
                <button onClick={() => { setEditingPhase(null); setIsPhaseModalOpen(true); }} className="btn btn-xs btn-primary rounded-lg px-4 font-black uppercase tracking-widest shadow-md">
                  <Plus className="w-3 h-3" /> Add Phase
                </button>
              </div>

              <div className="flex flex-col h-full">
                {/* Phase Navigation - Clean Pills */}
                <div className="border-b border-base-200 bg-base-50/50">
                  <div className="px-6 py-4 overflow-x-auto custom-scrollbar">
                    <div className="flex gap-2">
                      {(project.phases || []).sort((a, b) => a.startDate.getTime() - b.startDate.getTime()).map(phase => {
                        const isActive = selectedPhaseId === phase.id;
                        const krs = phase.outcomes || [];
                        const progress = krs.length > 0 ? Math.round((krs.filter(o => o.isDone).length / krs.length) * 100) : 0;
                        
                        return (
                          <button 
                            key={phase.id}
                            onClick={() => setSelectedPhaseId(phase.id)}
                            className={`px-4 py-2 rounded-xl flex items-center gap-3 transition-all whitespace-nowrap border ${isActive ? 'bg-base-100 border-primary/20 shadow-md scale-105' : 'bg-transparent border-transparent hover:bg-base-200/50 opacity-60 hover:opacity-100'}`}
                          >
                            <div className={`w-2 h-2 rounded-full ${phase.color.split(' ')[0]} ${isActive ? 'ring-2 ring-offset-2 ring-primary/20' : ''}`}></div>
                            <span className={`text-xs font-black uppercase tracking-tight ${isActive ? 'text-primary' : ''}`}>{phase.name}</span>
                            {progress === 100 && <CheckCircle2 className="w-3 h-3 text-success" />}
                          </button>
                        );
                      })}
                      {(project.phases || []).length === 0 && (
                         <div className="px-4 text-[10px] font-black uppercase opacity-20 tracking-widest py-2">No Phases Defined</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 bg-base-100 relative">
                  {selectedPhase ? (
                    <div className="p-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                      {/* Phase Header */}
                      <div className="flex flex-col gap-6 mb-10">
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-2">
                            <h2 className="text-3xl font-black uppercase tracking-tight leading-none">{selectedPhase.name}</h2>
                            <div className="flex items-center gap-4 text-[10px] font-bold opacity-40 uppercase tracking-widest">
                               <Calendar className="w-3 h-3" />
                               <span>{formatDate(selectedPhase.startDate)} — {formatDate(selectedPhase.endDate)}</span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => { setEditingPhase(selectedPhase); setIsPhaseModalOpen(true); }} className="btn btn-ghost btn-sm btn-square rounded-xl hover:bg-base-200">
                              <Pencil className="w-4 h-4 opacity-50" />
                            </button>
                            <button onClick={() => { if(confirm("Delete this phase?")) deletePhase(selectedPhase.id, project.id); }} className="btn btn-ghost btn-sm btn-square rounded-xl text-error hover:bg-error/10">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-2">
                          <div className="flex justify-between text-[10px] font-black uppercase tracking-widest opacity-40">
                            <span>Phase Progress</span>
                            <span>{selectedPhase.outcomes?.length ? Math.round((selectedPhase.outcomes.filter(o => o.isDone).length / selectedPhase.outcomes.length) * 100) : 0}%</span>
                          </div>
                          <progress 
                            className={`progress w-full h-2 ${selectedPhase.outcomes?.every(o => o.isDone) && selectedPhase.outcomes?.length > 0 ? 'progress-success' : 'progress-primary'}`} 
                            value={selectedPhase.outcomes?.length ? (selectedPhase.outcomes.filter(o => o.isDone).length / selectedPhase.outcomes.length) * 100 : 0} 
                            max="100"
                          ></progress>
                        </div>
                      </div>

                      {/* Outcomes List */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between border-b border-base-200 pb-4 mb-2">
                          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-30 flex items-center gap-2">
                            <Target className="w-3 h-3" /> Key Outcomes
                          </h4>
                          <button 
                            onClick={() => {
                              setTargetPhaseId(selectedPhase.id);
                              setEditingOutcome(null);
                              setIsOutcomeModalOpen(true);
                            }}
                            className="btn btn-ghost btn-xs rounded-lg font-black uppercase tracking-widest hover:bg-base-200 text-primary"
                          >+ Add Outcome</button>
                        </div>

                        <div className="space-y-2">
                          {(selectedPhase.outcomes || []).map(kr => {
                             const assignee = developers.find(d => d.id === kr.assigneeId);
                             return (
                               <div key={kr.id} className="group flex items-center gap-4 p-4 rounded-2xl border border-transparent hover:border-base-200 hover:bg-base-50 transition-all">
                                 <button onClick={() => updateOutcome({ ...kr, isDone: !kr.isDone })} className="shrink-0 transition-transform active:scale-90">
                                   {kr.isDone ? <CheckCircle2 className="w-5 h-5 text-success" /> : <Circle className="w-5 h-5 opacity-20 hover:opacity-100 hover:text-primary transition-all" />}
                                 </button>
                                 
                                 <div className="flex-1 min-w-0">
                                   <div className={`font-bold text-sm transition-all ${kr.isDone ? 'line-through opacity-30' : ''}`}>{kr.name}</div>
                                   {kr.description && !kr.isDone && <p className="text-xs opacity-40 truncate mt-0.5">{kr.description}</p>}
                                 </div>

                                 <div className="flex items-center gap-4">
                                   {assignee && (
                                     <div className="avatar tooltip tooltip-left" data-tip={assignee.name}>
                                       <div className="w-6 h-6 mask mask-squircle shadow-sm opacity-60 grayscale group-hover:grayscale-0 transition-all"><img src={assignee.avatarUrl} alt="" /></div>
                                     </div>
                                   )}
                                   <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                      <button onClick={() => { setEditingOutcome(kr); setTargetPhaseId(selectedPhase.id); setIsOutcomeModalOpen(true); }} className="btn btn-ghost btn-xs btn-square"><Pencil className="w-3 h-3 opacity-50" /></button>
                                      <button onClick={() => deleteOutcome(kr.id)} className="btn btn-ghost btn-xs btn-square text-error"><Trash2 className="w-3 h-3" /></button>
                                   </div>
                                 </div>
                               </div>
                             );
                          })}
                          {(selectedPhase.outcomes || []).length === 0 && (
                            <div className="text-center py-12 opacity-20">
                              <Box className="w-8 h-8 mx-auto mb-2" />
                              <p className="text-[10px] font-black uppercase tracking-widest">No outcomes defined</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center opacity-20">
                      <LayoutTemplate className="w-16 h-16 mb-4" />
                      <p className="font-black uppercase tracking-widest text-xs">Select a phase to view details</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Context (Requirements + Squad) */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="card bg-base-100 shadow-xl border border-base-200 rounded-[2.5rem] overflow-hidden">
                <div className="card-body p-0">
                  <div className="p-6 border-b border-base-200 flex items-center justify-between bg-base-100 z-20">
                    <h3 className="font-black flex items-center gap-2 uppercase text-[10px] tracking-widest opacity-40">
                      <ShieldAlert className="w-5 h-5 text-primary" /> Requirements
                    </h3>
                    <button onClick={() => setIsReqModalOpen(true)} className="btn btn-xs btn-primary rounded-lg px-4 font-black uppercase tracking-widest shadow-md">
                      <Plus className="w-3 h-3" /> Add Spec
                    </button>
                  </div>
                  <div className="p-6 flex flex-wrap gap-2">
                    {project.requirements?.map(req => (
                      <div key={req.id} className="badge badge-lg badge-outline gap-2 py-5 px-4 rounded-xl group/req font-black uppercase text-[10px] tracking-tighter">
                        {req.name} <span className="opacity-30">LVL {req.level}</span>
                        <button onClick={() => { if(confirm("Delete requirement?")) deleteRequirement(req.id, project.id); }} className="btn btn-ghost btn-xs btn-circle h-5 w-5 min-h-0 opacity-0 group-hover/req:opacity-100 transition-opacity ml-1 text-error"><X className="w-3 h-3" /></button>
                      </div>
                    ))}
                    {(!project.requirements || project.requirements.length === 0) && <p className="text-xs opacity-30 italic font-medium px-2">No technical constraints defined.</p>}
                  </div>
                </div>
              </div>

              <div className="card bg-base-100 shadow-xl border border-base-200 rounded-[2.5rem] overflow-hidden xl:col-span-2 flex flex-col">
                <div className="card-body p-0 flex flex-col h-full">
                  <div className="p-6 border-b border-base-200 flex items-center justify-between bg-base-100 z-20">
                    <h3 className="font-black flex items-center gap-2 uppercase text-[10px] tracking-widest opacity-40">
                      <Users className="w-5 h-5 text-primary" /> The Squad
                    </h3>
                    <button className="btn btn-xs btn-primary rounded-lg px-4 font-black uppercase tracking-widest shadow-md" onClick={() => { setEditingAllocation(null); setIsAllocationModalOpen(true); }}>
                      <Plus className="w-3 h-3" /> Add Resource
                    </button>
                  </div>
                  <div className="p-4 bg-base-200/30 border-b border-base-200">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-4 top-3.5 opacity-30" />
                      <input type="text" placeholder="Find resource..." className="input input-bordered w-full pl-11 h-11 bg-base-100 rounded-xl font-bold text-xs" value={squadSearch} onChange={(e) => setSquadSearch(e.target.value)} />
                    </div>
                  </div>
                  <div className="overflow-y-auto flex-1 custom-scrollbar">
                    <table className="table w-full border-separate border-spacing-0">
                      <thead className="sticky top-0 z-10 bg-base-100/95 backdrop-blur-sm shadow-sm">
                        <tr className="text-[10px] font-black uppercase tracking-widest opacity-40">
                          <th className="pl-6 py-4 bg-transparent border-b border-base-200">Engineer</th>
                          <th className="text-right pr-6 bg-transparent border-b border-base-200">Peak</th>
                          <th className="w-12 bg-transparent border-b border-base-200"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-base-100">
                        {team.filter(dev => dev.name.toLowerCase().includes(squadSearch.toLowerCase()) || dev.role.toLowerCase().includes(squadSearch.toLowerCase())).map(dev => {
                          const devProjectAllocations = filteredAllocations.filter(a => a.developerId === dev.id);
                          const avgProjectLoad = devProjectAllocations.length > 0 ? Math.round(devProjectAllocations.reduce((sum, a) => sum + a.load, 0) / devProjectAllocations.length) : 0;
                          const hasCurrentLeave = leaves.filter(l => l.developerId === dev.id).some(l => isOverlapping(l.startDate, l.endDate, filterStart, filterEnd));
                          return (
                            <tr key={dev.id} className="group hover:bg-primary/5 transition-colors">
                              <td className="py-4 pl-6">
                                <div className="flex items-center gap-4">
                                  <div className="avatar"><div className="w-10 h-10 mask mask-squircle shadow-md"><img src={dev.avatarUrl} alt="" /></div></div>
                                  <div className="overflow-hidden">
                                    <div className="font-black text-sm uppercase tracking-tight flex items-center gap-2 truncate">{dev.name} {hasCurrentLeave && <div className="badge bg-amber-100 text-amber-800 border-amber-200 font-black text-[7px] py-2">🌴 ON LEAVE</div>}</div>
                                    <div className="text-[9px] font-bold opacity-40 uppercase truncate">{dev.role}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="text-right pr-6"><div className="text-lg font-black text-primary leading-none">{avgProjectLoad}%</div></td>
                              <td className="pr-4"><button onClick={() => setManagingDevId(dev.id)} className="btn btn-ghost btn-xs btn-square opacity-0 group-hover:opacity-100 transition-opacity"><MoreVertical className="w-4 h-4" /></button></td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Full Width Schedule Engine */}
          <div className="grid grid-cols-1 mb-8">
            <div className="card bg-base-100 shadow-xl border border-base-200 rounded-[2.5rem] overflow-hidden flex flex-col h-[600px]">
              <div className="card-body p-0 flex flex-col h-full">
                <div className="p-6 border-b border-base-200 flex items-center justify-between bg-base-100 z-20 shadow-sm">
                  <h3 className="font-black flex items-center gap-2 uppercase text-[10px] tracking-widest opacity-40">
                    <Calendar className="w-5 h-5 text-primary" /> Schedule Engine
                  </h3>
                  <div className="join bg-base-200 p-0.5 rounded-lg shadow-inner">
                    <button className={`btn btn-xs join-item font-black uppercase text-[8px] h-7 px-3 ${scheduleView === 'weeks' ? 'btn-primary shadow-lg' : 'btn-ghost opacity-40'}`} onClick={() => setScheduleView('weeks')}>Weeks</button>
                    <button className={`btn btn-xs join-item font-black uppercase text-[8px] h-7 px-3 ${scheduleView === 'months' ? 'btn-primary shadow-lg' : 'btn-ghost opacity-40'}`} onClick={() => setScheduleView('months')}>Months</button>
                  </div>
                </div>
                
                <div className="overflow-x-auto flex-1 custom-scrollbar">
                  <table className="table w-full border-separate border-spacing-0">
                    <thead className="sticky top-0 z-10 bg-base-100/95 backdrop-blur-sm shadow-sm">
                      <tr className="bg-base-200/50">
                        <th className="w-48 sticky left-0 bg-base-100 z-10 p-6 border-b border-base-200 shadow-[5px_0_10px_-5px_rgba(0,0,0,0.1)]">
                          <div className="text-[9px] font-black uppercase tracking-[0.2em] opacity-40">Timeline Row</div>
                        </th>
                        {ganttColumns.map((col) => (
                          <th key={col.id} className="text-center border-l border-base-200 border-b border-base-200 p-4 min-w-[100px] bg-transparent">
                            <div className="text-xs font-black uppercase tracking-tight text-primary">{col.label}</div>
                            <div className="text-[9px] font-bold opacity-30 tracking-widest mt-1">{col.displayMonth} {scheduleView === 'weeks' ? `${col.displayStart}-${col.displayEnd}` : ''}</div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-base-100">
                      {project.phases && project.phases.length > 0 && (
                        <tr className="bg-base-200/20">
                          <td className="font-black text-[9px] uppercase opacity-30 pl-8 sticky left-0 bg-base-100 z-10 py-4 shadow-[5px_0_10px_-5px_rgba(0,0,0,0.1)]">Structural Phases</td>
                          {ganttColumns.map((col) => {
                            const activePhase = project.phases?.find(ph => isOverlapping(ph.startDate, ph.endDate, col.start, col.end));
                            return (<td key={col.id} className="border-l border-base-200 p-1.5 h-14 align-middle">{activePhase && (<div className={`${activePhase.color} text-[8px] font-black uppercase p-2 rounded-lg shadow-md text-center truncate`}>{activePhase.name}</div>)}</td>);
                          })}
                        </tr>
                      )}
                      {team.map((dev) => {
                         const devProjectAllocations = filteredAllocations.filter(a => a.developerId === dev.id);
                         const devLeaves = leaves.filter(l => l.developerId === dev.id);
                         return (
                           <tr key={dev.id} className="hover:bg-base-200/10 transition-colors">
                             <td className="sticky left-0 bg-base-100 z-10 border-b border-base-200 p-4 shadow-[5px_0_10px_-5px_rgba(0,0,0,0.1)]">
                               <div className="flex items-center gap-3">
                                 <div className="w-8 h-8 rounded-full overflow-hidden shadow-sm ring-2 ring-primary/10"><img src={dev.avatarUrl} alt="" className="object-cover w-full h-full" /></div>
                                 <span className="font-black text-[11px] uppercase tracking-tight truncate max-w-[100px]">{dev.name}</span>
                               </div>
                             </td>
                             {ganttColumns.map((col) => {
                               const activeAllocations = devProjectAllocations.filter((a) => isOverlapping(a.startDate, a.endDate, col.start, col.end));
                               const activeLeaves = devLeaves.filter((l) => isOverlapping(l.startDate, l.endDate, col.start, col.end));
                               let load = 0; if (activeAllocations.length > 0) { const total = activeAllocations.reduce((sum, a) => sum + a.load, 0); load = scheduleView === 'months' ? Math.round(total / activeAllocations.length) : total; }
                               const isLeaveConflict = activeAllocations.some(a => activeLeaves.some(l => isOverlapping(a.startDate, a.endDate, l.startDate, l.endDate)));
                               const isOverload = load > (dev.capacity * 100); const isConflict = isLeaveConflict || isOverload;
                               return (
                                 <td key={col.id} className="border-l border-base-200 border-b border-base-200 p-1.5 h-20 align-top">
                                   <div className="flex flex-col gap-1.5 h-full pt-1">
                                     <div className="h-3 w-full">{isConflict && (<div className="badge badge-error border-none w-full font-black animate-pulse text-[7px] p-0 h-3 leading-none rounded-sm">{isLeaveConflict ? "CONFLICT" : "OVERLOAD"}</div>)}</div>
                                     <div className="h-4 w-full">{activeLeaves.length > 0 ? (<div className="bg-amber-100 text-amber-800 border-amber-200 p-0.5 rounded-md text-[7px] font-black text-center border border-dashed truncate h-4 flex items-center justify-center shadow-sm">🌴 {activeLeaves[0].type.slice(0, 3).toUpperCase()}</div>) : null}</div>
                                     <div className="h-7 w-full">{load > 0 ? (<div className={`${project.color} w-full rounded-lg flex items-center justify-center text-[10px] font-black text-white shadow-lg transition-all hover:scale-105 p-1 h-7 border border-white/10`}>{load}%</div>) : null}</div>
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
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-base-100 rounded-[3rem] p-12 shadow-2xl border border-base-300 min-h-[800px] animate-in slide-in-from-bottom-4 duration-700">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl font-black uppercase tracking-tight flex items-center gap-3"><Trophy className="w-8 h-8 text-primary" /> Executive Status Report</h2>
              <p className="text-xs font-bold opacity-40 uppercase tracking-[0.2em] mt-1">Unified roadmap & milestone achievement</p>
            </div>
            <button onClick={() => window.print()} className="btn btn-xs btn-primary rounded-lg px-6 font-black uppercase tracking-widest shadow-md h-10">
              <Plus className="w-3 h-3" /> Print Executive PDF
            </button>
          </div>

          <div className="space-y-16">
            {(project.phases || []).sort((a, b) => a.startDate.getTime() - b.startDate.getTime()).map(phase => {
              const krs = phase.outcomes || [];
              const doneCount = krs.filter(o => o.isDone).length;
              const progress = krs.length > 0 ? Math.round((doneCount / krs.length) * 100) : 0;

              return (
                <div key={phase.id} className="grid grid-cols-1 lg:grid-cols-4 gap-10 group">
                  <div className="lg:col-span-1 space-y-4">
                    <div className={`w-16 h-16 rounded-[2rem] ${phase.color.split(' ')[0]} flex items-center justify-center shadow-xl border-4 border-white group-hover:scale-110 transition-transform`}>
                      <Box className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black uppercase tracking-tight leading-none">{phase.name}</h3>
                      <p className="text-[10px] font-black opacity-30 uppercase tracking-widest mt-2">{formatDate(phase.startDate)} — {formatDate(phase.endDate)}</p>
                    </div>
                    <div className="space-y-1.5 pt-4">
                      <div className="text-[9px] font-black uppercase opacity-30 tracking-widest">Phase Completion</div>
                      <div className="flex items-center gap-3">
                        <progress className={`progress h-2 flex-1 ${progress === 100 ? 'progress-success' : 'progress-primary'}`} value={progress} max="100"></progress>
                        <span className="text-xs font-black opacity-60">{progress}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-3 bg-base-200/30 rounded-[2.5rem] border border-base-300 p-8 shadow-inner">
                    <div className="space-y-2">
                      {krs.map(kr => {
                        const assignee = developers.find(d => d.id === kr.assigneeId);
                        return (
                          <div key={kr.id} className="bg-base-100 p-4 rounded-2xl border border-base-200 shadow-sm flex items-center gap-5 transition-all hover:shadow-md">
                            {kr.isDone ? (
                              <CheckCircle2 className="w-6 h-6 text-success shrink-0" />
                            ) : (
                              <div className="w-6 h-6 rounded-full border-2 border-base-300 flex items-center justify-center shrink-0">
                                <div className="w-2 h-2 rounded-full bg-base-300 opacity-20"></div>
                              </div>
                            )}
                            <div className="flex-1">
                              <div className={`font-black text-sm uppercase tracking-tight ${kr.isDone ? 'opacity-30' : 'opacity-80'}`}>{kr.name}</div>
                              {kr.description && !kr.isDone && (
                                <div className="text-[9px] font-medium opacity-40 mt-0.5 line-clamp-1">{kr.description}</div>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-4">
                              {assignee && (
                                <div className="flex items-center gap-2 bg-base-200/50 px-3 py-1 rounded-xl border border-base-300">
                                  <div className="avatar">
                                    <div className="w-5 h-5 mask mask-squircle border border-base-300 shadow-sm">
                                      <img src={assignee.avatarUrl} alt="" />
                                    </div>
                                  </div>
                                  <span className="text-[8px] font-black uppercase opacity-40 tracking-widest">{assignee.name.split(' ')[0]}</span>
                                </div>
                              )}
                              {kr.isDone && <div className="badge badge-success border-none text-white font-black text-[7px] py-2 px-2 uppercase tracking-widest">Done</div>}
                            </div>
                          </div>
                        );
                      })}
                      {krs.length === 0 && (
                        <div className="py-12 text-center opacity-10 border-2 border-dashed border-base-300 rounded-[2rem]">
                          <Hash className="w-12 h-12 mx-auto mb-2" />
                          <p className="text-[10px] font-black uppercase tracking-widest">Zero milestones tracked for this phase</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <NewAllocationModal isOpen={isAllocationModalOpen} onClose={() => { setIsAllocationModalOpen(false); setEditingAllocation(null); }} initialData={editingAllocation} />
      <NewPhaseModal isOpen={isPhaseModalOpen} onClose={() => { setIsPhaseModalOpen(false); setEditingPhase(null); }} projectId={project.id} initialData={editingPhase} />
      <NewRequirementModal isOpen={isReqModalOpen} onClose={() => setIsReqModalOpen(false)} projectId={project.id} />
      
      <NewOutcomeModal 
        isOpen={isOutcomeModalOpen} 
        onClose={() => { setIsOutcomeModalOpen(false); setEditingOutcome(null); }}
        developers={developers}
        initialData={editingOutcome}
        onSave={(data) => {
          if (editingOutcome) {
            updateOutcome({ ...editingOutcome, ...data as Outcome });
          } else {
            addOutcome({
              id: crypto.randomUUID(),
              name: data.name!,
              description: data.description,
              assigneeId: data.assigneeId,
              isDone: false,
              order: 0,
              phaseId: targetPhaseId!
            });
          }
        }}
      />

      {managingDevId && (() => {
        const dev = developers.find(d => d.id === managingDevId);
        if (!dev) return null;
        const devProjectAllocations = filteredAllocations.filter(a => a.developerId === dev.id);
        return (
          <div className="modal modal-open">
            <div className="modal-box max-w-md border border-base-300 shadow-2xl rounded-[2.5rem] p-8 bg-base-100">
              <div className="flex items-center gap-5 mb-8">
                <div className="avatar"><div className="w-16 h-16 mask mask-squircle shadow-2xl ring-4 ring-primary/10"><img src={dev.avatarUrl} alt="" /></div></div>
                <div>
                  <h3 className="font-black text-xl uppercase tracking-tight leading-tight">{dev.name}</h3>
                  <p className="text-[10px] opacity-40 font-black uppercase tracking-widest mt-1">{dev.role}</p>
                </div>
                <button onClick={() => setManagingDevId(null)} className="btn btn-sm btn-circle btn-ghost ml-auto">✕</button>
              </div>
              <div className="space-y-6">
                <h4 className="text-[10px] font-black uppercase opacity-40 tracking-widest text-center">Manage active segments</h4>
                <div className="space-y-3">
                  {devProjectAllocations.map(alloc => (
                    <div key={alloc.id} className="bg-base-200/50 p-4 rounded-[1.5rem] border border-base-300 transition-all hover:bg-base-100 hover:shadow-md">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="text-xl font-black text-primary leading-none">{alloc.load}%</div>
                          <div className="text-[10px] font-bold opacity-60 mt-3 flex items-center gap-2">{formatDate(alloc.startDate)} <ArrowRight className="w-3 h-3 opacity-20" /> {formatDate(alloc.endDate)}</div>
                        </div>
                        <div className="flex gap-1">
                          <button onClick={() => { setEditingAllocation(alloc); setManagingDevId(null); setIsAllocationModalOpen(true); }} className="btn btn-square btn-sm btn-ghost"><Pencil className="w-4 h-4" /></button>
                          <button onClick={() => { if(confirm("Delete segment?")) { deleteAllocation(alloc.id); if (devProjectAllocations.length <= 1) setManagingDevId(null); } }} className="btn btn-square btn-sm btn-ghost text-error"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="modal-action mt-10"><button className="btn btn-block rounded-2xl font-black uppercase tracking-widest h-12" onClick={() => setManagingDevId(null)}>Done</button></div>
            </div>
            <div className="modal-backdrop bg-base-900/60 backdrop-blur-md" onClick={() => setManagingDevId(null)}></div>
          </div>
        );
      })()}
    </div>
  );
}
