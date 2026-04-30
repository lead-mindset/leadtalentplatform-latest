"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function FinalCTA() {
  return (
    <section className="p-4 sm:p-6 lg:p-8 h-screen">
      <div className="bg-background w-full h-full rounded-[2rem] relative overflow-hidden shadow-2xl">
        <div className="absolute inset-0 z-0">
          <video
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover"
          >
            <source src="https://sboibxszratyaswwursb.supabase.co/storage/v1/object/sign/video/video3.mp4?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV81MzNiYjliNy03NjlkLTRhZjMtOTQ3MC0yMGM2NmJjYTI3OWIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJ2aWRlby92aWRlbzMubXA0IiwiaWF0IjoxNzc2NjMxNzEzLCJleHAiOjIwOTE5OTE3MTN9.SQ0yf7HaD3Uc2Df5JXECvsqXDgMm2WnzuGHAhBJZylo" type="video/mp4" />
          </video>
        </div>
        
        <div className="absolute inset-0 bg-black/60 z-1"></div>
        
        <div className="relative z-10 h-full flex flex-col justify-end p-8 sm:p-12 md:p-16 lg:p-24">
          <div className="max-w-4xl">
            <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-white mb-6 leading-tight">
              Join the Next Frontier.
            </h2>
            <p className="text-white/80 text-lg sm:text-xl md:text-2xl font-medium mb-12 max-w-2xl">
              Connect with global STEM opportunities and a community of visionaries. Transform your potential into leadership with the fastest growing tech community in the Americas.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                asChild
                size="lg"
                className="px-8 py-6 text-base sm:text-lg rounded-full font-bold hover:scale-105 hover:shadow-2xl transition-all group bg-white text-background hover:bg-white/90"
              >
                <Link href="/auth/sign-up">
                  Become a Member
                  <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button 
                asChild
                variant="outline"
                size="lg"
                className="px-8 py-6 text-base sm:text-lg rounded-full font-bold hover:scale-105 transition-all group border-white/30 text-white hover:bg-white/10 hover:text-white"
              >
                <Link href="/about">
                  Explore Mentorship
                  <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}