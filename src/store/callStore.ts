
import { create } from "zustand";

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

interface CallStore {
  activeCall: Call | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isMuted: boolean;
  isCameraOn: boolean;
  isScreenSharing: boolean;
  error: string | null;
  
  // Actions
  startCall: (receiverId: string, type: CallType) => Promise<void>;
  answerCall: () => Promise<void>;
  endCall: () => Promise<void>;
  toggleMute: () => void;
  toggleCamera: () => void;
  toggleScreenShare: () => void;
}

export const useCallStore = create<CallStore>()((set, get) => ({
  activeCall: null,
  localStream: null,
  remoteStream: null,
  isMuted: false,
  isCameraOn: true,
  isScreenSharing: false,
  error: null,
  
  startCall: async (receiverId, type) => {
    set({ 
      activeCall: {
        id: `call-${Date.now()}`,
        callerId: "user1", // Would come from auth
        receiverId,
        type,
        status: "ringing",
        startedAt: new Date(),
      } 
    });
    
    try {
      // Mock getting user media
      const constraints = {
        audio: true,
        video: type === "video",
      };
      
      // In a real implementation, this would request actual media
      // const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // set({ localStream: stream });
      
      // After a delay, simulate the call being answered
      setTimeout(() => {
        set((state) => ({
          activeCall: state.activeCall ? {
            ...state.activeCall,
            status: "connected",
          } : null
        }));
      }, 2000);
      
    } catch (error) {
      set({ error: "Failed to access media devices" });
    }
  },
  
  answerCall: async () => {
    try {
      // Mock answering a call
      set((state) => ({
        activeCall: state.activeCall ? {
          ...state.activeCall,
          status: "connecting",
        } : null
      }));
      
      // Simulate connection delay
      setTimeout(() => {
        set((state) => ({
          activeCall: state.activeCall ? {
            ...state.activeCall,
            status: "connected",
          } : null
        }));
      }, 1000);
      
    } catch (error) {
      set({ error: "Failed to answer call" });
    }
  },
  
  endCall: async () => {
    const { activeCall } = get();
    
    if (activeCall) {
      set({
        activeCall: {
          ...activeCall,
          status: "ended",
          endedAt: new Date(),
        }
      });
      
      // Clean up streams
      get().localStream?.getTracks().forEach(track => track.stop());
      
      // In a real app, we'd send this to the signaling server
      
      // After a delay, set active call to null
      setTimeout(() => {
        set({ activeCall: null, localStream: null, remoteStream: null });
      }, 1000);
    }
  },
  
  toggleMute: () => {
    const { isMuted, localStream } = get();
    
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = isMuted;
      });
    }
    
    set({ isMuted: !isMuted });
  },
  
  toggleCamera: () => {
    const { isCameraOn, localStream } = get();
    
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !isCameraOn;
      });
    }
    
    set({ isCameraOn: !isCameraOn });
  },
  
  toggleScreenShare: () => {
    // This would be implemented with navigator.mediaDevices.getDisplayMedia
    set({ isScreenSharing: !get().isScreenSharing });
  },
}));
