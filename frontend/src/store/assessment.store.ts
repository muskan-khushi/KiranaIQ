import { create } from 'zustand';
import type { AssessmentResult, StatusResponse } from '../api/types';

interface AssessmentState {
  // Currently viewed / in-progress assessment
  currentId: string | null;
  currentStatus: StatusResponse | null;
  currentResult: AssessmentResult | null;

  // Setters
  setCurrentId: (id: string | null) => void;
  setCurrentStatus: (status: StatusResponse | null) => void;
  setCurrentResult: (result: AssessmentResult | null) => void;
  reset: () => void;
}

export const useAssessmentStore = create<AssessmentState>()((set) => ({
  currentId: null,
  currentStatus: null,
  currentResult: null,

  setCurrentId: (id) => set({ currentId: id }),
  setCurrentStatus: (status) => set({ currentStatus: status }),
  setCurrentResult: (result) => set({ currentResult: result }),
  reset: () => set({ currentId: null, currentStatus: null, currentResult: null }),
}));