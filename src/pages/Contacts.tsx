
import { useState } from "react";
import { useUserStore } from "@/store/userStore";
import { Navigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Search, UserPlus, Phone, Video, MessageSquare, MoreHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

// Mock contacts data
const mockContacts = [
  {
    id: "user2",
    username: "janedoe",
    fullName: "Jane Doe",
    avatarUrl: "https://images.unsplash.com/photo-1582562124811-c09040d0a901?ixlib=rb-4.0.3",
    status: "online",
    email: "jane@example.com",
  },
  {
    id: "user3",
    username: "alexsmith",
    fullName: "Alex Smith",
    avatarUrl: "https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?ixlib=rb-4.0.3",
    status: "away",
    email: "alex@example.com",
  },
  {
    id: "user4",
    username: "sarahparker",
    fullName: "Sarah Parker",
    avatarUrl: "https://images.unsplash.com/photo-1721322800607-8c38375eef04?ixlib=rb-4.0.3",
    status: "offline",
    email: "sarah@example.com",
  }
];

export default function Contacts() {
  const { isAuthenticated } = useUserStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedContact, setSelectedContact] = useState<any>(null);
  
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }
  
  const filteredContacts = mockContacts.filter(contact => 
    contact.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.fullName.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  return (
    <div className="h-full flex">
      <div className="w-80 border-r bg-background/80">
        <div className="h-full flex flex-col">
          <div className="p-4 space-y-4 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search contacts..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <Button className="w-full flex items-center gap-2" variant="outline">
              <UserPlus size={16} />
              <span>Add Contact</span>
            </Button>
          </div>
          
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {filteredContacts.map((contact) => (
                <button
                  key={contact.id}
                  className={`w-full text-left p-3 rounded-lg flex items-center space-x-3 transition-colors ${
                    selectedContact?.id === contact.id
                      ? "bg-accent text-accent-foreground"
                      : "hover:bg-accent/10"
                  }`}
                  onClick={() => setSelectedContact(contact)}
                >
                  <div className="relative">
                    <Avatar>
                      <AvatarImage src={contact.avatarUrl} />
                      <AvatarFallback className={`${
                        selectedContact?.id === contact.id ? "bg-accent-foreground text-accent" : "bg-accent text-accent-foreground"
                      }`}>
                        {contact.fullName.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <span 
                      className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background ${
                        contact.status === 'online' 
                          ? 'bg-green-500' 
                          : contact.status === 'away'
                            ? 'bg-yellow-500'
                            : 'bg-gray-400'
                      }`} 
                    />
                  </div>
                  <div>
                    <div className="font-medium">{contact.fullName}</div>
                    <div className="text-xs text-muted-foreground">@{contact.username}</div>
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>
      
      <div className="flex-1 p-6">
        {selectedContact ? (
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={selectedContact.avatarUrl} />
                  <AvatarFallback className="text-2xl bg-accent text-accent-foreground">
                    {selectedContact.fullName.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-2xl font-bold">{selectedContact.fullName}</h2>
                  <p className="text-muted-foreground">@{selectedContact.username}</p>
                  <div className="flex items-center mt-1">
                    <span 
                      className={`h-2 w-2 rounded-full mr-2 ${
                        selectedContact.status === 'online' 
                          ? 'bg-green-500' 
                          : selectedContact.status === 'away'
                            ? 'bg-yellow-500'
                            : 'bg-gray-400'
                      }`} 
                    />
                    <span className="text-sm capitalize">{selectedContact.status}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline" size="icon" className="h-10 w-10 rounded-full">
                  <MessageSquare size={18} />
                </Button>
                <Button variant="outline" size="icon" className="h-10 w-10 rounded-full">
                  <Phone size={18} />
                </Button>
                <Button variant="outline" size="icon" className="h-10 w-10 rounded-full">
                  <Video size={18} />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" className="h-10 w-10 rounded-full">
                      <MoreHorizontal size={18} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>Block contact</DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">Remove contact</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Contact Information</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                    <span className="text-muted-foreground">Email</span>
                    <span>{selectedContact.email}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                    <span className="text-muted-foreground">User ID</span>
                    <span className="font-mono text-sm">{selectedContact.id}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center max-w-md">
              <h2 className="text-2xl font-bold mb-2 voxa-gradient-text">Select a contact</h2>
              <p className="text-muted-foreground">
                Choose a contact from the list to view their profile and start a conversation.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
