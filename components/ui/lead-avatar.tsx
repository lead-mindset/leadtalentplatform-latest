"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface LeadAvatarProps {
  size?: "sm" | "md" | "lg";
  variant?: "student" | "editor" | "recruiter" | "admin" | "coral" | "magenta" | "violet" | "info";
  initials?: string;
  statusIndicator?: "online" | "offline" | "away";
  className?: string;
}

const sizeClasses = {
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-12 h-12 text-base",
};

const variantClasses = {
  student: "bg-blue-500/20 text-blue-400",
  editor: "bg-emerald-500/20 text-emerald-400",
  recruiter: "bg-amber-500/20 text-amber-400",
  admin: "bg-purple-500/20 text-purple-400",
  coral: "bg-orange-500/20 text-orange-400",
  magenta: "bg-pink-500/20 text-pink-400",
  violet: "bg-violet-500/20 text-violet-400",
  info: "bg-cyan-500/20 text-cyan-400",
};

export function LeadAvatar({
  size = "md",
  variant = "student",
  initials = "?",
  statusIndicator,
  className,
}: LeadAvatarProps) {
  return (
    <div className="relative inline-flex">
      <div
        className={cn(
          "inline-flex items-center justify-center rounded-full font-medium",
          sizeClasses[size],
          variantClasses[variant],
          className
        )}
      >
        {initials?.toUpperCase()}
      </div>
      {statusIndicator && (
        <span
          className={cn(
            "absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-background",
            statusIndicator === "online" && "bg-emerald-500",
            statusIndicator === "offline" && "bg-slate-400",
            statusIndicator === "away" && "bg-amber-500"
          )}
        />
      )}
    </div>
  );
}
