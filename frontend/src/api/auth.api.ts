import client from './client';
import type { LoginRequest, TokenResponse } from './types';

export const login = async (data: LoginRequest): Promise<TokenResponse> => {
  const res = await client.post('/auth/login', data);
  return res.data;
};