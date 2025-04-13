
export type CallType = "audio" | "video";
export type CallStatus = "idle" | "ringing" | "connecting" | "connected" | "ended";

export interface Call {
  id: string;
  callerId: string;
  receiverId: string;
  type: CallType;
  status: CallStatus;
  startedAt?: Date;
  endedAt?: Date;
}

export interface IncomingCall {
  id: string;
  callerId: string;
  type: CallType;
}
