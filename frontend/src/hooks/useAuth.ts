import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { login } from '../api/auth.api';
import { useAuthStore } from '../store/auth.store';
import type { LoginRequest } from '../api/types';

/**
 * Convenience hook that wraps the login mutation and auth store together.
 * Keeps Login.tsx and other callers from importing both separately.
 */
export function useAuth() {
  const navigate = useNavigate();
  const { token, email, setToken, logout, isAuthenticated } = useAuthStore();

  const loginMutation = useMutation({
    mutationFn: (data: LoginRequest) => login(data),
    onSuccess: (res, variables) => {
      setToken(res.access_token, variables.email);
      navigate('/dashboard');
    },
  });

  return {
    token,
    email,
    isAuthenticated,
    logout,
    login: loginMutation.mutate,
    loginAsync: loginMutation.mutateAsync,
    loginPending: loginMutation.isPending,
    loginError: loginMutation.error,
  };
}