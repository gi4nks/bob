"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import { Plus, Plane, ChevronRight } from "lucide-react";
import Link from "next/link";
import NewAllocationModal from "./NewAllocationModal";
import NewLeaveModal from "./NewLeaveModal";
import { useAppStore } from "@/lib/store";

const Navbar = () => {
  const pathname = usePathname();
  const { projects } = useAppStore();
  const [isAllocModalOpen, setIsAllocModalOpen] = useState(false);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);

  const getBreadcrumbs = () => {
    const paths = pathname.split("/").filter(Boolean);
    const breadcrumbs: { label: string; href: string }[] = [];

    if (paths.length === 0) {
      breadcrumbs.push({ label: "Timeline", href: "/" });
      return breadcrumbs;
    }

    let currentPath = "";
    paths.forEach((path, index) => {
      currentPath += `/${path}`;
      
      let label = path.charAt(0).toUpperCase() + path.slice(1);
      
      // Special mappings
      if (path === "team") label = "Team & Skills";
      if (path === "projects") label = "Projects";
      if (path === "reports") label = "Reports";
      if (path === "utilization") label = "Utilization Center";
      if (path === "financials") label = "Project Financials";
      if (path === "skills-gap") label = "Skills Gap Analysis";
      if (path === "resource") label = "Resource Management";
      if (path === "alerts") label = "Conflicts & Alerts";
      if (path === "matrix") label = "Skill Matrix";
      if (path === "leaves") label = "Leaves";
      if (path === "search") label = "Smart Match";

      // Flatten logic: If this is the 'reports' segment but there is a sub-path, 
      // skip adding it to breadcrumbs to avoid fake parent-child hierarchy
      if (path === "reports" && paths.length > 1) return;

      // Dynamic project ID handling
      if (paths[index - 1] === "projects") {
        const project = projects.find(p => p.id === path);
        if (project) label = project.name;
      }

      breadcrumbs.push({ label, href: currentPath });
    });

    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <>
      <div className="navbar bg-base-100 border-b border-base-200 sticky top-0 z-10 px-8">
        <div className="flex-none lg:hidden">
          <label htmlFor="my-drawer" aria-label="open sidebar" className="btn btn-square btn-ghost">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-6 h-6 stroke-current"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
          </label>
        </div>
        <div className="flex-1">
          <div className="text-sm breadcrumbs">
            <ul>
              <li><Link href="/" className="opacity-60 hover:opacity-100 transition-opacity">Bob</Link></li>
              {breadcrumbs.map((bc, i) => {
                // Don't show "Timeline" link if we are already showing "Bob" at the root
                if (pathname === "/" && bc.label === "Timeline") {
                   return <li key="root-label"><span className="font-semibold text-primary">Timeline</span></li>;
                }
                
                return (
                  <li key={bc.href}>
                    {i === breadcrumbs.length - 1 ? (
                      <span className="font-semibold text-primary">{bc.label}</span>
                    ) : (
                      <Link href={bc.href} className="opacity-60 hover:opacity-100 transition-opacity">
                        {bc.label}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
        <div className="flex-none gap-2">
          <button 
            className="btn btn-primary btn-sm gap-2"
            onClick={() => setIsAllocModalOpen(true)}
          >
            <Plus className="w-4 h-4" />
            New Allocation
          </button>
        </div>
      </div>
      
      <NewAllocationModal isOpen={isAllocModalOpen} onClose={() => setIsAllocModalOpen(false)} />
      <NewLeaveModal isOpen={isLeaveModalOpen} onClose={() => setIsLeaveModalOpen(false)} />
    </>
  );
};

export default Navbar;
