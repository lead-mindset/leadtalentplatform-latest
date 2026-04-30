"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { LeadAvatar } from "./lead-avatar";
import { LeadBadge } from "./lead-badge";
import {
  MagnifyingGlass,
  Bell,
  Gear,
  SignOut,
  User,
  Sun,
  Moon,
  Globe,
  CaretDown,
} from "@phosphor-icons/react";

interface CommandBarProps {
  user?: {
    name: string;
    email: string;
    avatar?: string;
    role: "student" | "editor" | "recruiter" | "admin";
  };
  notifications?: number;
  onSearch?: (query: string) => void;
  onThemeToggle?: () => void;
  onLanguageChange?: (lang: string) => void;
  onLogout?: () => void;
}

export function CommandBar({
  user,
  notifications = 0,
  onSearch,
  onThemeToggle,
  onLanguageChange,
  onLogout,
}: CommandBarProps) {
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);
  const [isProfileOpen, setIsProfileOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isDark, setIsDark] = React.useState(true);

  const roleColors = {
    student: "coral",
    editor: "magenta",
    recruiter: "violet",
    admin: "info",
  } as const;

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-3rem)] max-w-5xl"
    >
      <nav className="flex items-center gap-2 px-2 py-2 rounded-full bg-[#0f1f3e]/80 backdrop-blur-[32px] ring-1 ring-white/[0.08] shadow-[0_8px_48px_-8px_rgba(0,8,32,0.5)]">
        {}
        <div className="flex items-center gap-3 pl-3 pr-4">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FF4D4D] to-[#7C4DFF] flex items-center justify-center">
            <span className="text-white font-display font-bold text-sm">L</span>
          </div>
          <span className="font-display font-semibold text-[#e8edff] text-sm hidden sm:block">
            LEAD Frontier
          </span>
        </div>

        {}
        <div className="flex-1 max-w-md">
          <AnimatePresence mode="wait">
            {isSearchOpen ? (
              <motion.div
                initial={{ width: 40, opacity: 0 }}
                animate={{ width: "100%", opacity: 1 }}
                exit={{ width: 40, opacity: 0 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="relative"
              >
                <input
                  type="text"
                  placeholder="Search events, people, or help..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    onSearch?.(e.target.value);
                  }}
                  className="w-full h-10 pl-10 pr-4 rounded-full bg-[#05122d] text-[#e8edff] text-sm placeholder:text-[#6b7a9c] ring-1 ring-white/[0.06] focus:outline-none focus:ring-2 focus:ring-[#FF4D4D]/50"
                  autoFocus
                  onBlur={() => {
                    if (!searchQuery) setIsSearchOpen(false);
                  }}
                />
                <MagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6b7a9c]" />
              </motion.div>
            ) : (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsSearchOpen(true)}
                className="flex items-center gap-2 h-10 px-4 rounded-full bg-[#05122d]/50 text-[#6b7a9c] hover:text-[#b8c2e0] hover:bg-[#05122d] transition-colors"
              >
                <MagnifyingGlass className="w-4 h-4" />
                <span className="text-sm hidden md:block">Search...</span>
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {}
        <div className="flex items-center gap-1">
          {}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setIsDark(!isDark);
              onThemeToggle?.();
            }}
            className="w-10 h-10 rounded-full flex items-center justify-center text-[#6b7a9c] hover:text-[#b8c2e0] hover:bg-white/[0.05] transition-colors"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </motion.button>

          {}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-10 h-10 rounded-full flex items-center justify-center text-[#6b7a9c] hover:text-[#b8c2e0] hover:bg-white/[0.05] transition-colors"
          >
            <Globe className="w-4 h-4" />
          </motion.button>

          {}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="relative w-10 h-10 rounded-full flex items-center justify-center text-[#6b7a9c] hover:text-[#b8c2e0] hover:bg-white/[0.05] transition-colors"
          >
            <Bell className="w-4 h-4" />
            {notifications > 0 && (
              <LeadBadge
                variant="count"
                className="absolute -top-1 -right-1"
                animate
              >
                {notifications > 9 ? "9+" : notifications}
              </LeadBadge>
            )}
          </motion.button>

          {}
          <div className="relative">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full bg-[#05122d]/50 hover:bg-[#05122d] ring-1 ring-white/[0.06] transition-all"
            >
              <LeadAvatar
                size="sm"
                variant={roleColors[user?.role || "student"]}
                initials={user?.name.charAt(0)}
                statusIndicator="online"
              />
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium text-[#e8edff] leading-tight">
                  {user?.name || "Guest"}
                </p>
                <p className="text-[10px] text-[#6b7a9c] leading-tight capitalize">
                  {user?.role || "Visitor"}
                </p>
              </div>
              <CaretDown className={`w-3 h-3 text-[#6b7a9c] transition-transform ${isProfileOpen ? "rotate-180" : ""}`} />
            </motion.button>

            {}
            <AnimatePresence>
              {isProfileOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute right-0 top-full mt-2 w-56 p-2 rounded-2xl bg-[#0f1f3e]/95 backdrop-blur-[32px] ring-1 ring-white/[0.08] shadow-[0_16px_64px_-16px_rgba(0,8,32,0.6)]"
                >
                  <div className="px-3 py-2 mb-2 border-b border-white/[0.06]">
                    <p className="font-medium text-[#e8edff]">{user?.name}</p>
                    <p className="text-xs text-[#6b7a9c]">{user?.email}</p>
                  </div>
                  
                  <button className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-[#b8c2e0] hover:text-[#e8edff] hover:bg-white/[0.05] transition-colors">
                    <User className="w-4 h-4" />
                    Profile
                  </button>
                  
                  <button className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-[#b8c2e0] hover:text-[#e8edff] hover:bg-white/[0.05] transition-colors">
                    <Gear className="w-4 h-4" />
                    Settings
                  </button>
                  
                  <div className="mt-2 pt-2 border-t border-white/[0.06]">
                    <button
                      onClick={onLogout}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-[#FF6B6B] hover:bg-[#FF6B6B]/10 transition-colors"
                    >
                      <SignOut className="w-4 h-4" />
                      Sign out
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </nav>
    </motion.header>
  );
}
