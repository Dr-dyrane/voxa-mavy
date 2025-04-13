
import { useRef, useState } from "react";
import { Phone, Video, Search, User, Calendar } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CallType, useCallStore } from "@/store/callStore";

// Mock users data
const mockUsers = [
  {
    id: "user2",
    username: "janedoe",
    avatarUrl: "https://images.unsplash.com/photo-1582562124811-c09040d0a901?ixlib=rb-4.0.3",
    status: "online" as const,
    lastSeen: new Date(),
  },
  {
    id: "user3",
    username: "alexsmith",
    avatarUrl: "https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?ixlib=rb-4.0.3",
    status: "away" as const,
    lastSeen: new Date(Date.now() - 15 * 60 * 1000),
  },
  {
    id: "user4",
    username: "sarahparker",
    avatarUrl: "https://images.unsplash.com/photo-1721322800607-8c38375eef04?ixlib=rb-4.0.3",
    status: "offline" as const,
    lastSeen: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
];

// Mock call history
const mockCallHistory = [
  {
    id: "call1",
    userId: "user2",
    type: "video" as CallType,
    status: "ended",
    duration: "12:34",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    direction: "outgoing" as const,
  },
  {
    id: "call2",
    userId: "user3",
    type: "audio" as CallType,
    status: "missed",
    duration: "",
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
    direction: "incoming" as const,
  },
  {
    id: "call3",
    userId: "user4",
    type: "audio" as CallType,
    status: "ended",
    duration: "5:22",
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    direction: "outgoing" as const,
  },
  {
    id: "call4",
    userId: "user2",
    type: "video" as CallType,
    status: "ended",
    duration: "31:15",
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    direction: "incoming" as const,
  },
];

export function CallList() {
  const { startCall } = useCallStore();
  const [searchTerm, setSearchTerm] = useState("");
  
  const filteredUsers = mockUsers.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const handleStartCall = (userId: string, type: CallType) => {
    startCall(userId, type);
  };
  
  function formatCallTime(date: Date) {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    }).format(date);
  }
  
  return (
    <div className="h-full flex flex-col">
      <Tabs defaultValue="contacts" className="h-full flex flex-col">
        <div className="p-4 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search contacts..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="contacts" className="flex items-center gap-2">
              <User size={16} />
              <span>Contacts</span>
            </TabsTrigger>
            <TabsTrigger value="recent" className="flex items-center gap-2">
              <Calendar size={16} />
              <span>Recent</span>
            </TabsTrigger>
          </TabsList>
        </div>
        
        <ScrollArea className="flex-1">
          <TabsContent value="contacts" className="h-full m-0">
            <div className="p-2 space-y-1">
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="p-3 rounded-lg hover:bg-accent/10 flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <Avatar>
                        <AvatarImage src={user.avatarUrl} />
                        <AvatarFallback className="bg-accent text-accent-foreground">
                          {user.username.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {user.status === "online" && (
                        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-background" />
                      )}
                      {user.status === "away" && (
                        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-yellow-500 border-2 border-background" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium">{user.username}</div>
                      <div className="text-xs text-muted-foreground">
                        {user.status === "online"
                          ? "Online"
                          : user.status === "away"
                          ? "Away"
                          : "Offline"}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-accent"
                      onClick={() => handleStartCall(user.id, "audio")}
                    >
                      <Phone size={16} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-accent"
                      onClick={() => handleStartCall(user.id, "video")}
                    >
                      <Video size={16} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="recent" className="h-full m-0">
            <div className="p-2 space-y-1">
              {mockCallHistory.map((call) => {
                const user = mockUsers.find(u => u.id === call.userId);
                if (!user) return null;
                
                return (
                  <div
                    key={call.id}
                    className="p-3 rounded-lg hover:bg-accent/10 flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <Avatar>
                          <AvatarImage src={user.avatarUrl} />
                          <AvatarFallback className="bg-accent text-accent-foreground">
                            {user.username.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      <div>
                        <div className="font-medium">{user.username}</div>
                        <div className="flex items-center space-x-2 text-xs">
                          <span className={call.direction === "incoming" ? "rotate-180" : ""}>
                            →
                          </span>
                          <span className={call.status === "missed" ? "text-destructive" : "text-muted-foreground"}>
                            {call.type === "audio" ? "Audio" : "Video"} call • {formatCallTime(call.timestamp)}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex space-x-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-accent"
                        onClick={() => handleStartCall(user.id, call.type)}
                      >
                        {call.type === "audio" ? <Phone size={16} /> : <Video size={16} />}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );
}
