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

export async function getInitialData() {

  const devsWithSkills = await prisma.developer.findMany({

    include: { skills: true, tags: true }

  });



  const projects = await prisma.project.findMany({

    include: { 

      requirements: true, 

      phases: {

        include: { outcomes: { include: { assignee: true } } }

      }, 

      tags: true

    }

  });

  const allocations = await prisma.allocation.findMany();

  const leaves = await prisma.leave.findMany();

  const tags = await prisma.tag.findMany();



  return {

    developers: devsWithSkills as unknown as DeveloperWithSkills[], // Prisma types align mostly, explicit cast for safety

    projects: projects as unknown as Project[],

    allocations: allocations as unknown as Allocation[],

    leaves: leaves as unknown as Leave[],

    tags: tags as unknown as Tag[]

  };

}



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


// --- Bulk Resolution (Atomic Operations) ---
export async function bulkResolveAction(params: {
  toDelete: string[];
  toCreate: Allocation[];
  toUpdate?: Allocation[];
}) {
  const validatedDelete = z.array(z.string()).parse(params.toDelete);
  const validatedCreate = z.array(AllocationSchema).parse(params.toCreate);
  const validatedUpdate = z.array(AllocationSchema).parse(params.toUpdate || []);

  await prisma.$transaction(async (tx) => {
    // 1. Delete marked allocations
    if (validatedDelete.length > 0) {
      await tx.allocation.deleteMany({
        where: { id: { in: validatedDelete } }
      });
    }

    // 2. Create new allocation segments
    if (validatedCreate.length > 0) {
      // Prisma doesn't have createMany with specific IDs in a way that handles all SQLite nuances easily,
      // so we use a loop within the transaction for robustness since these are usually small counts.
      for (const alloc of validatedCreate) {
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

    // 3. Update existing segments if any
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
  });
}

  
