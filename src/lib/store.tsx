"use client";

import React, { createContext, useContext, ReactNode, useMemo } from "react";
import { DeveloperWithSkills, Project, Allocation, Leave, Phase, RequiredSkill, Tag, Outcome } from "@/types";
import { 
  useAppData, 
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
  isLoading: boolean;
  isError: boolean;
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
  bulkResolve: (params: { 
    toDelete: string[]; 
    toCreate: Allocation[]; 
    toUpdate?: Allocation[];
    leaves?: {
      toDelete?: string[];
      toCreate?: Leave[];
      toUpdate?: Leave[];
    };
  }) => Promise<void>;
  addTag: (tag: Tag) => void;
  updateTag: (tag: Tag) => void;
  deleteTag: (id: string) => void;
  addOutcome: (outcome: Outcome) => void;
  updateOutcome: (outcome: Outcome) => void;
  deleteOutcome: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const { isLoading, isError, data } = useAppData();
  
  const developers = data?.developers || [];
  const projects = data?.projects || [];
  const allocations = data?.allocations || [];
  const leaves = data?.leaves || [];
  const tags = data?.tags || [];

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

  const value = useMemo(() => ({
    developers,
    projects,
    allocations,
    leaves,
    tags,
    isLoading, // Expose loading state
    isError,   // Expose error state
    addDeveloper: (dev: DeveloperWithSkills) => addDeveloperMutation.mutate(dev),
    updateDeveloper: (dev: DeveloperWithSkills) => updateDeveloperMutation.mutate(dev),
    deleteDeveloper: (id: string) => deleteDeveloperMutation.mutate(id),
    addProject: (proj: Project) => addProjectMutation.mutate(proj),
    updateProject: (proj: Project) => updateProjectMutation.mutate(proj),
    deleteProject: (id: string) => deleteProjectMutation.mutate(id),
    addAllocation: (alloc: Allocation) => addAllocationMutation.mutate(alloc),
    updateAllocation: (alloc: Allocation) => updateAllocationMutation.mutate(alloc),
    deleteAllocation: (id: string) => deleteAllocationMutation.mutate(id),
    addLeave: (leave: Leave) => addLeaveMutation.mutate(leave),
    updateLeave: (leave: Leave) => updateLeaveMutation.mutate(leave),
    deleteLeave: (id: string) => deleteLeaveMutation.mutate(id),
    addPhase: (phase: Phase) => addPhaseMutation.mutate(phase),
    updatePhase: (phase: Phase) => updatePhaseMutation.mutate(phase),
    deletePhase: (id: string, projectId: string) => deletePhaseMutation.mutate({ id, projectId }),
    addRequirement: (req: RequiredSkill) => addReqMutation.mutate(req),
    deleteRequirement: (id: string, projectId: string) => deleteReqMutation.mutate({ id, projectId }),
    bulkResolve: async (params: any) => { await bulkResolveMutation.mutateAsync(params); },
    addTag: (tag: Tag) => addTagMutation.mutate(tag),
    updateTag: (tag: Tag) => updateTagMutation.mutate(tag),
    deleteTag: (id: string) => deleteTagMutation.mutate(id),
    addOutcome: (outcome: Outcome) => addOutcomeMutation.mutate(outcome),
    updateOutcome: (outcome: Outcome) => updateOutcomeMutation.mutate(outcome),
    deleteOutcome: (id: string) => deleteOutcomeMutation.mutate(id),
  }), [
    developers, projects, allocations, leaves, tags, isLoading, isError,
    addDeveloperMutation, updateDeveloperMutation, deleteDeveloperMutation,
    addProjectMutation, updateProjectMutation, deleteProjectMutation,
    addAllocationMutation, updateAllocationMutation, deleteAllocationMutation,
    addLeaveMutation, updateLeaveMutation, deleteLeaveMutation,
    addPhaseMutation, updatePhaseMutation, deletePhaseMutation,
    addReqMutation, deleteReqMutation, bulkResolveMutation,
    addTagMutation, updateTagMutation, deleteTagMutation,
    addOutcomeMutation, updateOutcomeMutation, deleteOutcomeMutation
  ]);

  if (isError) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-base-100 gap-4">
        <h2 className="text-xl font-bold">Failed to load data</h2>
        <button onClick={() => window.location.reload()} className="btn btn-primary">Retry</button>
      </div>
    );
  }

  return (
    <AppContext.Provider value={value}>
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
