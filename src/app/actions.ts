'use server'

import prisma from '@/lib/db';
import { z } from 'zod';
import { 
  DeveloperSchema, 
  ProjectSchema, 
  AllocationSchema, 
  LeaveSchema, 
  PhaseSchema, 
  RequirementSchema,
  TagSchema,
  OutcomeSchema
} from '@/lib/schemas';
import { DeveloperWithSkills, Project, Allocation, Leave, Phase, RequiredSkill, Tag, Outcome } from '@/types';

// --- Initial Load ---

// --- Data Fetching ---

function safeAllocationStatus(status: string): "Confirmed" | "Draft" {
  return (status === "Confirmed" || status === "Draft") ? status : "Confirmed";
}

function safeLeaveType(type: string): "Vacation" | "Sick Leave" | "Public Holiday" | "Other" {
  const validTypes = ["Vacation", "Sick Leave", "Public Holiday", "Other"];
  return validTypes.includes(type) ? (type as any) : "Other";
}

export async function getDevelopers(): Promise<DeveloperWithSkills[]> {
  const devs = await prisma.developer.findMany({
    include: { skills: true, tags: true }
  });
  return devs.map(d => ({
    id: d.id,
    name: d.name,
    role: d.role,
    avatarUrl: d.avatarUrl,
    capacity: d.capacity,
    dailyRate: d.dailyRate,
    isPlaceholder: d.isPlaceholder,
    tags: d.tags.map(t => ({ id: t.id, name: t.name, color: t.color })),
    skills: d.skills.map(s => ({
      name: s.name,
      level: s.level,
      category: s.category
    }))
  }));
}

export async function getProjects(): Promise<Project[]> {
  const projects = await prisma.project.findMany({
    include: { 
      requirements: true, 
      phases: {
        include: { 
          outcomes: { 
            include: { 
              assignee: {
                include: { tags: true }
              } 
            } 
          },
          requirements: true 
        }
      }, 
      tags: true
    }
  });

  return projects.map(p => ({
    id: p.id,
    name: p.name,
    client: p.client,
    color: p.color,
    status: p.status,
    budget: p.budget,
    startDate: p.startDate ? p.startDate : undefined,
    endDate: p.endDate ? p.endDate : undefined,
    tags: p.tags.map(t => ({ id: t.id, name: t.name, color: t.color })),
    requirements: p.requirements.map(r => ({
      id: r.id,
      projectId: r.projectId,
      phaseId: r.phaseId,
      name: r.name,
      level: r.level
    })),
    phases: p.phases.map(ph => ({
      id: ph.id,
      projectId: ph.projectId,
      name: ph.name,
      startDate: ph.startDate,
      endDate: ph.endDate,
      color: ph.color,
      requirements: ph.requirements.map(pr => ({
        id: pr.id,
        projectId: pr.projectId,
        phaseId: pr.phaseId,
        name: pr.name,
        level: pr.level
      })),
      outcomes: ph.outcomes.map(o => ({
        id: o.id,
        name: o.name,
        description: o.description,
        isDone: o.isDone,
        order: o.order,
        phaseId: o.phaseId,
        assigneeId: o.assigneeId,
        assignee: o.assignee ? {
          id: o.assignee.id,
          name: o.assignee.name,
          role: o.assignee.role,
          avatarUrl: o.assignee.avatarUrl,
          capacity: o.assignee.capacity,
          dailyRate: o.assignee.dailyRate,
          isPlaceholder: o.assignee.isPlaceholder,
          tags: o.assignee.tags.map(t => ({ id: t.id, name: t.name, color: t.color }))
        } : null
      }))
    }))
  }));
}

export async function getAllocations(): Promise<Allocation[]> {
  const allocations = await prisma.allocation.findMany();
  return allocations.map(a => ({
    id: a.id,
    developerId: a.developerId,
    projectId: a.projectId,
    startDate: a.startDate,
    endDate: a.endDate,
    load: a.load,
    status: safeAllocationStatus(a.status)
  }));
}

