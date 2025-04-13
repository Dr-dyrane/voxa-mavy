
import { supabase } from "@/integrations/supabase/client";

export const createProfileActions = (get: any, set: any) => ({
  setUser: (user: any) => set({ user, isAuthenticated: !!user }),
  
  clearError: () => set({ error: null }),
  
  refreshUser: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        set({ user: null, isAuthenticated: false });
        return;
      }
      
      // Get user profile
      const { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();
        
      if (error || !userData) {
        set({ user: null, isAuthenticated: false });
        return;
      }
      
      set({
        isAuthenticated: true,
        user: {
          id: userData.id,
          username: userData.username,
          avatarUrl: userData.avatar_url,
          status: userData.status as "online" | "offline" | "away" | "busy",
          lastSeen: new Date(userData.last_seen)
        }
      });
    } catch (err) {
      set({ user: null, isAuthenticated: false });
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
