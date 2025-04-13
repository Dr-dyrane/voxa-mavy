
import { supabase } from "@/integrations/supabase/client";
import { useUserStore } from "@/store/user/userStore";
import { toast } from "sonner";
import { Message, Conversation } from "./types";

export const createChatActions = (get: any, set: any) => ({
  setActiveConversation: (id: string | null) => set({ activeConversationId: id }),
  
  addMessage: (message: Message) => {
    set((state: any) => {
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
          
        const conversation = state.conversations.find((c: Conversation) => 
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
      conversationMessages.sort((a: Message, b: Message) => 
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
  
  setTypingStatus: (conversationId: string, isTyping: boolean) => {
    set((state: any) => ({
      isTyping: {
        ...state.isTyping,
        [conversationId]: isTyping,
      }
    }));
  },
  
  fetchMessages: async (conversationId: string) => {
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
          const conversation = get().conversations.find((conv: Conversation) => 
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
  
  sendMessage: async (content: string, type = "text") => {
    const conversationId = get().activeConversationId;
    const currentUser = useUserStore.getState().user;
    
    if (!conversationId || !currentUser) return;
    
    // Get the conversation to find the receiver
    const conversation = get().conversations.find((c: Conversation) => c.id === conversationId);
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
  }
});
