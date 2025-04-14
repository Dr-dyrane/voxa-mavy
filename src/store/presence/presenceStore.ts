
import { create } from "zustand";
import { supabase } from "@/integrations/supabase/client";
import { useUserStore } from "@/store/user/userStore";
import { toast } from "sonner";

export type UserStatus = "online" | "offline" | "away" | "busy";

interface PresenceState {
  userStatus: UserStatus;
  statusMessage: string | null;
  isLoading: boolean;
  heartbeatInterval: number | null;
  
  // Actions
  updateStatus: (status: UserStatus) => Promise<void>;
  updateStatusMessage: (message: string | null) => Promise<void>;
  initializePresence: () => (() => void) | undefined;
  startHeartbeat: () => void;
  stopHeartbeat: () => void;
}

export const usePresenceStore = create<PresenceState>()((set, get) => ({
  userStatus: "offline",
  statusMessage: null,
  isLoading: false,
  heartbeatInterval: null,
  
  updateStatus: async (status: UserStatus) => {
    const currentUser = useUserStore.getState().user;
    if (!currentUser) return;
    
    set({ isLoading: true, userStatus: status });
    
    try {
      await supabase
        .from('presence')
        .upsert({
          user_id: currentUser.id,
          status,
          last_seen: new Date().toISOString()
        });
        
      // Also update users table
      await supabase
        .from('users')
        .update({ status })
        .eq('id', currentUser.id);
    } catch (error: any) {
      toast.error("Failed to update status", {
        description: error.message
      });
    } finally {
      set({ isLoading: false });
    }
  },
  
  updateStatusMessage: async (message: string | null) => {
    const currentUser = useUserStore.getState().user;
    if (!currentUser) return;
    
    set({ isLoading: true, statusMessage: message });
    
    try {
      // For this example, we're just storing the message in local state
      // In a real app, you might store this in the database
    } catch (error: any) {
      toast.error("Failed to update status message", {
        description: error.message
      });
    } finally {
      set({ isLoading: false });
    }
  },
  
  initializePresence: () => {
    const currentUser = useUserStore.getState().user;
    if (!currentUser) return undefined;
    
    // Set initial presence
    get().updateStatus("online");
    
    // Start heartbeat
    get().startHeartbeat();
    
    // Set up window focus/blur events to detect when user is AFK
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // User switched tabs or minimized window
        setTimeout(() => {
          // After a delay, if still hidden, set to away
          if (document.hidden && get().userStatus === "online") {
            get().updateStatus("away");
          }
        }, 60000); // 1 minute delay
      } else {
        // User came back
        if (get().userStatus === "away") {
          get().updateStatus("online");
        }
      }
    };
    
    document.addEventListener("visibilitychange", handleVisibilityChange);
    
    // Set up activity monitoring
    let activityTimeout: number | null = null;
    const activityHandler = () => {
      if (activityTimeout) {
        clearTimeout(activityTimeout);
      }
      
      // If user was away, set them back to online
      if (get().userStatus === "away") {
        get().updateStatus("online");
      }
      
      // Set timeout to mark as away after inactivity
      activityTimeout = window.setTimeout(() => {
        if (get().userStatus === "online") {
          get().updateStatus("away");
        }
      }, 300000); // 5 minutes
    };
    
    // Monitor user activity
    window.addEventListener("mousemove", activityHandler);
    window.addEventListener("keydown", activityHandler);
    window.addEventListener("click", activityHandler);
    window.addEventListener("scroll", activityHandler);
    
    // Initial activity check
    activityHandler();
    
    // Set up window beforeunload event to update presence on page close
    const handleBeforeUnload = () => {
      get().updateStatus("offline");
    };
    
    window.addEventListener("beforeunload", handleBeforeUnload);
    
    // Return cleanup function
    return () => {
      get().stopHeartbeat();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("mousemove", activityHandler);
      window.removeEventListener("keydown", activityHandler);
      window.removeEventListener("click", activityHandler);
      window.removeEventListener("scroll", activityHandler);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      
      if (activityTimeout) {
        clearTimeout(activityTimeout);
      }
      
      // Update status to offline
      get().updateStatus("offline");
    };
  },
  
  startHeartbeat: () => {
    const currentUser = useUserStore.getState().user;
    if (!currentUser) return;
    
    // Stop any existing heartbeat
    get().stopHeartbeat();
    
    // Update last_seen periodically
    const interval = window.setInterval(async () => {
      try {
        await supabase
          .from('presence')
          .upsert({
            user_id: currentUser.id,
            status: get().userStatus,
            last_seen: new Date().toISOString()
          });
      } catch (error) {
        console.error("Heartbeat error:", error);
      }
    }, 30000); // Every 30 seconds
    
    set({ heartbeatInterval: interval });
  },
  
  stopHeartbeat: () => {
    const { heartbeatInterval } = get();
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval);
      set({ heartbeatInterval: null });
    }
  },
}));
