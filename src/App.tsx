
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";

import { AuthProvider } from "./context/AuthContext";
import { MainLayout } from "./components/Layout/MainLayout";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Chat from "./pages/Chat";
import Call from "./pages/Call";
import Video from "./pages/Video";
import Contacts from "./pages/Contacts";
import NotFound from "./pages/NotFound";
import { useUserStore } from "./store/user/userStore";
import { useCallStore } from "./store/call/callStore";
import { useFriendsStore } from "./store/friends/friendsStore";
import { usePresenceStore } from "./store/presence/presenceStore";

const queryClient = new QueryClient();

const App = () => {
  const { refreshUser } = useUserStore();
  const { initializeCallStore } = useCallStore();
  const { initializeRealtime: initializeFriendsRealtime } = useFriendsStore();
  const { initializePresence } = usePresenceStore();
  const { isAuthenticated } = useUserStore();

  // Initialize real-time features when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      // Initialize all real-time features when authenticated
      const cleanup = () => {
        // Safe cleanup function that handles potentially undefined cleanups
        const cleanups = [
          initializeCallStore(),
          initializeFriendsRealtime(),
          initializePresence()
        ];
        
        return () => {
          // Call each cleanup function if it exists
          cleanups.forEach(cleanup => typeof cleanup === 'function' && cleanup());
        };
      };
      
      return cleanup();
    }
    
    // Return empty cleanup function for when not authenticated
    return () => {};
  }, [isAuthenticated, initializeCallStore, initializeFriendsRealtime, initializePresence]);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route element={<MainLayout />}>
                <Route path="/" element={<Navigate to="/chat" replace />} />
                <Route path="/chat" element={<Chat />} />
                <Route path="/call" element={<Call />} />
                <Route path="/video" element={<Video />} />
                <Route path="/contacts" element={<Contacts />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
