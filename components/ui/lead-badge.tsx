"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface LeadBadgeProps {
  variant?: "count" | "status" | "dot";
  className?: string;
  animate?: boolean;
  children?: React.ReactNode;
}

export function LeadBadge({
  variant = "dot",
  className,
  animate,
  children,
}: LeadBadgeProps) {
  const badgeContent = (
    <span
      className={cn(
        "inline-flex items-center justify-center",
        variant === "count" && "min-w-[18px] h-[18px] px-1.5 text-[10px] font-bold bg-red-500 text-white rounded-full",
        variant === "status" && "w-2 h-2 rounded-full bg-emerald-500",
        variant === "dot" && "w-2 h-2 rounded-full bg-red-500",
        className
      )}
    >
      {variant === "count" && children}
    </span>
  );

  if (animate) {
    return (
      <motion.span
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 500, damping: 25 }}
        className={cn(
          "inline-flex items-center justify-center",
          variant === "count" && "min-w-[18px] h-[18px] px-1.5 text-[10px] font-bold bg-red-500 text-white rounded-full",
          variant === "status" && "w-2 h-2 rounded-full bg-emerald-500",
          variant === "dot" && "w-2 h-2 rounded-full bg-red-500",
          className
        )}
      >
        {variant === "count" && children}
      </motion.span>
    );
  }

  return badgeContent;
}
