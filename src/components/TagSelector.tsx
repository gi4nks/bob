"use client";

import React, { useState } from "react";
import { Tag } from "@/types";
import { X, Plus, Hash } from "lucide-react";
import { useAppStore } from "@/lib/store";

interface TagSelectorProps {
  selectedTags: Tag[];
  onChange: (tags: Tag[]) => void;
  category: "Project" | "Developer";
}

export default function TagSelector({ selectedTags, onChange }: TagSelectorProps) {
  const { tags, addTag } = useAppStore();
  const [isAdding, setIsAdding] = useState(false);
  const [newTagName, setNewTagName] = useState("");

  const handleSelect = (tag: Tag) => {
    if (selectedTags.some(t => t.id === tag.id)) return;
    onChange([...selectedTags, tag]);
  };

  const handleRemove = (tagId: string) => {
    onChange(selectedTags.filter(t => t.id !== tagId));
  };

  const handleCreateTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim()) return;
    
    const colors = ["bg-blue-500", "bg-emerald-500", "bg-amber-500", "bg-rose-500", "bg-indigo-500", "bg-violet-500", "bg-cyan-500", "bg-slate-500"];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    const newTag: Tag = {
      id: crypto.randomUUID(),
      name: newTagName.trim(),
      color: randomColor
    };

    addTag(newTag);
    onChange([...selectedTags, newTag]);
    setNewTagName("");
    setIsAdding(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {selectedTags.map(tag => (
          <div key={tag.id} className={`badge ${tag.color} text-white gap-1 py-3 px-3 font-black text-[9px] uppercase tracking-tighter border-none shadow-sm`}>
            <Hash className="w-2.5 h-2.5 opacity-50" />
            {tag.name}
            <button onClick={() => handleRemove(tag.id)} className="hover:text-white/50 transition-colors">
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
        {selectedTags.length === 0 && <span className="text-[10px] opacity-30 italic font-bold">No tags assigned</span>}
      </div>

      <div className="divider opacity-10 my-1"></div>

      <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1">
        {tags.filter(t => !selectedTags.some(st => st.id === t.id)).map(tag => (
          <button 
            key={tag.id} 
            type="button"
            onClick={() => handleSelect(tag)}
            className="badge badge-outline text-[9px] font-black uppercase tracking-tighter py-3 px-3 opacity-50 hover:opacity-100 hover:bg-base-200 transition-all border-dashed"
          >
            + {tag.name}
          </button>
        ))}
        
        {!isAdding ? (
          <button 
            type="button"
            onClick={() => setIsAdding(true)}
            className="badge badge-ghost text-[9px] font-black uppercase tracking-tighter py-3 px-3 border-none hover:bg-primary hover:text-white transition-all"
          >
            <Plus className="w-3 h-3 mr-1" /> New Tag
          </button>
        ) : (
          <form onSubmit={handleCreateTag} className="flex items-center gap-1">
            <input 
              autoFocus
              type="text" 
              className="input input-xs input-bordered w-32 font-bold uppercase text-[9px]" 
              placeholder="Tag Name..."
              value={newTagName}
              onChange={e => setNewTagName(e.target.value)}
              onBlur={() => { if(!newTagName) setIsAdding(false); }}
            />
            <button type="submit" className="btn btn-xs btn-primary btn-square"><Plus className="w-3 h-3" /></button>
          </form>
        )}
      </div>
    </div>
  );
}
