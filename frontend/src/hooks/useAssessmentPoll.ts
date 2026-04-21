import { useQuery } from '@tanstack/react-query';
import { getStatus, getResult } from '../api/assessment.api';
import type { AssessmentResult, StatusResponse } from '../api/types';

export function useAssessmentPoll(id: string | null) {
  // TanStack Query v5: refetchInterval callback receives a Query object
  // with { state: { data, status, ... } } — NOT the data directly.
  const { data: status } = useQuery<StatusResponse>({
    queryKey: ['status', id],
    queryFn: () => getStatus(id!),
    enabled: !!id,
    staleTime: 0,
    refetchInterval: (query) => {
      const s = query.state.data?.status;
      if (!s) return 3000;
      return s === 'completed' || s === 'failed' ? false : 3000;
    },
  });

  const { data: result, isLoading: resultLoading } = useQuery<AssessmentResult>({
    queryKey: ['result', id],
    queryFn: () => getResult(id!),
    enabled: !!id && status?.status === 'completed',
    staleTime: 5 * 60 * 1000,
  });

  return { status, result, resultLoading };
}