
import { create } from "zustand";
import { supabase } from "@/integrations/supabase/client";
import { useUserStore } from "@/store/userStore";
import { toast } from "sonner";

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  type: "text" | "emoji" | "image" | "file";
  emoji?: Record<string, any>;
  isRead: boolean;
  createdAt: Date;
}

interface Conversation {
  id: string;
  participantIds: string[];
  lastMessageId?: string;
  updatedAt: Date;
  createdAt: Date;
}

interface User {
  id: string;
  username: string;
  avatarUrl?: string;
  status: "online" | "offline" | "away" | "busy";
  lastSeen: Date;
}

interface ChatStore {
  conversations: Conversation[];
  activeConversationId: string | null;
  messages: Record<string, Message[]>;
  isTyping: Record<string, boolean>;
  isLoadingMessages: boolean;
  users: Record<string, User>;
  isLoadingUsers: boolean;
  
  // Actions
  setActiveConversation: (id: string | null) => void;
  addMessage: (message: Message) => void;
  setTypingStatus: (conversationId: string, isTyping: boolean) => void;
  fetchMessages: (conversationId: string) => Promise<void>;
  sendMessage: (content: string, type?: Message["type"]) => Promise<void>;
  fetchConversations: () => Promise<void>;
  fetchUsers: () => Promise<void>;
  initializeRealtime: () => (() => void) | undefined;
  getUserById: (id: string) => User | null;
}

