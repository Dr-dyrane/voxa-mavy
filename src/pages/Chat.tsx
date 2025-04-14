
import { useEffect } from "react";
import { useChatStore } from "@/store/chat/chatStore";
import { ChatList } from "@/components/Chat/ChatList";
import { ChatWindow } from "@/components/Chat/ChatWindow";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export default function Chat() {
  const { isAuthenticated, isLoading } = useAuth();
  const { fetchConversations, initializeRealtime } = useChatStore();
  
  useEffect(() => {
    console.log("Chat page mount with auth state:", { isAuthenticated, isLoading });
    
    if (isAuthenticated && !isLoading) {
      console.log("Chat page: Fetching conversations and initializing realtime");
      // Fetch conversations when the component mounts and we're authenticated
      fetchConversations();
      
      // Initialize realtime listeners
      const cleanup = initializeRealtime();
      
      // Clean up listeners when component unmounts
      return () => {
        console.log("Chat page: Cleaning up realtime listeners");
        if (typeof cleanup === 'function') cleanup();
      };
    }
  }, [isAuthenticated, isLoading, fetchConversations, initializeRealtime]);
  
  if (isLoading) {
    console.log("Chat page: Still loading auth state");
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    console.log("Chat page: User not authenticated, redirecting to /auth");
    return <Navigate to="/auth" replace />;
  }
  
  return (
    <div className="h-full flex">
      <div className="w-80 border-r bg-background/80">
        <ChatList />
      </div>
      <div className="flex-1">
        <ChatWindow />
      </div>
    </div>
  );
}
