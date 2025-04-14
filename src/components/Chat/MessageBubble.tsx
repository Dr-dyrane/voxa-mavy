
import { useChatStore } from "@/store/chat/chatStore";
import { formatDistanceToNow } from "date-fns";
import { User } from "@/store/user/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Message } from "@/store/chat/types";

interface MessageBubbleProps {
  message: Message;
  currentUser: User;
}

export function MessageBubble({ message, currentUser }: MessageBubbleProps) {
  const { getUserById } = useChatStore();
  const isCurrentUser = message.senderId === currentUser.id;
  const sender = isCurrentUser ? currentUser : getUserById(message.senderId);
  
  return (
    <div
      className={`flex items-start gap-2 max-w-[80%] ${
        isCurrentUser ? "ml-auto flex-row-reverse" : ""
      }`}
    >
      {!isCurrentUser && (
        <Avatar className="h-8 w-8">
          <AvatarImage src={sender?.avatarUrl} />
          <AvatarFallback className="bg-accent text-accent-foreground">
            {sender?.username?.substring(0, 2).toUpperCase() || "U"}
          </AvatarFallback>
        </Avatar>
      )}
      
      <div className="flex flex-col">
        <div className={isCurrentUser ? "message-bubble-sender" : "message-bubble-receiver"}>
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        </div>
        <span
          className={`text-xs text-muted-foreground mt-1 ${
            isCurrentUser ? "text-right" : ""
          }`}
        >
          {formatDistanceToNow(new Date(message.createdAt), {
            addSuffix: true,
          })}
        </span>
      </div>
    </div>
  );
}
