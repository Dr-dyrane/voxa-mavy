
import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Search, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger 
} from "@/components/ui/dialog";
import { useChatStore } from "@/store/chatStore";
import { useUserStore } from "@/store/userStore";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function ChatList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [newDialogOpen, setNewDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  
  const { user: currentUser } = useUserStore();
  const { 
    conversations,
    activeConversationId,
    setActiveConversation,
    fetchConversations,
    users,
    fetchUsers
  } = useChatStore();
  
  useEffect(() => {
    if (currentUser) {
      fetchUsers();
    }
  }, [currentUser, fetchUsers]);
  
  // Create a new conversation with the selected user
  const createConversation = async () => {
    if (!selectedUser || !currentUser) return;
    
    try {
      // Check if conversation already exists
      const existingConv = conversations.find(c => 
        c.participantIds.includes(currentUser.id) && 
        c.participantIds.includes(selectedUser)
      );
      
      if (existingConv) {
        setActiveConversation(existingConv.id);
        setNewDialogOpen(false);
        return;
      }
      
      // Create new conversation
      const { data, error } = await supabase
        .from('conversations')
        .insert([
          {
            participant_ids: [currentUser.id, selectedUser],
          }
        ])
        .select();
        
      if (error) {
        toast.error("Failed to create conversation", {
          description: error.message
        });
        return;
      }
      
      if (data && data.length > 0) {
        // Refresh conversations list
        await fetchConversations();
        
        // Set the new conversation as active
        setActiveConversation(data[0].id);
        setNewDialogOpen(false);
        
        toast.success("Conversation started");
      }
    } catch (err: any) {
      toast.error("Error creating conversation", {
        description: err.message
      });
    }
  };
  
  // Filter users for the new conversation dialog
  const filteredUsers = Object.values(users).filter(user => 
    user.id !== currentUser?.id && 
    user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Filter conversations for the chat list
  const filteredConversations = conversations.filter(conversation => {
    // For now, just return all conversations
    return true;
    
    // In the future, could filter based on search term and last message content
  });
  
  return (
    <div className="h-full flex flex-col">
      <div className="p-4 space-y-4 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search chats..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <Dialog open={newDialogOpen} onOpenChange={setNewDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full flex items-center gap-2">
              <Plus size={16} />
              <span>New Chat</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Start a new conversation</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <Input 
                placeholder="Search users..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <ScrollArea className="h-[300px]">
                <div className="space-y-2">
                  {filteredUsers.map((user) => (
                    <button
                      key={user.id}
                      className={`w-full text-left p-3 rounded-lg flex items-center space-x-3 transition-colors ${
                        selectedUser === user.id
                          ? "bg-accent text-accent-foreground"
                          : "hover:bg-accent/10"
                      }`}
                      onClick={() => setSelectedUser(user.id)}
                    >
                      <Avatar>
                        <AvatarImage src={user.avatarUrl} />
                        <AvatarFallback>
                          {user.username.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{user.username}</div>
                        <div className="text-xs flex items-center">
                          <span 
                            className={`inline-block h-2 w-2 rounded-full mr-1 ${
                              user.status === 'online' 
                                ? 'bg-green-500' 
                                : user.status === 'away'
                                  ? 'bg-yellow-500'
                                  : 'bg-gray-400'
                            }`} 
                          />
                          <span>{user.status}</span>
                        </div>
                      </div>
                    </button>
                  ))}
                  
                  {filteredUsers.length === 0 && (
                    <div className="text-center p-4 text-muted-foreground">
                      No users found
                    </div>
                  )}
                </div>
              </ScrollArea>
              <div className="flex justify-end">
                <Button 
                  onClick={createConversation} 
                  disabled={!selectedUser}
                >
                  Start Chat
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {filteredConversations.map((conversation) => {
            // Get the other participant in this conversation
            const otherUserId = conversation.participantIds.find(
              id => id !== currentUser?.id
            );
            const otherUser = otherUserId ? users[otherUserId] : null;
            
            if (!otherUser) return null;
            
            return (
              <button
                key={conversation.id}
                className={`w-full text-left p-3 rounded-lg flex items-center space-x-3 transition-colors ${
                  activeConversationId === conversation.id
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-accent/10"
                }`}
                onClick={() => setActiveConversation(conversation.id)}
              >
                <Avatar>
                  <AvatarImage src={otherUser.avatarUrl} />
                  <AvatarFallback>
                    {otherUser.username.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="overflow-hidden flex-1">
                  <div className="font-medium">{otherUser.username}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {/* Show last message preview here */}
                  </div>
                </div>
                <div className="flex flex-col items-end text-xs text-muted-foreground">
                  {/* Last message time */}
                  <span 
                    className={`h-2 w-2 rounded-full mt-1 ${
                      otherUser.status === 'online' 
                        ? 'bg-green-500' 
                        : otherUser.status === 'away'
                          ? 'bg-yellow-500'
                          : 'bg-gray-400'
                    }`} 
                  />
                </div>
              </button>
            );
          })}
          
          {filteredConversations.length === 0 && (
            <div className="text-center p-4 text-muted-foreground">
              No conversations yet. Start a new chat!
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
