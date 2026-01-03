"use client";

import React, { useState, useMemo } from "react";
import { useAppStore } from "@/lib/store";
import { LayoutGrid, Search, Filter, Sparkles, ChevronRight, User } from "lucide-react";
import Link from "next/link";

export default function SkillMatrixPage() {
  const { developers } = useAppStore();
  const [devSearch, setDevSearch] = useState("");
  const [skillSearch, setSkillSearch] = useState("");

  // --- 1. Data Transformation: Categorized Skills ---
  const categorizedSkills = useMemo(() => {
    const categories: Record<string, Set<string>> = {};
    
    developers.forEach(dev => {
      dev.skills.forEach(skill => {
        const cat = skill.category || "Uncategorized";
        if (!categories[cat]) categories[cat] = new Set();
        categories[cat].add(skill.name);
      });
    });

    // Convert to sorted array of objects
    return Object.entries(categories)
      .map(([name, skills]) => ({
        name,
        skills: Array.from(skills).sort()
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [developers]);

  const filteredDevelopers = useMemo(() => {
    return developers.filter((dev) =>
      dev.name.toLowerCase().includes(devSearch.toLowerCase()) ||
      dev.role.toLowerCase().includes(devSearch.toLowerCase())
    );
  }, [developers, devSearch]);

  const getSkillLevel = (devId: string, skillName: string) => {
    const dev = developers.find(d => d.id === devId);
    return dev?.skills.find(s => s.name === skillName)?.level || 0;
  };

  return (
    <div className="space-y-8 pb-20">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <LayoutGrid className="w-8 h-8 text-primary" /> Skill Matrix
        </h1>
        <p className="text-sm text-base-content/70 mt-1">
          High-density expertise mapping. Spot talent concentrations and critical skill gaps.
        </p>
      </div>

      {/* Global Controls */}
      <div className="flex flex-col lg:flex-row justify-between items-center gap-4 bg-base-100 p-4 rounded-2xl border border-base-200 shadow-sm sticky top-20 z-20">
        <div className="flex items-center gap-4 w-full lg:w-auto">
          <div className="relative flex-1 lg:w-64">
            <Search className="w-4 h-4 absolute left-3 top-3 opacity-40" />
            <input
              type="text"
              placeholder="Find engineer..."
              className="input input-bordered input-sm w-full pl-10 h-10 bg-base-200/20"
              value={devSearch}
              onChange={(e) => setDevSearch(e.target.value)}
            />
          </div>
          <div className="relative flex-1 lg:w-64">
            <Filter className="w-4 h-4 absolute left-3 top-3 opacity-40" />
            <input
              type="text"
              placeholder="Filter skills..."
              className="input input-bordered input-sm w-full pl-10 h-10 bg-base-200/20"
              value={skillSearch}
              onChange={(e) => setSkillSearch(e.target.value)}
            />
          </div>
        </div>
        
        <div className="flex items-center gap-6 text-[10px] uppercase font-black opacity-50 tracking-tighter">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary"></div> Expert (4-5)
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-secondary"></div> Proficient (3)
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-base-300"></div> Beginner (1-2)
          </div>
        </div>
      </div>

      {/* Categorized Matrix Sections */}
      <div className="space-y-12">
        {categorizedSkills.map((category) => {
          const filteredSkills = category.skills.filter(s => 
            s.toLowerCase().includes(skillSearch.toLowerCase())
          );

          if (filteredSkills.length === 0) return null;

          // Filter developers to only those who have at least one of these skills
          const devsWithSkillsInCategory = filteredDevelopers.filter(dev => 
            filteredSkills.some(skill => getSkillLevel(dev.id, skill) > 0)
          );

          if (devsWithSkillsInCategory.length === 0) return null;

          return (
            <section key={category.name} className="space-y-4">
              <div className="flex items-center gap-4">
                <h2 className="text-lg font-black uppercase tracking-widest text-primary flex items-center gap-2">
                  <Sparkles className="w-4 h-4" /> {category.name}
                </h2>
                <div className="h-px bg-base-300 flex-1 opacity-50"></div>
                <span className="badge badge-sm badge-ghost font-bold">{devsWithSkillsInCategory.length} Engineers</span>
              </div>

              <div className="bg-base-100 rounded-2xl shadow-sm border border-base-200 overflow-x-auto">
                <table className="table table-sm w-full table-pin-cols">
                  <thead>
                    <tr className="bg-base-200/30 text-[10px] uppercase opacity-60">
                      <th className="bg-base-100/80 backdrop-blur-md pl-6 py-4 w-64">Engineer</th>
                      {filteredSkills.map(skill => (
                        <th key={skill} className="text-center font-black min-w-[80px]">{skill}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {devsWithSkillsInCategory.map(dev => (
                      <tr key={dev.id} className="hover:bg-primary/5 transition-colors group">
                        <th className="bg-base-100 pl-6 py-3 border-r border-base-200 shadow-sm">
                          <Link href={`/reports/resource?devId=${dev.id}`} className="flex items-center gap-3 hover:text-primary transition-colors">
                            <div className="avatar">
                              <div className="w-8 h-8 mask mask-squircle shadow-sm bg-base-200">
                                <img src={dev.avatarUrl} alt="" />
                              </div>
                            </div>
                            <div className="text-left overflow-hidden">
                              <div className="font-bold text-sm truncate">{dev.name}</div>
                              <div className="text-[9px] opacity-50 uppercase truncate">{dev.role}</div>
                            </div>
                          </Link>
                        </th>
                        {filteredSkills.map(skill => {
                          const level = getSkillLevel(dev.id, skill);
                          return (
                            <td key={skill} className="text-center p-0">
                              <div className="flex items-center justify-center h-12">
                                {level > 0 ? (
                                  <div 
                                    className={`tooltip tooltip-top transition-all duration-300 transform group-hover:scale-110`} 
                                    data-tip={`${skill}: Level ${level}/5`}
                                  >
                                    <div 
                                      className={`w-6 h-6 rounded-lg shadow-sm flex items-center justify-center text-[10px] font-black
                                        ${level >= 4 ? 'bg-primary text-primary-content' : 
                                          level >= 3 ? 'bg-secondary text-secondary-content' : 
                                          'bg-base-300 text-base-content opacity-60'
                                        }`}
                                    >
                                      {level}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="w-1 h-1 rounded-full bg-base-300 opacity-20"></div>
                                )}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          );
        })}
      </div>

      {categorizedSkills.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 bg-base-100 rounded-3xl border-2 border-dashed border-base-300 opacity-40">
          <LayoutGrid className="w-16 h-16 mb-4" />
          <p className="text-xl font-medium italic">No skills or categories found in the database.</p>
        </div>
      )}
    </div>
  );
}
