
import { supabase } from "@/integrations/supabase/client";

// Configuration for WebRTC connections
const configuration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export class WebRTCHandler {
  connection: RTCPeerConnection | null = null;
  localStream: MediaStream | null = null;
  remoteStream: MediaStream | null = null;
  callId: string | null = null;
  userId: string | null = null;
  remoteUserId: string | null = null;
  isInitiator: boolean = false;
  onLocalStream: (stream: MediaStream) => void = () => {};
  onRemoteStream: (stream: MediaStream) => void = () => {};
  onConnectionStateChange: (state: RTCPeerConnectionState) => void = () => {};

  constructor(userId: string) {
    this.userId = userId;
    this.setupRealtimeListener();
  }

  setupRealtimeListener() {
    // Listen for signaling messages
    const channel = supabase
      .channel('public:signaling')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'signaling',
          filter: `receiver_id=eq.${this.userId}`
        },
        (payload) => {
          this.handleSignalingMessage(payload.new);
        }
      )
      .subscribe();
  }

  async initializeCall(remoteUserId: string, isVideo: boolean): Promise<MediaStream> {
    this.isInitiator = true;
    this.remoteUserId = remoteUserId;
    
    try {
      // Create a call record
      const { data, error } = await supabase
        .from('calls')
        .insert([{
          caller_id: this.userId,
          receiver_id: remoteUserId,
          call_type: isVideo ? 'video' : 'audio',
          status: 'ringing',
          started_at: new Date().toISOString(),
        }])
        .select();

      if (error) throw error;
      this.callId = data[0].id;

      // Get local media stream
      await this.getLocalMediaStream(isVideo);
      
      // Create RTCPeerConnection
      await this.createPeerConnection();
      
      return this.localStream!;
    } catch (error) {
      console.error('Failed to initialize call:', error);
      throw error;
    }
  }

  async answerCall(callId: string, callerId: string, isVideo: boolean): Promise<MediaStream> {
    this.isInitiator = false;
    this.remoteUserId = callerId;
    this.callId = callId;
    
    try {
      // Update call status
      await supabase
        .from('calls')
        .update({ status: 'connecting' })
        .eq('id', callId);

      // Get local media stream
      await this.getLocalMediaStream(isVideo);
      
      // Create RTCPeerConnection
      await this.createPeerConnection();
      
      return this.localStream!;
    } catch (error) {
      console.error('Failed to answer call:', error);
      throw error;
    }
  }

  async getLocalMediaStream(isVideo: boolean): Promise<void> {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: isVideo
      });
      
      this.onLocalStream(this.localStream);
    } catch (error) {
      console.error('Error accessing media devices:', error);
      throw error;
    }
  }

  async createPeerConnection(): Promise<void> {
    try {
      // Create a new RTCPeerConnection
      this.connection = new RTCPeerConnection(configuration);
      
      // Add local tracks to the connection
      if (this.localStream) {
        this.localStream.getTracks().forEach(track => {
          this.connection!.addTrack(track, this.localStream!);
        });
      }
      
      // Create a remote stream and set up track event handlers
      this.remoteStream = new MediaStream();
      
      // Set up ICE candidate handler
      this.connection.onicecandidate = async (event) => {
        if (event.candidate) {
          await this.sendSignalingMessage({
            type: 'ice-candidate',
            candidate: event.candidate
          });
        }
      };
      
      // Handle incoming tracks
      this.connection.ontrack = (event) => {
        event.streams[0].getTracks().forEach(track => {
          this.remoteStream!.addTrack(track);
        });
        this.onRemoteStream(this.remoteStream!);
      };
      
      // Connection state change
      this.connection.onconnectionstatechange = () => {
        this.onConnectionStateChange(this.connection!.connectionState);
        
        if (this.connection!.connectionState === 'connected') {
          // Update call status to connected
          this.updateCallStatus('connected');
        } else if (
          this.connection!.connectionState === 'disconnected' || 
          this.connection!.connectionState === 'failed' ||
          this.connection!.connectionState === 'closed'
        ) {
          // Update call status to ended
          this.updateCallStatus('ended');
        }
      };
      
      // If we're the initiator, create and send an offer
      if (this.isInitiator) {
        const offer = await this.connection.createOffer();
        await this.connection.setLocalDescription(offer);
        
        await this.sendSignalingMessage({
          type: 'offer',
          sdp: this.connection.localDescription
        });
      }
    } catch (error) {
      console.error('Error creating peer connection:', error);
      throw error;
    }
  }

  async handleSignalingMessage(message: any): Promise<void> {
    if (!this.connection) {
      console.warn('Received signaling message but no connection exists');
      return;
    }
    
    const signalData = message.signal_data;
    
    try {
      if (signalData.type === 'offer') {
        await this.connection.setRemoteDescription(new RTCSessionDescription(signalData.sdp));
        const answer = await this.connection.createAnswer();
        await this.connection.setLocalDescription(answer);
        
        await this.sendSignalingMessage({
          type: 'answer',
          sdp: this.connection.localDescription
        });
      } 
      else if (signalData.type === 'answer') {
        await this.connection.setRemoteDescription(new RTCSessionDescription(signalData.sdp));
      } 
      else if (signalData.type === 'ice-candidate') {
        await this.connection.addIceCandidate(new RTCIceCandidate(signalData.candidate));
      }
    } catch (error) {
      console.error('Error handling signaling message:', error);
    }
  }

  async sendSignalingMessage(data: any): Promise<void> {
    if (!this.remoteUserId) {
      console.warn('Cannot send signaling message: No remote user ID');
      return;
    }
    
    try {
      await supabase
        .from('signaling')
        .insert([{
          sender_id: this.userId,
          receiver_id: this.remoteUserId,
          session_id: this.callId,
          signal_data: data
        }]);
    } catch (error) {
      console.error('Error sending signaling message:', error);
    }
  }

  async updateCallStatus(status: string): Promise<void> {
    if (!this.callId) return;
    
    try {
      const updates: any = { status };
      
      if (status === 'ended') {
        updates.ended_at = new Date().toISOString();
      }
      
      await supabase
        .from('calls')
        .update(updates)
        .eq('id', this.callId);
    } catch (error) {
      console.error('Error updating call status:', error);
    }
  }

  async endCall(): Promise<void> {
    try {
      if (this.connection) {
        this.connection.close();
        this.connection = null;
      }
      
      // Stop all tracks
      if (this.localStream) {
        this.localStream.getTracks().forEach(track => track.stop());
        this.localStream = null;
      }
      
      // Update call status
      await this.updateCallStatus('ended');
    } catch (error) {
      console.error('Error ending call:', error);
    }
  }

  toggleMute(mute: boolean): void {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(track => {
        track.enabled = !mute;
      });
    }
  }

  toggleCamera(enable: boolean): void {
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach(track => {
        track.enabled = enable;
      });
    }
  }

  async toggleScreenShare(enable: boolean): Promise<void> {
    if (!this.connection) return;
    
    try {
      if (enable) {
        // Get screen share stream
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true
        });
        
        // Replace video track
        const videoTrack = screenStream.getVideoTracks()[0];
        
        const senders = this.connection.getSenders();
        const videoSender = senders.find(sender => 
          sender.track?.kind === 'video'
        );
        
        if (videoSender) {
          await videoSender.replaceTrack(videoTrack);
        } else {
          this.connection.addTrack(videoTrack, screenStream);
        }
        
        // Handle when user stops screen sharing
        videoTrack.onended = async () => {
          // Revert back to camera if available
          if (this.localStream) {
            const cameraTrack = this.localStream.getVideoTracks()[0];
            if (cameraTrack && videoSender) {
              await videoSender.replaceTrack(cameraTrack);
            }
          }
        };
      } else {
        // Revert back to camera if available
        if (this.localStream) {
          const cameraTrack = this.localStream.getVideoTracks()[0];
          
          const senders = this.connection.getSenders();
          const videoSender = senders.find(sender => 
            sender.track?.kind === 'video'
          );
          
          if (cameraTrack && videoSender) {
            await videoSender.replaceTrack(cameraTrack);
          }
        }
      }
    } catch (error) {
      console.error('Error toggling screen share:', error);
    }
  }
}
