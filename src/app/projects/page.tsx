"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useAppStore } from "@/lib/store";
import { Project, Tag } from "@/types";
import ProjectCard from "@/components/ProjectCard";
import { 
  Plus, 
  X, 
  Pencil, 
  Trash2, 
  LayoutGrid, 
  List as ListIcon, 
  Search, 
  Calendar, 
  Briefcase, 
  TrendingUp, 
  Sparkles,
  CheckCircle2,
  Clock,
  AlertCircle,
  Archive,
  ArrowRight,
  Hash
} from "lucide-react";
import { formatDate } from "@/lib/dateUtils";
import TagSelector from "@/components/TagSelector";

export default function ProjectsPage() {
  const { projects, addProject, updateProject, deleteProject } = useAppStore();
  
  // UI State
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [activeTab, setActiveTab] = useState<string>("Active");

  // Form State
  const [name, setName] = useState("");
  const [client, setClient] = useState("");
  const [color, setColor] = useState("bg-blue-600");
  const [status, setStatus] = useState("Active");
  const [budget, setBudget] = useState(0);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);

  useEffect(() => {
    if (editingProject) {
      setName(editingProject.name);
      setClient(editingProject.client);
      setColor(editingProject.color);
      setStatus(editingProject.status || "Active");
      setBudget(editingProject.budget || 0);
      setStartDate(editingProject.startDate ? formatDate(editingProject.startDate) : "");
      setEndDate(editingProject.endDate ? formatDate(editingProject.endDate) : "");
      setSelectedTags(editingProject.tags || []);
    } else {
      setName("");
      setClient("");
      setColor("bg-blue-600");
      setStatus("Active");
      setBudget(0);
      setStartDate("");
      setEndDate("");
      setSelectedTags([]);
    }
  }, [editingProject, isModalOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const projectData: Project = {
      id: editingProject ? editingProject.id : crypto.randomUUID(),
      name,
      client,
      color,
      status,
      budget,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      tags: selectedTags,
    };

    if (editingProject) {
      updateProject(projectData);
    } else {
      addProject(projectData);
    }

    setIsModalOpen(false);
    setEditingProject(null);
  };

  const handleEdit = (proj: Project) => {
    setEditingProject(proj);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this project?")) {
      deleteProject(id);
    }
  };

  const statusPriority: Record<string, number> = {
    "Active": 1,
    "Discovery": 2,
    "On Hold": 3,
    "Completed": 4
  };

  const stats = useMemo(() => ({
    active: projects.filter(p => p.status === "Active").length,
    discovery: projects.filter(p => p.status === "Discovery").length,
    onHold: projects.filter(p => p.status === "On Hold").length,
    completed: projects.filter(p => p.status === "Completed").length,
  }), [projects]);

  const filteredProjects = useMemo(() => {
    return projects
      .filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            p.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            p.tags?.some(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesTab = activeTab === "All" || p.status === activeTab;
        return matchesSearch && matchesTab;
      })
      .sort((a, b) => {
        const pA = statusPriority[a.status] || 99;
        const pB = statusPriority[b.status] || 99;
        if (pA !== pB) return pA - pB;
        return a.name.localeCompare(b.name);
      });
  }, [projects, searchQuery, activeTab]);

  const colorOptions = [
    { label: "Blue", value: "bg-blue-600" },
    { label: "Indigo", value: "bg-indigo-600" },
    { label: "Violet", value: "bg-violet-600" },
    { label: "Emerald", value: "bg-emerald-600" },
    { label: "Amber", value: "bg-amber-500" },
    { label: "Rose", value: "bg-rose-600" },
    { label: "Cyan", value: "bg-cyan-600" },
    { label: "Slate", value: "bg-slate-600" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Portfolio Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tight">Project Portfolio</h1>
          <p className="text-base-content/60 font-medium mt-1">Strategic oversight of all engineering initiatives.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="join bg-base-100 shadow-sm border border-base-300">
            <button 
              className={`btn btn-sm join-item ${viewMode === 'grid' ? 'btn-active btn-primary' : 'btn-ghost'}`}
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button 
              className={`btn btn-sm join-item ${viewMode === 'list' ? 'btn-active btn-primary' : 'btn-ghost'}`}
              onClick={() => setViewMode('list')}
            >
              <ListIcon className="w-4 h-4" />
            </button>
          </div>

          <button 
            className="btn btn-primary shadow-lg gap-2 h-11 px-6 rounded-2xl font-black uppercase text-xs tracking-widest"
            onClick={() => {
              setEditingProject(null);
              setIsModalOpen(true);
            }}
          >
            <Plus className="w-5 h-5" />
            New Initiative
          </button>
        </div>
      </div>

      {/* Portfolio KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <button 
          onClick={() => setActiveTab("Active")}
          className={`stat bg-base-100 rounded-2xl border transition-all hover:border-primary cursor-pointer ${activeTab === 'Active' ? 'border-primary ring-2 ring-primary/10 shadow-lg' : 'border-base-200 shadow-sm'}`}
        >
          <div className="stat-figure text-primary"><Clock className="w-6 h-6" /></div>
          <div className="stat-title text-[10px] font-black uppercase opacity-50 tracking-widest">Active</div>
          <div className="stat-value text-2xl">{stats.active}</div>
        </button>
        
        <button 
          onClick={() => setActiveTab("Discovery")}
          className={`stat bg-base-100 rounded-2xl border transition-all hover:border-secondary cursor-pointer ${activeTab === 'Discovery' ? 'border-secondary ring-2 ring-secondary/10 shadow-lg' : 'border-base-200 shadow-sm'}`}
        >
          <div className="stat-figure text-secondary"><Sparkles className="w-6 h-6" /></div>
          <div className="stat-title text-[10px] font-black uppercase opacity-50 tracking-widest">Discovery</div>
          <div className="stat-value text-2xl">{stats.discovery}</div>
        </button>

        <button 
          onClick={() => setActiveTab("On Hold")}
          className={`stat bg-base-100 rounded-2xl border transition-all hover:border-warning cursor-pointer ${activeTab === 'On Hold' ? 'border-warning ring-2 ring-warning/10 shadow-lg' : 'border-base-200 shadow-sm'}`}
        >
          <div className="stat-figure text-warning"><AlertCircle className="w-6 h-6" /></div>
          <div className="stat-title text-[10px] font-black uppercase opacity-50 tracking-widest">On Hold</div>
          <div className="stat-value text-2xl">{stats.onHold}</div>
        </button>

        <button 
          onClick={() => setActiveTab("Completed")}
          className={`stat bg-base-100 rounded-2xl border transition-all hover:border-success cursor-pointer ${activeTab === 'Completed' ? 'border-success ring-2 ring-success/10 shadow-lg' : 'border-base-200 shadow-sm'}`}
        >
          <div className="stat-figure text-success"><CheckCircle2 className="w-6 h-6" /></div>
          <div className="stat-title text-[10px] font-black uppercase opacity-50 tracking-widest">Done</div>
          <div className="stat-value text-2xl">{stats.completed}</div>
        </button>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col lg:flex-row justify-between items-center gap-4 bg-base-100 p-4 rounded-3xl border border-base-300 shadow-xl">
        <div className="tabs tabs-boxed bg-transparent p-0">
          {["Active", "Discovery", "On Hold", "Completed", "All"].map(t => (
            <button 
              key={t}
              onClick={() => setActiveTab(t)} 
              className={`tab tab-sm font-bold uppercase text-[10px] tracking-widest ${activeTab === t ? 'tab-active !bg-primary !text-white' : ''}`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="relative w-full lg:w-96">
          <Search className="w-4 h-4 absolute left-4 top-3 opacity-40" />
          <input 
            type="text" 
            placeholder="Search name, client, or #tag..." 
            className="input input-bordered input-sm w-full pl-12 h-10 font-bold bg-base-200/30"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Content Rendering */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <ProjectCard 
              key={project.id} 
              project={project} 
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : (
        <div className="bg-base-100 rounded-[2.5rem] shadow-2xl border border-base-300 overflow-hidden">
          <table className="table w-full">
            <thead>
              <tr className="bg-base-200/50 text-[10px] font-black uppercase tracking-widest opacity-50">
                <th className="pl-10 py-6">Project Entity</th>
                <th>Client</th>
                <th>Phase Status</th>
                <th>Tags</th>
                <th>Timeline Window</th>
                <th className="text-right pr-10">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProjects.map((project) => (
                <tr key={project.id} className="hover:bg-base-200/30 group transition-colors">
                  <td className="pl-10 py-5">
                    <div className="flex items-center gap-4">
                      <div className={`w-3 h-10 rounded-full ${project.color} shadow-lg group-hover:scale-y-110 transition-transform`} />
                      <div className="font-black text-sm uppercase tracking-tight group-hover:text-primary transition-colors">{project.name}</div>
                    </div>
                  </td>
                  <td className="font-bold text-xs opacity-60 uppercase tracking-tighter">{project.client}</td>
                  <td>
                    <div className={`badge badge-sm font-black border-none uppercase text-[9px] px-3 ${
                      project.status === 'Active' ? 'bg-primary text-white' : 
                      project.status === 'Discovery' ? 'bg-secondary text-white' :
                      project.status === 'Completed' ? 'bg-success text-white' : 'bg-base-300 opacity-50'
                    }`}>
                      {project.status}
                    </div>
                  </td>
                  <td>
                    <div className="flex flex-wrap gap-1">
                      {project.tags?.map(tag => (
                        <span key={tag.id} className={`badge ${tag.color} text-white border-none badge-xs font-black uppercase text-[7px] px-2`}>
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="text-xs">
                    {(project.startDate || project.endDate) ? (
                      <div className="flex items-center gap-2 font-mono font-bold opacity-60">
                        <Calendar className="w-3.5 h-3.5" />
                        {project.startDate ? formatDate(project.startDate) : "?"} 
                        <ArrowRight className="w-3 h-3 opacity-20" />
                        {project.endDate ? formatDate(project.endDate) : "?"}
                      </div>
                    ) : (
                      <span className="opacity-20 italic">No dates set</span>
                    )}
                  </td>
                  <td className="text-right pr-10">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="btn btn-ghost btn-square btn-sm" onClick={() => handleEdit(project)}><Pencil className="w-4 h-4" /></button>
                      <button className="btn btn-ghost btn-square btn-sm text-error" onClick={() => handleDelete(project.id)}><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredProjects.length === 0 && (
            <div className="p-24 text-center opacity-30 italic flex flex-col items-center gap-4">
              <Archive className="w-16 h-16" />
              <p className="text-lg uppercase font-black tracking-widest">No initiatives found</p>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="modal modal-open">
          <div className="modal-box w-11/12 max-w-4xl p-0 overflow-hidden border border-base-300 shadow-2xl bg-base-100 rounded-[2rem]">
            <div className="bg-base-200/50 p-6 border-b border-base-300 flex justify-between items-center">
              <div>
                <h3 className="font-black text-2xl uppercase tracking-tight">
                  {editingProject ? "Update Portfolio" : "New Initiative"}
                </h3>
                <p className="text-[10px] opacity-50 font-black uppercase mt-1 tracking-widest">Initiative Configuration</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="btn btn-sm btn-circle btn-ghost"><X className="w-5 h-5" /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-8">
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black uppercase text-primary tracking-widest flex items-center gap-2">
                      <Briefcase className="w-3 h-3" /> Mission Context
                    </h4>
                    <div className="form-control w-full">
                      <label className="label py-1 font-bold text-[10px] uppercase opacity-50">Initiative Name</label>
                      <input type="text" className="input input-bordered w-full bg-base-200/30 font-bold" value={name} onChange={(e) => setName(e.target.value)} required />
                    </div>
                    <div className="form-control w-full">
                      <label className="label py-1 font-bold text-[10px] uppercase opacity-50">Client Entity</label>
                      <input type="text" className="input input-bordered w-full bg-base-200/30 font-bold" value={client} onChange={(e) => setClient(e.target.value)} required />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black uppercase text-primary tracking-widest flex items-center gap-2">
                      <Calendar className="w-3 h-3" /> Planning Window
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="form-control w-full">
                        <label className="label py-1 font-bold text-[10px] uppercase opacity-50">Start</label>
                        <input type="date" className="input input-bordered w-full bg-base-200/30 font-bold text-xs" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                      </div>
                      <div className="form-control w-full">
                        <label className="label py-1 font-bold text-[10px] uppercase opacity-50">End</label>
                        <input type="date" className="input input-bordered w-full bg-base-200/30 font-bold text-xs" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black uppercase text-primary tracking-widest flex items-center gap-2">
                      <Hash className="w-3 h-3" /> Categorization Tags
                    </h4>
                    <div className="bg-base-200/30 p-5 rounded-[1.5rem] border border-base-300">
                      <TagSelector 
                        selectedTags={selectedTags} 
                        onChange={setSelectedTags} 
                        category="Project"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black uppercase text-primary tracking-widest flex items-center gap-2">
                      <TrendingUp className="w-3 h-3" /> Financial Metadata
                    </h4>
                    <div className="form-control w-full">
                      <label className="label py-1 font-bold text-[10px] uppercase opacity-50">Operational Status</label>
                      <select className="select select-bordered w-full bg-base-200/30 font-bold" value={status} onChange={(e) => setStatus(e.target.value)}>
                        <option value="Active">Active</option>
                        <option value="Discovery">Discovery</option>
                        <option value="On Hold">On Hold</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </div>
                    <div className="form-control w-full">
                      <label className="label py-1 font-bold text-[10px] uppercase opacity-50">Allocated Budget ($)</label>
                      <input type="number" className="input input-bordered w-full bg-base-200/30 font-bold text-lg" value={budget} onChange={(e) => setBudget(parseFloat(e.target.value))} required />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black uppercase text-primary tracking-widest flex items-center gap-2">
                      <Sparkles className="w-3 h-3" /> Visual Identity
                    </h4>
                    <div className="form-control w-full">
                      <select className="select select-bordered w-full bg-base-200/30 font-bold" value={color} onChange={(e) => setColor(e.target.value)}>
                        {colorOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                      </select>
                      <div className="mt-4 p-8 rounded-[1.5rem] bg-base-200/30 border border-base-200 flex flex-col items-center justify-center gap-4 shadow-inner">
                         <div className={`w-20 h-20 rounded-[1.2rem] ${color} shadow-2xl border-4 border-white/20`} />
                         <div className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Portfolio Theme</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-action mt-10 pt-6 border-t border-base-300">
                <button type="button" className="btn btn-ghost px-10 rounded-2xl font-bold" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary px-16 shadow-xl rounded-2xl font-black uppercase tracking-widest">
                  {editingProject ? "Update Entity" : "Initiate Entity"}
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