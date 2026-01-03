import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getDevelopers, getProjects, getAllocations, getLeaves, getTags,
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
  developers: ['developers'] as const,
  projects: ['projects'] as const,
  allocations: ['allocations'] as const,
  leaves: ['leaves'] as const,
  tags: ['tags'] as const,
};

// --- Hooks ---

export function useDevelopers() {
  return useQuery({
    queryKey: queryKeys.developers,
    queryFn: getDevelopers,
  });
}

export function useProjects() {
  return useQuery({
    queryKey: queryKeys.projects,
    queryFn: getProjects,
  });
}

export function useAllocations() {
  return useQuery({
    queryKey: queryKeys.allocations,
    queryFn: getAllocations,
  });
}

export function useLeaves() {
  return useQuery({
    queryKey: queryKeys.leaves,
    queryFn: getLeaves,
  });
}

export function useTags() {
  return useQuery({
    queryKey: queryKeys.tags,
    queryFn: getTags,
  });
}

// Aggregated hook for loading state mostly
export function useAppData() {
  const dev = useDevelopers();
  const proj = useProjects();
  const alloc = useAllocations();
  const leave = useLeaves();
  const tag = useTags();

  return {
    isLoading: dev.isLoading || proj.isLoading || alloc.isLoading || leave.isLoading || tag.isLoading,
    isError: dev.isError || proj.isError || alloc.isError || leave.isError || tag.isError,
    data: {
      developers: dev.data || [],
      projects: proj.data || [],
      allocations: alloc.data || [],
      leaves: leave.data || [],
      tags: tag.data || []
    }
  };
}

// --- Mutations ---

export function useAddDeveloper() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createDeveloperAction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.developers });
    },
  });
}

export function useUpdateDeveloper() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateDeveloperAction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.developers });
      // Also allocations might be affected if we display developer details there? 
      // Usually just developers list.
    },
  });
}

export function useDeleteDeveloper() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteDeveloperAction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.developers });
      queryClient.invalidateQueries({ queryKey: queryKeys.allocations }); // cascade delete
      queryClient.invalidateQueries({ queryKey: queryKeys.leaves }); // cascade delete
    },
  });
}

export function useAddProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createProjectAction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects });
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateProjectAction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects });
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteProjectAction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects });
      queryClient.invalidateQueries({ queryKey: queryKeys.allocations }); // cascade
    },
  });
}

// --- Allocation Mutations ---

export function useAddAllocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (alloc: Allocation) => {
      // Delegate splitting logic to server action
      await bulkResolveAction({
        toDelete: [],
        toCreate: [alloc], // Send single allocation, server handles splits
        leaves: undefined 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.allocations });
    },
  });
}

export function useUpdateAllocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateAllocationAction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.allocations });
    },
  });
}

export function useDeleteAllocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteAllocationAction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.allocations });
    },
  });
}

// --- Leave Mutations ---

export function useAddLeave() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (leave: Leave) => {
      // Server handles splitting existing allocations
      await bulkResolveAction({
        toDelete: [],
        toCreate: [],
        leaves: {
          toCreate: [leave]
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.leaves });
      queryClient.invalidateQueries({ queryKey: queryKeys.allocations });
    },
  });
}

export function useUpdateLeave() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (leave: Leave) => {
      // Server handles splitting existing allocations
      await bulkResolveAction({
        toDelete: [],
        toCreate: [],
        leaves: {
          toUpdate: [leave]
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.leaves });
      queryClient.invalidateQueries({ queryKey: queryKeys.allocations });
    },
  });
}

export function useDeleteLeave() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteLeaveAction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.leaves });
    },
  });
}

// --- Kanban Mutations ---

export function useAddOutcome() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createOutcomeAction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects }); // Outcomes are nested in projects/phases
    },
  });
}

export function useUpdateOutcome() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateOutcomeAction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects });
    },
  });
}

export function useDeleteOutcome() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteOutcomeAction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects });
    },
  });
}

// --- Rest ---

export function useAddPhase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createPhaseAction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects });
    },
  });
}

export function useUpdatePhase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updatePhaseAction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects });
    },
  });
}

export function useDeletePhase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { id: string, projectId: string }) => deletePhaseAction(params.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects });
    },
  });
}

export function useAddRequirement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createRequirementAction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects });
    },
  });
}

export function useDeleteRequirement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { id: string, projectId: string }) => deleteRequirementAction(params.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects });
    },
  });
}

export function useBulkResolve() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: bulkResolveAction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.allocations });
      queryClient.invalidateQueries({ queryKey: queryKeys.leaves });
    },
  });
}

export function useAddTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createTagAction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tags });
    },
  });
}

export function useUpdateTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateTagAction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tags });
      // Tags might be used in developers/projects, so might need to invalidate those too if we want immediate updates on names/colors there
      queryClient.invalidateQueries({ queryKey: queryKeys.developers });
      queryClient.invalidateQueries({ queryKey: queryKeys.projects });
    },
  });
}

export function useDeleteTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteTagAction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tags });
      queryClient.invalidateQueries({ queryKey: queryKeys.developers });
      queryClient.invalidateQueries({ queryKey: queryKeys.projects });
    },
  });
}
