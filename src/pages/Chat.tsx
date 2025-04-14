
import { useEffect } from "react";
import { useChatStore } from "@/store/chat/chatStore";
import { ChatList } from "@/components/Chat/ChatList";
import { ChatWindow } from "@/components/Chat/ChatWindow";
import { useUserStore } from "@/store/user/userStore";
import { Navigate } from "react-router-dom";

export default function Chat() {
  const { isAuthenticated } = useUserStore();
  const { fetchConversations, initializeRealtime } = useChatStore();
  
  useEffect(() => {
    if (isAuthenticated) {
      // Fetch conversations when the component mounts
      fetchConversations();
      
      // Initialize realtime listeners
      const cleanup = initializeRealtime();
      
      // Clean up listeners when component unmounts
      return () => {
        if (typeof cleanup === 'function') cleanup();
      };
    }
  }, [isAuthenticated, fetchConversations, initializeRealtime]);
  
  if (!isAuthenticated) {
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
