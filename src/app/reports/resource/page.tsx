"use client";

import React, { useState, useMemo, Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { isOverlapping, getBusinessDays, formatDate } from "@/lib/dateUtils";
import { 
  Users, 
  Briefcase, 
  Plane, 
  Search, 
  BarChart3, 
  ArrowRight,
  Pencil,
  Trash2,
  Plus,
  DollarSign,
  Activity
} from "lucide-react";
import Link from "next/link";
import NewAllocationModal from "@/components/NewAllocationModal";
import { Allocation } from "@/types";

function Resource360Content() {
  const { developers, allocations, projects, leaves, deleteAllocation, addAllocation } = useAppStore();
  const searchParams = useSearchParams();
  const urlDevId = searchParams.get("devId");
  
  // State
  const [selectedDevId, setSelectedDevId] = useState<string>(urlDevId || "");

  useEffect(() => {
    if (urlDevId) setSelectedDevId(urlDevId);
  }, [urlDevId]);

  const [filterStart, setFilterStart] = useState("2026-01-01");
  const [filterEnd, setFilterEnd] = useState("2026-06-30");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Management State
  const [isAllocModalOpen, setIsAllocModalOpen] = useState(false);
  const [editingAllocation, setEditingAllocation] = useState<Allocation | null>(null);
  const [activeTab, setActiveTab] = useState<"current" | "retro">("current");

  const developer = useMemo(() => 
    developers.find(d => d.id === selectedDevId), 
    [developers, selectedDevId]
  );

  const retroData = useMemo(() => {
    if (!selectedDevId) return null;
    
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const today = new Date();

    const pastAllocations = allocations.filter(a => 
      a.developerId === selectedDevId && 
      isOverlapping(a.startDate, a.endDate, sixMonthsAgo, today)
    );

    const pastLeaves = leaves.filter(l => 
      l.developerId === selectedDevId && 
      isOverlapping(l.startDate, l.endDate, sixMonthsAgo, today)
    );

    const uniqueProjects = Array.from(new Set(pastAllocations.map(a => a.projectId)));
    const avgLoad = pastAllocations.length > 0 
      ? Math.round(pastAllocations.reduce((s, a) => s + a.load, 0) / pastAllocations.length) 
      : 0;
    
    const totalSickDays = pastLeaves
      .filter(l => l.type === 'Sick Leave')
      .reduce((s, l) => s + (l.hours ? l.hours / 8 : getBusinessDays(l.startDate, l.endDate)), 0);

    const totalVacation = pastLeaves
      .filter(l => l.type === 'Vacation')
      .reduce((s, l) => s + (l.hours ? l.hours / 8 : getBusinessDays(l.startDate, l.endDate)), 0);

    return { uniqueProjects, avgLoad, totalSickDays, totalVacation, pastAllocations };
  }, [selectedDevId, allocations, leaves]);

  const filteredDevelopers = useMemo(() => 
    developers.filter(d => 
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.role.toLowerCase().includes(searchQuery.toLowerCase())
    ), [developers, searchQuery]
  );

  const resourceData = useMemo(() => {
    if (!selectedDevId) return null;

    const devAllocations = allocations.filter(a => 
      a.developerId === selectedDevId && 
      isOverlapping(a.startDate, a.endDate, filterStart, filterEnd)
    );

    const devLeaves = leaves.filter(l => 
      l.developerId === selectedDevId && 
      isOverlapping(l.startDate, l.endDate, filterStart, filterEnd)
    );

    // Grouping logic
    const groups: Record<string, any> = {};

    devAllocations.forEach(a => {
      const proj = projects.find(p => p.id === a.projectId);
      const key = a.projectId;
      if (!groups[key]) {
        groups[key] = {
          id: key,
          type: 'PROJECT',
          label: proj?.name || "Unknown Project",
          color: proj?.color || "bg-primary",
          client: proj?.client,
          items: []
        };
      }
      groups[key].items.push(a);
    });

    if (devLeaves.length > 0) {
      groups['leaves'] = {
        id: 'leaves',
        type: 'LEAVE',
        label: 'Time Off & Leaves',
        color: 'bg-neutral',
        items: devLeaves
      };
    }

    // Sort items within groups descending by start date
    Object.values(groups).forEach(g => {
      g.items.sort((a: any, b: any) => b.startDate.getTime() - a.startDate.getTime());
    });

    // Sort groups by their most recent item
    const sortedGroups = Object.values(groups).sort((a, b) => {
      return b.items[0].startDate.getTime() - a.items[0].startDate.getTime();
    });

    const uniqueProjectCount = sortedGroups.filter(g => g.type === 'PROJECT').length;

    return { sortedGroups, devAllocations, devLeaves, uniqueProjectCount };
  }, [selectedDevId, allocations, leaves, projects, filterStart, filterEnd]);

  const stats = useMemo(() => {
    if (!resourceData || !selectedDevId) return null;

    const fStart = new Date(filterStart);
    const fEnd = new Date(filterEnd);

    // Financial Impact Calculation
    let totalPeriodCost = 0;
    if (developer && developer.dailyRate) {
      resourceData.devAllocations.forEach(alloc => {
        if (alloc.status === "Confirmed") {
          const overlapStart = alloc.startDate > fStart ? alloc.startDate : fStart;
          const overlapEnd = alloc.endDate < fEnd ? alloc.endDate : fEnd;
          const days = getBusinessDays(overlapStart, overlapEnd);
          totalPeriodCost += (days * developer.dailyRate * (alloc.load / 100));
        }
      });
    }

    // Peak Load Calculation
    const projectEvents: { date: Date; load: number }[] = [];
    const leaveEvents: { date: Date; load: number }[] = [];
    
    resourceData.devAllocations.forEach(a => {
      projectEvents.push({ date: a.startDate, load: a.load });
      const exitDate = new Date(a.endDate);
      exitDate.setDate(exitDate.getDate() + 1);
      projectEvents.push({ date: exitDate, load: -a.load });
    });

    resourceData.devLeaves.forEach(l => {
      leaveEvents.push({ date: l.startDate, load: 100 });
      const exitDate = new Date(l.endDate);
      exitDate.setDate(exitDate.getDate() + 1);
      leaveEvents.push({ date: exitDate, load: -100 });
    });

    const allDateTimes = Array.from(new Set([
      ...projectEvents.map(e => e.date.getTime()),
      ...leaveEvents.map(e => e.date.getTime())
    ])).sort((a, b) => a - b);

    let peak = 0;
    
    allDateTimes.forEach(dateTime => {
      const date = new Date(dateTime);
      const currentProjectLoad = projectEvents.filter(e => e.date <= date).reduce((sum, e) => sum + e.load, 0);
      const currentLeaveLoad = leaveEvents.filter(e => e.date <= date).reduce((sum, e) => sum + e.load, 0);
      const currentCommitment = Math.max(currentProjectLoad, currentLeaveLoad);
      
      if (date >= fStart && date <= fEnd) {
        if (currentCommitment > peak) peak = currentCommitment;
      }
    });
    
    return { peakLoad: peak, totalPeriodCost };
  }, [resourceData, selectedDevId, filterStart, filterEnd, developer]);

  return (
    <div className="space-y-8 h-[calc(100vh-100px)] flex flex-col">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-4xl font-black tracking-tight uppercase leading-none flex items-center gap-3">
            <Users className="w-8 h-8 text-primary" /> Resource 360
          </h1>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-40 mt-2">Individual allocation management</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 flex-1 min-h-0">
        {/* Left Rail: The Squad */}
        <div className="xl:col-span-1 flex flex-col gap-4 min-h-0 h-full">
          <div className="bg-base-100 rounded-[2rem] shadow-xl border border-base-200 flex flex-col h-full overflow-hidden">
            <div className="p-6 border-b border-base-200 bg-base-100 sticky top-0 z-20">
              <h3 className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-4">The Squad</h3>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-4 top-3.5 opacity-30" />
                <input 
                  type="text" 
                  placeholder="FILTER ENGINEERS..." 
                  className="input input-bordered w-full pl-11 h-11 bg-base-200/30 rounded-xl font-bold text-xs uppercase"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="overflow-y-auto flex-1 p-3 custom-scrollbar">
              <div className="space-y-1">
                {filteredDevelopers.map(d => {
                  // Quick Status Check
                  const isActive = selectedDevId === d.id;
                  // Simple check for current load (not perfect but good for list)
                  const currentLoad = allocations
                    .filter(a => a.developerId === d.id && isOverlapping(new Date(), new Date(), a.startDate, a.endDate))
                    .reduce((sum, a) => sum + a.load, 0);
                  const statusColor = currentLoad > 100 ? 'bg-error' : currentLoad > 80 ? 'bg-warning' : 'bg-success';
                  
                  return (
                    <button 
                      key={d.id}
                      className={`w-full group flex items-center gap-4 p-3 rounded-2xl transition-all border ${isActive ? 'bg-base-100 border-primary shadow-lg ring-1 ring-primary/20' : 'border-transparent hover:bg-base-200/50 hover:border-base-200'}`}
                      onClick={() => setSelectedDevId(d.id)}
                    >
                      <div className="relative shrink-0">
                        <div className="avatar">
                          <div className={`w-12 h-12 mask mask-squircle shadow-sm ${isActive ? 'grayscale-0' : 'grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all'}`}>
                            <img src={d.avatarUrl} alt={d.name} />
                          </div>
                        </div>
                        <div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white ${statusColor}`}></div>
                      </div>
                      <div className="text-left overflow-hidden min-w-0 flex-1">
                        <div className={`font-black text-xs uppercase tracking-tight truncate ${isActive ? 'text-primary' : 'opacity-70'}`}>{d.name}</div>
                        <div className="text-[9px] font-bold opacity-40 uppercase truncate mt-0.5">{d.role}</div>
                      </div>
                      <div className={`text-[10px] font-black ${currentLoad > 0 ? 'opacity-40' : 'opacity-10'}`}>{currentLoad}%</div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Right Rail: Profile & Details */}
        <div className="xl:col-span-3 flex flex-col gap-6 min-h-0 h-full overflow-y-auto custom-scrollbar pr-2">
          {!developer ? (
            <div className="flex flex-col items-center justify-center h-full bg-base-100 rounded-[2.5rem] border border-base-200 opacity-30">
              <Users className="w-24 h-24 mb-6 stroke-1" />
              <p className="text-xl font-black uppercase tracking-[0.2em]">Select an Engineer</p>
            </div>
          ) : (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
              {/* Profile Card */}
              <div className="bg-base-100 rounded-[2.5rem] p-8 shadow-xl border border-base-200 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32 transition-all group-hover:bg-primary/10"></div>
                <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
                  <div className="flex items-center gap-6">
                    <div className="avatar">
                      <div className="w-24 h-24 mask mask-squircle shadow-2xl ring-4 ring-base-100 bg-base-100">
                        <img src={developer.avatarUrl} alt={developer.name} />
                      </div>
                    </div>
                    <div>
                      <h2 className="text-3xl font-black uppercase tracking-tight leading-none">{developer.name}</h2>
                      <p className="text-sm font-bold opacity-40 uppercase tracking-[0.2em] mt-2">{developer.role}</p>
                      <div className="flex gap-2 mt-4">
                        {developer.skills.slice(0, 3).map((s: any, i: number) => (
                           <span key={i} className="badge badge-sm bg-base-200 border-none font-bold text-[9px] uppercase tracking-wider opacity-60">{s.name}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-12 bg-base-50/50 p-6 rounded-3xl border border-base-100">
                    <div className="text-center">
                      <div className="text-[9px] font-black uppercase tracking-[0.2em] opacity-30 mb-1">Utilization</div>
                      <div className={`text-3xl font-black tracking-tighter ${stats?.peakLoad! > 100 ? 'text-error' : stats?.peakLoad! > 80 ? 'text-warning' : 'text-primary'}`}>{stats?.peakLoad}%</div>
                    </div>
                    <div className="w-px h-10 bg-base-300"></div>
                    <div className="text-center">
                      <div className="text-[9px] font-black uppercase tracking-[0.2em] opacity-30 mb-1">Active Projects</div>
                      <div className="text-3xl font-black tracking-tighter">{resourceData?.uniqueProjectCount}</div>
                    </div>
                    <div className="w-px h-10 bg-base-300"></div>
                    <div className="text-center">
                      <div className="text-[9px] font-black uppercase tracking-[0.2em] opacity-30 mb-1">Daily Rate</div>
                      <div className="text-3xl font-black tracking-tighter opacity-60">${developer.dailyRate}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Controls & Filter */}
              <div className="flex items-center justify-between bg-base-100 p-2 rounded-2xl shadow-sm border border-base-200">
                 <div className="flex gap-1 bg-base-200/50 p-1 rounded-xl">
                   <button onClick={() => setActiveTab("current")} className={`btn btn-sm rounded-lg border-none px-6 font-black uppercase text-[10px] tracking-widest ${activeTab === 'current' ? 'bg-white shadow-sm text-primary' : 'btn-ghost opacity-40'}`}>Schedule</button>
                   <button onClick={() => setActiveTab("retro")} className={`btn btn-sm rounded-lg border-none px-6 font-black uppercase text-[10px] tracking-widest ${activeTab === 'retro' ? 'bg-white shadow-sm text-primary' : 'btn-ghost opacity-40'}`}>Retro</button>
                 </div>

                 {activeTab === 'current' && (
                   <div className="flex items-center gap-4 px-4">
                     <div className="flex items-center gap-2 text-[10px] font-black uppercase opacity-40 tracking-widest">
                       <span>Window:</span>
                       <input type="date" className="bg-transparent border-none p-0 h-auto focus:ring-0 font-bold w-24" value={filterStart} onChange={(e) => setFilterStart(e.target.value)} />
                       <ArrowRight className="w-3 h-3" />
                       <input type="date" className="bg-transparent border-none p-0 h-auto focus:ring-0 font-bold w-24" value={filterEnd} onChange={(e) => setFilterEnd(e.target.value)} />
                     </div>
                     <button 
                       onClick={() => { setEditingAllocation(null); setIsAllocModalOpen(true); }}
                       className="btn btn-primary btn-sm rounded-lg px-4 font-black uppercase text-[10px] tracking-widest shadow-md"
                     >
                       <Plus className="w-3 h-3" /> Allocation
                     </button>
                   </div>
                 )}
              </div>

              {/* Main Content Area */}
              {activeTab === 'current' ? (
                <div className="space-y-6">
                  {resourceData?.sortedGroups.map((group) => (
                    <div key={group.id} className="card bg-base-100 shadow-lg border border-base-200 rounded-[2rem] overflow-hidden group/card hover:shadow-xl transition-all">
                      <div className={`px-8 py-5 border-b border-base-100 flex items-center justify-between ${group.type === 'PROJECT' ? 'bg-base-100' : 'bg-base-200/30'}`}>
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl ${group.color} flex items-center justify-center text-white shadow-lg`}>
                            {group.type === 'PROJECT' ? <Briefcase className="w-5 h-5" /> : <Plane className="w-5 h-5" />}
                          </div>
                          <div>
                            <div className="flex items-center gap-3">
                              <h3 className="font-black text-lg uppercase tracking-tight">{group.label}</h3>
                              {group.type === 'PROJECT' && <span className="badge badge-sm badge-ghost font-bold text-[9px] tracking-widest uppercase opacity-50">{group.client}</span>}
                            </div>
                            <p className="text-[9px] font-bold uppercase opacity-30 tracking-[0.2em] mt-1">
                              {group.type === 'PROJECT' ? 'Active Assignment' : 'Unavailable Period'}
                            </p>
                          </div>
                        </div>
                        {group.type === 'PROJECT' && (
                           <Link href={`/projects/${group.id}`} className="btn btn-ghost btn-xs rounded-lg font-black uppercase tracking-widest opacity-0 group-hover/card:opacity-100 transition-opacity">
                             View Timeline <ArrowRight className="w-3 h-3" />
                           </Link>
                        )}
                      </div>
                      
                      <div className="p-2">
                        {group.items.map((item: any) => {
                          const isDraft = item.status === "Draft";
                          const isPast = new Date(item.endDate) < new Date();
                          return (
                            <div key={item.id} className="flex items-center gap-4 p-4 hover:bg-base-200/50 rounded-2xl transition-colors group/item">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-1">
                                  <div className="text-xs font-black uppercase tracking-widest font-mono opacity-60">
                                    {formatDate(item.startDate)} — {formatDate(item.endDate)}
                                  </div>
                                  {isPast && <span className="badge badge-xs badge-ghost font-bold uppercase">Past</span>}
                                  {isDraft && <span className="badge badge-xs badge-secondary badge-outline font-bold uppercase">Draft</span>}
                                </div>
                                <div className="h-1.5 w-full bg-base-200 rounded-full overflow-hidden max-w-[200px]">
                                   <div className={`h-full ${group.color} opacity-40`} style={{ width: '100%' }}></div>
                                </div>
                              </div>

                              <div className="text-right">
                                <div className={`text-2xl font-black tracking-tighter ${group.type === 'LEAVE' ? 'opacity-30' : 'text-primary'}`}>
                                  {group.type === 'LEAVE' ? item.type : `${item.load}%`}
                                </div>
                              </div>

                              <div className="flex items-center gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity px-2">
                                <button onClick={() => { setEditingAllocation(item); setIsAllocModalOpen(true); }} className="btn btn-square btn-sm btn-ghost rounded-lg"><Pencil className="w-4 h-4 opacity-50" /></button>
                                <button onClick={() => { if(confirm("Delete?")) deleteAllocation(item.id); }} className="btn btn-square btn-sm btn-ghost rounded-lg text-error"><Trash2 className="w-4 h-4" /></button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                  
                  {resourceData?.sortedGroups.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 opacity-20 border-2 border-dashed border-base-300 rounded-[2.5rem]">
                      <Activity className="w-16 h-16 mb-4" />
                      <p className="font-black uppercase tracking-widest text-xs">No activity in selected window</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-base-100 p-8 rounded-[2.5rem] shadow-lg border border-base-200">
                         <h3 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-6">6-Month Workload Avg</h3>
                         <div className="flex items-end gap-2">
                            <span className="text-6xl font-black tracking-tighter text-primary">{retroData?.avgLoad}%</span>
                            <span className="text-sm font-bold opacity-40 mb-2 uppercase tracking-widest">Load</span>
                         </div>
                      </div>
                      <div className="bg-base-100 p-8 rounded-[2.5rem] shadow-lg border border-base-200 flex flex-col justify-between">
                         <h3 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-2">Absence Record</h3>
                         <div className="flex gap-8">
                            <div>
                               <div className="text-3xl font-black text-error">{retroData?.totalSickDays}d</div>
                               <div className="text-[9px] font-bold uppercase opacity-40 tracking-widest">Sick</div>
                            </div>
                            <div>
                               <div className="text-3xl font-black text-success">{retroData?.totalVacation}d</div>
                               <div className="text-[9px] font-bold uppercase opacity-40 tracking-widest">Vacation</div>
                            </div>
                         </div>
                      </div>
                   </div>

                   <div className="card bg-base-100 shadow-xl border border-base-200 rounded-[2rem] overflow-hidden">
                      <div className="p-6 border-b border-base-200 bg-base-100">
                         <h3 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Historical Allocations</h3>
                      </div>
                      <table className="table w-full">
                         <tbody>
                            {retroData?.pastAllocations.map(a => {
                               const proj = projects.find(p => p.id === a.projectId);
                               return (
                                  <tr key={a.id} className="hover:bg-base-200/50">
                                     <td className="pl-6 py-4">
                                        <div className="font-black text-sm uppercase tracking-tight">{proj?.name}</div>
                                     </td>
                                     <td className="text-xs font-mono font-bold opacity-60 uppercase tracking-wide">
                                        {formatDate(a.startDate)} — {formatDate(a.endDate)}
                                     </td>
                                     <td className="pr-6 text-right">
                                        <span className="font-black text-lg">{a.load}%</span>
                                     </td>
                                  </tr>
                               );
                            })}
                         </tbody>
                      </table>
                   </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <NewAllocationModal 
        isOpen={isAllocModalOpen} 
        onClose={() => { setIsAllocModalOpen(false); setEditingAllocation(null); }} 
        initialData={editingAllocation || { developerId: selectedDevId } as any}
      />
    </div>
  );
}

export default function Resource360Page() {
  return (
    <Suspense fallback={
      <div className="flex h-screen w-full items-center justify-center bg-base-100">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    }>
      <Resource360Content />
    </Suspense>
  );
}