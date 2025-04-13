
export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  type: "text" | "emoji" | "image" | "file";
  emoji?: Record<string, any>;
  isRead: boolean;
  createdAt: Date;
}

export interface Conversation {
  id: string;
  participantIds: string[];
  lastMessageId?: string;
  updatedAt: Date;
  createdAt: Date;
}

export interface User {
  id: string;
  username: string;
  avatarUrl?: string;
  status: "online" | "offline" | "away" | "busy";
  lastSeen: Date;
}
