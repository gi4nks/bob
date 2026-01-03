import React from "react";
import { Project } from "@/types";
import { Pencil, Trash2, Calendar, ArrowRight } from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/dateUtils";

interface ProjectCardProps {
  project: Project;
  onEdit?: (project: Project) => void;
  onDelete?: (id: string) => void;
}

const ProjectCard = ({ project, onEdit, onDelete }: ProjectCardProps) => {
  return (
    <div className="card bg-base-100 shadow-xl border border-base-200 relative group transition-all hover:shadow-2xl">
      <div className="card-body">
        <h2 className="card-title flex items-center gap-2">
          <div className={`w-4 h-4 rounded-full ${project.color} shadow-sm`}></div>
          <span className="flex-1 truncate">{project.name}</span>
          <div className="badge badge-xs badge-outline opacity-50 uppercase font-black px-2 py-2">{project.status}</div>
        </h2>
        <p className="text-sm text-base-content/70">Client: {project.client}</p>
        
        {(project.startDate || project.endDate) && (
          <div className="flex items-center gap-2 mt-2 text-xs text-base-content/60 bg-base-200/50 p-2 rounded-lg w-fit">
            <Calendar className="w-3 h-3" />
            <span className="font-mono">
              {project.startDate ? formatDate(project.startDate) : "TBD"} - {project.endDate ? formatDate(project.endDate) : "TBD"}
            </span>
          </div>
        )}

        <div className="flex flex-wrap gap-1 mt-4">
          {project.tags?.map(tag => (
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
                onClick={() => onEdit(project)}
                title="Edit Project"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            )}
            {onDelete && (
              <button 
                className="btn btn-square btn-xs btn-ghost text-error hover:bg-error/10" 
                onClick={() => onDelete(project.id)}
                title="Delete Project"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <Link href={`/projects/${project.id}`} className="btn btn-sm btn-ghost hover:btn-primary hover:text-primary-content transition-all gap-2">
            View Details
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;
