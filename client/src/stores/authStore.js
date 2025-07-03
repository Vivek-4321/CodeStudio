import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import authService from '../services/authService';

export const useAuthStore = create(
  devtools(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      loading: true,
      error: null,

      initializeAuth: async () => {
        try {
          if (authService.isAuthenticated()) {
            const currentUser = await authService.getCurrentUser();
            set({ 
              user: currentUser, 
              isAuthenticated: true,
              loading: false 
            });
          } else {
            set({ loading: false });
          }
        } catch (error) {
          console.error('Failed to initialize auth:', error);
          authService.logout();
          set({ 
            user: null, 
            isAuthenticated: false, 
            loading: false,
            error: 'Failed to initialize auth'
          });
        }
      },

      login: async (email, password) => {
        try {
          set({ loading: true, error: null });
          const result = await authService.login(email, password);
          set({ 
            user: result.user, 
            isAuthenticated: true,
            loading: false 
          });
          return result;
        } catch (error) {
          set({ 
            loading: false,
            error: error.message || 'Login failed'
          });
          throw error;
        }
      },

      register: async (email, password, firstName, lastName) => {
        try {
          set({ loading: true, error: null });
          const result = await authService.register(email, password, firstName, lastName);
          set({ 
            user: result.user, 
            isAuthenticated: true,
            loading: false 
          });
          return result;
        } catch (error) {
          set({ 
            loading: false,
            error: error.message || 'Registration failed'
          });
          throw error;
        }
      },

      logout: () => {
        authService.logout();
        set({ 
          user: null, 
          isAuthenticated: false,
          error: null
        });
      },

      setAuthState: (user) => {
        set({ 
          user, 
          isAuthenticated: true,
          error: null
        });
      },

      clearError: () => {
        set({ error: null });
      }
    }),
    {
      name: 'auth-store'
    }
  )
);