
import { NavLink } from "react-router-dom";
import { MessageSquare, Phone, Video, Users } from "lucide-react";
import { cn } from "@/lib/utils";

export function MobileNavBar() {
  const navItems = [
    { 
      icon: MessageSquare, 
      label: "Chats", 
      path: "/chat" 
    },
    { 
      icon: Phone, 
      label: "Calls", 
      path: "/call" 
    },
    { 
      icon: Video, 
      label: "Video", 
      path: "/video" 
    },
    { 
      icon: Users, 
      label: "Contacts", 
      path: "/contacts" 
    },
  ];

  return (
    <div className="md:hidden border-t bg-background px-2 py-2">
      <nav className="flex justify-around items-center">
        {navItems.map((item) => (
          <NavLink 
            key={item.path}
            to={item.path}
            className={({ isActive }) => cn(
              "flex flex-col items-center gap-1 p-2 rounded-md transition-colors",
              isActive 
                ? "text-accent" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <item.icon size={20} />
            <span className="text-xs">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
