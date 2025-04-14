import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { User } from "./types";

export const createAuthActions = (get: any, set: any) => ({
  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        set({ isLoading: false, error: error.message });
        toast.error("Login failed", {
          description: error.message
        });
        return;
      }
      
      if (data.user) {
        // Fetch user profile from our users table
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.user.id)
          .single();
          
        if (userError || !userData) {
          // If no profile exists, create one
          await supabase.from('users').insert([
            {
              id: data.user.id,
              username: email.split('@')[0],
              status: 'online',
              last_seen: new Date()
            }
          ]);
          
          // Then fetch the new user
          const { data: newUserData } = await supabase
            .from('users')
            .select('*')
            .eq('id', data.user.id)
            .single();
            
          if (newUserData) {
            set({
              isAuthenticated: true,
              user: {
                id: newUserData.id,
                username: newUserData.username,
                avatarUrl: newUserData.avatar_url,
                status: newUserData.status as "online" | "offline" | "away" | "busy",
                lastSeen: new Date(newUserData.last_seen)
              },
              isLoading: false
            });
          }
        } else {
          // User profile exists
          set({
            isAuthenticated: true,
            user: {
              id: userData.id,
              username: userData.username,
              avatarUrl: userData.avatar_url,
              status: userData.status as "online" | "offline" | "away" | "busy",
              lastSeen: new Date(userData.last_seen)
            },
            isLoading: false
          });
        }
        
        // Update user presence
        await supabase.from('presence').upsert({
          user_id: data.user.id,
          status: 'online',
          last_seen: new Date()
        });
        
        toast.success("Welcome back!", {
          description: "You've successfully logged in."
        });
      }
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      toast.error("Login failed", {
        description: err.message
      });
    }
  },
  
  register: async (email: string, password: string, username: string) => {
    set({ isLoading: true, error: null });
    
    try {
      // First, check if username is available
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('id')
        .eq('username', username)
        .single();
        
      if (existingUser) {
        set({ isLoading: false, error: "Username is already taken." });
        toast.error("Registration failed", {
          description: "Username is already taken."
        });
        return;
      }
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password
      });
      
      if (error) {
        set({ isLoading: false, error: error.message });
        toast.error("Registration failed", {
          description: error.message
        });
        return;
      }
      
      if (data.user) {
        // Create user profile
        await supabase.from('users').insert([
          {
            id: data.user.id,
            username,
            status: 'online',
            last_seen: new Date()
          }
        ]);
        
        // Create presence entry
        await supabase.from('presence').insert({
          user_id: data.user.id,
          status: 'online',
          last_seen: new Date()
        });
        
        set({
          isAuthenticated: true,
          user: {
            id: data.user.id,
            username,
            status: 'online',
            lastSeen: new Date()
          }
        });
        
        toast.success("Welcome to Voxa!", {
          description: "Your account has been created successfully."
        });
      }
    } catch (err: any) {
      set({ error: err.message });
      toast.error("Registration failed", {
        description: err.message
      });
    } finally {
      set({ isLoading: false });
    }
  },
  
  logout: async () => {
    set({ isLoading: true });
    
    try {
      // Update user presence status before logout
      if (get().user) {
        await supabase.from('presence').upsert({
          user_id: get().user?.id,
          status: 'offline',
          last_seen: new Date()
        });
      }
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        set({ isLoading: false, error: error.message });
        toast.error("Logout failed", {
          description: error.message
        });
        return;
      }
      
      set({
        isLoading: false,
        isAuthenticated: false,
        user: null,
      });
      
      toast.info("Logged out", {
        description: "You have been successfully logged out."
      });
    } catch (err: any) {
      set({ isLoading: false, error: err.message });
    }
  },
});
