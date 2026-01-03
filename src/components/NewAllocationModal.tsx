"use client";

import React, { useState, useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { X, Zap, Users, TrendingUp, Calendar } from "lucide-react";
import { Allocation } from "@/types";
import { formatDate } from "@/lib/dateUtils";

interface NewAllocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Allocation | null;
}

const NewAllocationModal = ({ isOpen, onClose, initialData }: NewAllocationModalProps) => {
  const { developers, projects, addAllocation, updateAllocation } = useAppStore();

  const [developerId, setDeveloperId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [load, setLoad] = useState(100);
  const [status, setStatus] = useState<"Confirmed" | "Draft">("Confirmed");

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setDeveloperId(initialData.developerId);
        setProjectId(initialData.projectId);
        setStartDate(formatDate(initialData.startDate));
        setEndDate(formatDate(initialData.endDate));
        setLoad(initialData.load);
        setStatus(initialData.status || "Confirmed");
      } else {
        setDeveloperId("");
        setProjectId("");
        setStartDate("");
        setEndDate("");
        setLoad(100);
        setStatus("Confirmed");
      }
    }
  }, [isOpen, initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!developerId || !projectId || !startDate || !endDate) return;

    const data: Allocation = {
      id: initialData ? initialData.id : crypto.randomUUID(),
      developerId,
      projectId,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      load,
      status,
    };

    if (initialData) {
      updateAllocation(data);
    } else {
      addAllocation(data);
    }

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box w-11/12 max-w-2xl p-0 overflow-hidden border border-base-300 shadow-2xl bg-base-100">
        <div className="bg-base-200/50 p-6 border-b border-base-300 flex justify-between items-center">
          <div>
            <h3 className="font-black text-2xl uppercase tracking-tight">
              {initialData ? "Edit Assignment" : "New Allocation"}
            </h3>
            <p className="text-xs opacity-50 font-bold uppercase mt-1">Project Staffing & Scheduling</p>
          </div>
          <button 
            onClick={onClose} 
            className="btn btn-sm btn-circle btn-ghost"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left Section: Context */}
            <div className="space-y-6">
              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase text-primary tracking-widest flex items-center gap-2">
                  <Users className="w-3 h-3" /> Target Resource
                </h4>
                <div className="form-control w-full">
                  <label className="label py-1"><span className="label-text text-xs font-bold opacity-70">Engineer</span></label>
                  <select 
                    className="select select-bordered w-full bg-base-200/30 focus:bg-base-100"
                    value={developerId}
                    onChange={(e) => setDeveloperId(e.target.value)}
                    required
                  >
                    <option value="" disabled>Select a developer</option>
                    {developers.map(dev => (
                      <option key={dev.id} value={dev.id}>
                        {dev.isPlaceholder ? `[PLANNING] ${dev.name}` : dev.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-control w-full">
                  <label className="label py-1"><span className="label-text text-xs font-bold opacity-70">Project</span></label>
                  <select 
                    className="select select-bordered w-full bg-base-200/30 focus:bg-base-100"
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    required
                  >
                    <option value="" disabled>Select a project</option>
                    {projects.map(proj => (
                      <option key={proj.id} value={proj.id}>{proj.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase text-primary tracking-widest flex items-center gap-2">
                  <Calendar className="w-3 h-3" /> Timing
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="form-control w-full">
                    <label className="label py-1"><span className="label-text text-xs font-bold opacity-70">Start Date</span></label>
                    <input 
                      type="date" 
                      className="input input-bordered w-full bg-base-200/30" 
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-control w-full">
                    <label className="label py-1"><span className="label-text text-xs font-bold opacity-70">End Date</span></label>
                    <input 
                      type="date" 
                      className="input input-bordered w-full bg-base-200/30" 
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Section: Configuration */}
            <div className="space-y-6">
              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase text-primary tracking-widest flex items-center gap-2">
                  <TrendingUp className="w-3 h-3" /> Intensity
                </h4>
                <div className="p-4 bg-base-200/30 rounded-2xl border border-base-300">
                  <label className="label py-0 mb-4">
                    <span className="label-text text-xs font-bold opacity-70">Weekly Load</span>
                    <span className="label-text-alt font-black text-2xl text-primary">{load}%</span>
                  </label>
                  <input 
                    type="range" 
                    min="10" 
                    max="100" 
                    value={load} 
                    onChange={(e) => setLoad(Number(e.target.value))}
                    className="range range-primary range-sm" 
                    step="10"
                  />
                  <div className="w-full flex justify-between text-[10px] font-bold opacity-40 px-1 mt-2">
                    <span>Low</span>
                    <span>Standard</span>
                    <span>Full-Time</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase text-primary tracking-widest flex items-center gap-2">
                  <Zap className="w-3 h-3" /> Strategy
                </h4>
                <div className="bg-base-100 border border-base-300 rounded-2xl p-4 shadow-inner space-y-4">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input 
                      type="radio" 
                      name="status" 
                      className="radio radio-primary radio-sm" 
                      checked={status === "Confirmed"} 
                      onChange={() => setStatus("Confirmed")} 
                    />
                    <div>
                      <span className="block text-sm font-black uppercase tracking-tight group-hover:text-primary transition-colors">Confirmed</span>
                      <span className="block text-[10px] opacity-50">Active assignment, affects metrics.</span>
                    </div>
                  </label>
                  <div className="h-px bg-base-300 opacity-50"></div>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input 
                      type="radio" 
                      name="status" 
                      className="radio radio-secondary radio-sm" 
                      checked={status === "Draft"} 
                      onChange={() => setStatus("Draft")} 
                    />
                    <div>
                      <span className="block text-sm font-black uppercase tracking-tight group-hover:text-secondary transition-colors">What-If Draft</span>
                      <span className="block text-[10px] opacity-50">Scenario planning only.</span>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="modal-action mt-8 pt-6 border-t border-base-300">
            <button type="button" className="btn btn-ghost px-8" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary px-12 shadow-lg">
              {initialData ? "Update Allocation" : "Apply Assignment"}
            </button>
          </div>
        </form>
      </div>
      <div className="modal-backdrop bg-base-900/40 backdrop-blur-sm" onClick={onClose}></div>
    </div>
  );
};

export default NewAllocationModal;
