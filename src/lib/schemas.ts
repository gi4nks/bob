import { z } from 'zod';

export const SkillSchema = z.object({
  name: z.string().min(1),
  level: z.number().int().min(1).max(5),
  category: z.string().min(1),
});

export const TagSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  color: z.string().min(1),
});

export const DeveloperSchema = z.object({
  id: z.string().uuid().or(z.string().min(1)), // randomUUID() doesn't always produce standard UUID in some environments, but usually does.
  name: z.string().min(1),
  role: z.string().min(1),
  avatarUrl: z.string().url().or(z.string().startsWith('/')),
  capacity: z.number().min(0).max(10),
  dailyRate: z.number().min(0),
  isPlaceholder: z.boolean().optional().default(false),
  skills: z.array(SkillSchema),
  tags: z.array(TagSchema).optional(),
});

export const OutcomeSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional().nullable(),
  isDone: z.boolean().default(false),
  order: z.number().int().default(0),
  phaseId: z.string().min(1),
  assigneeId: z.string().optional().nullable(),
});

export const ProjectSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  client: z.string().min(1),
  color: z.string().min(1),
  status: z.string().min(1),
  budget: z.number().min(0),
  startDate: z.coerce.date().optional().nullable(),
  endDate: z.coerce.date().optional().nullable(),
  tags: z.array(TagSchema).optional(),
});

export const AllocationSchema = z.object({
  id: z.string().min(1),
  developerId: z.string().min(1),
  projectId: z.string().min(1),
  startDate: z.coerce.date(), 
  endDate: z.coerce.date(),
  load: z.number().min(0).max(100),
  status: z.enum(['Confirmed', 'Draft']),
});

export const LeaveSchema = z.object({
  id: z.string().min(1),
  developerId: z.string().min(1),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  type: z.enum(['Vacation', 'Sick Leave', 'Public Holiday', 'Other']),
  hours: z.number().min(0).optional().nullable(),
});

export const PhaseSchema = z.object({
  id: z.string().min(1),
  projectId: z.string().min(1),
  name: z.string().min(1),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  color: z.string().min(1),
});

export const RequirementSchema = z.object({
  id: z.string().min(1),
  projectId: z.string().min(1),
  phaseId: z.string().optional().nullable(),
  name: z.string().min(1),
  level: z.number().int().min(1).max(5),
});
