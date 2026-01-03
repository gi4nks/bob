"use client";

import React, { useState, useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { X } from "lucide-react";
import { RequiredSkill } from "@/types";

interface NewRequirementModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
}

const NewRequirementModal = ({ isOpen, onClose, projectId }: NewRequirementModalProps) => {
  const { addRequirement } = useAppStore();

  const [name, setName] = useState("");
  const [level, setLevel] = useState(3);

  useEffect(() => {
    if (isOpen) {
      setName("");
      setLevel(3);
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name) return;

    addRequirement({
      id: crypto.randomUUID(),
      projectId,
      name,
      level,
    });

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box">
        <button onClick={onClose} className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">
          <X className="w-4 h-4" />
        </button>
        <h3 className="font-bold text-lg mb-4">Add Expertise Requirement</h3>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="form-control w-full">
            <label className="label">
              <span className="label-text">Skill Name</span>
            </label>
            <input 
              type="text" 
              className="input input-bordered w-full" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. React, Docker, Python"
              required
            />
          </div>

          <div className="form-control w-full">
            <label className="label">
              <span className="label-text">Minimum Proficiency Required</span>
              <span className="label-text-alt font-black text-primary">Level {level}</span>
            </label>
            <input 
              type="range" 
              min="1" 
              max="5" 
              value={level} 
              onChange={(e) => setLevel(Number(e.target.value))}
              className="range range-primary" 
              step="1"
            />
            <div className="w-full flex justify-between text-xs px-2 mt-2 opacity-50">
              <span>Junior</span>
              <span>Mid</span>
              <span>Expert</span>
            </div>
          </div>

          <div className="modal-action">
            <button type="button" className="btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">Add Requirement</button>
          </div>
        </form>
      </div>
      <div className="modal-backdrop" onClick={onClose}></div>
    </div>
  );
};

export default NewRequirementModal;
