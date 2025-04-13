
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useChatStore, useUserData } from "@/store/chatStore";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";

export function ChatList() {
  const { conversations, messages, activeConversationId, setActiveConversation } = useChatStore();
  const { getUserById } = useUserData();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredConversations = conversations.filter((conversation) => {
    // In a real app, we'd search based on username
    const otherUserId = conversation.participantIds.find((id) => id !== "user1");
    const otherUser = otherUserId ? getUserById(otherUserId) : null;
    return otherUser?.username.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleConversationClick = (id: string) => {
    setActiveConversation(id);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search conversations..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {filteredConversations.map((conversation) => {
            const otherUserId = conversation.participantIds.find((id) => id !== "user1");
            const otherUser = otherUserId ? getUserById(otherUserId) : null;
            
            if (!otherUser) return null;
            
            const conversationMessages = messages[conversation.id] || [];
            const lastMessage = conversationMessages[conversationMessages.length - 1];
            
            const isActive = activeConversationId === conversation.id;
            
            return (
              <button
                key={conversation.id}
                className={`w-full text-left p-3 rounded-lg flex items-center space-x-3 transition-colors ${
                  isActive
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-accent/10"
                }`}
                onClick={() => handleConversationClick(conversation.id)}
              >
                <div className="relative">
                  <Avatar>
                    <AvatarImage src={otherUser.avatarUrl} />
                    <AvatarFallback className={`${
                      isActive ? "bg-accent-foreground text-accent" : "bg-accent text-accent-foreground"
                    }`}>
                      {otherUser.username.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-background" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between">
                    <span className="font-medium truncate">{otherUser.username}</span>
                    {lastMessage && (
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(lastMessage.createdAt), {
                          addSuffix: false,
                        })}
                      </span>
                    )}
                  </div>
                  {lastMessage && (
                    <p className="text-sm truncate text-muted-foreground">
                      {lastMessage.senderId === "user1" ? "You: " : ""}
                      {lastMessage.content}
                    </p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
