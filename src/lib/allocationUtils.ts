import { Allocation, Leave } from "@/types";
import { isOverlapping } from "./dateUtils";

/**
 * Adjusts or splits an allocation based on a leave period.
 * Returns an array of one or more allocations if split/truncated, or an empty array if completely covered by leave.
 */
export const adjustAllocationForLeave = (alloc: Allocation, leave: Leave): Allocation[] => {
  if (!isOverlapping(alloc.startDate, alloc.endDate, leave.startDate, leave.endDate)) {
    return [alloc];
  }

  const allocStart = new Date(alloc.startDate);
  const allocEnd = new Date(alloc.endDate);
  const leaveStart = new Date(leave.startDate);
  const leaveEnd = new Date(leave.endDate);

  const results: Allocation[] = [];

  // 1. Part before the leave
  if (allocStart < leaveStart) {
    const endBefore = new Date(leaveStart);
    endBefore.setDate(endBefore.getDate() - 1);
    
    results.push({
      ...alloc,
      id: crypto.randomUUID(),
      endDate: endBefore
    });
  }

  // 2. Part after the leave
  if (allocEnd > leaveEnd) {
    const startAfter = new Date(leaveEnd);
    startAfter.setDate(startAfter.getDate() + 1);

    results.push({
      ...alloc,
      id: crypto.randomUUID(),
      startDate: startAfter
    });
  }

  return results;
};

/**
 * Splits an allocation into up to three segments based on a target period.
 * Returns an object containing the three potential segments (pre, during, post).
 */
export const splitAllocation = (alloc: Allocation, targetStart: Date, targetEnd: Date) => {
  const allocStart = new Date(alloc.startDate);
  const allocEnd = new Date(alloc.endDate);
  
  const segments: {
    pre: Allocation | null;
    during: Allocation | null;
    post: Allocation | null;
  } = { pre: null, during: null, post: null };

  // 1. Pre-target segment
  if (allocStart < targetStart) {
    const segmentEnd = new Date(targetStart);
    segmentEnd.setDate(segmentEnd.getDate() - 1);
    
    segments.pre = {
      ...alloc,
      id: crypto.randomUUID(),
      endDate: segmentEnd
    };
  }

  // 2. During-target segment (the overlap)
  const overlapStart = allocStart > targetStart ? allocStart : targetStart;
  const overlapEnd = allocEnd < targetEnd ? allocEnd : targetEnd;

  if (overlapStart <= overlapEnd) {
    segments.during = {
      ...alloc,
      id: crypto.randomUUID(),
      startDate: overlapStart,
      endDate: overlapEnd
    };
  }

  // 3. Post-target segment
  if (allocEnd > targetEnd) {
    const segmentStart = new Date(targetEnd);
    segmentStart.setDate(segmentStart.getDate() + 1);

    segments.post = {
      ...alloc,
      id: crypto.randomUUID(),
      startDate: segmentStart
    };
  }

  return segments;
};
