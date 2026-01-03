import { DeveloperWithSkills, Allocation, Leave, Project } from "@/types";
import { isOverlapping, formatDate } from "./dateUtils";

export interface Conflict {
  id: string;
  type: "OVERLOAD" | "LEAVE_CONFLICT";
  severity: "HIGH" | "MEDIUM";
  developerId: string;
  developerName: string;
  periodLabel: string;
  startDate: Date;
  endDate: Date;
  details: string;
  allocations: Allocation[];
  leaves: Leave[];
}

export const detectConflicts = (
  developers: DeveloperWithSkills[],
  allocations: Allocation[],
  leaves: Leave[],
  projects: Project[],
  weeksToScan: number = 12,
  startDate: Date = new Date(2026, 0, 1)
): Conflict[] => {
  const conflicts: Conflict[] = [];
  const scanEnd = new Date(startDate);
  scanEnd.setDate(scanEnd.getDate() + (weeksToScan * 7));

  developers.forEach(dev => {
    // 1. Collect all boundary dates for this developer
    const devAllocations = allocations.filter(a => a.developerId === dev.id);
    const devLeaves = leaves.filter(l => l.developerId === dev.id);

    const boundaryDates: Set<number> = new Set();
    boundaryDates.add(startDate.getTime());
    boundaryDates.add(scanEnd.getTime());

    [...devAllocations, ...devLeaves].forEach(item => {
      const s = new Date(item.startDate).getTime();
      const e = new Date(item.endDate).getTime();
      const nextDay = new Date(item.endDate);
      nextDay.setDate(nextDay.getDate() + 1);
      
      if (s >= startDate.getTime() && s <= scanEnd.getTime()) boundaryDates.add(s);
      if (nextDay.getTime() >= startDate.getTime() && nextDay.getTime() <= scanEnd.getTime()) boundaryDates.add(nextDay.getTime());
    });

    const sortedDates = Array.from(boundaryDates).sort((a, b) => a - b);
    
    // 2. Scan each segment between boundaries
    const rawConflicts: Conflict[] = [];

    for (let i = 0; i < sortedDates.length - 1; i++) {
      const segStart = new Date(sortedDates[i]);
      const segEnd = new Date(sortedDates[i + 1]);
      segEnd.setDate(segEnd.getDate() - 1); // Boundary is "start of next", so segment ends day before

      if (segStart > segEnd) continue;

      const activeAllocations = devAllocations.filter(a => isOverlapping(a.startDate, a.endDate, segStart, segEnd));
      const activeLeaves = devLeaves.filter(l => isOverlapping(l.startDate, l.endDate, segStart, segEnd));

      const totalLoad = activeAllocations.reduce((sum, a) => sum + a.load, 0);
      const capacityPercent = dev.capacity * 100;

      // Type 1: Leave Conflict (Allocated during leave)
      if (activeAllocations.length > 0 && activeLeaves.length > 0) {
        rawConflicts.push({
          id: `raw-leave-${dev.id}-${i}`,
          type: "LEAVE_CONFLICT",
          severity: "HIGH",
          developerId: dev.id,
          developerName: dev.name,
          periodLabel: "", // Will be set during consolidation
          startDate: segStart,
          endDate: segEnd,
          details: `Booked for ${activeAllocations[0].load}% load during ${activeLeaves[0].type}`,
          allocations: activeAllocations,
          leaves: activeLeaves
        });
      }
      // Type 2: Overload
      else if (totalLoad > capacityPercent) {
        rawConflicts.push({
          id: `raw-overload-${dev.id}-${i}`,
          type: "OVERLOAD",
          severity: totalLoad > 120 ? "HIGH" : "MEDIUM",
          developerId: dev.id,
          developerName: dev.name,
          periodLabel: "",
          startDate: segStart,
          endDate: segEnd,
          details: `Allocated ${totalLoad}% (Capacity: ${capacityPercent}%)`,
          allocations: activeAllocations,
          leaves: activeLeaves
        });
      }
    }

    // 3. Consolidate contiguous segments of the same conflict
    if (rawConflicts.length > 0) {
      let current = rawConflicts[0];

      for (let i = 1; i < rawConflicts.length; i++) {
        const next = rawConflicts[i];
        const isContiguous = (new Date(current.endDate).getTime() + (24 * 60 * 60 * 1000)) >= new Date(next.startDate).getTime();
        const sameType = current.type === next.type;
        
        // Simplified check: if projects/leaves involved are the same, merge them
        const sameContext = JSON.stringify(current.allocations.map(a => a.id).sort()) === JSON.stringify(next.allocations.map(a => a.id).sort());

        if (isContiguous && sameType && sameContext) {
          current.endDate = next.endDate;
        } else {
          current.periodLabel = `${formatDate(current.startDate)} to ${formatDate(current.endDate)}`;
          current.id = `${current.type}-${dev.id}-${current.startDate.getTime()}`;
          conflicts.push(current);
          current = next;
        }
      }
      current.periodLabel = `${formatDate(current.startDate)} to ${formatDate(current.endDate)}`;
      current.id = `${current.type}-${dev.id}-${current.startDate.getTime()}`;
      conflicts.push(current);
    }
  });

  return conflicts;
};
