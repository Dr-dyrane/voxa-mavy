
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { User } from "./types";

export const createAuthActions = (get: any, set: any) => ({
  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    
    try {
      console.log("Login attempt for:", email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        console.error("Login error:", error.message);
        set({ isLoading: false, error: error.message });
        toast.error("Login failed", {
          description: error.message
        });
        return;
      }
      
      console.log("Login successful, fetching user profile");
      
      if (data.user) {
        // Fetch user profile from our users table
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.user.id)
          .single();
          
        if (userError || !userData) {
          console.log("No user profile found, creating one");
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
            console.log("New user profile created and fetched");
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
          } else {
            // Make sure we still set isLoading to false even if we couldn't fetch the new user
            console.error("Failed to fetch newly created user profile");
            set({ isLoading: false, error: "Failed to fetch user profile" });
          }
        } else {
          // User profile exists
          console.log("Existing user profile found");
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
        
        console.log("Login flow complete, authentication state updated");
      }
    } catch (err: any) {
      console.error("Login exception:", err.message);
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
          },
          isLoading: false
        });
        
        toast.success("Welcome to Voxa!", {
          description: "Your account has been created successfully."
        });
      } else {
        // Make sure to set loading to false even if we couldn't create the user
        set({ isLoading: false });
      }
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      toast.error("Registration failed", {
        description: err.message
      });
    }
  },
  
  logout: async () => {
    set({ isLoading: true, error: null });
    
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
        console.error("Logout error:", error.message);
        set({ isLoading: false, error: error.message });
        toast.error("Logout failed", {
          description: error.message
        });
        return;
      }
      
      // Always reset the state, even if there was an error updating presence
      set({
        isLoading: false,
        isAuthenticated: false,
        user: null,
      });
      
      console.log("Logout successful, reset authentication state");
      
      toast.info("Logged out", {
        description: "You have been successfully logged out."
      });
    } catch (err: any) {
      console.error("Logout exception:", err.message);
      set({ isLoading: false, error: err.message, isAuthenticated: false, user: null });
      // Still log the user out locally even if there was an error
      toast.info("Logged out", {
        description: "You have been logged out."
      });
    }
  },
});
