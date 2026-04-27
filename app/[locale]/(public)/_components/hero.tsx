"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MainContainer } from "@/components/global/main-container";
import GradientText from "@/components/ui/gradient-text";
import Aurora from "@/components/ui/aurora";

export function Hero() {
  return (
    <section className="relative h-screen flex flex-col items-center justify-center text-center overflow-hidden bg-background">
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
      <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-background/30 to-background z-10"></div>
      <div className="absolute inset-0 z-10 w-full h-full pointer-events-none">
        <Aurora
          colorStops={["#e2315f","#8037c4","#5227FF"]}
          blend={0.5}
          amplitude={1.0}
          speed={0.5}
        />
      </div>
      <div className="absolute w-full h-full inset-0 bg-background opacity-60 z-15 pointer-events-none"></div>

      <MainContainer className="relative z-20 flex flex-col items-center justify-center py-16">
        <h1 className="fluid-hero text-foreground mb-6">
          Leading the Next <br/><GradientText 
            colors={["#d84cc5", "#c53c73", "#a92da7"]}
            animationSpeed={3}
            showBorder={false}
            className="inline font-extrabold"
          >
            Tech Frontier.
          </GradientText>
        </h1>
        <p className="fluid-body-lg text-muted-foreground max-w-3xl mx-auto mb-10 font-medium">
          We&apos;re a community of dreamers and builders bridging Latin America to the global stage through elite mentorship and tech opportunities.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
          <Button size="lg" className="px-8 py-4 sm:px-10 sm:py-5 text-base sm:text-lg font-bold rounded-full" asChild>
            <Link href="/auth/sign-up">Join the Mission</Link>
          </Button>
          <Button variant="outline" size="lg" className="px-8 py-4 sm:px-10 sm:py-5 text-base sm:text-lg font-bold rounded-full" asChild>
            <Link href="/about">Learn More</Link>
          </Button>
        </div>
      </MainContainer>
    </section>
  );
}