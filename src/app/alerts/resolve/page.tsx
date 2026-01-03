"use client";

import React, { Suspense, useState, useMemo, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { isOverlapping, formatDate } from "@/lib/dateUtils";
import { splitAllocation } from "@/lib/allocationUtils";
import { 
  AlertTriangle, 
  ArrowLeft, 
  Scale, 
  UserPlus, 
  Scissors, 
  Calendar,
  Zap,
  Info,
  Settings2,
  ArrowRight
} from "lucide-react";
import Link from "next/link";
import CapacityBalancerModal from "@/components/CapacityBalancerModal";
import { Allocation } from "@/types";

function ResolveConflictContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { 
    developers, 
    allocations, 
    projects, 
    leaves, 
    bulkResolve
  } = useAppStore();

  const [isBalancerOpen, setIsBalancerOpen] = useState(false);

  const devId = searchParams.get("devId");
  const start = searchParams.get("start");
  const end = searchParams.get("end");
  const periodLabel = searchParams.get("period") || "selected period";

  const developer = useMemo(() => developers.find((d) => d.id === devId), [developers, devId]);

  // --- 3-Week Context Timeline Logic ---
  const timelineWeeks = useMemo(() => {
    if (!start || !end) return [];
    const conflictStart = new Date(start);
    const conflictEnd = new Date(end);
    
    const windowStart = new Date(conflictStart);
    windowStart.setDate(windowStart.getDate() - 7);
    
    const windowEnd = new Date(conflictEnd);
    windowEnd.setDate(windowEnd.getDate() + 7);

    const cols = [];
    const current = new Date(windowStart);
    while (current <= windowEnd) {
      const s = new Date(current);
      const e = new Date(current);
      e.setDate(e.getDate() + 6);
      cols.push({ start: s, end: e, label: s.toLocaleString('default', { month: 'short', day: 'numeric' }) });
      current.setDate(current.getDate() + 7);
    }
    return cols;
  }, [start, end]);

  const devTimelineData = useMemo(() => {
    if (!devId || timelineWeeks.length === 0) return { relevantAllocations: [], relevantLeaves: [] };
    const windowStart = timelineWeeks[0].start;
    const windowEnd = timelineWeeks[timelineWeeks.length - 1].end;

    const relevantAllocations = allocations.filter(a => a.developerId === devId && isOverlapping(a.startDate, a.endDate, windowStart, windowEnd));
    const relevantLeaves = leaves.filter(l => l.developerId === devId && isOverlapping(l.startDate, l.endDate, windowStart, windowEnd));

    return { relevantAllocations, relevantLeaves };
  }, [allocations, leaves, devId, timelineWeeks]);

  const getProject = useCallback((id: string) => projects.find((p) => p.id === id), [projects]);

  const impactedAllocations = useMemo(() => 
    !devId || !start || !end ? [] : allocations.filter((a) => a.developerId === devId && isOverlapping(a.startDate, a.endDate, start, end)),
    [allocations, devId, start, end]
  );

  const impactedLeaves = useMemo(() => 
    !devId || !start || !end ? [] : leaves.filter((l) => l.developerId === devId && isOverlapping(l.startDate, l.endDate, start, end)),
    [leaves, devId, start, end]
  );

  const totalLoad = useMemo(() => impactedAllocations.reduce((sum, a) => sum + a.load, 0), [impactedAllocations]);
  const capacityPercent = useMemo(() => Math.round((developer?.capacity || 1) * 100), [developer]);
  
  const conflictingAllocations = useMemo(() => impactedAllocations.filter(a => 
    impactedLeaves.some(l => isOverlapping(a.startDate, a.endDate, l.startDate, l.endDate))
  ), [impactedAllocations, impactedLeaves]);
  
  const isLeaveConflict = conflictingAllocations.length > 0;
  const isOverload = totalLoad > capacityPercent && !isLeaveConflict;

  if (!devId || !start || !end || !developer) {
    return (
      <div className="p-8 text-center">
        <AlertTriangle className="w-12 h-12 text-error mx-auto mb-4" />
        <h2 className="text-xl font-bold">Invalid Resolution Request</h2>
        <p className="opacity-70 mt-2">Could not find the necessary conflict details.</p>
        <Link href="/alerts" className="btn btn-primary mt-6">Back to Alerts</Link>
      </div>
    );
  }

  // --- Smart Actions ---

  const handleAutoBalance = async () => {
    if (impactedAllocations.length === 0) return;
    
    const factor = capacityPercent / totalLoad;
    const conflictStart = new Date(start!);
    const conflictEnd = new Date(end!);

    const toDelete: string[] = [];
    const toCreate: Allocation[] = [];

    impactedAllocations.forEach((alloc) => {
      const { pre, during, post } = splitAllocation(alloc, conflictStart, conflictEnd);
      toDelete.push(alloc.id);
      if (pre) toCreate.push(pre);
      if (post) toCreate.push(post);
      if (during) {
        toCreate.push({
          ...during,
          load: Math.floor(during.load * factor)
        });
      }
    });

    await bulkResolve({ toDelete, toCreate });
    router.push("/alerts");
  };

  const handleSplitAroundLeave = async (alloc: any, leave: any) => {
    const { pre, post } = splitAllocation(alloc, new Date(leave.startDate), new Date(leave.endDate));
    
    await bulkResolve({ 
      toDelete: [alloc.id], 
      toCreate: [pre, post].filter(Boolean) as Allocation[] 
    });
    
    router.push("/alerts");
  };

  const findAlternativeResource = (alloc: any) => {
    const project = getProject(alloc.projectId);
    if (!project) return null;
    return developers.find(d => 
      d.id !== developer.id && 
      !d.isPlaceholder &&
      d.capacity >= (alloc.load / 100) &&
      !allocations.some(a => a.developerId === d.id && isOverlapping(a.startDate, a.endDate, alloc.startDate, alloc.endDate))
    );
  };

  // --- Bob's Recommendation Engine ---
  const recommendation = useMemo(() => {
    if (isLeaveConflict) {
      const targetAlloc = conflictingAllocations[0];
      const targetLeave = impactedLeaves.find(l => isOverlapping(targetAlloc.startDate, targetAlloc.endDate, l.startDate, l.endDate))!;
      
      const alt = findAlternativeResource(targetAlloc);
      if (alt) {
        return {
          title: `Reassign to ${alt.name}`,
          description: `Bob found an available expert (${alt.role}) who can take over ${getProject(targetAlloc.projectId)?.name} during this period.`,
          action: () => {
            bulkResolve({ 
              toDelete: [], 
              toCreate: [], 
              toUpdate: [{ ...targetAlloc, developerId: alt.id }] 
            });
            router.push("/alerts");
          },
          icon: <UserPlus className="w-6 h-6" />,
          color: "bg-success text-success-content"
        };
      }
      return {
        title: "Split Allocations",
        description: `Bob recommends splitting ${getProject(targetAlloc.projectId)?.name} into two parts to completely avoid the vacation period.`,
        action: () => handleSplitAroundLeave(targetAlloc, targetLeave),
        icon: <Scissors className="w-6 h-6" />,
        color: "bg-primary text-primary-content"
      };
    }

    if (isOverload) {
      return {
        title: "Auto-Balance to Fit",
        description: `Bob will automatically calculate and apply the correct proportional reduction to fit the ${capacityPercent}% capacity.`,
        action: handleAutoBalance,
        icon: <Scale className="w-6 h-6" />,
        color: "bg-primary text-primary-content"
      };
    }

    return null;
  }, [isLeaveConflict, isOverload, conflictingAllocations, impactedLeaves, developers, capacityPercent, totalLoad, bulkResolve, getProject, handleAutoBalance, handleSplitAroundLeave, router]);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/alerts" className="btn btn-ghost btn-circle">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div className="avatar">
            <div className="w-16 h-16 mask mask-squircle">
              <img src={developer.avatarUrl} alt={developer.name} />
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-bold">Resolve Conflict</h1>
            <p className="text-lg opacity-70">
              {developer.name} &bull; <span className="text-primary font-semibold">{periodLabel}</span>
            </p>
          </div>
        </div>
        <div className="flex gap-2">
           <div className={`badge badge-lg gap-2 p-4 font-bold ${isOverload ? 'badge-error' : 'badge-warning'}`}>
             <AlertTriangle className="w-4 h-4" />
             {isOverload ? 'Overload Detected' : 'Leave Conflict'}
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Context & Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Bob's Featured Recommendation */}
          {recommendation && (
            <div className={`card shadow-2xl border-2 border-primary animate-in fade-in slide-in-from-bottom-4 duration-500 ${recommendation.color}`}>
              <div className="card-body">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-white/20 rounded-xl">
                    {recommendation.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 fill-current text-yellow-300" />
                      <h2 className="text-xl font-black uppercase tracking-tight">Bob's Recommendation</h2>
                    </div>
                    <h3 className="text-2xl font-bold mt-1">{recommendation.title}</h3>
                    <p className="opacity-90 mt-2 text-lg leading-snug">{recommendation.description}</p>
                    <div className="card-actions justify-end mt-6">
                      <button 
                        onClick={recommendation.action}
                        className="btn btn-lg bg-white text-primary border-none hover:bg-base-200 px-8 shadow-xl"
                      >
                        Apply Recommended Fix
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Mini-Timeline Context */}
          <div className="card bg-base-100 shadow-xl border border-base-200 overflow-hidden">
            <div className="card-body p-0">
              <div className="bg-base-200/50 p-4 border-b border-base-200 flex items-center justify-between">
                <h2 className="font-bold flex items-center gap-2 text-xs uppercase tracking-widest opacity-60">
                  <Calendar className="w-4 h-4" /> Schedule Context (3-Week Window)
                </h2>
              </div>
              <div className="p-4 overflow-x-auto">
                <table className="table table-xs w-full border-separate border-spacing-1">
                  <thead>
                    <tr>
                      {timelineWeeks.map((w, i) => (
                        <th key={i} className="text-center p-1 opacity-50 font-bold">
                          {w.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      {timelineWeeks.map((w, i) => {
                        const isConflictWeek = isOverlapping(start!, end!, w.start, w.end);
                        const weekAllocations = devTimelineData.relevantAllocations.filter(a => isOverlapping(a.startDate, a.endDate, w.start, w.end));
                        const weekLeaves = devTimelineData.relevantLeaves.filter(l => isOverlapping(l.startDate, l.endDate, w.start, w.end));
                        const weekLoad = weekAllocations.reduce((sum, a) => sum + a.load, 0);
                        
                        return (
                          <td key={i} className={`p-2 rounded-xl border-2 transition-all ${isConflictWeek ? 'border-primary/30 bg-primary/5' : 'border-base-200'}`}>
                            <div className="flex flex-col gap-1 min-h-[60px] justify-center items-center">
                              {weekLeaves.length > 0 ? (
                                <div className="badge bg-amber-100 text-amber-800 border-amber-200 badge-xs font-bold w-full py-2">🌴 LEAVE</div>
                              ) : weekLoad > 0 ? (
                                <div className={`text-center space-y-1 w-full`}>
                                  <div className={`text-lg font-black ${weekLoad > (developer.capacity * 100) ? 'text-error' : 'text-primary'}`}>{weekLoad}%</div>
                                  <div className="flex flex-wrap justify-center gap-0.5">
                                    {weekAllocations.map(a => (
                                      <div key={a.id} className={`w-2 h-2 rounded-full ${getProject(a.projectId)?.color}`} title={getProject(a.projectId)?.name} />
                                    ))}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-[10px] opacity-20 italic">Empty</span>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="card bg-base-100 shadow-xl border border-base-200 overflow-hidden">
            <div className="card-body p-0">
              <div className="bg-base-200/50 p-4 border-b border-base-200 flex items-center justify-between">
                <h2 className="font-bold flex items-center gap-2">
                  <Info className="w-5 h-5 text-info" /> Current Allocations in Period
                </h2>
                <span className="badge badge-sm">{impactedAllocations.length} Projects</span>
              </div>
              <div className="divide-y divide-base-200">
                {impactedAllocations.map(alloc => {
                  const project = getProject(alloc.projectId);
                  return (
                    <div key={alloc.id} className="p-4 flex items-center justify-between hover:bg-base-200/20 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-lg ${project?.color} flex items-center justify-center text-white shadow-sm`}>
                           {project?.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-lg">{project?.name || 'Unknown Project'}</div>
                          <div className="text-xs opacity-60 flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> {formatDate(alloc.startDate)} <ArrowRight className="w-3 h-3" /> {formatDate(alloc.endDate)}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <div className="text-2xl font-black text-primary">{alloc.load}%</div>
                        <div className="text-[10px] uppercase font-bold tracking-wider opacity-40">Load</div>
                      </div>
                    </div>
                  );
                })}

                {impactedLeaves.map(leave => (
                   <div key={leave.id} className="p-4 bg-amber-50/30 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-800 border border-amber-200 flex items-center justify-center shadow-sm text-xl">
                         🌴
                      </div>
                      <div>
                        <div className="font-bold text-lg text-amber-900">{leave.type}</div>
                        <div className="text-xs opacity-60 flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> {formatDate(leave.startDate)} <ArrowRight className="w-3 h-3" /> {formatDate(leave.endDate)}
                        </div>
                      </div>
                    </div>
                    <div className="badge bg-amber-100 text-amber-800 border-amber-200 font-bold">ON LEAVE</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="card bg-base-100 shadow border border-base-200">
              <div className="card-body">
                <div className="stat p-0">
                  <div className="stat-title">Resource Utilization</div>
                  <div className={`stat-value ${isOverload ? 'text-error' : 'text-warning'}`}>{totalLoad}%</div>
                  <div className="stat-desc">Target capacity: {capacityPercent}%</div>
                  <progress className={`progress w-full mt-2 ${isOverload ? 'progress-error' : 'progress-warning'}`} value={totalLoad} max={capacityPercent}></progress>
                </div>
              </div>
            </div>
            <div className="card bg-base-100 shadow border border-base-200">
              <div className="card-body">
                 <h2 className="font-bold mb-2">Period Impact</h2>
                 <p className="text-sm opacity-70">
                   This conflict occurs during <span className="font-bold">{periodLabel}</span>. 
                   {isLeaveConflict ? " The developer has approved leave during this time." : " The total allocation exceeds their weekly hours."}
                 </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Alternative Options Panel */}
        <div className="space-y-6">
          <div className="card bg-base-100 shadow-xl border border-base-200">
            <div className="card-body">
              <h2 className="card-title flex items-center gap-2 mb-2">
                <Settings2 className="w-5 h-5 text-primary" /> Alternative Fixes
              </h2>
              <p className="text-xs opacity-70 mb-4">If you prefer not to use Bob's recommendation, you can use these manual tools:</p>
              
              <div className="space-y-3">
                <button 
                  onClick={() => setIsBalancerOpen(true)}
                  className="btn btn-outline w-full gap-3 justify-start h-auto py-3"
                >
                  <Scale className="w-5 h-5" /> 
                  <div className="text-left">
                    <div className="font-bold text-sm">Fine-tune Balance</div>
                    <div className="text-[10px] opacity-70 font-normal">Manually adjust % for each project</div>
                  </div>
                </button>

                <button 
                  onClick={() => router.push(`/projects/${impactedAllocations[0]?.projectId || ''}`)}
                  className="btn btn-ghost bg-base-200 hover:bg-base-300 w-full gap-3 justify-start h-auto py-3"
                >
                  <Calendar className="w-5 h-5" /> 
                  <div className="text-left">
                    <div className="font-bold text-sm">Manual Rescheduling</div>
                    <div className="text-[10px] opacity-70 font-normal">Edit dates on the project timeline</div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <CapacityBalancerModal 
        isOpen={isBalancerOpen}
        onClose={() => setIsBalancerOpen(false)}
        developer={developer}
        targetAllocations={impactedAllocations}
        periodLabel={periodLabel}
      />
    </div>
  );
}

export default function ResolveConflictPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen w-full items-center justify-center bg-base-100">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    }>
      <ResolveConflictContent />
    </Suspense>
  );
}