export async function getLeaves(): Promise<Leave[]> {
  const leaves = await prisma.leave.findMany();
  return leaves.map(l => ({
    id: l.id,
    developerId: l.developerId,
    startDate: l.startDate,
    endDate: l.endDate,
    type: safeLeaveType(l.type),
    hours: l.hours || undefined
  }));
}

export async function getTags(): Promise<Tag[]> {
  const tags = await prisma.tag.findMany();
  return tags.map(t => ({
    id: t.id,
    name: t.name,
    color: t.color
  }));
}

// ...



// ...



// --- Outcomes (Key Results) ---

export async function createOutcomeAction(outcome: Outcome) {

  const validated = OutcomeSchema.parse(outcome);

  await prisma.outcome.create({

    data: {

      id: validated.id,

      name: validated.name,

      description: validated.description,

      isDone: validated.isDone,

      order: validated.order,

      phaseId: validated.phaseId,

      assigneeId: validated.assigneeId

    }

  });

}



export async function updateOutcomeAction(outcome: Outcome) {

  const validated = OutcomeSchema.parse(outcome);

  await prisma.outcome.update({

    where: { id: validated.id },

    data: {

      name: validated.name,

      description: validated.description,

      isDone: validated.isDone,

      order: validated.order,

      phaseId: validated.phaseId,

      assigneeId: validated.assigneeId

    }

  });

}



export async function deleteOutcomeAction(id: string) {
  await prisma.outcome.delete({
    where: { id }
  });
}

// --- Developers ---
export async function createDeveloperAction(dev: DeveloperWithSkills) {
  const validated = DeveloperSchema.parse(dev);
  
  await prisma.developer.create({
    data: {
      id: validated.id,
      name: validated.name,
      role: validated.role,
      avatarUrl: validated.avatarUrl,
      capacity: validated.capacity,
      dailyRate: validated.dailyRate,
      isPlaceholder: validated.isPlaceholder || false,
      skills: {
        create: validated.skills.map(s => ({
          name: s.name,
          level: s.level,
          category: s.category
        }))
      },
      tags: {
        connect: (validated.tags || []).map(t => ({ id: t.id }))
      }
    }
  });
}

export async function updateDeveloperAction(dev: DeveloperWithSkills) {
  const validated = DeveloperSchema.parse(dev);

  await prisma.$transaction(async (tx) => {
    await tx.developer.update({
      where: { id: validated.id },
      data: {
        name: validated.name,
        role: validated.role,
        avatarUrl: validated.avatarUrl,
        capacity: validated.capacity,
        dailyRate: validated.dailyRate,
        isPlaceholder: validated.isPlaceholder || false,
        tags: {
          set: (validated.tags || []).map(t => ({ id: t.id }))
        }
      }
    });

    // Delete existing skills
    await tx.skill.deleteMany({
      where: { developerId: validated.id }
    });

    // Create new skills
    if (validated.skills.length > 0) {
      await tx.skill.createMany({
        data: validated.skills.map(s => ({
          developerId: validated.id,
          name: s.name,
          level: s.level,
          category: s.category
        }))
      });
    }
  });
}

export async function deleteDeveloperAction(id: string) {
  await prisma.developer.delete({
    where: { id }
  });
}

// --- Projects ---
export async function createProjectAction(proj: Project) {
  const validated = ProjectSchema.parse(proj);
  await prisma.project.create({
    data: {
      id: validated.id,
      name: validated.name,
      client: validated.client,
      color: validated.color,
      status: validated.status,
      budget: validated.budget,
      startDate: validated.startDate,
      endDate: validated.endDate,
      tags: {
        connect: (validated.tags || []).map(t => ({ id: t.id }))
      }
    }
  });
}

export async function updateProjectAction(proj: Project) {
  const validated = ProjectSchema.parse(proj);
  await prisma.project.update({
    where: { id: validated.id },
    data: {
      name: validated.name,
      client: validated.client,
      color: validated.color,
      status: validated.status,
      budget: validated.budget,
      startDate: validated.startDate,
      endDate: validated.endDate,
      tags: {
        set: (validated.tags || []).map(t => ({ id: t.id }))
      }
    }
  });
}

