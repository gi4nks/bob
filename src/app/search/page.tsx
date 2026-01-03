"use client";

import React, { useState, useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { isOverlapping, formatDate } from "@/lib/dateUtils";
import { DeveloperWithSkills } from "@/types";
import { Sparkles, Search, Filter, Briefcase, Calendar, ArrowRight, User } from "lucide-react";
import Link from "next/link";

export default function SmartMatchPage() {
  const { developers, allocations, leaves, projects } = useAppStore();
  
  // Search Criteria
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [selectedPhaseId, setSelectedPhaseId] = useState("");
  const [requiredSkill, setRequiredSkill] = useState("");
  const [minLevel, setMinLevel] = useState(3);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [minCapacity, setMinCapacity] = useState(50); // % available

  const [matches, setMatches] = useState<{dev: DeveloperWithSkills, score: number, availability: number, skillLevel: number}[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  // Sync criteria when project/phase changes
  useEffect(() => {
    if (!selectedProjectId) return;
    const project = projects.find(p => p.id === selectedProjectId);
    if (!project) return;

    if (selectedPhaseId) {
      const phase = project.phases?.find(ph => ph.id === selectedPhaseId);
      if (phase) {
        setStartDate(formatDate(phase.startDate));
        setEndDate(formatDate(phase.endDate));
        // If phase has requirements, pick the first one as default skill
        if (project.requirements && project.requirements.length > 0) {
           const req = project.requirements.find(r => r.phaseId === phase.id) || project.requirements[0];
           setRequiredSkill(req.name);
           setMinLevel(req.level);
        }
      }
    } else {
      // General project search
      if (project.startDate) setStartDate(formatDate(project.startDate));
      if (project.endDate) setEndDate(formatDate(project.endDate));
      if (project.requirements && project.requirements.length > 0) {
        setRequiredSkill(project.requirements[0].name);
        setMinLevel(project.requirements[0].level);
      }
    }
  }, [selectedProjectId, selectedPhaseId, projects]);

  // Derive unique skills for autocomplete
  const allSkills = Array.from(new Set(developers.flatMap(d => d.skills.map(s => s.name)))).sort();

  const handleSearch = () => {
    if (!startDate || !endDate) return;
    setHasSearched(true);

    const results = developers.map(dev => {
      // 1. Skill Match
      const skill = dev.skills.find(s => s.name.toLowerCase() === requiredSkill.toLowerCase());
      if (requiredSkill && !skill) return null; // Must match skill if specified
      if (skill && skill.level < minLevel) return null; // Must meet level

      const skillScore = skill ? skill.level * 20 : 0; // Max 100

      // 2. Availability Calculation
      const activeAllocations = (allocations || []).filter(a => 
        a.developerId === dev.id && isOverlapping(a.startDate, a.endDate, startDate, endDate)
      );
      
      const activeLeaves = (leaves || []).filter(l => 
        l.developerId === dev.id && isOverlapping(l.startDate, l.endDate, startDate, endDate)
      );

      const currentLoad = activeAllocations.reduce((sum, a) => sum + a.load, 0);
      const isLeave = activeLeaves.length > 0;
      
      const effectiveCapacity = isLeave ? 0 : (dev.capacity * 100);
      const availability = Math.max(0, effectiveCapacity - currentLoad);

      if (availability < minCapacity) return null;

      // 3. Final Score (Weighted: 60% Availability, 40% Skill)
      const score = (availability * 0.6) + (skillScore * 0.4);

      return {
        dev,
        score,
        availability,
        skillLevel: skill ? skill.level : 0
      };
    }).filter(Boolean) as {dev: DeveloperWithSkills, score: number, availability: number, skillLevel: number}[];

    // Sort by Score DESC
    results.sort((a, b) => b.score - a.score);
    setMatches(results);
  };

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-black uppercase tracking-tight flex items-center gap-3">
           <Sparkles className="w-7 h-7 text-primary" /> Smart Match Engine
        </h1>
        <p className="text-[9px] font-bold uppercase tracking-[0.2em] opacity-40 mt-1">
          Heuristic resource allocation assistant
        </p>
      </div>

      {/* Search Panel */}
      <div className="card bg-base-100 shadow-xl border border-base-200 rounded-[2rem] overflow-hidden">
        <div className="card-body p-6 lg:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Context Section */}
            <div className="space-y-4">
              <h4 className="text-[9px] font-black uppercase text-primary tracking-widest flex items-center gap-2 opacity-50">
                <Briefcase className="w-3 h-3" /> 01. Context
              </h4>
              <div className="space-y-3">
                <div className="form-control w-full">
                  <label className="label py-1"><span className="label-text text-[10px] font-black uppercase tracking-wide opacity-70">Target Project</span></label>
                  <select 
                    className="select select-bordered select-sm w-full bg-base-200/30 rounded-xl font-bold text-xs"
                    value={selectedProjectId}
                    onChange={(e) => { setSelectedProjectId(e.target.value); setSelectedPhaseId(""); }}
                  >
                    <option value="">Manual Search (No Project)</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>

                {selectedProjectId && (
                  <div className="form-control w-full animate-in fade-in slide-in-from-top-2 duration-300">
                    <label className="label py-1"><span className="label-text text-[10px] font-black uppercase tracking-wide opacity-70">Target Phase</span></label>
                    <select 
                      className="select select-bordered select-sm w-full bg-base-200/30 rounded-xl font-bold text-xs"
                      value={selectedPhaseId}
                      onChange={(e) => setSelectedPhaseId(e.target.value)}
                    >
                      <option value="">Full Project Lifecycle</option>
                      {projects.find(p => p.id === selectedProjectId)?.phases?.map(ph => (
                        <option key={ph.id} value={ph.id}>{ph.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* Requirement Section */}
            <div className="space-y-4">
              <h4 className="text-[9px] font-black uppercase text-primary tracking-widest flex items-center gap-2 opacity-50">
                <Sparkles className="w-3 h-3" /> 02. Expertise
              </h4>
              <div className="space-y-3">
                <div className="form-control w-full">
                  <label className="label py-1"><span className="label-text text-[10px] font-black uppercase tracking-wide opacity-70">Required Skill</span></label>
                  <input 
                    list="skills-list"
                    type="text" 
                    className="input input-bordered input-sm w-full bg-base-200/30 rounded-xl font-bold text-xs" 
                    placeholder="e.g. React"
                    value={requiredSkill}
                    onChange={(e) => setRequiredSkill(e.target.value)}
                  />
                  <datalist id="skills-list">
                    {allSkills.map(s => <option key={s} value={s} />)}
                  </datalist>
                </div>

                <div className="form-control w-full">
                  <div className="flex justify-between items-center mb-1">
                    <span className="label-text text-[10px] font-black uppercase tracking-wide opacity-70">Min Proficiency</span>
                    <span className="badge badge-primary font-black text-[9px] h-4">LVL {minLevel}</span>
                  </div>
                  <input 
                    type="range" 
                    min="1" 
                    max="5" 
                    value={minLevel} 
                    onChange={(e) => setMinLevel(parseInt(e.target.value))}
                    className="range range-xs range-primary" 
                  />
                  <div className="w-full flex justify-between text-[8px] px-1 mt-0.5 font-bold opacity-30 uppercase">
                    <span>Junior</span><span>Senior</span><span>Expert</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Timing Section */}
            <div className="space-y-4">
              <h4 className="text-[9px] font-black uppercase text-primary tracking-widest flex items-center gap-2 opacity-50">
                <Calendar className="w-3 h-3" /> 03. Availability
              </h4>
              <div className="space-y-3">
                 <div className="flex items-center gap-2">
                    <div className="form-control w-full">
                      <label className="label py-1"><span className="label-text text-[10px] font-black uppercase tracking-wide opacity-70">From</span></label>
                      <input type="date" className="input input-bordered input-sm w-full bg-base-200/30 rounded-xl font-bold text-[10px]" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                    </div>
                    <ArrowRight className="w-3 h-3 mt-6 opacity-20" />
                    <div className="form-control w-full">
                      <label className="label py-1"><span className="label-text text-[10px] font-black uppercase tracking-wide opacity-70">To</span></label>
                      <input type="date" className="input input-bordered input-sm w-full bg-base-200/30 rounded-xl font-bold text-[10px]" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                    </div>
                 </div>

                <div className="form-control w-full">
                  <div className="flex justify-between items-center mb-1">
                     <span className="label-text text-[10px] font-black uppercase tracking-wide opacity-70">Min Capacity</span>
                     <span className="text-primary font-black text-[10px]">{minCapacity}% Free</span>
                  </div>
                  <input 
                    type="range" 
                    min="10" 
                    max="100" 
                    step="10"
                    value={minCapacity} 
                    onChange={(e) => setMinCapacity(parseInt(e.target.value))}
                    className="range range-xs" 
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div className="divider opacity-10 my-6"></div>
          
          <div className="flex justify-end">
            <button 
              className="btn btn-primary btn-sm rounded-xl px-8 h-10 shadow-lg hover:shadow-xl hover:scale-105 transition-all text-[10px] font-black uppercase tracking-widest disabled:opacity-50"
              onClick={handleSearch}
              disabled={!startDate || !endDate}
            >
              <Search className="w-4 h-4" /> Run Match Engine
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      {hasSearched && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between">
             <h2 className="text-lg font-black uppercase tracking-tight flex items-center gap-3 opacity-60">
               <Filter className="w-4 h-4" /> Matching Candidates ({matches.length})
             </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {matches.map((match, idx) => (
              <div key={match.dev.id} className="card bg-base-100 shadow-xl hover:shadow-2xl transition-all border border-base-200 rounded-[2rem] overflow-hidden group">
                <div className="card-body p-6 relative">
                   <div className="absolute top-0 right-0 p-4 opacity-5 text-7xl font-black select-none pointer-events-none group-hover:opacity-10 transition-opacity">
                      {idx + 1}
                   </div>

                   <div className="flex items-start justify-between mb-4 relative z-10">
                      <div className="flex items-center gap-4">
                         <div className="avatar">
                            <div className="w-12 h-12 mask mask-squircle shadow-lg bg-base-100">
                               <img src={match.dev.avatarUrl} alt={match.dev.name} />
                            </div>
                         </div>
                         <div>
                            <div className="font-black text-base uppercase tracking-tight leading-none">{match.dev.name}</div>
                            <div className="text-[9px] font-bold opacity-40 uppercase tracking-widest mt-1">{match.dev.role}</div>
                         </div>
                      </div>
                      
                      <div className="flex flex-col items-center">
                         <div className="radial-progress text-primary text-[10px] font-black" style={{"--value": match.score, "--size": "2.8rem"} as any} role="progressbar">
                            {Math.round(match.score)}
                         </div>
                         <div className="text-[7px] font-bold uppercase tracking-widest opacity-40 mt-1">Match</div>
                      </div>
                   </div>
                   
                   <div className="space-y-2 relative z-10">
                      <div className="flex justify-between items-center bg-base-200/50 p-2 rounded-lg border border-base-200/50">
                         <span className="text-[9px] font-black uppercase tracking-widest opacity-40">Skill Fit</span>
                         {match.skillLevel > 0 ? (
                            <span className="badge badge-primary font-bold text-[8px] h-4">{requiredSkill} • LVL {match.skillLevel}</span>
                         ) : (
                            <span className="text-[9px] font-bold italic opacity-40">General Availability</span>
                         )}
                      </div>
                      <div className="flex justify-between items-center bg-base-200/50 p-2 rounded-lg border border-base-200/50">
                         <span className="text-[9px] font-black uppercase tracking-widest opacity-40">Availability</span>
                         <span className={`font-black text-xs ${match.availability >= 80 ? 'text-success' : 'text-warning'}`}>
                            {match.availability}% Free
                         </span>
                      </div>
                   </div>

                   <div className="card-actions justify-end mt-6 relative z-10">
                      <Link href={`/reports/resource?devId=${match.dev.id}`} className="btn btn-xs btn-ghost gap-2 rounded-lg font-black uppercase tracking-widest text-[9px] group-hover:bg-base-200">
                         View Profile <ArrowRight className="w-3 h-3" />
                      </Link>
                   </div>
                </div>
              </div>
            ))}
          </div>

          {matches.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 bg-base-100 rounded-[2rem] border-2 border-dashed border-base-200 opacity-40">
               <Search className="w-12 h-12 mb-3" />
               <div className="font-black uppercase tracking-widest text-base">No matches found</div>
               <div className="text-[10px] font-bold mt-1">Try lowering requirements</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
