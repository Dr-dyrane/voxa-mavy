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
        try {
          // Fetch user profile from our users table
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', data.user.id)
            .single();
            
          if (userError || !userData) {
            console.log("No user profile found, creating one");
            // If no profile exists, create one
            const { error: insertError } = await supabase.from('users').insert([
              {
                id: data.user.id,
                username: email.split('@')[0],
                status: 'online',
                last_seen: new Date().toISOString()
              }
            ]);
            
            if (insertError) {
              console.error("Error creating user profile:", insertError.message);
              set({ 
                isLoading: false, 
                error: "Failed to create user profile"
              });
              toast.error("Login issue", {
                description: "Failed to create user profile"
              });
              return;
            }
            
            // Then fetch the new user
            const { data: newUserData, error: fetchError } = await supabase
              .from('users')
              .select('*')
              .eq('id', data.user.id)
              .single();
              
            if (fetchError || !newUserData) {
              console.error("Failed to fetch newly created user profile:", fetchError?.message);
              set({ 
                isLoading: false, 
                error: "Failed to fetch user profile"
              });
              toast.error("Login issue", {
                description: "Failed to fetch user profile"
              });
              return;
            }
            
            console.log("New user profile created and fetched:", newUserData);
            set({
              isAuthenticated: true,
              user: {
                id: newUserData.id,
                username: newUserData.username,
                avatarUrl: newUserData.avatar_url,
                status: newUserData.status as "online" | "offline" | "away" | "busy",
                lastSeen: new Date(newUserData.last_seen)
              },
              isLoading: false,
              error: null
            });
          } else {
            // User profile exists
            console.log("Existing user profile found:", userData);
            set({
              isAuthenticated: true,
              user: {
                id: userData.id,
                username: userData.username,
                avatarUrl: userData.avatar_url,
                status: userData.status as "online" | "offline" | "away" | "busy",
                lastSeen: new Date(userData.last_seen)
              },
              isLoading: false,
              error: null
            });
          }
          
          // Update user presence
          await supabase.from('presence').upsert({
            user_id: data.user.id,
            status: 'online',
            last_seen: new Date().toISOString()
          });
          
          toast.success("Welcome back!", {
            description: "You've successfully logged in."
          });
          
          console.log("Login flow complete, authentication state updated");
        } catch (err: any) {
          console.error("Error processing user profile:", err.message);
          set({ isLoading: false, error: err.message || "Error processing profile" });
          toast.error("Login issue", {
            description: err.message || "Error processing profile"
          });
          return;
        }
      } else {
        console.error("Login succeeded but no user data returned");
        set({ isLoading: false, error: "No user data returned" });
        toast.error("Login issue", {
          description: "No user data returned"
        });
      }
    } catch (err: any) {
      console.error("Login exception:", err.message);
      set({ isLoading: false, error: err.message });
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
        try {
          await supabase.from('presence').upsert({
            user_id: get().user?.id,
            status: 'offline',
            last_seen: new Date().toISOString()
          });
        } catch (presenceErr) {
          console.error("Error updating presence during logout:", presenceErr);
          // Continue with logout even if presence update fails
        }
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
        error: null
      });
      
      console.log("Logout successful, reset authentication state");
      
      toast.info("Logged out", {
        description: "You have been successfully logged out."
      });
    } catch (err: any) {
      console.error("Logout exception:", err.message);
      // Always reset auth state on logout attempt, even if there was an error
      set({ 
        isLoading: false, 
        error: err.message, 
        isAuthenticated: false, 
        user: null 
      });
      toast.info("Logged out", {
        description: "You have been logged out."
      });
    }
  },
});
