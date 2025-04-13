import { create } from "zustand";

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
      const conversationId = state.activeConversationId;
      if (!conversationId) return state;
      
      const conversationMessages = [...(state.messages[conversationId] || [])];
      conversationMessages.push(message);
      
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
    set({ isLoadingMessages: true });
    
    // Mock API call delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    set({ 
      isLoadingMessages: false,
      // In a real implementation, we would fetch from Supabase
    });
  },
  
  sendMessage: async (content, type = "text") => {
    const conversationId = get().activeConversationId;
    if (!conversationId) return;
    
    const newMessage: Message = {
      id: `msg${Date.now()}`,
      senderId: "user1", // Current user ID would come from auth
      receiverId: "user2", // This would be determined by the conversation
      content,
      type,
      isRead: false,
      createdAt: new Date(),
    };
    
    get().addMessage(newMessage);
    
    // In a real app, this would send to Supabase
    // await supabaseClient.from("messages").insert(newMessage);
  },
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
