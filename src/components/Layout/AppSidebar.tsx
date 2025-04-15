
import { MessageSquare, Phone, Video, Users, Settings, LogOut, Search, Plus } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarInput,
} from "@/components/ui/sidebar";
import { VoxaTextLogo } from "../VoxaLogo";
import { useUserStore } from "@/store/user/userStore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { NavLink } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";

export function AppSidebar() {
  const { user, logout } = useUserStore();
  const isMobile = useIsMobile();
  
  const primaryMenuItems = [
    { title: "Chats", icon: MessageSquare, path: "/chat" },
    { title: "Calls", icon: Phone, path: "/call" },
    { title: "Video", icon: Video, path: "/video" },
    { title: "Contacts", icon: Users, path: "/contacts" },
  ];
  
  return (
    <Sidebar className="border-r">
      <SidebarHeader className="p-4 flex items-center justify-between">
        <VoxaTextLogo />
        <Button size="sm" variant="ghost" className="rounded-full">
          <Plus size={18} />
        </Button>
      </SidebarHeader>
      
      <SidebarContent>
        {/* Search area */}
        <div className="px-4 py-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <SidebarInput type="search" placeholder="Search..." className="pl-8" />
          </div>
        </div>
        
        {/* Main navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className="px-4 py-2">Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {primaryMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.path}
                      className={({ isActive }) => 
                        isActive 
                          ? "flex items-center gap-3 p-2 rounded-md bg-accent text-accent-foreground" 
                          : "flex items-center gap-3 p-2 rounded-md text-foreground hover:bg-accent/20"
                      }
                    >
                      <item.icon size={18} />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter className="p-4 border-t mt-auto">
        <div className="flex flex-col gap-4">
          {/* User profile */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Avatar className="h-10 w-10">
                <AvatarImage src={user?.avatarUrl} />
                <AvatarFallback className="bg-accent text-accent-foreground">
                  {user?.username?.substring(0, 2).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-sm font-medium">{user?.username}</span>
                <span className="text-xs text-muted-foreground">{user?.status || "Available"}</span>
              </div>
            </div>
          </div>
          
          {/* Action buttons */}
          <div className="flex gap-2">
            <SidebarMenuButton asChild className="flex-1">
              <NavLink 
                to="/settings"
                className={({ isActive }) => 
                  `flex items-center justify-center gap-2 p-2 text-xs rounded-md ${
                    isActive ? "bg-accent text-accent-foreground" : "hover:bg-accent/20"
                  }`
                }
              >
                <Settings size={16} />
                <span>Settings</span>
              </NavLink>
            </SidebarMenuButton>
            
            <SidebarMenuButton
              onClick={() => logout()}
              className="flex items-center justify-center gap-2 p-2 text-xs rounded-md hover:bg-destructive/20 hover:text-destructive flex-1"
            >
              <LogOut size={16} />
              <span>Logout</span>
            </SidebarMenuButton>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
