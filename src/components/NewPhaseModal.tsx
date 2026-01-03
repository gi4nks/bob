"use client";

import React, { useState, useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { X } from "lucide-react";
import { Phase } from "@/types";
import { formatDate } from "@/lib/dateUtils";

interface NewPhaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  initialData?: Phase | null;
}

const NewPhaseModal = ({ isOpen, onClose, projectId, initialData }: NewPhaseModalProps) => {
  const { addPhase, updatePhase } = useAppStore();

  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [color, setColor] = useState("bg-blue-100 text-blue-800");

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setName(initialData.name);
        setStartDate(formatDate(initialData.startDate));
        setEndDate(formatDate(initialData.endDate));
        setColor(initialData.color);
      } else {
        setName("");
        setStartDate("");
        setEndDate("");
        setColor("bg-blue-100 text-blue-800");
      }
    }
  }, [isOpen, initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !startDate || !endDate) return;

    const data: Phase = {
      id: initialData ? initialData.id : crypto.randomUUID(),
      projectId,
      name,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      color,
    };

    if (initialData) {
      updatePhase(data);
    } else {
      addPhase(data);
    }

    onClose();
  };

  if (!isOpen) return null;

  const colorOptions = [
    { label: "Blue", value: "bg-blue-500 text-white" },
    { label: "Orange", value: "bg-orange-500 text-white" },
    { label: "Green", value: "bg-green-600 text-white" },
    { label: "Red", value: "bg-red-500 text-white" },
    { label: "Indigo", value: "bg-indigo-500 text-white" },
    { label: "Purple", value: "bg-purple-500 text-white" },
    { label: "Cyan", value: "bg-cyan-500 text-white" },
    { label: "Emerald", value: "bg-emerald-500 text-white" },
  ];

  return (
    <div className="modal modal-open">
      <div className="modal-box">
        <button onClick={onClose} className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">
          <X className="w-4 h-4" />
        </button>
        <h3 className="font-bold text-lg mb-4">{initialData ? "Edit Phase" : "New Project Phase"}</h3>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="form-control w-full">
            <label className="label">
              <span className="label-text">Phase Name</span>
            </label>
            <input 
              type="text" 
              className="input input-bordered w-full" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Discovery, Implementation"
              required
            />
          </div>

          <div className="flex gap-4">
            <div className="form-control w-full">
              <label className="label">
                <span className="label-text">Start Date</span>
              </label>
              <input 
                type="date" 
                className="input input-bordered w-full" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>

            <div className="form-control w-full">
              <label className="label">
                <span className="label-text">End Date</span>
              </label>
              <input 
                type="date" 
                className="input input-bordered w-full" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-control w-full">
            <label className="label">
              <span className="label-text">Theme Color</span>
            </label>
            <select 
              className="select select-bordered w-full"
              value={color}
              onChange={(e) => setColor(e.target.value)}
            >
              {colorOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <div className="mt-2 p-3 rounded-lg border border-base-200 flex items-center justify-center">
               <div className={`${color} px-4 py-1 rounded-full text-xs font-black uppercase`}>Preview Phase Label</div>
            </div>
          </div>

          <div className="modal-action">
            <button type="button" className="btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">{initialData ? "Update Phase" : "Create Phase"}</button>
          </div>
        </form>
      </div>
      <div className="modal-backdrop" onClick={onClose}></div>
    </div>
  );
};

export default NewPhaseModal;
