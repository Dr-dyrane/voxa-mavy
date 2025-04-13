
import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface User {
  id: string;
  username: string;
  avatarUrl?: string;
  status: "online" | "offline" | "away" | "busy";
  lastSeen: Date;
}

interface UserStore {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, username: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
  clearError: () => void;
}

// This is a placeholder store for future integration with Supabase auth
export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      
      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        
        // Mock successful login for UI development
        setTimeout(() => {
          set({
            isLoading: false,
            isAuthenticated: true,
            user: {
              id: "1",
              username: email.split("@")[0],
              status: "online",
              lastSeen: new Date(),
            },
          });
        }, 1000);
      },
      
      register: async (email: string, password: string, username: string) => {
        set({ isLoading: true, error: null });
        
        // Mock successful registration for UI development
        setTimeout(() => {
          set({
            isLoading: false,
            isAuthenticated: true,
            user: {
              id: "1",
              username,
              status: "online",
              lastSeen: new Date(),
            },
          });
        }, 1000);
      },
      
      logout: async () => {
        set({ isLoading: true });
        
        // Mock successful logout
        setTimeout(() => {
          set({
            isLoading: false,
            isAuthenticated: false,
            user: null,
          });
        }, 500);
      },
      
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      clearError: () => set({ error: null }),
    }),
    {
      name: "voxa-user-store",
      // Only store non-sensitive data
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
      }),
    }
  )
);
