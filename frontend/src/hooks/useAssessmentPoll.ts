import { useQuery } from '@tanstack/react-query';
import { getStatus, getResult } from '../api/assessment.api';
import type { AssessmentResult, StatusResponse } from '../api/types';

/**
 * Polls assessment status every 3 seconds until completed or failed.
 * Then fetches the full result document.
 *
 * Pass null as id to disable polling (e.g. for demo mode).
 */
export function useAssessmentPoll(id: string | null) {
  const { data: status, isError: statusError } = useQuery<StatusResponse>({
    queryKey: ['status', id],
    queryFn: () => getStatus(id!),
    enabled: !!id,
    staleTime: 0,
    retry: 3,
    retryDelay: 2000,
    refetchInterval: (query) => {
      const s = query.state.data?.status;
      // Stop polling once terminal state reached
      if (!s) return 3000;
      return s === 'completed' || s === 'failed' ? false : 3000;
    },
  });

  const { data: result, isLoading: resultLoading } = useQuery<AssessmentResult>({
    queryKey: ['result', id],
    queryFn: () => getResult(id!),
    // Only fetch full result when status is completed
    enabled: !!id && status?.status === 'completed',
    staleTime: 5 * 60 * 1000, // 5 minutes — result won't change
    retry: 2,
  });

  return {
    status,
    result,
    resultLoading,
    statusError,
  };
}