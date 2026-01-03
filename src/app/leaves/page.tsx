"use client";

import React, { useState, useMemo } from "react";
import { useAppStore } from "@/lib/store";
import { Leave } from "@/types";
import { Plus, Trash2, Calendar, Plane, Pencil, Search, Users, Clock, ArrowRight } from "lucide-react";
import NewLeaveModal from "@/components/NewLeaveModal";
import { formatDate } from "@/lib/dateUtils";

export default function LeavesPage() {
  const { leaves, developers, deleteLeave } = useAppStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLeave, setEditingLeave] = useState<Leave | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "active" | "upcoming" | "past">("all");

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const getDeveloper = (id: string) => developers.find(d => d.id === id);

  // Filter and Category Logic
  const filteredLeaves = useMemo(() => {
    return leaves.filter(leave => {
      const dev = getDeveloper(leave.developerId);
      const matchesSearch = dev?.name.toLowerCase().includes(searchQuery.toLowerCase());
      
      const start = leave.startDate;
      const end = leave.endDate;
      
      let matchesTab = true;
      if (activeTab === "active") matchesTab = start <= today && end >= today;
      if (activeTab === "upcoming") matchesTab = start > today;
      if (activeTab === "past") matchesTab = end < today;
      
      return matchesSearch && matchesTab;
    }).sort((a, b) => b.startDate.getTime() - a.startDate.getTime());
  }, [leaves, searchQuery, activeTab, developers]);

  // KPIs
  const currentlyOut = leaves.filter(l => l.startDate <= today && l.endDate >= today);
  const upcomingSoon = leaves.filter(l => {
    const start = l.startDate;
    const inTwoWeeks = new Date(today);
    inTwoWeeks.setDate(today.getDate() + 14);
    return start > today && start <= inTwoWeeks;
  });

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to cancel this leave?")) {
      deleteLeave(id);
    }
  };

  const handleEdit = (leave: Leave) => {
    setEditingLeave(leave);
    setIsModalOpen(true);
  };

  // Grouping leaves by month
  const groupedLeaves = useMemo(() => {
    const groups: Record<string, Leave[]> = {};
    filteredLeaves.forEach(leave => {
      const date = leave.startDate;
      const monthYear = date.toLocaleString('default', { month: 'long', year: 'numeric' });
      if (!groups[monthYear]) groups[monthYear] = [];
      groups[monthYear].push(leave);
    });
    return groups;
  }, [filteredLeaves]);

  return (
    <div className="space-y-8 pb-12">
      {/* Header & Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight flex items-center gap-3">
            <Plane className="w-8 h-8 text-primary" /> Leave Management
          </h1>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-40 mt-1">Manage team availability and time-off requests.</p>
        </div>
        <button 
          className="btn btn-primary gap-2 px-6 rounded-xl font-black uppercase tracking-widest text-xs shadow-md"
          onClick={() => {
            setEditingLeave(null);
            setIsModalOpen(true);
          }}
        >
          <Plus className="w-4 h-4" />
          Book Leave
        </button>
      </div>

      {/* Summary Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-base-100 p-6 rounded-[2rem] shadow-lg border border-base-200">
          <div className="flex justify-between items-start mb-2">
             <div className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Currently Out</div>
             <Users className="w-5 h-5 text-success" />
          </div>
          <div className="text-4xl font-black tracking-tighter">{currentlyOut.length}</div>
          <div className="text-[9px] font-bold opacity-40 uppercase mt-1">Active Now</div>
        </div>

        <div className="bg-base-100 p-6 rounded-[2rem] shadow-lg border border-base-200">
          <div className="flex justify-between items-start mb-2">
             <div className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Upcoming (14d)</div>
             <Clock className="w-5 h-5 text-info" />
          </div>
          <div className="text-4xl font-black tracking-tighter">{upcomingSoon.length}</div>
          <div className="text-[9px] font-bold opacity-40 uppercase mt-1">Starting Soon</div>
        </div>

        <div className="bg-base-100 p-6 rounded-[2rem] shadow-lg border border-base-200">
          <div className="flex justify-between items-start mb-2">
             <div className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Total Booked</div>
             <Calendar className="w-5 h-5 text-primary" />
          </div>
          <div className="text-4xl font-black tracking-tighter">{leaves.length}</div>
          <div className="text-[9px] font-bold opacity-40 uppercase mt-1">Requests in system</div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col lg:flex-row justify-between items-center gap-4 bg-base-100 p-2 rounded-[1.5rem] border border-base-200 shadow-sm">
        <div className="flex bg-base-200/50 p-1 rounded-xl">
          {["all", "active", "upcoming", "past"].map((tab) => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab as any)} 
              className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-white shadow-sm text-primary' : 'hover:bg-white/50 opacity-50'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 w-full lg:w-auto px-2">
          <div className="relative flex-1 lg:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 opacity-40" />
            <input 
              type="text" 
              placeholder="FILTER BY ENGINEER..." 
              className="input input-sm input-bordered w-full pl-9 bg-base-200/30 rounded-xl font-bold text-[10px] uppercase h-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Grouped Chronological List */}
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {Object.entries(groupedLeaves).map(([month, items]) => (
          <div key={month} className="space-y-4">
            <div className="flex items-center gap-4 px-2">
              <h2 className="text-xs font-black uppercase tracking-[0.2em] text-primary/50">{month}</h2>
              <div className="h-px bg-base-200 flex-1"></div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {items.map(leave => {
                const dev = getDeveloper(leave.developerId);
                const start = new Date(leave.startDate);
                const end = new Date(leave.endDate);
                const isPast = end < today;
                const isCurrent = start <= today && end >= today;

                return (
                  <div key={leave.id} className={`group bg-base-100 p-4 rounded-[1.5rem] border border-base-200 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-6 ${isPast ? 'opacity-50 grayscale hover:grayscale-0 hover:opacity-100' : ''}`}>
                    <div className="flex items-center gap-4 min-w-[200px]">
                      <div className="avatar">
                        <div className="w-10 h-10 mask mask-squircle shadow-sm bg-base-200">
                          <img src={dev?.avatarUrl} alt={dev?.name} />
                        </div>
                      </div>
                      <div>
                        <div className="font-black text-sm uppercase tracking-tight">{dev?.name}</div>
                        <div className="text-[9px] opacity-40 font-bold uppercase tracking-widest mt-0.5">{dev?.role}</div>
                      </div>
                    </div>

                    <div className="flex-1 flex flex-wrap items-center gap-8">
                      <div className="flex flex-col">
                        <span className="text-[8px] uppercase font-black opacity-30 tracking-widest mb-1">Period</span>
                        <div className="flex items-center gap-2 font-mono text-xs font-bold opacity-70">
                          {formatDate(leave.startDate)} <ArrowRight className="w-3 h-3 opacity-30" /> {formatDate(leave.endDate)}
                          {leave.hours && <span className="ml-2 text-[9px] font-black text-secondary bg-secondary/10 px-1.5 py-0.5 rounded">PARTIAL</span>}
                        </div>
                      </div>

                      <div className="flex flex-col">
                        <span className="text-[8px] uppercase font-black opacity-30 tracking-widest mb-1">Type</span>
                        <div className="flex items-center gap-2 font-black text-xs uppercase tracking-tight">
                          {leave.type === 'Vacation' && '🌴'}
                          {leave.type === 'Sick Leave' && '🤒'}
                          {leave.type === 'Public Holiday' && '🏛️'}
                          {leave.type === 'Other' && '❓'}
                          {leave.type}
                        </div>
                      </div>

                      <div className="flex flex-col min-w-[80px]">
                        <span className="text-[8px] uppercase font-black opacity-30 tracking-widest mb-1">Status</span>
                        <div>
                          {isCurrent && <span className="badge badge-success border-none text-white font-black text-[9px] px-2 py-0.5 animate-pulse">ACTIVE</span>}
                          {isPast && <span className="badge badge-ghost font-black text-[9px] px-2 py-0.5">PAST</span>}
                          {!isCurrent && !isPast && <span className="badge badge-info border-none text-white font-black text-[9px] px-2 py-0.5">UPCOMING</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-1 border-t md:border-t-0 pt-3 md:pt-0 mt-1 md:mt-0 border-base-200 opacity-0 group-hover:opacity-100 transition-opacity px-2">
                      <button 
                        className="btn btn-square btn-ghost btn-sm rounded-lg"
                        onClick={() => handleEdit(leave)}
                      >
                        <Pencil className="w-3.5 h-3.5 opacity-50" />
                      </button>
                      <button 
                        className="btn btn-square btn-ghost btn-sm text-error rounded-lg"
                        onClick={() => handleDelete(leave.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {Object.keys(groupedLeaves).length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 bg-base-100 rounded-[2.5rem] border-2 border-dashed border-base-300 opacity-30">
            <Plane className="w-16 h-16 mb-4" />
            <p className="text-sm font-black uppercase tracking-widest">No leave records found</p>
          </div>
        )}
      </div>

      <NewLeaveModal 
        isOpen={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false);
          setEditingLeave(null);
        }} 
        initialData={editingLeave}
      />
    </div>
  );
}
