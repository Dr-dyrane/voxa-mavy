
import { useChatStore } from "@/store/chatStore";
import { ChatList } from "@/components/Chat/ChatList";
import { ChatWindow } from "@/components/Chat/ChatWindow";
import { useUserStore } from "@/store/userStore";
import { Navigate } from "react-router-dom";

export default function Chat() {
  const { isAuthenticated } = useUserStore();
  
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
