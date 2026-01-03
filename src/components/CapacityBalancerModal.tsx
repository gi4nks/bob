"use client";

import React, { useState, useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { X, Scale } from "lucide-react";
import { Allocation, Developer, Project } from "@/types";

interface CapacityBalancerModalProps {
  isOpen: boolean;
  onClose: () => void;
  developer: Developer;
  targetAllocations: Allocation[];
  periodLabel: string;
}

const CapacityBalancerModal = ({ isOpen, onClose, developer, targetAllocations, periodLabel }: CapacityBalancerModalProps) => {
  const { projects, updateAllocation } = useAppStore();
  const [localLoads, setLocalLoads] = useState<Record<string, number>>({});

  useEffect(() => {
    if (isOpen) {
      const initialLoads: Record<string, number> = {};
      targetAllocations.forEach(a => {
        initialLoads[a.id] = a.load;
      });
      setLocalLoads(initialLoads);
    }
  }, [isOpen, targetAllocations]);

  const totalLoad = Object.values(localLoads).reduce((sum, val) => sum + val, 0);
  const capacityPercent = (developer.capacity || 1.0) * 100;
  const isOverloaded = totalLoad > capacityPercent;

  const handleSliderChange = (id: string, value: number) => {
    setLocalLoads(prev => ({ ...prev, [id]: value }));
  };

  const handleApply = () => {
    targetAllocations.forEach(alloc => {
      const newLoad = localLoads[alloc.id];
      if (newLoad !== undefined && newLoad !== alloc.load) {
        updateAllocation({ ...alloc, load: newLoad });
      }
    });
    onClose();
  };

  const getProjectName = (id: string) => projects.find(p => p.id === id)?.name || "Unknown Project";

  if (!isOpen) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-lg">
        <button onClick={onClose} className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">
          <X className="w-4 h-4" />
        </button>
        <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
          <Scale className="w-5 h-5 text-primary" /> Capacity Balancer
        </h3>
        <p className="text-sm opacity-70 mb-6">
          Resolving overload for <strong>{developer.name}</strong> during {periodLabel}.
        </p>

        <div className="space-y-6">
          {targetAllocations.map(alloc => (
            <div key={alloc.id} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold">{getProjectName(alloc.projectId)}</span>
                <span className="badge badge-sm font-mono">{localLoads[alloc.id]}%</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="100" 
                step="5" 
                value={localLoads[alloc.id] || 0} 
                onChange={(e) => handleSliderChange(alloc.id, parseInt(e.target.value))}
                className="range range-xs range-primary" 
              />
            </div>
          ))}

          <div className="divider"></div>

          <div className={`p-4 rounded-lg flex justify-between items-center ${isOverloaded ? 'bg-error/10 border border-error/20' : 'bg-success/10 border border-success/20'}`}>
            <div>
              <div className="text-xs uppercase font-bold opacity-50">Resulting Total Load</div>
              <div className={`text-2xl font-black ${isOverloaded ? 'text-error' : 'text-success'}`}>
                {totalLoad}% <span className="text-sm font-normal opacity-50">/ {capacityPercent}%</span>
              </div>
            </div>
            {isOverloaded ? (
              <div className="badge badge-error gap-1">Overload</div>
            ) : (
              <div className="badge badge-success gap-1">Healthy</div>
            )}
          </div>
        </div>

        <div className="modal-action">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button 
            className="btn btn-primary" 
            onClick={handleApply}
            disabled={isOverloaded}
          >
            Apply Changes
          </button>
        </div>
      </div>
      <div className="modal-backdrop" onClick={onClose}></div>
    </div>
  );
};

export default CapacityBalancerModal;
