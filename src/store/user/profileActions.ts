import { supabase } from "@/integrations/supabase/client";

export const createProfileActions = (get: any, set: any) => ({
  setUser: (user: any) => set({ user, isAuthenticated: !!user }),
  
  clearError: () => set({ error: null }),
  
  refreshUser: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.log("No authenticated user found during refresh");
        set({ user: null, isAuthenticated: false, isLoading: false });
        return;
      }
      
      console.log("Fetching profile for user:", user.id);
      
      // Get user profile
      const { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();
        
      if (error) {
        console.error("Error fetching user profile:", error.message);
        if (error.code === 'PGRST116') {
          // No profile found - create one
          console.log("No profile found, creating one");
          const { error: insertError } = await supabase.from('users').insert([
            {
              id: user.id,
              username: user.email?.split('@')[0] || `user_${user.id.substring(0, 8)}`,
              status: 'online',
              last_seen: new Date().toISOString()
            }
          ]);
          
          if (insertError) {
            console.error("Failed to create user profile:", insertError.message);
            set({ user: null, isAuthenticated: false, isLoading: false, error: insertError.message });
            return;
          }
          
          // Fetch the newly created profile
          const { data: newUserData, error: fetchError } = await supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single();
            
          if (fetchError || !newUserData) {
            console.error("Failed to fetch newly created profile:", fetchError?.message);
            set({ user: null, isAuthenticated: false, isLoading: false, error: fetchError?.message });
            return;
          }
          
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
          return;
        }
        
        // For any other error
        set({ user: null, isAuthenticated: false, isLoading: false, error: error.message });
        return;
      }
      
      if (!userData) {
        console.error("No user profile data returned");
        set({ user: null, isAuthenticated: false, isLoading: false });
        return;
      }
      
      console.log("User profile fetched successfully:", userData);
      
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
    } catch (err: any) {
      console.error("Exception in refreshUser:", err.message);
      set({ user: null, isAuthenticated: false, isLoading: false, error: err.message });
    }
  },
  
  updateProfile: async (profileData: { username?: string, status?: string }) => {
    const { user } = get();
    if (!user) return;
    
    try {
      set({ isLoading: true });
      
      const updates: any = {};
      if (profileData.username) updates.username = profileData.username;
      if (profileData.status) updates.status = profileData.status;
      
      const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id);
        
      if (error) throw error;
      
      // Refresh user data
      await get().refreshUser();
      
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    } finally {
      set({ isLoading: false });
    }
  },
  
  updateAvatar: async (file: File) => {
    const { user } = get();
    if (!user) return { success: false, error: "Not authenticated" };
    
    try {
      set({ isLoading: true });
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `avatars/${fileName}`;
      
      // Upload the file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);
        
      if (uploadError) throw uploadError;
      
      // Get the public URL
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
        
      const avatarUrl = data.publicUrl;
      
      // Update user profile with new avatar URL
      const { error: updateError } = await supabase
        .from('users')
        .update({ avatar_url: avatarUrl })
        .eq('id', user.id);
        
      if (updateError) throw updateError;
      
      // Refresh user data
      await get().refreshUser();
      
      return { success: true, avatarUrl };
    } catch (error: any) {
      return { success: false, error: error.message };
    } finally {
      set({ isLoading: false });
    }
  },
});
