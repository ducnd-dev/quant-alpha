import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../services/api';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface AuthResponse {
  token: string;
  user: User;
  message?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (email: string, name: string, password: string) => Promise<boolean>;
  updateUser: (userData: Partial<User>) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      
      login: async (email, password) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await api.post<AuthResponse>('/auth/login', { email, password });
          
          if (response && response.token) {
            // Save the token to localStorage through the API service
            localStorage.setItem('token', response.token);
            
            set({
              user: response.user,
              token: response.token,
              isAuthenticated: true,
              isLoading: false,
              error: null
            });
            
            return true;
          } else {
            set({
              isLoading: false,
              error: 'Invalid response from server'
            });
            return false;
          }
        } catch (err: any) {
          set({
            isLoading: false,
            error: err.message || 'Failed to login'
          });
          return false;
        }
      },
      
      logout: () => {
        // Remove token from localStorage
        localStorage.removeItem('token');
        
        set({
          user: null,
          token: null,
          isAuthenticated: false
        });
      },
      
      register: async (email, name, password) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await api.post<AuthResponse>('/auth/register', { email, name, password });
          
          if (response && response.token) {
            // Save the token to localStorage
            localStorage.setItem('token', response.token);
            
            set({
              user: response.user,
              token: response.token,
              isAuthenticated: true,
              isLoading: false,
              error: null
            });
            
            return true;
          } else {
            set({
              isLoading: false,
              error: 'Invalid response from server'
            });
            return false;
          }
        } catch (err: any) {
          set({
            isLoading: false,
            error: err.message || 'Failed to register'
          });
          return false;
        }
      },
      
      updateUser: (userData) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...userData } : null
        }));
      },
      
      clearError: () => set({ error: null })
    }),
    {
      name: 'alpha-quant-auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated
      }),
    }
  )
);