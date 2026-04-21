import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  token: string | null;
  email: string | null;
  setToken: (token: string, email: string) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      email: null,
      setToken: (token, email) => {
        localStorage.setItem('access_token', token);
        set({ token, email });
      },
      logout: () => {
        localStorage.removeItem('access_token');
        set({ token: null, email: null });
      },
      isAuthenticated: () => !!get().token,
    }),
    { name: 'kiranaiq-auth', partialize: (s) => ({ token: s.token, email: s.email }) }
  )
);