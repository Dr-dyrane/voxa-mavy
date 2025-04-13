
import { Message } from "@/store/chatStore";
import { formatDistanceToNow } from "date-fns";
import { User } from "@/store/userStore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface MessageBubbleProps {
  message: Message;
  currentUser: User;
}

export function MessageBubble({ message, currentUser }: MessageBubbleProps) {
  const isCurrentUser = message.senderId === currentUser.id;
  
  return (
    <div
      className={`flex items-start gap-2 max-w-[80%] ${
        isCurrentUser ? "ml-auto flex-row-reverse" : ""
      }`}
    >
      {!isCurrentUser && (
        <Avatar className="h-8 w-8">
          <AvatarImage src="https://images.unsplash.com/photo-1582562124811-c09040d0a901?ixlib=rb-4.0.3" />
          <AvatarFallback className="bg-accent text-accent-foreground">JD</AvatarFallback>
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
