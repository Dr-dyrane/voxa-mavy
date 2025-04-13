
export interface User {
  id: string;
  username: string;
  avatarUrl?: string;
  status: "online" | "offline" | "away" | "busy";
  lastSeen: Date;
}
