
import { create } from "zustand";
import { WebRTCHandler } from "./webRTCHandler";
import { Call, CallType, CallStatus, IncomingCall } from "./types";
import { supabase } from "@/integrations/supabase/client";
import { useUserStore } from "@/store/user/userStore";
import { toast } from "sonner";

interface CallStore {
  activeCall: Call | null;
  incomingCall: IncomingCall | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isMuted: boolean;
  isCameraOn: boolean;
  isScreenSharing: boolean;
  error: string | null;
  webRTC: WebRTCHandler | null;
  
  // Actions
  initializeCallStore: () => void;
  startCall: (receiverId: string, type: CallType) => Promise<void>;
  answerCall: () => Promise<void>;
  rejectCall: () => Promise<void>;
  endCall: () => Promise<void>;
  toggleMute: () => void;
  toggleCamera: () => void;
  toggleScreenShare: () => void;
}

export const useCallStore = create<CallStore>()((set, get) => ({
  activeCall: null,
  incomingCall: null,
  localStream: null,
  remoteStream: null,
  isMuted: false,
  isCameraOn: true,
  isScreenSharing: false,
  error: null,
  webRTC: null,
  
  initializeCallStore: () => {
    const user = useUserStore.getState().user;
    if (!user) return;
    
    // Create WebRTC handler
    const webRTC = new WebRTCHandler(user.id);
    
    // Set up event handlers
    webRTC.onLocalStream = (stream: MediaStream) => {
      set({ localStream: stream });
    };
    
    webRTC.onRemoteStream = (stream: MediaStream) => {
      set({ remoteStream: stream });
    };
    
    webRTC.onConnectionStateChange = (state: RTCPeerConnectionState) => {
      if (state === 'connected') {
        set((s) => ({
          activeCall: s.activeCall ? { ...s.activeCall, status: 'connected' } : null
        }));
      } else if (
        state === 'disconnected' || 
        state === 'failed' || 
        state === 'closed'
      ) {
        if (get().activeCall) {
          setTimeout(() => {
            set({ activeCall: null, localStream: null, remoteStream: null });
          }, 1000);
        }
      }
    };
    
    set({ webRTC });
    
    // Listen for incoming calls
    const incomingCallChannel = supabase
      .channel('public:calls')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'calls',
          filter: `receiver_id=eq.${user.id}`
        },
        (payload) => {
          const callData = payload.new;
          
          // Only handle ringing calls
          if (callData.status === 'ringing') {
            set({
              incomingCall: {
                id: callData.id,
                callerId: callData.caller_id,
                type: callData.call_type as CallType
              }
            });
            
            // Show notification
            toast("Incoming Call", {
              description: "Someone is calling you",
              action: {
                label: "Answer",
                onClick: () => get().answerCall()
              },
              onDismiss: () => {
                get().rejectCall();
              }
            });
          }
        }
      )
      .subscribe();
      
    // Return cleanup function
    return () => {
      supabase.removeChannel(incomingCallChannel);
      if (get().webRTC) {
        get().webRTC.endCall();
      }
    };
  },
  
  startCall: async (receiverId: string, type: CallType) => {
    try {
      const webRTC = get().webRTC;
      if (!webRTC) throw new Error("WebRTC not initialized");
      
      const callType = type === "audio" ? "audio" : "video";
      const isVideo = callType === "video";
      
      // Initialize call and get local stream
      const localStream = await webRTC.initializeCall(receiverId, isVideo);
      
      set({
        activeCall: {
          id: webRTC.callId!,
          callerId: webRTC.userId!,
          receiverId: receiverId,
          type: callType,
          status: "ringing",
          startedAt: new Date(),
        },
        localStream,
        error: null
      });
    } catch (error: any) {
      set({ error: error.message });
      toast.error("Call failed", {
        description: error.message
      });
    }
  },
  
  answerCall: async () => {
    try {
      const { incomingCall, webRTC } = get();
      if (!incomingCall || !webRTC) throw new Error("No incoming call or WebRTC not initialized");
      
      const isVideo = incomingCall.type === "video";
      
      // Answer the call and get local stream
      const localStream = await webRTC.answerCall(
        incomingCall.id, 
        incomingCall.callerId, 
        isVideo
      );
      
      set({
        activeCall: {
          id: incomingCall.id,
          callerId: incomingCall.callerId,
          receiverId: webRTC.userId!,
          type: incomingCall.type,
          status: "connecting",
          startedAt: new Date(),
        },
        incomingCall: null,
        localStream,
        error: null
      });
    } catch (error: any) {
      set({ error: error.message, incomingCall: null });
      toast.error("Failed to answer call", {
        description: error.message
      });
    }
  },
  
  rejectCall: async () => {
    const { incomingCall } = get();
    if (!incomingCall) return;
    
    try {
      // Update call status to ended
      await supabase
        .from('calls')
        .update({ 
          status: 'ended',
          ended_at: new Date().toISOString()
        })
        .eq('id', incomingCall.id);
        
      set({ incomingCall: null });
    } catch (error: any) {
      console.error("Error rejecting call:", error);
      set({ incomingCall: null });
    }
  },
  
  endCall: async () => {
    const { activeCall, webRTC } = get();
    
    if (activeCall && webRTC) {
      await webRTC.endCall();
      
      set({
        activeCall: {
          ...activeCall,
          status: "ended",
          endedAt: new Date(),
        }
      });
      
      // After a delay, reset the call state
      setTimeout(() => {
        set({ activeCall: null, localStream: null, remoteStream: null });
      }, 1000);
    }
  },
  
  toggleMute: () => {
    const { isMuted, webRTC } = get();
    
    if (webRTC) {
      webRTC.toggleMute(!isMuted);
      set({ isMuted: !isMuted });
    }
  },
  
  toggleCamera: () => {
    const { isCameraOn, webRTC } = get();
    
    if (webRTC) {
      webRTC.toggleCamera(!isCameraOn);
      set({ isCameraOn: !isCameraOn });
    }
  },
  
  toggleScreenShare: () => {
    const { isScreenSharing, webRTC } = get();
    
    if (webRTC) {
      webRTC.toggleScreenShare(!isScreenSharing);
      set({ isScreenSharing: !isScreenSharing });
    }
  },
}));
