
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";

import { MainLayout } from "./components/Layout/MainLayout";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Chat from "./pages/Chat";
import Call from "./pages/Call";
import Video from "./pages/Video";
import Contacts from "./pages/Contacts";
import NotFound from "./pages/NotFound";
import { useUserStore } from "./store/userStore";
import { supabase } from "./integrations/supabase/client";

const queryClient = new QueryClient();

const App = () => {
  const { refreshUser } = useUserStore();

  useEffect(() => {
    // Initial auth check
    refreshUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      () => {
        setTimeout(() => {
          refreshUser();
        }, 0);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [refreshUser]);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route element={<MainLayout />}>
              <Route path="/" element={<Index />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/call" element={<Call />} />
              <Route path="/video" element={<Video />} />
              <Route path="/contacts" element={<Contacts />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
