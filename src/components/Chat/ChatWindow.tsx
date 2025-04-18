import { useState, useRef, useEffect } from "react";
import { Send, Paperclip, Smile, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useChatStore } from "@/store/chat/chatStore";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { TypingIndicator } from "./TypingIndicator";
import { MessageBubble } from "./MessageBubble";
import { useUserStore } from "@/store/user/userStore";

export function ChatWindow() {
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user: currentUser } = useUserStore();
  const { 
    activeConversationId, 
    messages, 
    sendMessage,
    isTyping,
    setTypingStatus,
    conversations,
    fetchUsers,
    getUserById
  } = useChatStore();
  
  const conversationMessages = activeConversationId ? messages[activeConversationId] : [];
  
  useEffect(() => {
    // Fetch users data when component mounts
    fetchUsers();
  }, [fetchUsers]);
  
  const handleSendMessage = () => {
    if (message.trim() && activeConversationId) {
      sendMessage(message);
      setMessage("");
      setTypingStatus(activeConversationId, false);
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    
    if (activeConversationId) {
      setTypingStatus(activeConversationId, e.target.value.length > 0);
    }
  };
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversationMessages]);
  
  if (!activeConversationId) {
    return (
      <div className="h-full flex items-center justify-center text-center p-4">
        <div className="max-w-md">
          <h2 className="text-2xl font-bold mb-2 voxa-gradient-text">Start a conversation</h2>
          <p className="text-muted-foreground">
            Select a chat from the sidebar or start a new conversation
          </p>
        </div>
      </div>
    );
  }
  
  // Find the active conversation
  const activeConversation = conversations.find(c => c.id === activeConversationId);
  
  if (!activeConversation || !currentUser) {
    return null;
  }
  
  // Get the other user in the conversation
  const otherUserId = activeConversation.participantIds.find(id => id !== currentUser.id);
  const otherUser = otherUserId ? getUserById(otherUserId) : null;
  
  if (!otherUser) {
    return null;
  }
  
  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Avatar>
            <AvatarImage src={otherUser.avatarUrl} />
            <AvatarFallback className="bg-accent text-accent-foreground">
              {otherUser.username?.substring(0, 2).toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-medium">{otherUser.username}</h3>
            <div className="flex items-center space-x-1">
              <span className={`h-2 w-2 rounded-full ${
                otherUser.status === 'online' ? 'bg-green-500' : 
                otherUser.status === 'away' ? 'bg-yellow-500' : 
                'bg-gray-400'
              }`} />
              <span className="text-xs text-muted-foreground">{otherUser.status}</span>
            </div>
          </div>
        </div>
        <div className="flex space-x-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="text-accent">
                <Mic size={18} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Voice Call</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="text-accent">
                <Smile size={18} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Open Emoji Picker</TooltipContent>
          </Tooltip>
        </div>
      </div>
      
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {conversationMessages && conversationMessages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            currentUser={currentUser}
          />
        ))}
        
        {activeConversationId && isTyping[activeConversationId] && (
          <div className="flex items-start gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={otherUser.avatarUrl} />
              <AvatarFallback className="bg-accent text-accent-foreground">
                {otherUser.username?.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <TypingIndicator />
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Message Input */}
      <div className="p-4 border-t">
        <div className="flex items-end space-x-2">
          <div className="flex-1 relative">
            <Textarea
              value={message}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              className="min-h-[80px] pr-12 resize-none"
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 bottom-2 text-muted-foreground hover:text-accent"
            >
              <Paperclip size={18} />
            </Button>
          </div>
          <Button
            onClick={handleSendMessage}
            className="bg-accent h-10 w-10 rounded-full p-2 flex items-center justify-center"
            disabled={!message.trim()}
          >
            <Send size={18} className="text-white" />
          </Button>
        </div>
      </div>
    </div>
  );
}
