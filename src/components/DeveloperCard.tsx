import React from "react";
import { DeveloperWithSkills } from "@/types";
import { Pencil, Trash2 } from "lucide-react";

interface DeveloperCardProps {
  developer: DeveloperWithSkills;
  onEdit?: (dev: DeveloperWithSkills) => void;
  onDelete?: (id: string) => void;
}

const DeveloperCard = ({ developer, onEdit, onDelete }: DeveloperCardProps) => {
  return (
    <div className={`card bg-base-100 shadow-xl border ${developer.isPlaceholder ? 'border-dashed border-primary/40' : 'border-base-200'} relative group transition-all hover:shadow-2xl`}>
      <div className="card-body">
        <div className="flex items-center gap-4 mb-4">
          <div className="avatar">
            <div className="w-16 h-16 mask mask-squircle shadow-sm">
              <img src={developer.avatarUrl} alt={developer.name} />
            </div>
          </div>
          <div className="flex-1 overflow-hidden">
            <h2 className="card-title truncate">{developer.name}</h2>
            <p className="text-sm text-base-content/70 truncate">{developer.role}</p>
          </div>
        </div>

        <div className="divider my-0 opacity-50"></div>

        <div className="space-y-3 mt-4 flex-1">
          <h4 className="text-[10px] font-black uppercase opacity-40 tracking-widest mb-2">Core Skills</h4>
          {developer.skills.map((skill) => (
            <div key={skill.name} className="flex flex-col gap-1">
              <div className="flex justify-between text-[10px] font-bold uppercase opacity-70">
                <span>{skill.name}</span>
                <span>{skill.level}/5</span>
              </div>
              <progress 
                className="progress progress-primary w-full h-1.5" 
                value={skill.level} 
                max="5"
              ></progress>
            </div>
          ))}
          {developer.skills.length === 0 && <p className="text-xs italic opacity-30 py-4 text-center">No skills defined</p>}
        </div>

        <div className="flex flex-wrap gap-1 mt-4">
          {developer.tags?.map(tag => (
            <span key={tag.id} className={`badge ${tag.color} text-white border-none badge-xs font-black uppercase text-[7px] px-2`}>
              {tag.name}
            </span>
          ))}
        </div>

        <div className="card-actions justify-between items-center mt-6 pt-4 border-t border-base-200">
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {onEdit && (
              <button 
                className="btn btn-square btn-xs btn-ghost hover:bg-base-200" 
                onClick={() => onEdit(developer)}
                title="Edit Resource"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            )}
            {onDelete && (
              <button 
                className="btn btn-square btn-xs btn-ghost text-error hover:bg-error/10" 
                onClick={() => onDelete(developer.id)}
                title="Delete Resource"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <div className="text-[10px] font-black uppercase text-primary tracking-widest">
            {developer.isPlaceholder ? "Planning Placeholder" : "Active Member"}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeveloperCard;
