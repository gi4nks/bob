import { Allocation, Leave } from '@/types';
import { adjustAllocationForLeave } from '@/lib/allocationUtils';

/**
 * Pure function to calculate allocation splits based on new/updated allocations and leaves.
 * Returns the final list of allocations to create and delete.
 */
export function calculateSplits(params: {
  allocsToCreate: Allocation[];
  activeLeaves: Leave[];
  existingAllocs: Allocation[];
  allocsToDelete: string[]; // IDs marked for deletion
  leavesToCreateOrUpdate: Leave[];
}) {
  const { allocsToCreate, activeLeaves, existingAllocs, allocsToDelete, leavesToCreateOrUpdate } = params;
  
  // Prepare final list of allocations to create (starts with the requested creates)
  let finalAllocsToCreate: Allocation[] = [...allocsToCreate];
  const finalAllocsToDelete: string[] = [...allocsToDelete];

  // A. Process New Allocations against Active Leaves
  let processedCreates: Allocation[] = [];
  for (const alloc of finalAllocsToCreate) {
    const devLeaves = activeLeaves.filter(l => l.developerId === alloc.developerId);
    let currentSegments = [alloc];
    
    for (const leave of devLeaves) {
      if (leave.hours) continue; // Partial leave doesn't split
      const nextSegments: Allocation[] = [];
      for (const seg of currentSegments) {
        const splits = adjustAllocationForLeave(seg, leave);
        nextSegments.push(...splits);
      }
      currentSegments = nextSegments;
    }
    processedCreates.push(...currentSegments);
  }
  finalAllocsToCreate = processedCreates;

  // B. Process Active Allocations against New/Updated Leaves
  // We only need to check existing allocations that are NOT in toDelete.
  const activeAllocs = existingAllocs.filter(a => !finalAllocsToDelete.includes(a.id));
  
  const disturbingLeaves = [...leavesToCreateOrUpdate];

  for (const leave of disturbingLeaves) {
    if (leave.hours) continue;
    
    // Find allocations that overlap this new leave
    const victimAllocs = activeAllocs.filter(a => 
      a.developerId === leave.developerId && 
      (a.startDate <= leave.endDate && a.endDate >= leave.startDate)
    );

    for (const victim of victimAllocs) {
      // If we already marked it for delete, skip
      if (finalAllocsToDelete.includes(victim.id)) continue;

      const splits = adjustAllocationForLeave({
        ...victim, 
        status: victim.status as "Confirmed" | "Draft"
      }, leave);
      
      if (splits.length === 1 && splits[0].id === victim.id && splits[0].startDate === victim.startDate && splits[0].endDate === victim.endDate) {
        // No change
        continue;
      }

      // It split or shrank. Mark original for delete, add new segments to create.
      finalAllocsToDelete.push(victim.id);
      finalAllocsToCreate.push(...splits);
    }
  }

  return {
    toCreate: finalAllocsToCreate,
    toDelete: finalAllocsToDelete
  };
}
