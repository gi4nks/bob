export interface Developer {
  id: string;
  name: string;
  avatarUrl: string;
  role: string;
  capacity: number; // e.g., 1.0 for full-time
  dailyRate: number;
  isPlaceholder?: boolean;
  tags?: Tag[];
}

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface Skill {
  name: string;
  level: number; // 1-5
  category: string;
}

export interface Project {
  id: string;
  name: string;
  client: string;
  color: string; // Tailwind class like bg-primary, bg-accent
  status: string; // e.g. Active, Discovery, On Hold, Completed
  budget: number;
  startDate?: Date;
  endDate?: Date;
  requirements?: RequiredSkill[];
  phases?: Phase[];
  tags?: Tag[];
}

export interface Outcome {
  id: string;
  name: string;
  description?: string | null;
  isDone: boolean;
  order: number;
  phaseId: string | null;
  assigneeId?: string | null;
  assignee?: Developer | null;
}

export interface Phase {
  id: string;
  projectId: string;
  name: string;
  startDate: Date;
  endDate: Date;
  color: string;
  requirements?: RequiredSkill[];
  outcomes?: Outcome[];
}

export interface RequiredSkill {
  id: string;
  projectId: string;
  phaseId?: string | null;
  name: string;
  level: number;
}

export interface Allocation {
  id: string;
  developerId: string;
  projectId: string;
  startDate: Date; 
  endDate: Date;
  load: number; // percentage (0-100)
  status: "Confirmed" | "Draft";
}

export interface Leave {
  id: string;
  developerId: string;
  startDate: Date;
  endDate: Date;
  type: "Vacation" | "Sick Leave" | "Public Holiday" | "Other";
  hours?: number;
}

export interface DeveloperWithSkills extends Developer {
  skills: Skill[];
  allocations?: Allocation[];
  leaves?: Leave[];
}
