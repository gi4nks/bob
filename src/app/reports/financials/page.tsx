"use client";

import React, { useState, useMemo, Suspense, useCallback } from "react";
import { useAppStore } from "@/lib/store";
import { getBusinessDays, formatDate, isOverlapping } from "@/lib/dateUtils";
import { 
  TrendingUp, 
  DollarSign, 
  AlertCircle, 
  ArrowRight,
  PieChart,
  Users,
  ChevronLeft,
  ChevronRight,
  Search,
  AlertTriangle,
  Layers,
  ArrowUpRight
} from "lucide-react";
import Link from "next/link";

function FinancialsContent() {
  const { projects, developers, allocations } = useAppStore();
  
  // UI State
  const [searchQuery, setSearchQuery] = useState("");
  const [healthFilter, setHealthFilter] = useState<"All" | "Over Budget" | "At Risk">("All");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [startMonth, setStartMonth] = useState(new Date(2026, 0, 1));

  // 1. Month Generation for Forecast
  const reportMonths = useMemo(() => {
    const months = [];
    for (let i = 0; i < 6; i++) {
      const d = new Date(startMonth.getFullYear(), startMonth.getMonth() + i, 1);
      months.push({
        label: d.toLocaleString('default', { month: 'short' }),
        start: new Date(d.getFullYear(), d.getMonth(), 1),
        end: new Date(d.getFullYear(), d.getMonth() + 1, 0),
      });
    }
    return months;
  }, [startMonth]);

  // 2. Data Calculation Engine
  const portfolioData = useMemo(() => {
    return projects.map(project => {
      const projectAllocations = allocations.filter(a => a.projectId === project.id && a.status === "Confirmed");
      
      let committedSpend = 0;
      projectAllocations.forEach(alloc => {
        const dev = developers.find(d => d.id === alloc.developerId);
        if (dev?.dailyRate) {
          const days = getBusinessDays(alloc.startDate, alloc.endDate);
          committedSpend += (days * dev.dailyRate * (alloc.load / 100));
        }
      });

      const budget = project.budget || 0;
      const utilization = budget > 0 ? (committedSpend / budget) * 100 : 0;
      const headroom = budget - committedSpend;
      
      // Monthly Burn for current month
      let currentMonthBurn = 0;
      const now = reportMonths[0];
      projectAllocations.forEach(alloc => {
        if (isOverlapping(alloc.startDate, alloc.endDate, now.start, now.end)) {
          const overlapStart = alloc.startDate > now.start ? alloc.startDate : now.start;
          const overlapEnd = alloc.endDate < now.end ? alloc.endDate : now.end;
          const dev = developers.find(d => d.id === alloc.developerId);
          if (dev?.dailyRate) {
            const days = getBusinessDays(overlapStart, overlapEnd);
            currentMonthBurn += (days * dev.dailyRate * (alloc.load / 100));
          }
        }
      });

      // Health Tagging
      let health: "Healthy" | "At Risk" | "Over Budget" = "Healthy";
      if (utilization > 100) health = "Over Budget";
      else if (utilization > 85) health = "At Risk";

      return {
        project,
        budget,
        committedSpend,
        utilization,
        headroom,
        currentMonthBurn,
        health,
        allocations: projectAllocations
      };
    }).sort((a, b) => b.budget - a.budget);
  }, [projects, developers, allocations, reportMonths]);

  // 3. Filtering
  const filteredData = useMemo(() => {
    return portfolioData.filter(item => {
      const matchesSearch = item.project.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            item.project.client.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesHealth = healthFilter === "All" || item.health === healthFilter;
      return matchesSearch && matchesHealth;
    });
  }, [portfolioData, searchQuery, healthFilter]);

  // 4. Portfolio KPIs
  const totals = useMemo(() => {
    const budget = portfolioData.reduce((s, i) => s + i.budget, 0);
    const spend = portfolioData.reduce((s, i) => s + i.committedSpend, 0);
    const burn = portfolioData.reduce((s, i) => s + i.currentMonthBurn, 0);
    const overBudgetCount = portfolioData.filter(i => i.health === "Over Budget").length;
    return { budget, spend, burn, overBudgetCount };
  }, [portfolioData]);

  const getProject = useCallback((id: string) => projects.find((p) => p.id === id), [projects]);

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-500">
      {/* Portfolio Executive Overview */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight flex items-center gap-3">
            <DollarSign className="w-8 h-8 text-primary" /> Project Financials
          </h1>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-40 mt-1">Portfolio budget health and burn rate oversight.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
           <div className="bg-base-100 rounded-xl border border-base-200 shadow-sm px-5 py-2 flex items-center gap-4">
              <div>
                <div className="text-[9px] font-black uppercase opacity-40 tracking-widest">Portfolio Burn</div>
                <div className="text-lg font-black tracking-tighter">${totals.burn.toLocaleString()}</div>
              </div>
              <div className="text-[9px] font-bold text-primary uppercase tracking-wide bg-primary/10 px-2 py-1 rounded-lg">Current Month</div>
           </div>
           {totals.overBudgetCount > 0 && (
             <div className="bg-error/10 rounded-xl border border-error/20 shadow-sm px-5 py-2 flex items-center gap-4">
                <div>
                  <div className="text-[9px] font-black uppercase text-error tracking-widest">Over Budget</div>
                  <div className="text-lg font-black text-error tracking-tighter">{totals.overBudgetCount} Projects</div>
                </div>
                <AlertTriangle className="w-5 h-5 text-error animate-pulse" />
             </div>
           )}
        </div>
      </div>

      {/* Advanced Filter Bar */}
      <div className="flex flex-col lg:flex-row justify-between items-center gap-4 bg-base-100 p-2 rounded-[1.5rem] border border-base-200 shadow-sm">
        <div className="flex items-center gap-4 w-full lg:w-auto px-2">
          <div className="relative flex-1 lg:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 opacity-40" />
            <input 
              type="text" 
              placeholder="SEARCH INITIATIVES..." 
              className="input input-sm input-bordered w-full pl-9 bg-base-200/30 rounded-xl font-bold text-[10px] uppercase h-9"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="join bg-base-200/50 p-1 rounded-xl">
            {(["All", "Over Budget", "At Risk"] as const).map(f => (
              <button 
                key={f}
                onClick={() => setHealthFilter(f)}
                className={`btn btn-xs join-item font-black text-[9px] uppercase tracking-widest px-4 h-7 ${healthFilter === f ? 'btn-primary' : 'btn-ghost opacity-50'}`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 px-2">
          <div className="join border border-base-200 rounded-xl overflow-hidden shadow-sm h-9 bg-base-100">
            <button onClick={() => setStartMonth(new Date(startMonth.getFullYear(), startMonth.getMonth() - 1, 1))} className="btn btn-sm btn-ghost join-item px-2">
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <div className="text-[10px] font-black uppercase tracking-widest min-w-[100px] flex items-center justify-center bg-base-100 join-item px-2">
              {startMonth.toLocaleString('default', { month: 'short', year: 'numeric' })}
            </div>
            <button onClick={() => setStartMonth(new Date(startMonth.getFullYear(), startMonth.getMonth() + 1, 1))} className="btn btn-sm btn-ghost join-item px-2">
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 items-start">
        <div className="col-span-1">
          <div className="bg-base-100 rounded-[2rem] shadow-xl border border-base-200 overflow-hidden">
            <table className="table w-full border-collapse">
              <thead>
                <tr className="bg-base-200/50 text-[9px] font-black uppercase tracking-widest opacity-50 border-b border-base-200">
                  <th className="pl-8 py-4 w-1/3">Project Entity</th>
                  <th className="text-right">Budget</th>
                  <th className="text-right">Committed</th>
                  <th className="text-center">Utilization</th>
                  <th className="text-right">Headroom</th>
                  <th className="text-right pr-8">Burn</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-base-200/50">
                {filteredData.map((item) => {
                  const isSelected = selectedProjectId === item.project.id;
                  return (
                    <React.Fragment key={item.project.id}>
                      <tr 
                        className={`group hover:bg-base-200/30 cursor-pointer transition-all ${isSelected ? 'bg-base-200/50' : ''}`}
                        onClick={() => setSelectedProjectId(isSelected ? null : item.project.id)}
                      >
                        <td className="pl-8 py-4">
                          <div className="flex items-center gap-4">
                            <div className={`w-2 h-8 rounded-full ${item.project.color} shadow-sm group-hover:scale-y-110 transition-transform ${isSelected ? 'scale-y-125 ring-2 ring-primary/20' : ''}`} />
                            <div>
                              <div className="font-black text-xs uppercase tracking-tight group-hover:text-primary transition-colors">{item.project.name}</div>
                              <div className="text-[9px] font-bold opacity-40 uppercase tracking-widest mt-0.5">{item.project.client}</div>
                            </div>
                          </div>
                        </td>
                        <td className="text-right font-bold text-xs text-base-content/70">
                          ${item.budget.toLocaleString()}
                        </td>
                        <td className="text-right font-black text-xs">
                          ${item.committedSpend.toLocaleString()}
                        </td>
                        <td className="text-center w-40">
                          <div className="flex items-center justify-center gap-3">
                            <div className="w-20 bg-base-200 rounded-full h-2 overflow-hidden">
                              <div 
                                className={`h-full transition-all duration-1000 ${
                                  item.health === "Over Budget" ? 'bg-error' : item.health === "At Risk" ? 'bg-warning' : 'bg-success'
                                }`}
                                style={{ width: `${Math.min(item.utilization, 100)}%` }}
                              />
                            </div>
                            <span className={`text-[10px] font-black ${item.health === "Over Budget" ? 'text-error' : 'opacity-50'}`}>
                              {Math.round(item.utilization)}%
                            </span>
                          </div>
                        </td>
                        <td className={`text-right font-black text-xs ${item.headroom < 0 ? 'text-error' : 'text-success opacity-80'}`}>
                          ${item.headroom.toLocaleString()}
                        </td>
                        <td className="text-right pr-8">
                          <div className="flex items-center justify-end gap-2">
                            <span className="text-[10px] font-bold text-base-content/60">${item.currentMonthBurn.toLocaleString()}</span>
                            <ChevronRight className={`w-3.5 h-3.5 opacity-30 transition-transform duration-300 ${isSelected ? 'rotate-90' : ''}`} />
                          </div>
                        </td>
                      </tr>

                      {/* Expanded Detail Row */}
                      {isSelected && (
                        <tr className="bg-base-50 shadow-inner">
                          <td colSpan={6} className="p-0 border-t-0">
                            <div className="p-8 animate-in slide-in-from-top-2 duration-300 overflow-hidden">
                              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                                {/* Left: Branding & Status */}
                                <div className="space-y-6">
                                  <div>
                                    <div className="text-[9px] font-black uppercase tracking-[0.2em] opacity-30 mb-2">Project Inspector</div>
                                    <h2 className="text-2xl font-black tracking-tight uppercase leading-tight mb-1">{item.project.name}</h2>
                                    <p className="text-xs font-bold opacity-50 mb-4">{item.project.client}</p>
                                    <div className="flex gap-2">
                                      <div className="badge badge-outline border-base-300 font-black uppercase text-[9px] tracking-widest">{item.project.status}</div>
                                      {item.health !== "Healthy" && (
                                        <div className={`badge border-none font-black uppercase text-[9px] tracking-widest ${item.health === "Over Budget" ? 'bg-error/10 text-error' : 'bg-warning/10 text-warning-content'}`}>
                                          {item.health}
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-base-100 p-4 rounded-2xl border border-base-200 shadow-sm">
                                      <div className="text-[9px] font-black uppercase opacity-40 mb-1 tracking-widest">Available Funds</div>
                                      <div className={`text-xl font-black ${item.headroom < 0 ? 'text-error' : 'text-success'}`}>
                                        ${item.headroom.toLocaleString()}
                                      </div>
                                    </div>
                                    <div className="bg-base-100 p-4 rounded-2xl border border-base-200 shadow-sm">
                                      <div className="text-[9px] font-black uppercase opacity-40 mb-1 tracking-widest">Burn Velocity</div>
                                      <div className="text-xl font-black text-secondary">
                                        ${item.currentMonthBurn.toLocaleString()}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="pt-2">
                                    <Link 
                                      href={`/projects/${item.project.id}`} 
                                      className="btn btn-primary btn-block rounded-xl gap-2 shadow-md font-black uppercase tracking-widest text-[10px]"
                                    >
                                      Full Roadmap <ArrowUpRight className="w-4 h-4" />
                                    </Link>
                                  </div>
                                </div>

                                {/* Center: Utilization & Forecast */}
                                <div className="space-y-6 bg-base-100 p-6 rounded-[2rem] border border-base-200 shadow-sm">
                                  <div>
                                    <h4 className="text-[9px] font-black uppercase tracking-widest opacity-40 mb-4 flex items-center gap-2">
                                      <PieChart className="w-3 h-3 text-primary" /> Budget Trajectory
                                    </h4>
                                    <div className="space-y-4">
                                      <div className="flex justify-between items-end">
                                        <div className="text-[10px] font-bold opacity-50 uppercase tracking-wide">Lifetime Consumption</div>
                                        <div className="text-2xl font-black tracking-tighter">${item.committedSpend.toLocaleString()}</div>
                                      </div>
                                      <div className="w-full bg-base-200 rounded-full h-4 p-0.5 overflow-hidden shadow-inner">
                                        <div 
                                          className={`h-full rounded-full transition-all duration-1000 ${
                                            item.utilization > 100 ? 'bg-error' : item.utilization > 85 ? 'bg-warning' : 'bg-success'
                                          }`}
                                          style={{ width: `${Math.min(item.utilization, 100)}%` }}
                                        />
                                      </div>
                                      <div className="flex justify-between items-center text-[9px] font-black uppercase opacity-40 tracking-wide">
                                        <span>Allocated</span>
                                        <span className={item.utilization > 100 ? 'text-error' : ''}>{item.utilization.toFixed(1)}% depletion</span>
                                        <span>Total</span>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="pt-2">
                                    <h4 className="text-[9px] font-black uppercase tracking-widest opacity-40 mb-4 flex items-center gap-2">
                                      <TrendingUp className="w-3 h-3 text-secondary" /> Monthly Trend
                                    </h4>
                                    <div className="flex items-end gap-2 h-16 px-1">
                                      {reportMonths.map((m, i) => {
                                        let monthCost = 0;
                                        item.allocations.forEach(alloc => {
                                          if (isOverlapping(alloc.startDate, alloc.endDate, m.start, m.end)) {
                                            const overlapStart = alloc.startDate > m.start ? alloc.startDate : m.start;
                                            const overlapEnd = alloc.endDate < m.end ? alloc.endDate : m.end;
                                            const dev = developers.find(d => d.id === alloc.developerId);
                                            if (dev?.dailyRate) {
                                              const days = getBusinessDays(overlapStart, overlapEnd);
                                              monthCost += (days * dev.dailyRate * (alloc.load / 100));
                                            }
                                          }
                                        });
                                        
                                        const maxPossible = Math.max(...reportMonths.map(() => item.currentMonthBurn * 1.5)) || 1;
                                        const height = Math.min(100, (monthCost / maxPossible) * 100);

                                        return (
                                          <div key={i} className="flex-1 flex flex-col items-center gap-1 group/bar">
                                            <div 
                                              className="w-full bg-primary/20 rounded-t-md transition-all duration-1000 group-hover/bar:bg-primary" 
                                              style={{ height: `${height}%` }}
                                              title={`${m.label}: $${Math.round(monthCost).toLocaleString()}`}
                                            />
                                            <div className="text-[8px] font-black opacity-30 uppercase tracking-wider">{m.label}</div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                </div>

                                {/* Right: Cost Centers */}
                                <div className="bg-base-100 p-6 rounded-[2rem] border border-base-200 shadow-sm h-full flex flex-col">
                                  <h4 className="text-[9px] font-black uppercase tracking-widest opacity-40 mb-4 flex items-center gap-2">
                                    <Users className="w-3 h-3 text-primary" /> Active Cost Centers
                                  </h4>
                                  <div className="space-y-3 flex-1 overflow-y-auto max-h-[250px] pr-1 custom-scrollbar">
                                    {item.allocations.map(alloc => {
                                      const dev = developers.find(d => d.id === alloc.developerId);
                                      const days = getBusinessDays(alloc.startDate, alloc.endDate);
                                      const cost = (days * (dev?.dailyRate || 0) * (alloc.load / 100));
                                      
                                      return (
                                        <div key={alloc.id} className="flex items-center gap-3 bg-base-200/30 p-3 rounded-xl border border-base-200 transition-all hover:bg-base-200/50">
                                          <div className="avatar">
                                            <div className="w-8 h-8 mask mask-squircle shadow-sm bg-base-100">
                                              <img src={dev?.avatarUrl} alt="" />
                                            </div>
                                          </div>
                                          <div className="flex-1 overflow-hidden">
                                            <div className="font-black text-[10px] uppercase truncate tracking-tight">{dev?.name}</div>
                                            <div className="text-[8px] font-bold opacity-40 uppercase tracking-tighter">{alloc.load}% Load &bull; ${dev?.dailyRate}/d</div>
                                          </div>
                                          <div className="text-right">
                                            <div className="text-[10px] font-black text-primary">${Math.round(cost).toLocaleString()}</div>
                                            <div className="text-[8px] font-bold opacity-30 uppercase tracking-wide">Est. Total</div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                    {item.allocations.length === 0 && (
                                      <div className="py-8 text-center text-[9px] italic opacity-30 uppercase font-black tracking-widest">No resources assigned</div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
            {filteredData.length === 0 && (
              <div className="p-16 text-center">
                <div className="opacity-10 mb-3"><Layers className="w-16 h-16 mx-auto" /></div>
                <h3 className="text-lg font-bold opacity-40 uppercase tracking-widest">No Financial Records Match</h3>
                <p className="text-[10px] opacity-30 mt-1 italic">Adjust your search or health filters.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProjectFinancialsPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen w-full items-center justify-center bg-base-100">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    }>
      <FinancialsContent />
    </Suspense>
  );
}