export async function deleteProjectAction(id: string) {
  await prisma.project.delete({
    where: { id }
  });
}

// ...
// --- Tags ---
export async function createTagAction(tag: Tag) {
  const validated = TagSchema.parse(tag);
  await prisma.tag.create({
    data: {
      id: validated.id,
      name: validated.name,
      color: validated.color
    }
  });
}

export async function updateTagAction(tag: Tag) {
  const validated = TagSchema.parse(tag);
  await prisma.tag.update({
    where: { id: validated.id },
    data: {
      name: validated.name,
      color: validated.color
    }
  });
}

export async function deleteTagAction(id: string) {
  await prisma.tag.delete({
    where: { id }
  });
}

// --- Allocations ---
export async function createAllocationAction(alloc: Allocation) {
  const validated = AllocationSchema.parse(alloc);
  await prisma.allocation.create({
    data: {
      id: validated.id,
      developerId: validated.developerId,
      projectId: validated.projectId,
      startDate: validated.startDate,
      endDate: validated.endDate,
      load: validated.load,
      status: validated.status
    }
  });
}

export async function updateAllocationAction(alloc: Allocation) {
  const validated = AllocationSchema.parse(alloc);
  await prisma.allocation.update({
    where: { id: validated.id },
    data: {
      developerId: validated.developerId,
      projectId: validated.projectId,
      startDate: validated.startDate,
      endDate: validated.endDate,
      load: validated.load,
      status: validated.status
    }
  });
}

export async function deleteAllocationAction(id: string) {
  try {
    await prisma.allocation.delete({
      where: { id }
    });
  } catch (_e) {
    // Ignore error if record already deleted
    console.warn(`Attempted to delete non-existent allocation: ${id}`);
  }
}

// --- Leaves ---
export async function createLeaveAction(leave: Leave) {
  const validated = LeaveSchema.parse(leave);
  await prisma.leave.create({
    data: {
      id: validated.id,
      developerId: validated.developerId,
      startDate: validated.startDate,
      endDate: validated.endDate,
      type: validated.type,
      hours: validated.hours
    }
  });
}

export async function updateLeaveAction(leave: Leave) {
  const validated = LeaveSchema.parse(leave);
  await prisma.leave.update({
    where: { id: validated.id },
    data: {
      developerId: validated.developerId,
      startDate: validated.startDate,
      endDate: validated.endDate,
      type: validated.type,
      hours: validated.hours
    }
  });
}

export async function deleteLeaveAction(id: string) {
  try {
    await prisma.leave.delete({
      where: { id }
    });
  } catch (_e) {
    console.warn(`Attempted to delete non-existent leave: ${id}`);
  }
}

// --- Phases ---
export async function createPhaseAction(phase: Phase) {
  const validated = PhaseSchema.parse(phase);
  await prisma.phase.create({
    data: {
      id: validated.id,
      projectId: validated.projectId,
      name: validated.name,
      startDate: validated.startDate,
      endDate: validated.endDate,
      color: validated.color
    }
  });
}

export async function updatePhaseAction(phase: Phase) {
  const validated = PhaseSchema.parse(phase);
  await prisma.phase.update({
    where: { id: validated.id },
    data: {
      name: validated.name,
      startDate: validated.startDate,
      endDate: validated.endDate,
      color: validated.color
    }
  });
}

export async function deletePhaseAction(id: string) {
  await prisma.phase.delete({
    where: { id }
  });
}

// --- Requirements ---
export async function createRequirementAction(req: RequiredSkill) {
  const validated = RequirementSchema.parse(req);
  await prisma.requiredSkill.create({
    data: {
      id: validated.id,
      projectId: validated.projectId,
      phaseId: validated.phaseId,
      name: validated.name,
      level: validated.level
    }
  });
}


export async function deleteRequirementAction(id: string) {
  await prisma.requiredSkill.delete({
    where: { id }
  });
}


import { calculateSplits } from '@/lib/logic/allocationLogic';

// ...

