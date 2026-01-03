"use client";

import React, { useMemo } from "react";
import { useAppStore } from "@/lib/store";
import { 
  ShieldAlert, 
  CheckCircle2, 
  ArrowRight, 
  AlertTriangle,
  Lightbulb,
  Sparkles,
  TrendingUp,
  Briefcase
} from "lucide-react";
import Link from "next/link";

export default function SkillsGapPage() {
  const { projects, developers } = useAppStore();

  const analysis = useMemo(() => {
    return projects.map(project => {
      const requirements = project.requirements || [];
      const gaps: any[] = [];
      const matches: any[] = [];

      requirements.forEach(req => {
        // Find best developer for this skill
        const specialists = developers
          .map(d => {
            const skill = d.skills.find(s => s.name.toLowerCase() === req.name.toLowerCase());
            return { dev: d, skillLevel: skill ? skill.level : 0 };
          })
          .filter(s => s.skillLevel > 0)
          .sort((a, b) => b.skillLevel - a.skillLevel);

        if (specialists.length === 0 || specialists[0].skillLevel < req.level) {
          gaps.push({
            skill: req.name,
            required: req.level,
            available: specialists.length > 0 ? specialists[0].skillLevel : 0,
            bestCandidate: specialists.length > 0 ? specialists[0].dev.name : "No one"
          });
        } else {
          matches.push({
            skill: req.name,
            level: specialists[0].skillLevel,
            expert: specialists[0].dev.name
          });
        }
      });

      return { project, gaps, matches, score: requirements.length > 0 ? Math.round((matches.length / requirements.length) * 100) : 100 };
    });
  }, [projects, developers]);

  const globalGaps = useMemo(() => {
    const counts: Record<string, number> = {};
    analysis.forEach(a => a.gaps.forEach(g => {
      counts[g.skill] = (counts[g.skill] || 0) + 1;
    }));
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [analysis]);

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-black uppercase tracking-tight flex items-center gap-3">
          <ShieldAlert className="w-8 h-8 text-primary" /> Skills Gap Analysis
        </h1>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-40 mt-1">
          Technical capability audit & hiring roadmap
        </p>
      </div>

      {/* Top: Strategic Insights */}
      <div className="card bg-primary text-primary-content shadow-xl rounded-[2rem] border border-primary-content/10 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/5 rounded-full blur-3xl -mr-64 -mt-64 pointer-events-none"></div>
        
        <div className="card-body p-6 lg:p-8 md:flex-row md:items-start gap-8 relative z-10">
          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-3 mb-1">
               <div className="p-2 bg-white/10 rounded-xl">
                  <Lightbulb className="w-5 h-5" />
               </div>
               <div>
                  <h2 className="text-xl font-black uppercase tracking-tight leading-none">Strategic Insight</h2>
                  <div className="text-[9px] font-bold uppercase tracking-widest opacity-60 mt-0.5">AI-Powered Assessment</div>
               </div>
            </div>
            
            {globalGaps.length > 0 ? (
              <div className="space-y-4">
                <p className="font-medium opacity-90 text-sm leading-relaxed max-w-2xl">
                  Based on current project requirements, we've identified <span className="font-black underline decoration-secondary decoration-2 underline-offset-2">{globalGaps.length} critical skill shortages</span>. Addressing these areas will significantly improve project delivery confidence.
                </p>
                <div className="alert bg-white/10 border-none py-2 px-4 text-xs w-fit rounded-xl flex items-start">
                  <Sparkles className="w-4 h-4 text-yellow-300 mt-0.5 shrink-0" />
                  <span className="font-bold">Recommendation: Prioritize hiring or upskilling in the top 3 high-demand areas.</span>
                </div>
              </div>
            ) : (
              <p className="font-medium opacity-90 text-sm">Your team possesses 100% of the required capabilities for the active portfolio. Excellent resource planning.</p>
            )}
          </div>

          {globalGaps.length > 0 && (
            <div className="flex-none w-full md:w-72 bg-white/5 p-4 rounded-[1.5rem] border border-white/10 shadow-inner">
              <h4 className="text-[9px] font-black uppercase opacity-60 tracking-widest mb-4 flex items-center gap-2">
                 <TrendingUp className="w-3 h-3" /> High Demand Gaps
              </h4>
              <div className="space-y-2">
                {globalGaps.slice(0, 3).map(([skill, count], idx) => (
                  <div key={skill} className="flex justify-between items-center bg-white/10 p-3 rounded-lg border border-white/5 shadow-sm group hover:bg-white/20 transition-all">
                    <div className="flex items-center gap-3">
                       <span className="text-lg font-black opacity-30">{idx + 1}</span>
                       <span className="font-black uppercase text-[10px] tracking-tight">{skill}</span>
                    </div>
                    <span className="badge badge-secondary badge-sm font-black border-none shadow-sm text-[10px]">{count} Proj</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom: Project Breakdown Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {analysis.map(({ project, gaps, matches, score }) => (
          <div key={project.id} className="card bg-base-100 shadow-lg border border-base-200 rounded-[2rem] overflow-hidden hover:shadow-xl transition-all group">
            <div className="px-6 py-4 border-b border-base-200 flex justify-between items-center bg-base-100 relative">
              <div className="flex items-center gap-4 z-10">
                <div className={`w-10 h-10 rounded-xl ${project.color} shadow-md flex items-center justify-center text-white`}>
                   <Briefcase className="w-5 h-5" />
                </div>
                <div>
                   <h3 className="font-black uppercase text-base tracking-tight leading-none">{project.name}</h3>
                   <div className="text-[9px] uppercase font-bold opacity-40 tracking-widest mt-1">{project.client}</div>
                </div>
              </div>
              
              <div className="flex flex-col items-center z-10">
                 <div className={`radial-progress font-black text-[10px] ${score > 80 ? 'text-success' : score > 50 ? 'text-warning' : 'text-error'}`} style={{"--value": score, "--size": "2.5rem"} as any}>
                    {score}%
                 </div>
                 <div className="text-[7px] font-black uppercase tracking-widest opacity-30 mt-0.5">Coverage</div>
              </div>
            </div>

            <div className="card-body p-0">
              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-base-200 min-h-[180px]">
                {/* Secured Skills */}
                <div className="p-5 space-y-4">
                  <h4 className="text-[9px] font-black uppercase opacity-40 tracking-[0.2em] flex items-center gap-2">
                    <CheckCircle2 className="w-3 h-3 text-success" /> Secured Capabilities
                  </h4>
                  {matches.length === 0 && (
                     <div className="h-24 flex items-center justify-center opacity-30 border-2 border-dashed border-base-200 rounded-xl">
                        <span className="text-[9px] font-black uppercase">No Matches</span>
                     </div>
                  )}
                  <div className="space-y-2">
                    {matches.map(m => (
                      <div key={m.skill} className="flex items-center justify-between group/item p-1.5 -mx-2 rounded-lg hover:bg-base-200/50 transition-colors">
                        <span className="text-[10px] font-bold">{m.skill}</span>
                        <div className="text-right">
                           <div className="text-[8px] font-black uppercase opacity-60 tracking-wider">Lvl {m.level}</div>
                           <div className="text-[7px] opacity-40 font-bold truncate max-w-[70px]">{m.expert}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Gaps */}
                <div className="p-5 space-y-4 bg-error/5 relative overflow-hidden">
                  {/* Decorative background pattern */}
                  <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#ef4444 1px, transparent 1px)', backgroundSize: '16px 16px' }}></div>
                  
                  <h4 className="text-[9px] font-black uppercase opacity-60 text-error tracking-[0.2em] flex items-center gap-2">
                    <AlertTriangle className="w-3 h-3" /> Critical Gaps
                  </h4>
                  
                  {gaps.length === 0 ? (
                     <div className="h-full flex flex-col items-center justify-center text-success opacity-50">
                        <CheckCircle2 className="w-10 h-10 mb-2" />
                        <span className="text-[9px] font-black uppercase tracking-widest">Fully Staffed</span>
                     </div>
                  ) : (
                     <div className="space-y-3 relative z-10">
                       {gaps.map(g => (
                         <div key={g.skill} className="bg-white/60 p-3 rounded-lg border border-error/10 shadow-sm">
                           <div className="flex justify-between items-start mb-1.5">
                             <span className="text-xs font-black uppercase text-error tracking-tight">{g.skill}</span>
                             <span className="badge badge-error text-white font-black text-[8px] border-none shadow-sm h-5">LVL {g.required}</span>
                           </div>
                           <div className="flex justify-between items-center text-[8px] font-bold uppercase tracking-wide opacity-60">
                              <span>Best Internal:</span>
                              <span>{g.available > 0 ? `Lvl ${g.available}` : 'None'}</span>
                           </div>
                         </div>
                       ))}
                     </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="px-6 py-3 bg-base-50 text-right border-t border-base-200">
              <Link href={`/projects/${project.id}`} className="btn btn-ghost btn-xs rounded-lg gap-2 font-black uppercase text-[9px] tracking-widest opacity-60 hover:opacity-100 hover:bg-base-200">
                View Requirements <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}