"use client";

import React, { useState, useEffect } from "react";
import { X, Target, User, AlignLeft } from "lucide-react";
import { Outcome, Developer } from "@/types";

interface NewOutcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<Outcome>) => void;
  initialData?: Outcome | null;
  developers: Developer[];
}

export default function NewOutcomeModal({ isOpen, onClose, onSave, initialData, developers }: NewOutcomeModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [assigneeId, setAssigneeId] = useState("");

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setDescription(initialData.description || "");
      setAssigneeId(initialData.assigneeId || "");
    } else {
      setName("");
      setDescription("");
      setAssigneeId("");
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name,
      description,
      assigneeId: assigneeId || null,
    });
    onClose();
  };

  return (
    <div className="modal modal-open">
      <div className="modal-box bg-base-100 rounded-[2.5rem] border border-base-300 shadow-2xl p-0 overflow-hidden max-w-md">
        <div className="bg-base-200 p-8 border-b border-base-300 flex justify-between items-center">
          <div>
            <h3 className="font-black uppercase text-sm tracking-[0.2em]">{initialData ? 'Refine Key Result' : 'Define Key Result'}</h3>
            <p className="text-[9px] font-bold opacity-40 uppercase mt-1">Strategic Milestone</p>
          </div>
          <button onClick={onClose} className="btn btn-sm btn-circle btn-ghost"><X className="w-5 h-5" /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-10 space-y-8">
          <div className="form-control">
            <label className="label py-1 font-black text-[10px] uppercase opacity-50 text-primary">Key Result Designation</label>
            <div className="relative">
              <Target className="w-4 h-4 absolute left-4 top-4 opacity-30" />
              <input 
                autoFocus
                type="text" 
                className="input input-bordered w-full pl-12 font-bold bg-base-100" 
                placeholder="e.g. System Integration Complete"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-control">
            <label className="label py-1 font-black text-[10px] uppercase opacity-50">Contextual Description</label>
            <div className="relative">
              <AlignLeft className="w-4 h-4 absolute left-4 top-4 opacity-30" />
              <textarea 
                className="textarea textarea-bordered w-full pl-12 pt-3 bg-base-100 font-medium h-24" 
                placeholder="Briefly describe the success criteria..."
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
            </div>
          </div>

          <div className="form-control">
            <label className="label py-1 font-black text-[10px] uppercase opacity-50">Owner / Assignee</label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-4 top-4 opacity-30 pointer-events-none" />
              <select 
                className="select select-bordered w-full pl-12 bg-base-100 font-bold"
                value={assigneeId}
                onChange={e => setAssigneeId(e.target.value)}
              >
                <option value="">Unassigned</option>
                {developers.map(dev => (
                  <option key={dev.id} value={dev.id}>{dev.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-4">
            <button type="submit" className="btn btn-primary btn-block rounded-2xl font-black uppercase tracking-widest h-16 shadow-xl">
              {initialData ? 'Update Strategy' : 'Confirm Key Result'}
            </button>
          </div>
        </form>
      </div>
      <div className="modal-backdrop bg-base-900/60 backdrop-blur-md" onClick={onClose}></div>
    </div>
  );
}
