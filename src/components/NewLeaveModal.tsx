"use client";

import React, { useState, useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { X, Zap, Users, TrendingUp, Calendar, Clock } from "lucide-react";
import { Leave } from "@/types";
import { formatDate } from "@/lib/dateUtils";

interface NewLeaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Leave | null;
}

const NewLeaveModal = ({ isOpen, onClose, initialData }: NewLeaveModalProps) => {
  const { developers, addLeave, updateLeave } = useAppStore();

  const [developerId, setDeveloperId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [type, setType] = useState<"Vacation" | "Sick Leave" | "Public Holiday" | "Other">("Vacation");
  const [hours, setHours] = useState<string>("");

  useEffect(() => {
    if (initialData) {
      setDeveloperId(initialData.developerId);
      setStartDate(formatDate(initialData.startDate));
      setEndDate(formatDate(initialData.endDate));
      setType(initialData.type);
      setHours(initialData.hours?.toString() || "");
    } else {
      setDeveloperId("");
      setStartDate("");
      setEndDate("");
      setType("Vacation");
      setHours("");
    }
  }, [initialData, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!developerId || !startDate || !endDate) return;

    const leaveData: Leave = {
      id: initialData ? initialData.id : crypto.randomUUID(),
      developerId,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      type,
      hours: hours ? parseFloat(hours) : undefined,
    };

    if (initialData) {
      updateLeave(leaveData);
    } else {
      addLeave(leaveData);
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
              {initialData ? "Edit Absence" : "Book Time Off"}
            </h3>
            <p className="text-xs opacity-50 font-bold uppercase mt-1">Leave & Availability Management</p>
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
                  <Users className="w-3 h-3" /> Resource Context
                </h4>
                <div className="form-control w-full">
                  <label className="label py-1"><span className="label-text text-xs font-bold opacity-70">Engineer</span></label>
                  <select 
                    className="select select-bordered w-full bg-base-200/30"
                    value={developerId}
                    onChange={(e) => setDeveloperId(e.target.value)}
                    required
                    disabled={!!initialData}
                  >
                    <option value="" disabled>Select a developer</option>
                    {developers.filter(d => !d.isPlaceholder).map(dev => (
                      <option key={dev.id} value={dev.id}>{dev.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-control w-full">
                  <label className="label py-1"><span className="label-text text-xs font-bold opacity-70">Absence Type</span></label>
                  <select 
                    className="select select-bordered w-full bg-base-200/30"
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    required
                  >
                    <option value="Vacation">Vacation 🌴</option>
                    <option value="Sick Leave">Sick Leave 🤒</option>
                    <option value="Public Holiday">Public Holiday 🏛️</option>
                    <option value="Other">Other ❓</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase text-primary tracking-widest flex items-center gap-2">
                  <Calendar className="w-3 h-3" /> Duration
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

            {/* Right Section: Granularity */}
            <div className="space-y-6">
              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase text-primary tracking-widest flex items-center gap-2">
                  <Clock className="w-3 h-3" /> Partial Day Intensity
                </h4>
                <div className="p-4 bg-base-200/30 rounded-2xl border border-base-300">
                  <label className="label py-0 mb-2">
                    <span className="label-text text-xs font-bold opacity-70">Absence Hours</span>
                    <span className="label-text-alt font-black text-primary">{hours || 'FULL'} {hours ? 'Hrs' : 'DAY'}</span>
                  </label>
                  <input 
                    type="number" 
                    step="0.5"
                    min="0.5"
                    max="8"
                    className="input input-bordered w-full bg-base-100 h-10" 
                    value={hours}
                    onChange={(e) => setHours(e.target.value)}
                    placeholder="e.g. 4"
                  />
                  <p className="text-[10px] opacity-50 mt-3 leading-tight">
                    Leave blank for a full day (8h) commitment reduction. Partial hours will not split project allocations automatically.
                  </p>
                </div>
              </div>

              <div className="card bg-primary/5 border border-primary/10 rounded-2xl p-4">
                <div className="flex gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg h-fit text-primary">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-black uppercase tracking-tight text-primary">Smart Sync</h5>
                    <p className="text-[10px] opacity-70 leading-normal mt-1">
                      Confirmed full-day leaves will automatically carve out time from existing project allocations to prevent scheduling conflicts.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="modal-action mt-8 pt-6 border-t border-base-300">
            <button type="button" className="btn btn-ghost px-8" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-secondary px-12 shadow-lg">
              {initialData ? "Update Absence" : "Confirm Booking"}
            </button>
          </div>
        </form>
      </div>
      <div className="modal-backdrop bg-base-900/40 backdrop-blur-sm" onClick={onClose}></div>
    </div>
  );
};

export default NewLeaveModal;
