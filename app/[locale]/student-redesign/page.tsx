"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { CommandBar } from "@/components/ui/command-bar-fixed";
import { AppSidebar } from "@/components/navigation/app-sidebar";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Calendar, 
  MapPin, 
  Clock, 
  ArrowRight, 
  Users, 
  FileText,
  CheckCircle2,
  TrendingUp,
  Sparkles
} from "lucide-react";

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

export default function StudentDashboardRedesign() {
  const [greeting, setGreeting] = React.useState("Good morning");

  React.useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 18) setGreeting("Good afternoon");
    else setGreeting("Good evening");
  }, []);

  const nextEvent = {
    title: "Spring Networking Night",
    date: "APR 24",
    time: "6:00 PM",
    location: "Boston Convention Center",
    chapter: "LEAD Boston",
    attendees: 47,
    checkedIn: false,
  };

  const stats = [
    { label: "Events Attended", value: "12", trend: "+3 this month", icon: Calendar },
    { label: "Profile Complete", value: "85%", trend: "Add resume", icon: FileText },
    { label: "Member Since", value: "Jan 2026", trend: "Verified", icon: CheckCircle2 },
  ];

  const upcomingEvents = [
    {
      title: "Tech Career Fair",
      date: "MAY 02",
      chapter: "LEAD Boston",
      type: "In-person",
      spots: "23/100",
    },
    {
      title: "Resume Workshop",
      date: "MAY 08",
      chapter: "Multi-chapter",
      type: "Virtual",
      spots: "156/200",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] mesh-bg opacity-50 blur-3xl" />
      </div>

      <CommandBar
        user={{
          name: "Mariana",
          email: "mariana@university.edu",
          role: "student",
        }}
        notifications={2}
      />

      <AppSidebar
        role="student"
        activePath="/student"
      />

      <main className="lg:ml-80 pt-32 pb-12 px-6 lg:pr-12">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-6xl mx-auto space-y-8"
        >
          <motion.section variants={itemVariants} className="space-y-2">
            <div className="flex items-center gap-3">
              <Badge variant="student" icon={<Sparkles className="w-3 h-3" />}>
                Student Member
              </Badge>
              <span className="text-muted-foreground text-sm">Member ID: #2847</span>
            </div>
            <h1 className="font-headline text-4xl lg:text-5xl text-foreground tracking-tight">
              {greeting}, Mariana
            </h1>
            <p className="text-muted-foreground text-lg max-w-xl">
              You have 1 upcoming event this week. Keep building your network!
            </p>
          </motion.section>

          <motion.section variants={itemVariants}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {stats.map((stat, index) => (
                <Card
                  key={stat.label}
                  variant="default"
                  className="group p-6"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-muted-foreground text-sm mb-1">{stat.label}</p>
                      <p className="font-headline text-3xl text-foreground">{stat.value}</p>
                      <p className="text-success text-xs mt-2 flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        {stat.trend}
                      </p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                      <stat.icon className="w-5 h-5 text-primary" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </motion.section>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <motion.section variants={itemVariants} className="lg:col-span-2">
              <Card variant="featured" className="p-0 overflow-hidden">
                <div className="relative">
                  <div className="h-48 bg-gradient-to-br from-primary/20 to-accent/20 relative">
                    <div className="absolute inset-0 bg-background/40" />
                    <Badge 
                      variant="live" 
                      className="absolute top-4 left-4"
                      pulse
                    >
                      Your Next Event
                    </Badge>
                  </div>

                  <div className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-headline text-2xl text-foreground mb-2">
                          {nextEvent.title}
                        </h3>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-4 h-4 text-primary" />
                            {nextEvent.date}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4 text-primary" />
                            {nextEvent.time}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <MapPin className="w-4 h-4 text-primary" />
                            {nextEvent.location}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Users className="w-4 h-4 text-primary" />
                            {nextEvent.attendees} attending
                          </span>
                        </div>
                      </div>

                      <div className="text-center bg-secondary rounded-2xl p-4 min-w-[80px]">
                        <p className="text-primary font-headline text-sm font-bold">APR</p>
                        <p className="font-headline text-3xl text-foreground">24</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 mt-6 pt-6 border-t border-white/[0.06]">
                      <Button variant="default" icon={<ArrowRight className="w-4 h-4" />}>
                        View Details
                      </Button>
                      <Button variant="secondary">
                        Add to Calendar
                      </Button>
                      <div className="ml-auto flex items-center gap-2">
                        <Avatar size="sm" variant="accent">
                          <AvatarFallback>LB</AvatarFallback>
                        </Avatar>
                        <span className="text-sm text-muted-foreground">{nextEvent.chapter}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.section>

            <motion.section variants={itemVariants} className="space-y-4">
              <Card variant="interactive" className="p-6 group cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Calendar className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-headline text-lg text-foreground">Discover Events</h4>
                    <p className="text-sm text-muted-foreground">Find your next opportunity</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all" />
                </div>
              </Card>

              <Card variant="interactive" className="p-6 group cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-accent/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <FileText className="w-6 h-6 text-accent" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-headline text-lg text-foreground">Upload Resume</h4>
                    <p className="text-sm text-muted-foreground">Complete your profile</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all" />
                </div>
              </Card>

              <Card variant="interactive" className="p-6 group cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-success/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Users className="w-6 h-6 text-success" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-headline text-lg text-foreground">Member ID</h4>
                    <p className="text-sm text-muted-foreground">View your digital card</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all" />
                </div>
              </Card>
            </motion.section>
          </div>

          <motion.section variants={itemVariants}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-headline text-xl text-foreground">More Events</h2>
              <Button variant="ghost" icon={<ArrowRight className="w-4 h-4" />}>
                View All
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {upcomingEvents.map((event, index) => (
                <Card 
                  key={event.title} 
                  variant="interactive" 
                  className="p-6 group cursor-pointer"
                >
                  <div className="flex items-start gap-4">
                    <div className="text-center bg-secondary rounded-xl p-3 min-w-[60px]">
                      <p className="text-primary font-headline text-xs font-bold">
                        {event.date.split(" ")[0]}
                      </p>
                      <p className="font-headline text-xl text-foreground">
                        {event.date.split(" ")[1]}
                      </p>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-headline text-lg text-foreground group-hover:text-primary transition-colors">
                        {event.title}
                      </h4>
                      <p className="text-sm text-muted-foreground mt-1">{event.chapter}</p>
                      <div className="flex items-center gap-3 mt-3">
                        <Badge variant="neutral" size="sm">
                          {event.type}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {event.spots} spots
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </motion.section>
        </motion.div>
      </main>
    </div>
  );
}
