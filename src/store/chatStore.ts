
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

interface ChatStore {
  conversations: Conversation[];
  activeConversationId: string | null;
  messages: Record<string, Message[]>;
  isTyping: Record<string, boolean>;
  isLoadingMessages: boolean;
  
  // Actions
  setActiveConversation: (id: string | null) => void;
  addMessage: (message: Message) => void;
  setTypingStatus: (conversationId: string, isTyping: boolean) => void;
  fetchMessages: (conversationId: string) => Promise<void>;
  sendMessage: (content: string, type?: Message["type"]) => Promise<void>;
  fetchConversations: () => Promise<void>;
  initializeRealtime: () => void;
}

// Mock data for UI development
const mockUser1 = {
  id: "user1",
  username: "johndoe",
  avatarUrl: "https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?ixlib=rb-4.0.3",
  status: "online" as const,
  lastSeen: new Date(), // Add lastSeen property
};

const mockUser2 = {
  id: "user2",
  username: "janedoe",
  avatarUrl: "https://images.unsplash.com/photo-1582562124811-c09040d0a901?ixlib=rb-4.0.3",
  status: "online" as const,
  lastSeen: new Date(), // Add lastSeen property
};

const mockConversations: Conversation[] = [
  {
    id: "conv1",
    participantIds: ["user1", "user2"],
    updatedAt: new Date(),
    createdAt: new Date(Date.now() - 86400000), // 1 day ago
  }
];

const mockMessages: Record<string, Message[]> = {
  "conv1": [
    {
      id: "msg1",
      senderId: "user2",
      receiverId: "user1",
      content: "Hello! How are you doing today?",
      type: "text",
      isRead: true,
      createdAt: new Date(Date.now() - 3600000), // 1 hour ago
    },
    {
      id: "msg2",
      senderId: "user1",
      receiverId: "user2",
      content: "I'm good, thanks! Just trying out this new Voxa app. The interface looks really clean.",
      type: "text",
      isRead: true,
      createdAt: new Date(Date.now() - 3500000), 
    },
    {
      id: "msg3",
      senderId: "user2",
      receiverId: "user1",
      content: "Yes, I love the design! Those gradient accents are a nice touch.",
      type: "text",
      isRead: true,
      createdAt: new Date(Date.now() - 3400000),
    },
    {
      id: "msg4",
      senderId: "user1",
      receiverId: "user2",
      content: "Agreed! Should we try a voice call to test that feature too?",
      type: "text",
      isRead: false,
      createdAt: new Date(Date.now() - 1800000), // 30 min ago
    }
  ]
};

export const useChatStore = create<ChatStore>()((set, get) => ({
  conversations: mockConversations,
  activeConversationId: null,
  messages: mockMessages,
  isTyping: {},
  isLoadingMessages: false,
  
  setActiveConversation: (id) => set({ activeConversationId: id }),
  
  addMessage: (message) => {
    set((state) => {
      const conversationId = message.senderId === get().activeConversationId ||
                             message.receiverId === get().activeConversationId 
                           ? get().activeConversationId 
                           : null;
                           
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
            updated_at: new Date()
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
      
    // Listen for typing indicators (this would require a separate table or 
    // could be implemented with Presence features)
    
    // Return cleanup function for components to call
    return () => {
      supabase.removeChannel(messageChannel);
    };
  }
}));

// Mock users data store - this would be replaced by a real implementation
export const useUserData = () => {
  return {
    getUserById: (id: string) => {
      if (id === "user1") return mockUser1;
      if (id === "user2") return mockUser2;
      return null;
    },
    currentUser: mockUser1,
  };
};
