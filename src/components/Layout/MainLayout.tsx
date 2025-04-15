
import { useEffect, useState } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { ModeToggle } from "./ModeToggle";
import { Outlet, Navigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Menu, MessageSquare, Phone, Users, Video } from "lucide-react";
import { VoxaTextLogo } from "../VoxaLogo";
import { CallPanel } from "../Call/CallPanel";
import { useCallStore } from "@/store/call/callStore";
import { useAuth } from "@/context/AuthContext";
import { MobileNavBar } from "./MobileNavBar";
import { NavLink } from "react-router-dom";

export function MainLayout() {
  const { isAuthenticated, isLoading } = useAuth();
  const { activeCall } = useCallStore();
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile && !isTablet);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

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
    return <Navigate to="/auth" replace />;
  }

  return (
    <SidebarProvider>
      <div className="h-screen flex w-full overflow-hidden bg-background">
        {/* Sidebar */}
        {sidebarOpen && <AppSidebar />}
        
        {/* Main content */}
        <div className="flex-1 flex flex-col h-full">
          {/* Top header */}
          <div className="border-b p-3 flex justify-between items-center">
            <div className="flex items-center gap-2">
              {/* Only show the logo on mobile when sidebar is closed */}
              {(!sidebarOpen || isMobile) && <VoxaTextLogo size="sm" />}
              
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={toggleSidebar}
                className={isMobile ? "hidden" : ""}
              >
                <Menu size={20} />
              </Button>
              
              {/* Show toggle sidebar button only on mobile */}
              {isMobile && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={toggleSidebar}
                >
                  <Menu size={20} />
                </Button>
              )}
            </div>
            <ModeToggle />
          </div>
          
          {/* Main content area */}
          <div className="flex-1 overflow-auto">
            <Outlet />
          </div>
          
          {/* Call panel for ongoing calls */}
          {activeCall && <CallPanel />}
          
          {/* Mobile bottom navigation */}
          {isMobile && <MobileNavBar />}
        </div>
      </div>
    </SidebarProvider>
  );
}

// Custom hook to detect tablet-sized screens
function useIsTablet() {
  const [isTablet, setIsTablet] = useState<boolean>(false);

  useEffect(() => {
    const checkTablet = () => {
      setIsTablet(window.innerWidth >= 768 && window.innerWidth < 1024);
    };
    
    checkTablet();
    window.addEventListener('resize', checkTablet);
    
    return () => window.removeEventListener('resize', checkTablet);
  }, []);

  return isTablet;
}
