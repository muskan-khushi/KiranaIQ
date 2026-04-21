import { useQuery } from '@tanstack/react-query';
import { getStatus, getResult } from '../api/assessment.api';
import type { AssessmentResult, StatusResponse } from '../api/types';

export function useAssessmentPoll(id: string | null) {
  const { data: status } = useQuery<StatusResponse>({
    queryKey: ['status', id],
    queryFn: () => getStatus(id!),
    refetchInterval: (query) => {
      const s = query.state.data?.status;
      if (!s) return 3000;
      return s === 'completed' || s === 'failed' ? false : 3000;
    },
    enabled: !!id,
    staleTime: 0,
  });

  const { data: result, isLoading: resultLoading } = useQuery<AssessmentResult>({
    queryKey: ['result', id],
    queryFn: () => getResult(id!),
    enabled: !!id && status?.status === 'completed',
    staleTime: 5 * 60 * 1000,
  });

  return { status, result, resultLoading };
}