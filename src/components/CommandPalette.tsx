"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { 
  Search, 
  Users, 
  Briefcase, 
  Calendar, 
  Settings, 
  BarChart3, 
  AlertTriangle, 
  Search as SearchIcon,
  LayoutTemplate,
  Plus,
  ArrowRight,
  Plane
} from "lucide-react";

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();
  const { projects, developers } = useAppStore();

  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        toggle();
      }
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [toggle]);

  const navItems = [
    { label: "Timeline Dashboard", href: "/", icon: <Calendar className="w-4 h-4" />, category: "Navigation", description: "View team schedule" },
    { label: "Projects Portfolio", href: "/projects", icon: <Briefcase className="w-4 h-4" />, category: "Navigation", description: "Manage project pipeline" },
    { label: "Team & Skills", href: "/team", icon: <Users className="w-4 h-4" />, category: "Navigation", description: "Manage engineer expertise" },
    { label: "Utilization Center", href: "/reports/utilization", icon: <BarChart3 className="w-4 h-4" />, category: "Navigation", description: "Capacity & forecast analytics" },
    { label: "Smart Match", href: "/search", icon: <SearchIcon className="w-4 h-4" />, category: "Navigation", description: "Find resources for projects" },
    { label: "Conflicts & Alerts", href: "/alerts", icon: <AlertTriangle className="w-4 h-4" />, category: "Navigation", description: "Identify and resolve scheduling issues" },
    { label: "Leave Management", href: "/leaves", icon: <Plane className="w-4 h-4" />, category: "Navigation", description: "Manage vacations and time off" },
  ];

  const results = useMemo(() => {
    const s = search.toLowerCase();
    
    const filteredNav = navItems.filter(item => item.label.toLowerCase().includes(s));
    
    const filteredProjects = projects
      .filter(p => 
        p.name.toLowerCase().includes(s) || 
        p.client.toLowerCase().includes(s) ||
        p.tags?.some(t => t.name.toLowerCase().includes(s))
      )
      .map(p => ({
        label: p.name,
        description: p.client,
        href: `/projects/${p.id}`,
        icon: <div className={`w-3 h-3 rounded-full ${p.color}`} />,
        category: "Projects"
      }));

    const filteredDevs = developers
      .filter(d => 
        d.name.toLowerCase().includes(s) || 
        d.role.toLowerCase().includes(s) ||
        d.tags?.some(t => t.name.toLowerCase().includes(s))
      )
      .map(d => ({
        label: d.name,
        description: d.role,
        href: `/reports/resource?devId=${d.id}`,
        icon: <img src={d.avatarUrl} alt="" className="w-4 h-4 rounded-full" />,
        category: "Developers"
      }));

    return [...filteredNav, ...filteredProjects, ...filteredDevs];
  }, [search, projects, developers]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  const onSelect = useCallback((item: any) => {
    router.push(item.href);
    setIsOpen(false);
    setSearch("");
  }, [router]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
    } else if (e.key === "Enter") {
      if (results[selectedIndex]) {
        onSelect(results[selectedIndex]);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-24 sm:pt-40 px-4">
      <div className="fixed inset-0 bg-base-900/60 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
      
      <div className="relative w-full max-w-2xl bg-base-100 rounded-2xl shadow-2xl border border-base-300 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center px-4 py-4 border-b border-base-200">
          <Search className="w-5 h-5 opacity-40 mr-3" />
          <input
            autoFocus
            className="flex-1 bg-transparent border-none outline-none text-lg placeholder:opacity-40"
            placeholder="Search projects, developers, or actions... (CMD+K)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <div className="flex items-center gap-1 ml-4 opacity-30">
            <kbd className="kbd kbd-sm">ESC</kbd>
          </div>
        </div>

        <div className="max-h-[400px] overflow-y-auto p-2">
          {results.length > 0 ? (
            <div className="space-y-4">
              {["Navigation", "Projects", "Developers"].map(category => {
                const categoryItems = results.filter(r => r.category === category);
                if (categoryItems.length === 0) return null;

                return (
                  <div key={category}>
                    <div className="px-3 py-2 text-[10px] font-black uppercase tracking-widest opacity-40">{category}</div>
                    <div className="space-y-1">
                      {categoryItems.map((item) => {
                        const globalIndex = results.indexOf(item);
                        const isSelected = selectedIndex === globalIndex;
                        return (
                          <button
                            key={item.href + item.label}
                            className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all text-left ${
                              isSelected ? "bg-primary text-primary-content shadow-lg scale-[1.02]" : "hover:bg-base-200"
                            }`}
                            onClick={() => onSelect(item)}
                            onMouseEnter={() => setSelectedIndex(globalIndex)}
                          >
                            <div className={`${isSelected ? "text-primary-content" : "text-primary"}`}>
                              {item.icon}
                            </div>
                            <div className="flex-1 overflow-hidden">
                              <div className="font-bold text-sm truncate">{item.label}</div>
                              {item.description && (
                                <div className={`text-[10px] font-medium truncate ${isSelected ? "opacity-80" : "opacity-50"}`}>
                                  {item.description}
                                </div>
                              )}
                            </div>
                            {isSelected && <ArrowRight className="w-4 h-4 opacity-50" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-12 text-center">
              <div className="opacity-20 mb-2">
                <Search className="w-12 h-12 mx-auto" />
              </div>
              <p className="text-sm opacity-50 italic">No results found for "{search}"</p>
            </div>
          )}
        </div>

        <div className="bg-base-200/50 p-3 flex items-center justify-between border-t border-base-200">
          <div className="flex gap-4">
            <div className="flex items-center gap-1.5">
              <kbd className="kbd kbd-xs">↑↓</kbd>
              <span className="text-[10px] font-bold opacity-40 uppercase">Navigate</span>
            </div>
            <div className="flex items-center gap-1.5">
              <kbd className="kbd kbd-xs">↵</kbd>
              <span className="text-[10px] font-bold opacity-40 uppercase">Select</span>
            </div>
          </div>
          <div className="text-[10px] font-black italic opacity-20 uppercase tracking-tighter">Powered by Bob</div>
        </div>
      </div>
    </div>
  );
}
