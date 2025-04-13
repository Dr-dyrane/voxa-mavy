
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { supabase } from "@/integrations/supabase/client";
import { User } from "./types";
import { createAuthActions } from "./authActions";
import { createProfileActions } from "./profileActions";

interface UserStore {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Auth actions
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, username: string) => Promise<void>;
  logout: () => Promise<void>;
  
  // Profile actions
  setUser: (user: User | null) => void;
  clearError: () => void;
  refreshUser: () => Promise<void>;
  updateProfile: (profileData: { username?: string, status?: string }) => Promise<{ success: boolean, error?: string }>;
  updateAvatar: (file: File) => Promise<{ success: boolean, error?: string, avatarUrl?: string }>;
}

export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      
      ...createAuthActions(get, set),
      ...createProfileActions(get, set),
    }),
    {
      name: "voxa-user-store",
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
      }),
    }
  )
);

// Setup auth state listener
if (typeof window !== 'undefined') {
  supabase.auth.onAuthStateChange((event, session) => {
    const store = useUserStore.getState();
    
    if (event === 'SIGNED_IN' && session) {
      // Don't need to do anything here since refreshUser will be called in App.tsx
    } else if (event === 'SIGNED_OUT') {
      store.setUser(null);
    }
  });
}
