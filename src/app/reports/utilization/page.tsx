"use client";

import React, { useState, useMemo } from "react";
import { useAppStore } from "@/lib/store";
import { isOverlapping, getBusinessDays, formatDate } from "@/lib/dateUtils";
import {
  Users,
  TrendingUp,
  Download,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Activity,
  BarChart3,
  Sparkles,
  LineChart,
  AlertCircle,
  Search
} from "lucide-react";

export default function UtilizationCenterPage() {
  const { developers, allocations, projects, leaves } = useAppStore();
  
  // UI State
  const [monthsToShow] = useState(6);
  const [startMonth, setStartMonth] = useState(new Date(2026, 0, 1));
  const [searchQuery, setSearchQuery] = useState("");
  const [activeView, setActiveTab] = useState<"forecast" | "stats" | "bench" | "offboarding" | "analytics">("forecast");

  // --- 1. Common Month Generation ---
  const reportMonths = useMemo(() => {
    const months = [];
    for (let i = 0; i < monthsToShow; i++) {
      const d = new Date(startMonth.getFullYear(), startMonth.getMonth() + i, 1);
      months.push({
        name: d.toLocaleString('default', { month: 'short' }),
        fullName: d.toLocaleString('default', { month: 'long', year: 'numeric' }),
        year: d.getFullYear(),
        month: d.getMonth(),
        start: new Date(d.getFullYear(), d.getMonth(), 1),
        end: new Date(d.getFullYear(), d.getMonth() + 1, 0),
      });
    }
    return months;
  }, [startMonth, monthsToShow]);

  // --- 1.5 Historical Month Generation ---
  const historicalMonths = useMemo(() => {
    const months = [];
    for (let i = 6; i > 0; i--) {
      const d = new Date(new Date().getFullYear(), new Date().getMonth() - i, 1);
      months.push({
        label: d.toLocaleString('default', { month: 'short' }),
        fullLabel: d.toLocaleString('default', { month: 'long', year: 'numeric' }),
        start: new Date(d.getFullYear(), d.getMonth(), 1),
        end: new Date(d.getFullYear(), d.getMonth() + 1, 0),
      });
    }
    return months;
  }, []);

  // --- 2. Utilization Logic (Forecast) ---
  const getDevMonthlyLoad = (devId: string, monthStart: Date, monthEnd: Date) => {
    const devAllocations = allocations.filter(a => a.developerId === devId);
    const activeInMonth = devAllocations.filter(a => isOverlapping(a.startDate, a.endDate, monthStart, monthEnd));
    const allocLoad = activeInMonth.reduce((sum, a) => sum + a.load, 0);
    const devLeaves = (leaves || []).filter(l => l.developerId === devId);
    const hasLeave = devLeaves.some(l => isOverlapping(l.startDate, l.endDate, monthStart, monthEnd));
    return allocLoad + (hasLeave ? 100 : 0);
  };

  const monthlyStats = useMemo(() => {
    const totalCapacityFTE = developers.length;
    return reportMonths.map(m => {
      const totalAllocatedLoad = developers.reduce((sum, dev) => {
        return sum + getDevMonthlyLoad(dev.id, m.start, m.end);
      }, 0);
      const utilizedFTE = totalAllocatedLoad / 100;
      const utilizationRate = totalCapacityFTE > 0 ? Math.round((utilizedFTE / totalCapacityFTE) * 100) : 0;
      return { ...m, utilizedFTE, utilizationRate };
    });
  }, [reportMonths, developers, allocations, leaves]);

  // --- 2.5 Historical Utilization Stats ---
  const historicalStats = useMemo(() => {
    const totalCapacityFTE = developers.length;
    return historicalMonths.map(m => {
      const totalAllocatedLoad = developers.reduce((sum, dev) => {
        return sum + getDevMonthlyLoad(dev.id, m.start, m.end);
      }, 0);
      const utilizedFTE = totalAllocatedLoad / 100;
      const utilizationRate = totalCapacityFTE > 0 ? Math.round((utilizedFTE / totalCapacityFTE) * 100) : 0;
      return { ...m, utilizedFTE, utilizationRate };
    });
  }, [historicalMonths, developers, allocations, leaves]);

  // --- 3. Workforce Stats Logic ---
  const workforceStats = useMemo(() => {
    const currentMonth = reportMonths[0];
    return developers
      .filter(dev => dev.name.toLowerCase().includes(searchQuery.toLowerCase()))
      .map(dev => {
        const devLeaves = leaves.filter(l => l.developerId === dev.id);
        let vacationDays = 0, sickDays = 0, holidayDays = 0, otherDays = 0;

        devLeaves.forEach(leave => {
          if (isOverlapping(leave.startDate, leave.endDate, currentMonth.start, currentMonth.end)) {
            const overlapStart = leave.startDate > currentMonth.start ? leave.startDate : currentMonth.start;
            const overlapEnd = leave.endDate < currentMonth.end ? leave.endDate : currentMonth.end;
            const days = leave.hours ? leave.hours / 8 : getBusinessDays(overlapStart, overlapEnd);
            
            if (leave.type === "Vacation") vacationDays += days;
            else if (leave.type === "Sick Leave") sickDays += days;
            else if (leave.type === "Public Holiday") holidayDays += days;
            else otherDays += days;
          }
        });

        const totalBusinessDays = getBusinessDays(currentMonth.start, currentMonth.end);
        const workedDays = Math.max(0, totalBusinessDays - (vacationDays + sickDays + holidayDays + otherDays));
        const presenceRate = totalBusinessDays > 0 ? Math.round((workedDays / totalBusinessDays) * 100) : 0;

        return { dev, workedDays, vacationDays, sickDays, holidayDays, presenceRate, totalBusinessDays };
      });
  }, [developers, leaves, reportMonths, searchQuery]);

  // --- 4. Bench Forecast Logic ---
  const benchForecast = useMemo(() => {
    return developers.map(dev => {
      const devAllocations = [...allocations]
        .filter(a => a.developerId === dev.id && a.status === "Confirmed")
        .sort((a, b) => b.endDate.getTime() - a.endDate.getTime());
      
      const currentLoad = getDevMonthlyLoad(dev.id, reportMonths[0].start, reportMonths[0].end);
      const lastProjectEnd = devAllocations.length > 0 ? formatDate(devAllocations[0].endDate) : "Available Now";
      
      return { dev, currentLoad, lastProjectEnd };
    }).filter(item => item.currentLoad < 80).sort((a, b) => a.currentLoad - b.currentLoad);
  }, [developers, allocations, leaves, reportMonths]);

  // --- 5. Off-boarding Logic ---
  const offboardingData = useMemo(() => {
    const todayTs = new Date().getTime();
    const getDaysAway = (date: Date) => {
      const diff = date.getTime() - todayTs;
      return diff / (1000 * 60 * 60 * 24);
    };

    const buckets = {
      imminent: [] as any[], // 2 weeks
      soon: [] as any[],     // 4 weeks
      upcoming: [] as any[]  // 8 weeks
    };

    developers.forEach(dev => {
      const devAllocations = allocations
        .filter(a => a.developerId === dev.id && a.status === "Confirmed")
        .sort((a, b) => b.endDate.getTime() - a.endDate.getTime());

      if (devAllocations.length === 0) return;

      const rollOffDate = devAllocations[0].endDate;
      const daysAway = getDaysAway(rollOffDate);

      const item = { dev, rollOffDate, daysAway, project: projects.find(p => p.id === devAllocations[0].projectId) };

      if (daysAway <= 14) buckets.imminent.push(item);
      else if (daysAway <= 28) buckets.soon.push(item);
      else if (daysAway <= 56) buckets.upcoming.push(item);
    });

    return buckets;
  }, [developers, allocations, projects]);

  // --- 6. Advanced Analytics Calculations ---
  const analyticsMetrics = useMemo(() => {
    let dailyBenchWaste = 0;
    developers.forEach(dev => {
      const currentLoad = getDevMonthlyLoad(dev.id, reportMonths[0].start, reportMonths[0].end);
      const unallocated = Math.max(0, (dev.capacity * 100) - currentLoad);
      dailyBenchWaste += (dev.dailyRate * (unallocated / 100));
    });

    const totalDoneOutcomes = projects.reduce((sum, p) => 
      sum + (p.phases?.reduce((ps, ph) => ps + (ph.outcomes?.filter(o => o.isDone).length || 0), 0) || 0)
    , 0);
    const currentFTE = monthlyStats[0].utilizedFTE;
    const velocity = currentFTE > 0 ? (totalDoneOutcomes / currentFTE).toFixed(1) : "0.0";

    return { 
      monthlyBenchWaste: dailyBenchWaste * 21, 
      velocity,
      totalInitiatives: projects.length,
      averageTeamSeniority: (developers.reduce((sum, d) => sum + (d.skills.reduce((s, sk) => s + sk.level, 0) / (d.skills.length || 1)), 0) / developers.length).toFixed(1)
    };
  }, [developers, reportMonths, monthlyStats, projects]);

  // --- 7. Export ---
  const handleExportCSV = () => {
    const headers = ["Month", "Engineer", "Worked Days", "Vacation", "Sick", "Presence %"];
    const rows = workforceStats.map(d => [
      reportMonths[0].fullName,
      d.dev.name,
      d.workedDays,
      d.vacationDays,
      d.sickDays,
      d.presenceRate
    ]);
    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `utilization_report.csv`;
    link.click();
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-primary" /> Utilization Center
          </h1>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-40 mt-1">Unified analytics for capacity & forecast</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-base-100 p-1 rounded-xl border border-base-200 shadow-sm">
            <button onClick={() => setStartMonth(new Date(startMonth.getFullYear(), startMonth.getMonth() - 1, 1))} className="btn btn-square btn-xs btn-ghost rounded-lg">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="text-[10px] font-black uppercase tracking-wider min-w-[100px] text-center flex items-center justify-center gap-2">
              <Calendar className="w-3 h-3 opacity-50" />
              {startMonth.toLocaleString('default', { month: 'short', year: 'numeric' })}
            </div>
            <button onClick={() => setStartMonth(new Date(startMonth.getFullYear(), startMonth.getMonth() + 1, 1))} className="btn btn-square btn-xs btn-ghost rounded-lg">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button className="btn btn-outline btn-xs gap-2 rounded-lg font-black uppercase tracking-widest text-[9px]" onClick={handleExportCSV}>
            <Download className="w-3 h-3" /> Export CSV
          </button>
        </div>
      </div>

      {/* Primary Tabs */}
      <div className="flex gap-2 p-1 bg-base-200/50 rounded-xl w-fit">
        {["forecast", "stats", "bench", "offboarding", "analytics"].map((tab) => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab as any)} 
            className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeView === tab ? 'bg-white shadow-sm text-primary' : 'hover:bg-white/50 opacity-50'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* View Content */}
      <div className="space-y-6">
        {activeView === "analytics" && (
          <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            {/* Executive Metrics Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-base-100 rounded-[2rem] p-6 shadow-lg border border-base-200">
                <div className="text-[9px] font-black uppercase tracking-[0.2em] opacity-40 mb-2 text-error">Bench Waste</div>
                <div className="text-2xl font-black tracking-tighter">${analyticsMetrics.monthlyBenchWaste.toLocaleString()}</div>
                <p className="text-[9px] font-bold opacity-40 mt-1 uppercase">Monthly Cost</p>
              </div>
              <div className="bg-base-100 rounded-[2rem] p-6 shadow-lg border border-base-200">
                <div className="text-[9px] font-black uppercase tracking-[0.2em] opacity-40 mb-2 text-primary">Velocity</div>
                <div className="text-2xl font-black tracking-tighter">{analyticsMetrics.velocity}</div>
                <p className="text-[9px] font-bold opacity-40 mt-1 uppercase">Outputs / FTE</p>
              </div>
              <div className="bg-base-100 rounded-[2rem] p-6 shadow-lg border border-base-200">
                <div className="text-[9px] font-black uppercase tracking-[0.2em] opacity-40 mb-2 text-secondary">Initiatives</div>
                <div className="text-2xl font-black tracking-tighter">{analyticsMetrics.totalInitiatives}</div>
                <p className="text-[9px] font-bold opacity-40 mt-1 uppercase">Total Projects</p>
              </div>
              <div className="bg-base-100 rounded-[2rem] p-6 shadow-lg border border-base-200">
                <div className="text-[9px] font-black uppercase tracking-[0.2em] opacity-40 mb-2 text-success">Seniority</div>
                <div className="text-2xl font-black tracking-tighter">{analyticsMetrics.averageTeamSeniority}</div>
                <p className="text-[9px] font-bold opacity-40 mt-1 uppercase">Avg Level</p>
              </div>
            </div>

            {/* Historical Pulse vs Forecast */}
            <div className="card bg-base-100 shadow-xl border border-base-200 overflow-hidden rounded-[2.5rem]">
              <div className="p-6 border-b border-base-200 bg-base-50/50 flex items-center justify-between">
                <h2 className="text-lg font-black uppercase tracking-tight flex items-center gap-3">
                  <BarChart3 className="w-5 h-5 text-primary" /> Portfolio Utilization Pulse
                </h2>
                <div className="badge badge-primary font-black uppercase text-[9px] tracking-widest px-3 py-2">Historical vs Forecast</div>
              </div>
              <div className="p-8">
                <div className="flex items-end gap-2 h-48 border-b border-base-200 pb-2 relative">
                  {/* Historical Bars */}
                  {historicalStats.map((m, i) => (
                    <div key={`hist-${i}`} className="flex-1 flex flex-col items-center gap-2 group">
                      <div 
                        className="w-full bg-base-300/50 rounded-t-lg transition-all duration-1000 group-hover:bg-base-300 relative overflow-hidden"
                        style={{ height: `${m.utilizationRate}%` }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent" />
                      </div>
                      <div className="text-[9px] font-black uppercase opacity-30 group-hover:opacity-60 transition-opacity">{m.label}</div>
                    </div>
                  ))}
                  
                  {/* Separator */}
                  <div className="w-px h-full bg-primary/20 relative mx-2"></div>

                  {/* Forecast Bars */}
                  {monthlyStats.map((m, i) => (
                    <div key={`fore-${i}`} className="flex-1 flex flex-col items-center gap-2 group">
                      <div 
                        className="w-full bg-primary/20 rounded-t-lg transition-all duration-1000 group-hover:bg-primary relative overflow-hidden"
                        style={{ height: `${m.utilizationRate}%` }}
                      >
                        <div className="absolute inset-0 bg-primary/10 animate-pulse" />
                      </div>
                      <div className="text-[9px] font-black uppercase opacity-30 group-hover:opacity-100 text-primary transition-opacity">{m.name}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Section: Efficiency & Insights */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-base-100 rounded-[2rem] p-6 shadow-lg border border-base-200">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-6 flex items-center gap-2">
                  <Activity className="w-4 h-4" /> Capacity Efficiency
                </h3>
                <div className="space-y-4">
                  {monthlyStats.slice(0, 4).map((m, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <div className="w-16 text-[9px] font-black uppercase opacity-40 text-right">{m.fullName.split(' ')[0]}</div>
                      <div className="flex-1 space-y-1">
                        <div className="flex justify-between text-[9px] font-bold">
                          <span className="opacity-50">Target (85%)</span>
                          <span>{m.utilizationRate}%</span>
                        </div>
                        <div className="w-full bg-base-200 rounded-full h-1.5">
                          <div className={`h-full rounded-full ${m.utilizationRate > 85 ? 'bg-error' : 'bg-primary'}`} style={{ width: `${Math.min(m.utilizationRate, 100)}%` }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-900 text-white rounded-[2rem] p-8 shadow-2xl relative overflow-hidden group border border-white/5">
                <div className="absolute top-0 right-0 p-8 opacity-5 transition-transform group-hover:scale-110 duration-1000">
                  <LineChart className="w-64 h-64 text-white" />
                </div>
                <div className="relative z-10">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-8 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" /> Strategic Insight
                  </h3>
                  <div className="space-y-6">
                    <div className="flex gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0 border border-white/10">
                        <AlertCircle className="w-5 h-5 text-amber-400" />
                      </div>
                      <div className="space-y-1">
                        <div className="text-[9px] font-black uppercase tracking-widest text-amber-400/60">Efficiency Alert</div>
                        <p className="text-sm font-medium leading-relaxed text-slate-300">
                          Increasing delivery velocity by 15% would eliminate <span className="text-rose-400 font-black">${analyticsMetrics.monthlyBenchWaste.toLocaleString()}</span> in monthly bench waste.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0 border border-white/10">
                        <TrendingUp className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div className="space-y-1">
                        <div className="text-[9px] font-black uppercase tracking-widest text-emerald-400/60">Pipeline Forecast</div>
                        <p className="text-sm font-medium leading-relaxed text-slate-300">
                          Peak contention expected in <span className="text-white font-black underline decoration-secondary decoration-2 underline-offset-4">{reportMonths[2]?.fullName || 'period'}</span>. Shift discovery phases forward.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeView === "forecast" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 card bg-base-100 shadow-xl border border-base-200 rounded-[2rem]">
              <div className="card-body p-8">
                <h2 className="text-lg font-black uppercase tracking-tight mb-6">Capacity Heatmap</h2>
                <div className="space-y-5">
                  {monthlyStats.map(m => (
                    <div key={m.name} className="space-y-1">
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-wide">
                        <span className="opacity-60">{m.fullName}</span>
                        <span className={m.utilizationRate > 90 ? 'text-error' : 'text-primary'}>{m.utilizationRate}% ({m.utilizedFTE.toFixed(1)} FTE)</span>
                      </div>
                      <div className="w-full bg-base-200/50 rounded-full h-3">
                        <div 
                          className={`h-3 rounded-full transition-all duration-500 ${ 
                            m.utilizationRate > 90 ? 'bg-error' : m.utilizationRate > 70 ? 'bg-success' : 'bg-warning'
                          }`}
                          style={{ width: `${Math.min(m.utilizationRate, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="space-y-4">
               <div className="bg-base-100 rounded-[2rem] p-8 border border-base-200 shadow-lg text-center">
                  <div className="text-[9px] font-black uppercase tracking-[0.2em] opacity-40 mb-2">Avg. Forecast Load</div>
                  <div className="text-5xl font-black text-primary tracking-tighter">
                    {Math.round(monthlyStats.reduce((s, m) => s + m.utilizationRate, 0) / monthlyStats.length)}%
                  </div>
                  <div className="text-[9px] font-bold opacity-40 mt-4 uppercase">Next {monthsToShow} months</div>
               </div>
            </div>
          </div>
        )}

        {activeView === "stats" && (
          <div className="card bg-base-100 shadow-xl border border-base-200 overflow-hidden rounded-[2rem]">
            <div className="p-4 bg-base-200/30 border-b border-base-200 flex justify-between items-center">
               <div className="relative w-48">
                  <Search className="w-3 h-3 absolute left-3 top-3 opacity-40" />
                  <input type="text" placeholder="FILTER ENGINEERS..." className="input input-sm input-bordered w-full pl-9 h-9 rounded-xl text-[10px] font-black uppercase" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
               </div>
               <div className="badge badge-ghost font-black text-[9px] uppercase tracking-widest">{reportMonths[0].fullName}</div>
            </div>
            <table className="table w-full">
              <thead>
                <tr className="bg-base-200/50 text-[9px] font-black uppercase tracking-widest opacity-60">
                  <th className="pl-6 py-4">Engineer</th>
                  <th className="text-center">Worked</th>
                  <th className="text-center">Vacation</th>
                  <th className="text-center">Sick</th>
                  <th className="text-center">Presence %</th>
                </tr>
              </thead>
              <tbody>
                {workforceStats.map(row => (
                  <tr key={row.dev.id} className="hover:bg-base-200/30">
                    <td className="pl-6 py-3">
                      <div className="flex items-center gap-3">
                        <div className="avatar">
                          <div className="w-8 h-8 mask mask-squircle shadow-sm"><img src={row.dev.avatarUrl} alt="" /></div>
                        </div>
                        <div className="font-black text-xs uppercase tracking-tight">{row.dev.name}</div>
                      </div>
                    </td>
                    <td className="text-center text-xs font-bold opacity-60">{row.workedDays}d</td>
                    <td className="text-center text-xs font-bold text-success">{row.vacationDays > 0 ? `${row.vacationDays}d` : '—'}</td>
                    <td className="text-center text-xs font-bold text-error">{row.sickDays > 0 ? `${row.sickDays}d` : '—'}</td>
                    <td className="text-center">
                      <div className={`badge badge-sm font-black border-none ${row.presenceRate > 80 ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>{row.presenceRate}%</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeView === "bench" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benchForecast.map(item => (
              <div key={item.dev.id} className="card bg-base-100 shadow-md border border-base-200 rounded-[2rem] hover:shadow-xl transition-all">
                <div className="card-body p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="avatar">
                      <div className="w-12 h-12 mask mask-squircle shadow-md"><img src={item.dev.avatarUrl} alt="" /></div>
                    </div>
                    <div>
                      <h3 className="font-black text-sm uppercase tracking-tight leading-none">{item.dev.name}</h3>
                      <p className="text-[9px] opacity-40 font-bold uppercase tracking-widest mt-1">{item.dev.role}</p>
                    </div>
                  </div>
                  <div className="space-y-2 bg-base-200/30 p-3 rounded-xl">
                    <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wide">
                      <span className="opacity-40">Load</span>
                      <span className={`${item.currentLoad === 0 ? 'text-success' : 'text-primary'}`}>{item.currentLoad}%</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wide">
                      <span className="opacity-40">Roll-off</span>
                      <span className="font-mono">{item.lastProjectEnd}</span>
                    </div>
                  </div>
                  <div className="card-actions mt-4">
                    <button className="btn btn-sm btn-block rounded-xl font-black uppercase tracking-widest text-[10px] btn-ghost bg-base-200 hover:bg-base-300 border-none">Flag Available</button>
                  </div>
                </div>
              </div>
            ))}
            {benchForecast.length === 0 && (
               <div className="col-span-full py-12 flex flex-col items-center justify-center border-2 border-dashed border-base-300 rounded-[2.5rem] opacity-40">
                  <Activity className="w-12 h-12 mb-3" />
                  <div className="font-black uppercase tracking-widest text-sm">No engineers currently available</div>
               </div>
            )}
          </div>
        )}

        {activeView === "offboarding" && (
          <div className="space-y-8">
            {[ 
              { label: "Imminent Roll-off (2 Weeks)", items: offboardingData.imminent, color: "text-error border-error/20 bg-error/5" },
              { label: "Approaching (4 Weeks)", items: offboardingData.soon, color: "text-warning border-warning/20 bg-warning/5" },
              { label: "Upcoming (8 Weeks)", items: offboardingData.upcoming, color: "text-info border-info/20 bg-info/5" }
            ].map(bucket => (
              <div key={bucket.label} className="space-y-4">
                <div className={`p-4 rounded-2xl border-l-4 font-black uppercase text-[10px] tracking-[0.2em] flex items-center justify-between ${bucket.color}`}>
                  {bucket.label}
                  <span className="badge badge-sm font-bold border-none shadow-sm bg-white/50">{bucket.items.length} Engineers</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {bucket.items.map((item: any) => (
                    <div key={item.dev.id} className="card bg-base-100 shadow-sm border border-base-200 hover:shadow-md transition-all rounded-[1.5rem]">
                      <div className="card-body p-4 flex-row items-center gap-4">
                        <div className="avatar">
                          <div className="w-10 h-10 mask mask-squircle shadow-sm">
                            <img src={item.dev.avatarUrl} alt="" />
                          </div>
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <h3 className="font-black text-xs uppercase tracking-tight truncate">{item.dev.name}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <div className={`w-1.5 h-1.5 rounded-full ${item.project?.color}`}></div>
                            <span className="text-[9px] font-bold opacity-50 uppercase truncate">{item.project?.name}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] font-mono font-black text-primary">{formatDate(item.rollOffDate)}</div>
                          <div className="text-[8px] font-bold uppercase opacity-40">{Math.ceil(item.daysAway)} days left</div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {bucket.items.length === 0 && (
                    <div className="col-span-full py-4 text-center text-[10px] font-black uppercase tracking-widest opacity-20 border border-dashed border-base-200 rounded-xl">
                      None in this window
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}