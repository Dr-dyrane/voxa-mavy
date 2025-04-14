
import { useState } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { ModeToggle } from "./ModeToggle";
import { Outlet, Navigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { VoxaTextLogo } from "../VoxaLogo";
import { CallPanel } from "../Call/CallPanel";
import { useCallStore } from "@/store/call/callStore";
import { useAuth } from "@/context/AuthContext";

export function MainLayout() {
  const { isAuthenticated, isLoading } = useAuth();
  const { activeCall } = useCallStore();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  console.log("MainLayout rendering with auth state:", { isAuthenticated, isLoading });

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, redirect to auth page
  if (!isAuthenticated) {
    console.log("MainLayout: User not authenticated, redirecting to /auth");
    return <Navigate to="/auth" replace />;
  }

  return (
    <SidebarProvider>
      <div className="h-screen flex w-full overflow-hidden bg-background">
        {sidebarOpen && <AppSidebar />}
        
        <div className="flex-1 flex flex-col h-full">
          <div className="border-b p-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
              {!sidebarOpen && <VoxaTextLogo size="sm" />}
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={toggleSidebar}
                className="md:hidden"
              >
                <Menu size={20} />
              </Button>
            </div>
            <ModeToggle />
          </div>
          
          <div className="flex-1 overflow-auto">
            <Outlet />
          </div>
          
          {activeCall && <CallPanel />}
        </div>
      </div>
    </SidebarProvider>
  );
}
