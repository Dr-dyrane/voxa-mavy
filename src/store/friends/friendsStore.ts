
import { create } from "zustand";
import { supabase } from "@/integrations/supabase/client";
import { useUserStore } from "@/store/user/userStore";
import { Friend, FriendRequest, FriendStatus, FriendWithProfile } from "./types";
import { toast } from "sonner";

interface FriendsStore {
  friends: FriendWithProfile[];
  friendRequests: FriendRequest[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchFriends: () => Promise<void>;
  fetchFriendRequests: () => Promise<void>;
  sendFriendRequest: (userId: string) => Promise<void>;
  acceptFriendRequest: (requestId: string) => Promise<void>;
  rejectFriendRequest: (requestId: string) => Promise<void>;
  removeFriend: (friendId: string) => Promise<void>;
  blockUser: (userId: string) => Promise<void>;
  unblockUser: (userId: string) => Promise<void>;
  initializeRealtime: () => (() => void) | undefined;
}

export const useFriendsStore = create<FriendsStore>()((set, get) => ({
  friends: [],
  friendRequests: [],
  isLoading: false,
  error: null,
  
  fetchFriends: async () => {
    const currentUser = useUserStore.getState().user;
    if (!currentUser) return;
    
    set({ isLoading: true });
    
    try {
      // Get all accepted friends
      const { data: friendsData, error } = await supabase
        .from('friends')
        .select('*')
        .eq('user_id', currentUser.id)
        .eq('status', 'accepted');
        
      if (error) throw error;
      
      if (friendsData) {
        // Get profiles for each friend
        const friendIds = friendsData.map(friend => friend.friend_id);
        
        if (friendIds.length > 0) {
          const { data: profiles, error: profilesError } = await supabase
            .from('users')
            .select('*')
            .in('id', friendIds);
            
          if (profilesError) throw profilesError;
          
          const friendsWithProfiles: FriendWithProfile[] = friendsData.map(friend => {
            const profile = profiles?.find(p => p.id === friend.friend_id);
            
            return {
              id: friend.id,
              status: friend.status as FriendStatus,
              user: {
                id: profile?.id || friend.friend_id,
                username: profile?.username || "Unknown User",
                avatarUrl: profile?.avatar_url,
                status: (profile?.status as "online" | "offline" | "away" | "busy") || "offline",
                lastSeen: profile ? new Date(profile.last_seen) : new Date()
              }
            };
          });
          
          set({ friends: friendsWithProfiles });
        } else {
          set({ friends: [] });
        }
      }
    } catch (err: any) {
      set({ error: err.message });
      toast.error("Failed to fetch friends", {
        description: err.message
      });
    } finally {
      set({ isLoading: false });
    }
  },
  
  fetchFriendRequests: async () => {
    const currentUser = useUserStore.getState().user;
    if (!currentUser) return;
    
    set({ isLoading: true });
    
    try {
      const { data: requestsData, error } = await supabase
        .from('friends')
        .select('*')
        .eq('friend_id', currentUser.id)
        .eq('status', 'pending');
        
      if (error) throw error;
      
      if (requestsData) {
        const requests: FriendRequest[] = requestsData.map(req => ({
          id: req.id,
          senderId: req.user_id,
          receiverId: req.friend_id,
          status: req.status as FriendStatus,
          createdAt: new Date(req.created_at)
        }));
        
        set({ friendRequests: requests });
      }
    } catch (err: any) {
      set({ error: err.message });
      toast.error("Failed to fetch friend requests", {
        description: err.message
      });
    } finally {
      set({ isLoading: false });
    }
  },
  
  sendFriendRequest: async (userId: string) => {
    const currentUser = useUserStore.getState().user;
    if (!currentUser) return;
    
    set({ isLoading: true });
    
    try {
      // Check if a request already exists
      const { data: existingRequest } = await supabase
        .from('friends')
        .select('*')
        .or(`and(user_id.eq.${currentUser.id},friend_id.eq.${userId}),and(user_id.eq.${userId},friend_id.eq.${currentUser.id})`);
        
      if (existingRequest && existingRequest.length > 0) {
        toast.info("Friend request already exists");
        return;
      }
      
      // Create friend request
      const { error } = await supabase
        .from('friends')
        .insert([{
          user_id: currentUser.id,
          friend_id: userId,
          status: 'pending'
        }]);
        
      if (error) throw error;
      
      toast.success("Friend request sent");
      
      // Create notification
      await supabase
        .from('notifications')
        .insert([{
          user_id: userId,
          type: 'friend_request',
          payload: {
            sender_id: currentUser.id,
            sender_name: currentUser.username
          },
          is_read: false
        }]);
    } catch (err: any) {
      set({ error: err.message });
      toast.error("Failed to send friend request", {
        description: err.message
      });
    } finally {
      set({ isLoading: false });
    }
  },
  
  acceptFriendRequest: async (requestId: string) => {
    const currentUser = useUserStore.getState().user;
    if (!currentUser) return;
    
    set({ isLoading: true });
    
    try {
      // Get request details
      const { data: requestData, error: requestError } = await supabase
        .from('friends')
        .select('*')
        .eq('id', requestId)
        .single();
        
      if (requestError) throw requestError;
      
      // Update request status
      const { error } = await supabase
        .from('friends')
        .update({ status: 'accepted' })
        .eq('id', requestId);
        
      if (error) throw error;
      
      // Create reciprocal friend entry
      await supabase.from('friends').insert([{
        user_id: currentUser.id,
        friend_id: requestData.user_id,
        status: 'accepted'
      }]);
      
      // Create notification
      await supabase
        .from('notifications')
        .insert([{
          user_id: requestData.user_id,
          type: 'friend_request_accepted',
          payload: {
            accepter_id: currentUser.id,
            accepter_name: currentUser.username
          },
          is_read: false
        }]);
        
      toast.success("Friend request accepted");
      
      // Update state
      await get().fetchFriendRequests();
      await get().fetchFriends();
    } catch (err: any) {
      set({ error: err.message });
      toast.error("Failed to accept friend request", {
        description: err.message
      });
    } finally {
      set({ isLoading: false });
    }
  },
  
  rejectFriendRequest: async (requestId: string) => {
    set({ isLoading: true });
    
    try {
      const { error } = await supabase
        .from('friends')
        .update({ status: 'rejected' })
        .eq('id', requestId);
        
      if (error) throw error;
      
      toast.info("Friend request rejected");
      
      // Update state
      await get().fetchFriendRequests();
    } catch (err: any) {
      set({ error: err.message });
      toast.error("Failed to reject friend request", {
        description: err.message
      });
    } finally {
      set({ isLoading: false });
    }
  },
  
  removeFriend: async (friendId: string) => {
    const currentUser = useUserStore.getState().user;
    if (!currentUser) return;
    
    set({ isLoading: true });
    
    try {
      // Delete both friend entries
      await supabase
        .from('friends')
        .delete()
        .or(`and(user_id.eq.${currentUser.id},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${currentUser.id})`);
        
      toast.info("Friend removed");
      
      // Update state
      await get().fetchFriends();
    } catch (err: any) {
      set({ error: err.message });
      toast.error("Failed to remove friend", {
        description: err.message
      });
    } finally {
      set({ isLoading: false });
    }
  },
  
  blockUser: async (userId: string) => {
    const currentUser = useUserStore.getState().user;
    if (!currentUser) return;
    
    set({ isLoading: true });
    
    try {
      // Check if any entry exists
      const { data: existingEntry } = await supabase
        .from('friends')
        .select('*')
        .eq('user_id', currentUser.id)
        .eq('friend_id', userId);
        
      if (existingEntry && existingEntry.length > 0) {
        // Update existing entry
        await supabase
          .from('friends')
          .update({ status: 'blocked' })
          .eq('id', existingEntry[0].id);
      } else {
        // Create new block entry
        await supabase
          .from('friends')
          .insert([{
            user_id: currentUser.id,
            friend_id: userId,
            status: 'blocked'
          }]);
      }
      
      // Delete any reciprocal friend entry
      await supabase
        .from('friends')
        .delete()
        .eq('user_id', userId)
        .eq('friend_id', currentUser.id);
        
      toast.info("User blocked");
      
      // Update state
      await get().fetchFriends();
      await get().fetchFriendRequests();
    } catch (err: any) {
      set({ error: err.message });
      toast.error("Failed to block user", {
        description: err.message
      });
    } finally {
      set({ isLoading: false });
    }
  },
  
  unblockUser: async (userId: string) => {
    const currentUser = useUserStore.getState().user;
    if (!currentUser) return;
    
    set({ isLoading: true });
    
    try {
      await supabase
        .from('friends')
        .delete()
        .eq('user_id', currentUser.id)
        .eq('friend_id', userId)
        .eq('status', 'blocked');
        
      toast.info("User unblocked");
    } catch (err: any) {
      set({ error: err.message });
      toast.error("Failed to unblock user", {
        description: err.message
      });
    } finally {
      set({ isLoading: false });
    }
  },
  
  initializeRealtime: () => {
    const currentUser = useUserStore.getState().user;
    if (!currentUser) return;
    
    // Listen for friend request changes
    const friendsChannel = supabase
      .channel('public:friends')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'friends',
          filter: `friend_id=eq.${currentUser.id}`
        },
        () => {
          // Refresh friend requests
          get().fetchFriendRequests();
          get().fetchFriends();
        }
      )
      .subscribe();
      
    // Listen for notifications
    const notificationsChannel = supabase
      .channel('public:notifications')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'notifications',
          filter: `user_id=eq.${currentUser.id}`
        },
        (payload) => {
          const notification = payload.new;
          
          if (notification.type === 'friend_request') {
            toast("New Friend Request", {
              description: `${notification.payload.sender_name} sent you a friend request.`,
              action: {
                label: "View",
                onClick: () => {
                  // This could navigate to the friend requests page
                }
              }
            });
            
            // Refresh friend requests
            get().fetchFriendRequests();
          }
        }
      )
      .subscribe();
      
    // Return cleanup function
    return () => {
      supabase.removeChannel(friendsChannel);
      supabase.removeChannel(notificationsChannel);
    };
  }
}));
