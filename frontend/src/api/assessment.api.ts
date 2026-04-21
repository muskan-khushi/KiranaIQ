import client from './client';
import type { AssessmentResult, StatusResponse } from './types';

export const submitAssessment = async (formData: FormData): Promise<{ assessment_id: string }> => {
  const res = await client.post('/assess/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

export const getStatus = async (id: string): Promise<StatusResponse> => {
  const res = await client.get(`/assess/${id}/status`);
  return res.data;
};

export const getResult = async (id: string): Promise<AssessmentResult> => {
  const res = await client.get(`/assess/${id}`);
  return res.data;
};

export const listAssessments = async (page = 1): Promise<AssessmentResult[]> => {
  const res = await client.get('/assessments/', { params: { page, limit: 20 } });
  return res.data.results ?? res.data;
};