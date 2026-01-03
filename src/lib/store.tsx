"use client";

import React, { createContext, useContext, ReactNode } from "react";
import { DeveloperWithSkills, Project, Allocation, Leave, Phase, RequiredSkill, Tag, Outcome } from "@/types";
import { 
  useAppData, 
  useDevelopers, 
  useProjects, 
  useAllocations, 
  useLeaves,
  useTags,
  useAddDeveloper,
  useUpdateDeveloper,
  useDeleteDeveloper,
  useAddProject,
  useUpdateProject,
  useDeleteProject,
  useAddAllocation,
  useUpdateAllocation,
  useDeleteAllocation,
  useAddLeave,
  useUpdateLeave,
  useDeleteLeave,
  useAddPhase,
  useUpdatePhase,
  useDeletePhase,
  useAddRequirement,
  useDeleteRequirement,
  useBulkResolve,
  useAddTag,
  useUpdateTag,
  useDeleteTag,
  useAddOutcome,
  useUpdateOutcome,
  useDeleteOutcome
} from "./hooks";

interface AppContextType {
  developers: DeveloperWithSkills[];
  projects: Project[];
  allocations: Allocation[];
  leaves: Leave[];
  tags: Tag[];
  addDeveloper: (developer: DeveloperWithSkills) => void;
  updateDeveloper: (developer: DeveloperWithSkills) => void;
  deleteDeveloper: (id: string) => void;
  addProject: (project: Project) => void;
  updateProject: (project: Project) => void;
  deleteProject: (id: string) => void;
  addAllocation: (allocation: Allocation) => void;
  updateAllocation: (allocation: Allocation) => void;
  deleteAllocation: (id: string) => void;
  addLeave: (leave: Leave) => void;
  updateLeave: (leave: Leave) => void;
  deleteLeave: (id: string) => void;
  addPhase: (phase: Phase) => void;
  updatePhase: (phase: Phase) => void;
  deletePhase: (id: string, projectId: string) => void;
  addRequirement: (req: RequiredSkill) => void;
  deleteRequirement: (id: string, projectId: string) => void;
  bulkResolve: (params: { toDelete: string[], toCreate: Allocation[], toUpdate?: Allocation[] }) => Promise<void>;
  addTag: (tag: Tag) => void;
  updateTag: (tag: Tag) => void;
  deleteTag: (id: string) => void;
  addOutcome: (outcome: Outcome) => void;
  updateOutcome: (outcome: Outcome) => void;
  deleteOutcome: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const { isLoading, isError } = useAppData();
  
  const developers = useDevelopers();
  const projects = useProjects();
  const allocations = useAllocations();
  const leaves = useLeaves();
  const tags = useTags();

  const addDeveloperMutation = useAddDeveloper();
  const updateDeveloperMutation = useUpdateDeveloper();
  const deleteDeveloperMutation = useDeleteDeveloper();
  
  const addProjectMutation = useAddProject();
  const updateProjectMutation = useUpdateProject();
  const deleteProjectMutation = useDeleteProject();

  const addAllocationMutation = useAddAllocation();
  const updateAllocationMutation = useUpdateAllocation();
  const deleteAllocationMutation = useDeleteAllocation();

  const addLeaveMutation = useAddLeave();
  const updateLeaveMutation = useUpdateLeave();
  const deleteLeaveMutation = useDeleteLeave();

  const addPhaseMutation = useAddPhase();
  const updatePhaseMutation = useUpdatePhase();
  const deletePhaseMutation = useDeletePhase();

  const addReqMutation = useAddRequirement();
  const deleteReqMutation = useDeleteRequirement();
  const bulkResolveMutation = useBulkResolve();

  const addTagMutation = useAddTag();
  const updateTagMutation = useUpdateTag();
  const deleteTagMutation = useDeleteTag();

  const addOutcomeMutation = useAddOutcome();
  const updateOutcomeMutation = useUpdateOutcome();
  const deleteOutcomeMutation = useDeleteOutcome();

  if (isLoading) {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-base-100">
            <span className="loading loading-spinner loading-lg text-primary"></span>
        </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-base-100 gap-4">
        <h2 className="text-xl font-bold">Failed to load data</h2>
        <button onClick={() => window.location.reload()} className="btn btn-primary">Retry</button>
      </div>
    );
  }

  return (
    <AppContext.Provider
      value={{
        developers,
        projects,
        allocations,
        leaves,
        tags,
        addDeveloper: (dev) => addDeveloperMutation.mutate(dev),
        updateDeveloper: (dev) => updateDeveloperMutation.mutate(dev),
        deleteDeveloper: (id) => deleteDeveloperMutation.mutate(id),
        addProject: (proj) => addProjectMutation.mutate(proj),
        updateProject: (proj) => updateProjectMutation.mutate(proj),
        deleteProject: (id) => deleteProjectMutation.mutate(id),
        addAllocation: (alloc) => addAllocationMutation.mutate(alloc),
        updateAllocation: (alloc) => updateAllocationMutation.mutate(alloc),
        deleteAllocation: (id) => deleteAllocationMutation.mutate(id),
        addLeave: (leave) => addLeaveMutation.mutate(leave),
        updateLeave: (leave) => updateLeaveMutation.mutate(leave),
        deleteLeave: (id) => deleteLeaveMutation.mutate(id),
        addPhase: (phase) => addPhaseMutation.mutate(phase),
        updatePhase: (phase) => updatePhaseMutation.mutate(phase),
        deletePhase: (id, projectId) => deletePhaseMutation.mutate({ id, projectId }),
        addRequirement: (req) => addReqMutation.mutate(req),
        deleteRequirement: (id, projectId) => deleteReqMutation.mutate({ id, projectId }),
        bulkResolve: async (params) => { await bulkResolveMutation.mutateAsync(params); },
        addTag: (tag) => addTagMutation.mutate(tag),
        updateTag: (tag) => updateTagMutation.mutate(tag),
        deleteTag: (id) => deleteTagMutation.mutate(id),
        addOutcome: (outcome) => addOutcomeMutation.mutate(outcome),
        updateOutcome: (outcome) => updateOutcomeMutation.mutate(outcome),
        deleteOutcome: (id) => deleteOutcomeMutation.mutate(id),
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppStore = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppStore must be used within an AppProvider");
  }
  return context;
};
