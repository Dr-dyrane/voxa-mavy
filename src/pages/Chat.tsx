
import { useEffect } from "react";
import { useChatStore } from "@/store/chat/chatStore";
import { ChatList } from "@/components/Chat/ChatList";
import { ChatWindow } from "@/components/Chat/ChatWindow";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";

export default function Chat() {
  const { isAuthenticated, isLoading } = useAuth();
  const { fetchConversations, initializeRealtime } = useChatStore();
  const isMobile = useIsMobile();
  
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      // Fetch conversations when the component mounts and we're authenticated
      fetchConversations();
      
      // Initialize realtime listeners
      const cleanup = initializeRealtime();
      
      // Clean up listeners when component unmounts
      return () => {
        if (typeof cleanup === 'function') cleanup();
      };
    }
  }, [isAuthenticated, isLoading, fetchConversations, initializeRealtime]);
  
  if (isLoading) {
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
    return <Navigate to="/auth" replace />;
  }
  
  return (
    <div className="h-full flex">
      {/* On mobile, we only show either the list or the chat window */}
      {!isMobile ? (
        <>
          <div className="w-80 border-r bg-background/80 overflow-hidden">
            <ChatList />
          </div>
          <div className="flex-1 overflow-hidden">
            <ChatWindow />
          </div>
        </>
      ) : (
        <div className="w-full overflow-hidden">
          <ChatList />
          {/* On mobile, ChatWindow will be shown via routing */}
        </div>
      )}
    </div>
  );
}