// --- Bulk Resolution (Atomic Operations) ---
export async function bulkResolveAction(params: {
  toDelete: string[];
  toCreate: Allocation[];
  toUpdate?: Allocation[];
  leaves?: {
    toDelete?: string[];
    toCreate?: Leave[];
    toUpdate?: Leave[];
  };
}) {
  const validatedDelete = z.array(z.string()).parse(params.toDelete);
  // We process creates/updates to handle splits, so we parse but don't finalize yet
  let allocsToCreate = z.array(AllocationSchema).parse(params.toCreate);
  const validatedUpdate = z.array(AllocationSchema).parse(params.toUpdate || []);

  const leavesDelete = z.array(z.string()).parse(params.leaves?.toDelete || []);
  const leavesCreate = z.array(LeaveSchema).parse(params.leaves?.toCreate || []);
  const leavesUpdate = z.array(LeaveSchema).parse(params.leaves?.toUpdate || []);

  // Fetch current state
  const existingLeaves = await prisma.leave.findMany();
  const existingAllocs = await prisma.allocation.findMany();

  // Prepare active leaves list (existing - deleted + created + updated)
  const activeLeaves = existingLeaves
    .filter(l => !leavesDelete.includes(l.id))
    .map(l => ({ ...l, type: l.type as any, hours: l.hours || undefined })); // cast for type match
  
  leavesCreate.forEach(l => activeLeaves.push({ ...l, hours: l.hours || undefined }));
  leavesUpdate.forEach(l => {
    const idx = activeLeaves.findIndex(al => al.id === l.id);
    const updated = { ...l, hours: l.hours || undefined };
    if (idx !== -1) activeLeaves[idx] = updated;
    else activeLeaves.push(updated);
  });

  const leavesToCreateOrUpdate = [...leavesCreate, ...leavesUpdate].map(l => ({ ...l, hours: l.hours || undefined }));
  const existingAllocsMapped = existingAllocs.map(a => ({...a, status: a.status as "Confirmed" | "Draft"}));

  // Calculate splits
  const { toCreate: finalAllocsToCreate, toDelete: finalAllocsToDelete } = calculateSplits({
    allocsToCreate,
    activeLeaves,
    existingAllocs: existingAllocsMapped,
    allocsToDelete: validatedDelete,
    leavesToCreateOrUpdate
  });

  await prisma.$transaction(async (tx) => {
    // 1. Allocations: Delete
    if (finalAllocsToDelete.length > 0) {
      await tx.allocation.deleteMany({
        where: { id: { in: finalAllocsToDelete } }
      });
    }

    // 2. Allocations: Create
    if (finalAllocsToCreate.length > 0) {
      for (const alloc of finalAllocsToCreate) {
        await tx.allocation.create({
          data: {
            id: alloc.id,
            developerId: alloc.developerId,
            projectId: alloc.projectId,
            startDate: alloc.startDate,
            endDate: alloc.endDate,
            load: alloc.load,
            status: alloc.status
          }
        });
      }
    }
    
    // ... (rest of transaction remains same)
    // 3. Allocations: Update
    for (const alloc of validatedUpdate) {
      await tx.allocation.update({
        where: { id: alloc.id },
        data: {
          developerId: alloc.developerId,
          projectId: alloc.projectId,
          startDate: alloc.startDate,
          endDate: alloc.endDate,
          load: alloc.load,
          status: alloc.status
        }
      });
    }

    // 4. Leaves: Delete
    if (leavesDelete.length > 0) {
      await tx.leave.deleteMany({
        where: { id: { in: leavesDelete } }
      });
    }

    // 5. Leaves: Create
    for (const leave of leavesCreate) {
      await tx.leave.create({
        data: {
          id: leave.id,
          developerId: leave.developerId,
          startDate: leave.startDate,
          endDate: leave.endDate,
          type: leave.type,
          hours: leave.hours
        }
      });
    }

    // 6. Leaves: Update
    for (const leave of leavesUpdate) {
      await tx.leave.update({
        where: { id: leave.id },
        data: {
          developerId: leave.developerId,
          startDate: leave.startDate,
          endDate: leave.endDate,
          type: leave.type,
          hours: leave.hours
        }
      });
    }
  });
}

  
