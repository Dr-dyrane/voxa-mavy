
import { Waves } from "lucide-react";
import { cn } from "@/lib/utils";

interface VoxaLogoProps {
  size?: number;
  className?: string;
}

export function VoxaLogo({ size = 24, className }: VoxaLogoProps) {
  return (
    <div className={cn("relative inline-flex items-center", className)}>
      <div className="absolute inset-0 bg-gradient-voxa blur-sm opacity-70" />
      <Waves 
        size={size} 
        className="relative z-10 text-white" 
        strokeWidth={2.5}
      />
    </div>
  );
}

interface VoxaTextLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  withTagline?: boolean;
}

export function VoxaTextLogo({ 
  className,
  size = "md",
  withTagline = false
}: VoxaTextLogoProps) {
  const sizeClasses = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-4xl"
  };

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div className="flex items-center gap-2">
        <VoxaLogo size={size === "sm" ? 20 : size === "md" ? 28 : 36} />
        <span className={cn("font-bold voxa-gradient-text", sizeClasses[size])}>
          Voxa
        </span>
      </div>
      {withTagline && (
        <p className="text-xs text-muted-foreground mt-1">Connect. Communicate. Create.</p>
      )}
    </div>
  );
}
