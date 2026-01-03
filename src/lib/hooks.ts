import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getInitialData, 
  createDeveloperAction, updateDeveloperAction, deleteDeveloperAction,
  createProjectAction, updateProjectAction, deleteProjectAction,
  createAllocationAction, updateAllocationAction, deleteAllocationAction,
  createLeaveAction, updateLeaveAction, deleteLeaveAction,
  createPhaseAction, updatePhaseAction, deletePhaseAction,
  createRequirementAction, deleteRequirementAction,
  bulkResolveAction,
  createTagAction, updateTagAction, deleteTagAction,
  createOutcomeAction, updateOutcomeAction, deleteOutcomeAction
} from '@/app/actions';
import { DeveloperWithSkills, Project, Allocation, Leave, Phase, RequiredSkill, Tag, Outcome } from '@/types';
import { isOverlapping } from './dateUtils';
import { adjustAllocationForLeave } from './allocationUtils';

// --- Keys ---
export const queryKeys = {
  all: ['initialData'] as const,
};

// --- Hooks ---

export function useAppData() {
  return useQuery({
    queryKey: queryKeys.all,
    queryFn: getInitialData,
  });
}

export function useDevelopers() {
  const { data } = useAppData();
  return data?.developers || [];
}

export function useProjects() {
  const { data } = useAppData();
  return data?.projects || [];
}

export function useAllocations() {
  const { data } = useAppData();
  return data?.allocations || [];
}

export function useLeaves() {
  const { data } = useAppData();
  return data?.leaves || [];
}

export function useTags() {
  const { data } = useAppData();
  return data?.tags || [];
}

// --- Mutations ---

export function useAddDeveloper() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createDeveloperAction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.all });
    },
  });
}

export function useUpdateDeveloper() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateDeveloperAction,
    onMutate: async (newDev) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.all });
      const previousData = queryClient.getQueryData<any>(queryKeys.all);
      if (previousData) {
        queryClient.setQueryData(queryKeys.all, {
          ...previousData,
          developers: previousData.developers.map((d: DeveloperWithSkills) => 
            d.id === newDev.id ? newDev : d
          ),
        });
      }
      return { previousData };
    },
    onError: (err, newDev, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKeys.all, context.previousData);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.all });
    },
  });
}

export function useDeleteDeveloper() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteDeveloperAction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.all });
    },
  });
}

export function useAddProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createProjectAction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.all });
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateProjectAction,
    onMutate: async (newProj) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.all });
      const previousData = queryClient.getQueryData<any>(queryKeys.all);
      if (previousData) {
        queryClient.setQueryData(queryKeys.all, {
          ...previousData,
          projects: previousData.projects.map((p: Project) => 
            p.id === newProj.id ? { ...p, ...newProj } : p
          ),
        });
      }
      return { previousData };
    },
    onError: (err, newProj, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKeys.all, context.previousData);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.all });
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteProjectAction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.all });
    },
  });
}

// --- Allocation Mutations ---

export function useAddAllocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (alloc: Allocation) => {
      const data = queryClient.getQueryData<{ leaves: Leave[] }>(queryKeys.all);
      const leaves = data?.leaves || [];
      
      const devLeaves = leaves.filter(l => l.developerId === alloc.developerId);
      let currentAllocations = [alloc];

      devLeaves.forEach(leave => {
        const nextAllocations: Allocation[] = [];
        currentAllocations.forEach(a => {
          const adjusted = adjustAllocationForLeave(a, leave);
          nextAllocations.push(...adjusted);
        });
        currentAllocations = nextAllocations;
      });

      if (currentAllocations.length === 0) return;

      for (const a of currentAllocations) {
        await createAllocationAction(a);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.all });
    },
  });
}

export function useUpdateAllocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateAllocationAction,
    onMutate: async (newAlloc) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.all });
      const previousData = queryClient.getQueryData<any>(queryKeys.all);
      if (previousData) {
        queryClient.setQueryData(queryKeys.all, {
          ...previousData,
          allocations: previousData.allocations.map((a: Allocation) => 
            a.id === newAlloc.id ? newAlloc : a
          ),
        });
      }
      return { previousData };
    },
    onError: (err, newAlloc, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKeys.all, context.previousData);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.all });
    },
  });
}

export function useDeleteAllocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteAllocationAction,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.all });
      const previousData = queryClient.getQueryData<any>(queryKeys.all);
      if (previousData) {
        queryClient.setQueryData(queryKeys.all, {
          ...previousData,
          allocations: previousData.allocations.filter((a: Allocation) => a.id !== id),
        });
      }
      return { previousData };
    },
    onError: (err, id, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKeys.all, context.previousData);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.all });
    },
  });
}

// --- Leave Mutations ---

export function useAddLeave() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (leave: Leave) => {
      const data = queryClient.getQueryData<{ allocations: Allocation[] }>(queryKeys.all);
      const allocations = data?.allocations || [];
      await createLeaveAction(leave);
      const toDelete: string[] = [];
      const toCreate: Allocation[] = [];
      allocations.forEach((alloc) => {
        if (!leave.hours && alloc.developerId === leave.developerId && isOverlapping(alloc.startDate, alloc.endDate, leave.startDate, leave.endDate)) {
          toDelete.push(alloc.id);
          const adjusted = adjustAllocationForLeave(alloc, leave);
          adjusted.forEach(a => toCreate.push(a));
        }
      });
      for (const id of toDelete) await deleteAllocationAction(id);
      for (const a of toCreate) await createAllocationAction(a);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.all });
    },
  });
}

export function useUpdateLeave() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (leave: Leave) => {
      const data = queryClient.getQueryData<{ allocations: Allocation[] }>(queryKeys.all);
      const allocations = data?.allocations || [];
      await updateLeaveAction(leave);
      const toDelete: string[] = [];
      const toCreate: Allocation[] = [];
      allocations.forEach((alloc) => {
        if (!leave.hours && alloc.developerId === leave.developerId && isOverlapping(alloc.startDate, alloc.endDate, leave.startDate, leave.endDate)) {
          toDelete.push(alloc.id);
          const adjusted = adjustAllocationForLeave(alloc, leave);
          adjusted.forEach(a => toCreate.push(a));
        }
      });
      for (const id of toDelete) await deleteAllocationAction(id);
      for (const a of toCreate) await createAllocationAction(a);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.all });
    },
  });
}

export function useDeleteLeave() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteLeaveAction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.all });
    },
  });
}

// --- Kanban Mutations ---

export function useAddOutcome() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createOutcomeAction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.all });
    },
  });
}

export function useUpdateOutcome() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateOutcomeAction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.all });
    },
  });
}

export function useDeleteOutcome() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteOutcomeAction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.all });
    },
  });
}

// --- Rest ---

export function useAddPhase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createPhaseAction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.all });
    },
  });
}

export function useUpdatePhase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updatePhaseAction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.all });
    },
  });
}

export function useDeletePhase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { id: string, projectId: string }) => deletePhaseAction(params.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.all });
    },
  });
}

export function useAddRequirement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createRequirementAction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.all });
    },
  });
}

export function useDeleteRequirement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { id: string, projectId: string }) => deleteRequirementAction(params.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.all });
    },
  });
}

export function useBulkResolve() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: bulkResolveAction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.all });
    },
  });
}

export function useAddTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createTagAction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.all });
    },
  });
}

export function useUpdateTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateTagAction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.all });
    },
  });
}

export function useDeleteTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteTagAction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.all });
    },
  });
}
