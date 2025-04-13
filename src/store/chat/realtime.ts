
import { supabase } from "@/integrations/supabase/client";
import { useUserStore } from "@/store/user/userStore";
import { toast } from "sonner";
import { Message } from "./types";

export const createRealtimeActions = (get: any) => ({
  fetchUsers: async () => {
    get().setLoadingUsers(true);
    
    try {
      const { data: usersData, error } = await supabase
        .from('users')
        .select('*')
        .order('username');
        
      if (error) {
        toast.error("Error fetching users", {
          description: error.message
        });
        return;
      }
      
      if (usersData) {
        const usersRecord: Record<string, any> = {};
        
        usersData.forEach(user => {
          usersRecord[user.id] = {
            id: user.id,
            username: user.username,
            avatarUrl: user.avatar_url,
            status: user.status as "online" | "offline" | "away" | "busy",
            lastSeen: new Date(user.last_seen)
          };
        });
        
        get().setUsers(usersRecord);
      }
    } catch (err: any) {
      toast.error("Error fetching users", {
        description: err.message
      });
    } finally {
      get().setLoadingUsers(false);
    }
  },
  
  initializeRealtime: () => {
    const currentUser = useUserStore.getState().user;
    if (!currentUser) return;
    
    // Listen for new messages
    const messageChannel = supabase
      .channel('public:messages')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages',
          filter: `receiver_id=eq.${currentUser.id}`
        },
        (payload) => {
          // New message received
          const messageData = payload.new;
          
          const newMessage: Message = {
            id: messageData.id,
            senderId: messageData.sender_id,
            receiverId: messageData.receiver_id,
            content: messageData.content,
            type: messageData.type as Message["type"],
            emoji: messageData.emoji,
            isRead: messageData.is_read,
            createdAt: new Date(messageData.created_at)
          };
          
          get().addMessage(newMessage);
          
          // Create notification for new message
          if (messageData.sender_id !== currentUser.id) {
            toast("New message", {
              description: `${newMessage.content.substring(0, 30)}${newMessage.content.length > 30 ? '...' : ''}`,
            });
          }
        }
      )
      .subscribe();
      
    // Listen for user presence changes
    const presenceChannel = supabase
      .channel('public:presence')
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'presence'
        },
        (payload) => {
          // Refresh users to get updated presence
          get().fetchUsers();
        }
      )
      .subscribe();
      
    // Return cleanup function for components to call
    return () => {
      supabase.removeChannel(messageChannel);
      supabase.removeChannel(presenceChannel);
    };
  }
});
