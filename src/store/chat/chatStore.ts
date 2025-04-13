
import { create } from "zustand";
import { Message, Conversation, User } from "./types";
import { createChatActions } from "./actions";
import { createRealtimeActions } from "./realtime";

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
  
  // Helper methods
  getUserById: (id: string) => User | null;
  setUsers: (users: Record<string, User>) => void;
  setLoadingUsers: (isLoading: boolean) => void;
}

export const useChatStore = create<ChatStore>()((set, get) => ({
  conversations: [],
  activeConversationId: null,
  messages: {},
  isTyping: {},
  isLoadingMessages: false,
  users: {},
  isLoadingUsers: false,
  
  setUsers: (users) => set({ users }),
  setLoadingUsers: (isLoading) => set({ isLoadingUsers: isLoading }),
  
  getUserById: (id) => {
    return get().users[id] || null;
  },
  
  ...createChatActions(get, set),
  ...createRealtimeActions(get)
}));
