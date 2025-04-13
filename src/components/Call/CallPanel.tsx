
import { useEffect, useRef } from "react";
import { Mic, MicOff, Phone, Video, VideoOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useCallStore } from "@/store/callStore";
import { useChatStore } from "@/store/chatStore";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function CallPanel() {
  const { activeCall, localStream, remoteStream, isMuted, isCameraOn, endCall, toggleMute, toggleCamera } = useCallStore();
  const { getUserById } = useChatStore();
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  
  const otherUserId = activeCall?.callerId === "user1" ? activeCall?.receiverId : activeCall?.callerId;
  const otherUser = otherUserId ? getUserById(otherUserId) : null;
  
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);
  
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);
  
  if (!activeCall) return null;
  
  const isVideoCall = activeCall.type === "video";
  const isConnecting = activeCall.status === "ringing" || activeCall.status === "connecting";
  
  return (
    <Card className="fixed bottom-4 right-4 w-80 shadow-lg animate-fade-in overflow-hidden">
      <CardContent className="p-0">
        <div className="relative">
          {/* Main video area */}
          <div 
            className={cn(
              "h-64 w-full bg-secondary flex items-center justify-center relative",
              isVideoCall ? "" : "bg-accent"
            )}
          >
            {isVideoCall && remoteStream ? (
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center justify-center">
                <Avatar className="h-20 w-20 mb-2">
                  <AvatarImage src={otherUser?.avatarUrl} />
                  <AvatarFallback className="bg-muted text-foreground text-xl">
                    {otherUser?.username?.substring(0, 2).toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>
                <h3 className="font-semibold text-white">{otherUser?.username}</h3>
                
                {isConnecting ? (
                  <div className="mt-2 text-sm text-white flex items-center">
                    <span className="animate-pulse mr-2">●</span>
                    {activeCall.callerId === "user1" ? "Calling..." : "Incoming call..."}
                  </div>
                ) : (
                  <div className="mt-2 text-sm text-white">
                    {activeCall.type === "audio" ? "Audio call" : "Video call"}
                  </div>
                )}
              </div>
            )}
            
            {/* Local video preview (only for video calls) */}
            {isVideoCall && localStream && (
              <div className="absolute bottom-2 right-2 h-24 w-32 rounded-lg overflow-hidden border-2 border-background shadow-lg">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="h-full w-full object-cover"
                />
              </div>
            )}
          </div>
          
          {/* Call controls */}
          <div className="p-4 bg-card flex items-center justify-center space-x-3">
            <Button
              variant="outline"
              size="icon"
              className={cn(
                "rounded-full h-10 w-10",
                isMuted ? "bg-destructive/20 text-destructive hover:bg-destructive/30" : ""
              )}
              onClick={toggleMute}
            >
              {isMuted ? <MicOff size={18} /> : <Mic size={18} />}
            </Button>
            
            <Button
              variant="destructive"
              size="icon"
              className="rounded-full h-12 w-12"
              onClick={() => endCall()}
            >
              <Phone size={20} className="rotate-[135deg]" />
            </Button>
            
            {isVideoCall && (
              <Button
                variant="outline"
                size="icon"
                className={cn(
                  "rounded-full h-10 w-10",
                  !isCameraOn ? "bg-destructive/20 text-destructive hover:bg-destructive/30" : ""
                )}
                onClick={toggleCamera}
              >
                {isCameraOn ? <Video size={18} /> : <VideoOff size={18} />}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