export const useChatStore = create<ChatStore>()((set, get) => ({
  conversations: [],
  activeConversationId: null,
  messages: {},
  isTyping: {},
  isLoadingMessages: false,
  users: {},
  isLoadingUsers: false,
  
  setActiveConversation: (id) => set({ activeConversationId: id }),
  
  addMessage: (message) => {
    set((state) => {
      // Find the conversation for this message
      const currentUser = useUserStore.getState().user;
      if (!currentUser) return state;
      
      // Determine which conversation this belongs to
      let conversationId = state.activeConversationId;
      
      // If we don't have an active conversation, try to find one with these participants
      if (!conversationId) {
        const otherUserId = message.senderId === currentUser.id 
          ? message.receiverId 
          : message.senderId;
          
        const conversation = state.conversations.find(c => 
          c.participantIds.includes(currentUser.id) && 
          c.participantIds.includes(otherUserId)
        );
        
        if (conversation) {
          conversationId = conversation.id;
        }
      }
      
      if (!conversationId) return state;
      
      const conversationMessages = [...(state.messages[conversationId] || [])];
      
      // Check if message already exists
      if (!conversationMessages.find(msg => msg.id === message.id)) {
        conversationMessages.push(message);
      }
      
      // Sort by createdAt
      conversationMessages.sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      
      return {
        messages: {
          ...state.messages,
          [conversationId]: conversationMessages,
        }
      };
    });
  },
  
  setTypingStatus: (conversationId, isTyping) => {
    set((state) => ({
      isTyping: {
        ...state.isTyping,
        [conversationId]: isTyping,
      }
    }));
  },
  
  fetchMessages: async (conversationId) => {
    const currentUser = useUserStore.getState().user;
    if (!currentUser) return;
    
    set({ isLoadingMessages: true });
    
    try {
      const { data: messagesData, error } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`)
        .order('created_at', { ascending: true });
      
      if (error) {
        toast.error("Error fetching messages", {
          description: error.message
        });
        return;
      }
      
      if (messagesData) {
        const messages = messagesData.map(msg => ({
          id: msg.id,
          senderId: msg.sender_id,
          receiverId: msg.receiver_id,
          content: msg.content,
          type: msg.type as Message["type"],
          emoji: msg.emoji,
          isRead: msg.is_read,
          createdAt: new Date(msg.created_at)
        }));
        
        // Group messages by conversation
        const messagesByConversation: Record<string, Message[]> = {};
        messages.forEach(message => {
          const otherUserId = message.senderId === currentUser.id 
            ? message.receiverId 
            : message.senderId;
            
          // Find conversation with this user
          const conversation = get().conversations.find(conv => 
            conv.participantIds.includes(currentUser.id) && 
            conv.participantIds.includes(otherUserId)
          );
          
          if (conversation) {
            if (!messagesByConversation[conversation.id]) {
              messagesByConversation[conversation.id] = [];
            }
            messagesByConversation[conversation.id].push(message);
          }
        });
        
        set({ 
          messages: messagesByConversation,
          isLoadingMessages: false
        });
      }
    } catch (err: any) {
      toast.error("Error fetching messages", {
        description: err.message
      });
      set({ isLoadingMessages: false });
    }
  },
  
  sendMessage: async (content, type = "text") => {
    const conversationId = get().activeConversationId;
    const currentUser = useUserStore.getState().user;
    
    if (!conversationId || !currentUser) return;
    
    // Get the conversation to find the receiver
    const conversation = get().conversations.find(c => c.id === conversationId);
    if (!conversation) return;
    
    // Find the receiver ID (the participant that isn't the current user)
    const receiverId = conversation.participantIds.find(id => id !== currentUser.id);
    if (!receiverId) return;
    
    // Create message structure
    const message = {
      sender_id: currentUser.id,
      receiver_id: receiverId,
      content,
      type,
      is_read: false,
    };
    
    try {
      // Insert into Supabase
      const { data, error } = await supabase
        .from('messages')
        .insert([message])
        .select();
        
      if (error) {
        toast.error("Failed to send message", {
          description: error.message
        });
        return;
      }
      
      if (data && data.length > 0) {
        // Update local state with the sent message
        const newMessage: Message = {
          id: data[0].id,
          senderId: data[0].sender_id,
          receiverId: data[0].receiver_id,
          content: data[0].content,
          type: data[0].type as Message["type"],
          emoji: data[0].emoji,
          isRead: data[0].is_read,
          createdAt: new Date(data[0].created_at)
        };
        
        get().addMessage(newMessage);
        
        // Update the conversation's last_message_id
        await supabase
          .from('conversations')
          .update({ 
            last_message_id: data[0].id,
            updated_at: new Date().toISOString()
          })
          .eq('id', conversationId);
      }
    } catch (err: any) {
      toast.error("Failed to send message", {
        description: err.message
      });
    }
  },
  
  fetchConversations: async () => {
    const currentUser = useUserStore.getState().user;
    if (!currentUser) return;
    
    try {
      const { data: conversationsData, error } = await supabase
        .from('conversations')
        .select('*')
        .contains('participant_ids', [currentUser.id])
        .order('updated_at', { ascending: false });
        
      if (error) {
        toast.error("Error fetching conversations", {
          description: error.message
        });
        return;
      }
      
      if (conversationsData) {
        const conversations: Conversation[] = conversationsData.map(conv => ({
          id: conv.id,
          participantIds: conv.participant_ids,
          lastMessageId: conv.last_message_id,
          updatedAt: new Date(conv.updated_at),
          createdAt: new Date(conv.created_at)
        }));
        
        set({ conversations });
        
        // If there are conversations, fetch messages for each
        if (conversations.length > 0) {
          conversations.forEach(conv => {
            get().fetchMessages(conv.id);
          });
        }
      }
    } catch (err: any) {
      toast.error("Error fetching conversations", {
        description: err.message
      });
    }
  },
  
  fetchUsers: async () => {
    set({ isLoadingUsers: true });
    
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
        const usersRecord: Record<string, User> = {};
        
        usersData.forEach(user => {
          usersRecord[user.id] = {
            id: user.id,
            username: user.username,
            avatarUrl: user.avatar_url,
            status: user.status as "online" | "offline" | "away" | "busy",
            lastSeen: new Date(user.last_seen)
          };
        });
        
        set({ 
          users: usersRecord,
          isLoadingUsers: false
        });
      }
    } catch (err: any) {
      toast.error("Error fetching users", {
        description: err.message
      });
      set({ isLoadingUsers: false });
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
  },
  
  getUserById: (id) => {
    return get().users[id] || null;
  }
}));
