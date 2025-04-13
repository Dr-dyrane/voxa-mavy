
import { useUserStore } from "@/store/userStore";
import { Navigate } from "react-router-dom";
import { CallList } from "@/components/Call/CallList";

export default function Call() {
  const { isAuthenticated } = useUserStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }
  
  return (
    <div className="h-full flex">
      <div className="w-80 border-r bg-background/80">
        <CallList />
      </div>
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center max-w-md p-6">
          <h2 className="text-2xl font-bold mb-2 voxa-gradient-text">Start a call</h2>
          <p className="text-muted-foreground">
            Select a contact from the list to start an audio or video call.
          </p>
        </div>
      </div>
    </div>
  );
}
