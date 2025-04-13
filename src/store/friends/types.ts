
export type FriendStatus = "pending" | "accepted" | "rejected" | "blocked";

export interface Friend {
  id: string;
  userId: string;
  friendId: string;
  status: FriendStatus;
  createdAt: Date;
}

export interface FriendRequest {
  id: string;
  senderId: string;
  receiverId: string;
  status: FriendStatus;
  createdAt: Date;
}

export interface FriendWithProfile {
  id: string;
  status: FriendStatus;
  user: {
    id: string;
    username: string;
    avatarUrl?: string;
    status: "online" | "offline" | "away" | "busy";
    lastSeen: Date;
  };
}
