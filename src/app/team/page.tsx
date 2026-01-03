"use client";

import React, { useState, useEffect, useMemo } from "react";
import DeveloperCard from "@/components/DeveloperCard";
import { useAppStore } from "@/lib/store";
import { DeveloperWithSkills, Skill, Tag } from "@/types";
import { Plus, X, Trash2, LayoutGrid, List as ListIcon, Search, Pencil, Users, TrendingUp, Sparkles, Hash } from "lucide-react";
import TagSelector from "@/components/TagSelector";

export default function TeamPage() {
  const { developers, addDeveloper, updateDeveloper, deleteDeveloper } = useAppStore();
  
  // UI State
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDev, setEditingDev] = useState<DeveloperWithSkills | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [capacity, setCapacity] = useState(100);
  const [dailyRate, setDailyRate] = useState(0);
  const [isPlaceholder, setIsPlaceholder] = useState(false);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);

  // New Skill State
  const [newSkillName, setNewSkillName] = useState("");
  const [newSkillLevel, setNewSkillLevel] = useState(3);
  const [newSkillCategory, setNewSkillCategory] = useState("Framework");

  useEffect(() => {
    if (editingDev) {
      setName(editingDev.name);
      setRole(editingDev.role);
      setAvatarUrl(editingDev.avatarUrl);
      setCapacity(editingDev.capacity ? Math.round(editingDev.capacity * 100) : 100);
      setDailyRate(editingDev.dailyRate || 0);
      setIsPlaceholder(!!editingDev.isPlaceholder);
      setSkills(editingDev.skills || []);
      setSelectedTags(editingDev.tags || []);
    } else {
      setName("");
      setRole("");
      setAvatarUrl(`https://api.dicebear.com/7.x/avataaars/svg?seed=${Math.random()}`);
      setCapacity(100);
      setDailyRate(0);
      setIsPlaceholder(false);
      setSkills([]);
      setSelectedTags([]);
    }
  }, [editingDev, isModalOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const devData: DeveloperWithSkills = {
      id: editingDev ? editingDev.id : crypto.randomUUID(),
      name,
      role,
      avatarUrl: isPlaceholder ? "https://api.dicebear.com/7.x/shapes/svg?seed=placeholder" : avatarUrl,
      capacity: capacity / 100, // Store as 0.0-1.0
      dailyRate,
      isPlaceholder,
      skills,
      tags: selectedTags,
    };

    if (editingDev) {
      updateDeveloper(devData);
    } else {
      addDeveloper(devData);
    }

    setIsModalOpen(false);
    setEditingDev(null);
  };

  const handleEdit = (dev: DeveloperWithSkills) => {
    setEditingDev(dev);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this developer?")) {
      deleteDeveloper(id);
    }
  };

  const addSkill = () => {
    if (!newSkillName.trim()) return;
    setSkills([...skills, { name: newSkillName, level: newSkillLevel, category: newSkillCategory }]);
    setNewSkillName("");
    setNewSkillLevel(3);
    setNewSkillCategory("Framework");
  };

  const removeSkill = (indexToRemove: number) => {
    setSkills(skills.filter((_, index) => index !== indexToRemove));
  };

  // Filter developers
  const filteredDevelopers = useMemo(() => {
    return developers.filter(dev => 
      dev.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dev.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dev.skills.some(s => s.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      dev.tags?.some(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [developers, searchQuery]);

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight flex items-center gap-3">
            <Users className="w-8 h-8 text-primary" /> Squad Management
          </h1>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-40 mt-1">{developers.length} Members in directory</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Search */}
          <div className="relative md:w-64 w-full">
            <input 
              type="text" 
              placeholder="SEARCH SQUAD..." 
              className="input input-sm input-bordered w-full pl-9 bg-base-100 font-bold uppercase text-[10px] rounded-xl" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 opacity-40" />
          </div>

          {/* View Toggle */}
          <div className="join bg-base-100 p-1 rounded-xl border border-base-200 shadow-sm">
            <button 
              className={`btn btn-xs join-item ${viewMode === 'grid' ? 'btn-primary' : 'btn-ghost opacity-50'}`}
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button 
              className={`btn btn-xs join-item ${viewMode === 'list' ? 'btn-primary' : 'btn-ghost opacity-50'}`}
              onClick={() => setViewMode('list')}
            >
              <ListIcon className="w-3.5 h-3.5" />
            </button>
          </div>

          <button 
            className="btn btn-sm btn-primary gap-2 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-md"
            onClick={() => {
              setEditingDev(null);
              setIsModalOpen(true);
            }}
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Add Member</span>
          </button>
        </div>
      </div>

      {/* Content */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {filteredDevelopers.map((dev) => (
            <DeveloperCard 
              key={dev.id} 
              developer={dev} 
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : (
        <div className="card bg-base-100 shadow-xl border border-base-200 overflow-hidden rounded-[2rem] animate-in fade-in slide-in-from-bottom-4 duration-500">
          <table className="table w-full">
            <thead>
              <tr className="bg-base-200/50 text-[9px] font-black uppercase tracking-widest opacity-60">
                <th className="pl-8 py-4">Engineer</th>
                <th>Role</th>
                <th>Capacity</th>
                <th>Tags</th>
                <th className="text-right pr-8">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDevelopers.map((dev) => (
                <tr key={dev.id} className="hover:bg-base-200/30 group transition-colors">
                  <td className="pl-8 py-3">
                    <div className="flex items-center gap-4">
                      <div className={`avatar ${dev.isPlaceholder ? 'placeholder' : ''}`}>
                        <div className={`mask mask-squircle w-10 h-10 shadow-sm ${dev.isPlaceholder ? 'bg-neutral text-neutral-content' : ''}`}>
                          <img src={dev.avatarUrl} alt={dev.name} />
                        </div>
                      </div>
                      <div className="font-black text-xs uppercase tracking-tight">
                        {dev.name}
                        {dev.isPlaceholder && <span className="ml-2 badge badge-xs badge-neutral font-bold">Plan</span>}
                      </div>
                    </div>
                  </td>
                  <td className="text-[10px] font-bold opacity-60 uppercase tracking-widest">{dev.role}</td>
                  <td>
                    <div className="flex items-center gap-3">
                       <progress className="progress progress-primary w-16 h-1.5" value={dev.capacity * 100} max="100"></progress>
                       <span className="text-[10px] font-black">{Math.round(dev.capacity * 100)}%</span>
                    </div>
                  </td>
                  <td>
                    <div className="flex flex-wrap gap-1">
                      {dev.tags?.map(tag => (
                        <span key={tag.id} className={`badge ${tag.color} text-white border-none badge-xs font-black uppercase text-[8px] px-2 h-5`}>
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="text-right pr-8">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        className="btn btn-ghost btn-square btn-xs rounded-lg"
                        onClick={() => handleEdit(dev)}
                      >
                        <Pencil className="w-3.5 h-3.5 opacity-50" />
                      </button>
                      <button 
                        className="btn btn-ghost btn-square btn-xs rounded-lg text-error"
                        onClick={() => handleDelete(dev.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredDevelopers.length === 0 && (
            <div className="p-16 text-center opacity-30 flex flex-col items-center">
              <Search className="w-8 h-8 mb-2" />
              <p className="font-black uppercase tracking-widest text-xs">No matches found</p>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="modal modal-open">
          <div className="modal-box w-11/12 max-w-4xl p-0 overflow-hidden border border-base-300 shadow-2xl bg-base-100 rounded-[2.5rem]">
            <div className="bg-base-200/30 p-6 border-b border-base-200 flex justify-between items-center backdrop-blur-sm">
              <div>
                <h3 className="font-black text-2xl uppercase tracking-tight">
                  {editingDev ? "Update Resource" : "New Team Member"}
                </h3>
                <p className="text-[9px] opacity-50 font-black uppercase mt-1 tracking-widest">Resource Profile Configuration</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="btn btn-sm btn-circle btn-ghost"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* Left Column: Basic Info */}
                <div className="space-y-8">
                  <div className="space-y-4">
                    <h4 className="text-[9px] font-black uppercase text-primary tracking-widest flex items-center gap-2 opacity-50">
                      <Users className="w-3 h-3" /> Identity & Role
                    </h4>
                    
                    <div className="grid grid-cols-1 gap-4">
                      <div className="form-control w-full">
                        <label className="label py-1 font-black text-[9px] uppercase opacity-40">Full Name</label>
                        <input 
                          type="text" 
                          className="input input-sm input-bordered w-full bg-base-200/30 font-bold text-xs rounded-xl" 
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          required
                        />
                      </div>

                      <div className="form-control w-full">
                        <label className="label py-1 font-black text-[9px] uppercase opacity-40">Professional Title</label>
                        <input 
                          type="text" 
                          className="input input-sm input-bordered w-full bg-base-200/30 font-bold text-xs rounded-xl" 
                          value={role}
                          onChange={(e) => setRole(e.target.value)}
                          placeholder="e.g. Solution Architect"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-[9px] font-black uppercase text-primary tracking-widest flex items-center gap-2 opacity-50">
                      <TrendingUp className="w-3 h-3" /> Logistics
                    </h4>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="form-control w-full">
                        <label className="label py-1 flex justify-between">
                          <span className="font-black text-[9px] uppercase opacity-40">Availability</span>
                          <span className="text-[9px] font-black text-primary">{capacity}%</span>
                        </label>
                        <input 
                          type="range" 
                          min="0" 
                          max="100" 
                          step="10" 
                          value={capacity} 
                          onChange={(e) => setCapacity(parseInt(e.target.value))}
                          className="range range-primary range-xs mt-1" 
                        />
                      </div>

                      <div className="form-control w-full">
                        <label className="label py-1 font-black text-[9px] uppercase opacity-40">Daily Rate ($)</label>
                        <input 
                          type="number" 
                          className="input input-sm input-bordered w-full bg-base-200/30 font-bold text-xs rounded-xl" 
                          value={dailyRate}
                          onChange={(e) => setDailyRate(parseFloat(e.target.value))}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-[9px] font-black uppercase text-primary tracking-widest flex items-center gap-2 opacity-50">
                      <Hash className="w-3 h-3" /> Classification Tags
                    </h4>
                    <div className="bg-base-200/30 p-4 rounded-2xl border border-base-300">
                      <TagSelector 
                        selectedTags={selectedTags} 
                        onChange={setSelectedTags} 
                        category="Developer"
                      />
                    </div>
                  </div>
                </div>

                {/* Right Column: Skills & Visuals */}
                <div className="space-y-8 flex flex-col h-full">
                  <div className="space-y-4 flex-1">
                    <h4 className="text-[9px] font-black uppercase text-primary tracking-widest flex items-center gap-2 opacity-50">
                      <Sparkles className="w-3 h-3" /> Skills Matrix
                    </h4>

                    <div className="bg-base-200/30 rounded-2xl border border-base-300 p-4 space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                      {skills.length === 0 && <p className="text-[9px] opacity-30 italic font-bold text-center py-8 uppercase tracking-widest">Expertise pending</p>}
                      {skills.map((skill, index) => (
                        <div key={index} className="flex items-center gap-3 bg-base-100 p-2.5 rounded-xl border border-base-200 shadow-sm group/skill">
                          <div className="flex-1">
                            <div className="font-black text-[10px] uppercase tracking-tight">{skill.name}</div>
                            <div className="text-[8px] font-bold opacity-40 uppercase">{skill.category}</div>
                          </div>
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <div key={star} className={`w-1 h-2.5 rounded-full ${star <= skill.level ? 'bg-primary' : 'bg-base-300'}`}></div>
                            ))}
                          </div>
                          <button type="button" onClick={() => removeSkill(index)} className="btn btn-ghost btn-xs btn-square text-error opacity-0 group-hover/skill:opacity-100 transition-opacity">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="bg-base-100 border border-base-300 p-4 rounded-2xl shadow-sm space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <input type="text" className="input input-bordered input-sm font-bold uppercase text-[9px] rounded-xl" value={newSkillName} onChange={e => setNewSkillName(e.target.value)} placeholder="SKILL..." />
                        <input type="text" className="input input-bordered input-sm font-bold uppercase text-[9px] rounded-xl" value={newSkillCategory} onChange={e => setNewSkillCategory(e.target.value)} placeholder="CATEGORY..." />
                      </div>
                      <div className="flex items-center gap-4">
                        <input type="range" min="1" max="5" value={newSkillLevel} onChange={e => setNewSkillLevel(parseInt(e.target.value))} className="range range-xs range-primary flex-1" />
                        <button type="button" onClick={addSkill} className="btn btn-sm btn-primary px-4 rounded-xl font-black uppercase text-[9px] shadow-md h-8 min-h-0">Add</button>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-base-200/50 rounded-2xl border border-base-300 flex items-center gap-6 shadow-inner">
                    <div className="avatar">
                      <div className="w-14 h-14 mask mask-squircle shadow-xl bg-base-100">
                        <img src={avatarUrl} alt="" />
                      </div>
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="text-[9px] font-black uppercase tracking-widest opacity-40">Profile Image URL</div>
                      <input 
                        type="text" 
                        className="input input-xs input-bordered w-full bg-base-100 font-mono text-[9px] rounded-lg" 
                        value={avatarUrl}
                        onChange={e => setAvatarUrl(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-action mt-8 pt-6 border-t border-base-200">
                <button type="button" className="btn btn-ghost px-8 rounded-xl font-bold text-xs" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary px-12 shadow-lg rounded-xl font-black uppercase tracking-widest text-xs">
                  {editingDev ? "Save Changes" : "Create Profile"}
                </button>
              </div>
            </form>
          </div>
          <div className="modal-backdrop bg-base-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
        </div>
      )}
    </div>
  );
}