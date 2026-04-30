"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: number;
  badgeVariant?: "warning" | "success" | "destructive" | "info" | "default";
  children?: NavItem[];
}

interface AppSidebarProps {
  role: "student" | "editor" | "recruiter" | "admin";
  activePath: string;
  onNavigate?: (path: string) => void;
}

const navConfig: Record<string, NavItem[]> = {
  student: [
    {
      label: "Discover",
      href: "/discover",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
        </svg>
      ),
      children: [
        { label: "Browse Events", href: "/discover", icon: null },
        { label: "Map View", href: "/discover/map", icon: null },
        { label: "Past Events", href: "/events/past", icon: null },
      ],
    },
    {
      label: "My Events",
      href: "/student/events",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
        </svg>
      ),
    },
    {
      label: "Profile",
      href: "/student/profile",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
        </svg>
      ),
      children: [
        { label: "Edit Profile", href: "/student/profile", icon: null },
        { label: "Resume", href: "/student/resume", icon: null },
        { label: "Member ID", href: "/student/member-id", icon: null },
      ],
    },
  ],
  editor: [
    {
      label: "Create Event",
      href: "/chapter/events/create",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      ),
    },
    {
      label: "Approve Members",
      href: "/chapter/members/pending",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
      ),
      badge: 3,
      badgeVariant: "warning",
    },
    {
      label: "Open Check-in",
      href: "/chapter/checkin",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
        </svg>
      ),
    },
    {
      label: "Events",
      href: "/chapter/events",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
        </svg>
      ),
      children: [
        { label: "Live", href: "/chapter/events", icon: null },
        { label: "Drafts", href: "/chapter/events/drafts", icon: null },
        { label: "Collaborating", href: "/chapter/collaborate", icon: null },
      ],
    },
    {
      label: "Members",
      href: "/chapter/members",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.592-2.641m-9.092-4.032A4.125 4.125 0 0 1 9.75 9.75a4.125 4.125 0 0 1 4.125-4.125 4.125 4.125 0 0 1 4.125 4.125 4.125 4.125 0 0 1-4.125 4.125m0 0A6.375 6.375 0 0 0 3.375 15.75m8.625-6v2.25m0 0v2.25m0-2.25h2.25m-2.25 0H9.75" />
        </svg>
      ),
      children: [
        { label: "Pending", href: "/chapter/members/pending", icon: null, badge: 3 },
        { label: "Active", href: "/chapter/members", icon: null },
      ],
    },
  ],
};

export function AppSidebar({ role, activePath, onNavigate }: AppSidebarProps) {
  const [expandedItems, setExpandedItems] = React.useState<string[]>(["Events", "Members"]);
  const items = navConfig[role] || [];

  const toggleExpand = (label: string) => {
    setExpandedItems((prev) =>
      prev.includes(label) ? prev.filter((i) => i !== label) : [...prev, label]
    );
  };

  const isActive = (href: string) => activePath === href || activePath.startsWith(href + "/");

  return (
    <aside className="fixed left-6 top-28 bottom-6 w-64 hidden lg:block z-40">
      <nav className="h-full p-3 rounded-[32px] bg-secondary/30 backdrop-blur-[32px] ring-1 ring-border/40">
        <div className="h-full overflow-y-auto scrollbar-hide">
          {}
          {role === "editor" && (
            <div className="mb-6">
              <p className="px-3 mb-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Quick Actions
              </p>
              <div className="space-y-1">
                {items.slice(0, 3).map((item, index) => (
                  <motion.button
                    key={item.label}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => onNavigate?.(item.href)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-3 rounded-2xl text-sm font-medium transition-all duration-300",
                      isActive(item.href)
                        ? "bg-gradient-to-r from-primary to-accent text-white shadow-[0_0_30px_rgba(var(--primary),0.3)]"
                        : "text-muted-foreground hover:text-foreground hover:bg-white/[0.05]"
                    )}
                  >
                    <span className={cn("transition-colors", isActive(item.href) ? "text-white" : "text-muted-foreground")}>
                      {item.icon}
                    </span>
                    <span className="flex-1 text-left">{item.label}</span>
                    {item.badge && (
                      <Badge
                        variant={item.badgeVariant || "warning"}
                        size="sm"
                      >
                        {item.badge}
                      </Badge>
                    )}
                  </motion.button>
                ))}
              </div>

              <div className="my-4 mx-3 h-px bg-border/40" />
            </div>
          )}

          {}
          <div className="space-y-1">
            {(role === "editor" ? items.slice(3) : items).map((item, index) => (
              <div key={item.label}>
                <motion.button
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 + 0.15 }}
                  onClick={() => {
                    if (item.children) {
                      toggleExpand(item.label);
                    } else {
                      onNavigate?.(item.href);
                    }
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-300",
                    isActive(item.href) && !item.children
                      ? "bg-secondary text-foreground ring-1 ring-border/50"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/[0.03]",
                    item.children && expandedItems.includes(item.label) && "text-foreground"
                  )}
                >
                  <span className={cn("transition-colors", isActive(item.href) ? "text-primary" : "")}>
                    {item.icon}
                  </span>
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.badge && (
                    <Badge
                      variant={item.badgeVariant || "warning"}
                      size="sm"
                    >
                      {item.badge}
                    </Badge>
                  )}
                  {item.children && (
                    <svg
                      className={cn(
                        "w-4 h-4 transition-transform duration-300",
                        expandedItems.includes(item.label) ? "rotate-180" : ""
                      )}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                  )}
                </motion.button>

                {}
                <AnimatePresence>
                  {item.children && expandedItems.includes(item.label) && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="ml-4 pl-4 border-l border-border/40 mt-1 space-y-1">
                        {item.children.map((child, childIndex) => (
                          <motion.button
                            key={child.label}
                            initial={{ opacity: 0, x: -5 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: childIndex * 0.05 }}
                            onClick={() => onNavigate?.(child.href)}
                            className={cn(
                              "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-200",
                              isActive(child.href)
                                ? "text-foreground bg-white/[0.05]"
                                : "text-muted-foreground hover:text-foreground hover:bg-white/[0.03]"
                            )}
                          >
                            <span className={cn(
                              "w-1.5 h-1.5 rounded-full transition-colors",
                              isActive(child.href) ? "bg-primary" : "bg-muted-foreground/30"
                            )} />
                            <span>{child.label}</span>
                            {child.badge && (
                              <Badge variant="warning" size="sm" className="ml-auto">
                                {child.badge}
                              </Badge>
                            )}
                          </motion.button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>

          {}
          <div className="mt-auto pt-6">
            <div className="mx-3 h-px bg-border/40 mb-4" />
            <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-white/[0.03] transition-all">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" />
              </svg>
              Help & Support
            </button>
          </div>
        </div>
      </nav>
    </aside>
  );
}
