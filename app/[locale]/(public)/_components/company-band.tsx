'use client'

import { CheckCircle2, Zap } from "lucide-react";
import { MainContainer } from "@/components/global/main-container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { SectionLabel } from "@/components/ui/section-label";

export function CompanyBand() {
  return (
    <section id="para-empresas" className="py-24 bg-background relative overflow-hidden">
      <MainContainer>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 sm:gap-16 items-center">
        
        <div className="relative z-10">
          <SectionLabel variant="primary">For Organizations</SectionLabel>
          <h2 className="fluid-h2 mb-8">
            Access the Best of <span className="text-gradient">LATAM Talent.</span>
          </h2>
          <p className="fluid-body text-muted-foreground leading-relaxed mb-10">
            Join hundreds of forward-thinking companies sourcing elite STEM talent directly from our community. From internships to senior leadership, we bridge the gap.
          </p>
          
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-card flex items-center justify-center flex-shrink-0 border border-border/30">
                <CheckCircle2 className="text-accent w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-lg mb-1">Vetted Professionals</h4>
                <p className="text-muted-foreground">Access a curated pool of the top 1% tech talent in the region.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-card flex items-center justify-center flex-shrink-0 border border-border/30">
                <Zap className="text-accent w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-lg mb-1">Accelerated Hiring</h4>
                <p className="text-muted-foreground">Reduce time-to-hire with direct access to pre-qualified candidates.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card p-10 md:p-12 rounded-[2rem] border border-border/30 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-primary/10 transition-colors"></div>
          
          <form className="space-y-6 relative z-10" onSubmit={(e) => e.preventDefault()}>
            <h3 className="fluid-h3 mb-6">
              Partner with LEAD
            </h3>
            
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input 
                id="name" 
                placeholder="Full name" 
                className="bg-muted/30 border-border/40 rounded-2xl px-6 py-4 h-12 focus:border-border/60"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <Input 
                id="company" 
                placeholder="Organization name" 
                className="bg-muted/30 border-border/40 rounded-2xl px-6 py-4 h-12 focus:border-border/60"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea 
                id="message" 
                placeholder="Tell us how we can help..."
                className="bg-muted/30 border-border/40 rounded-2xl px-6 py-4 h-32 focus:border-border/60 resize-none"
              />
            </div>
            
            <Button 
              type="button"
              size="lg"
              className="w-full gradient-luminescent text-primary-foreground py-5 rounded-full font-bold text-lg shadow-lg hover:shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
            >
              Contact LEAD Team
            </Button>
          </form>
        </div>

      </div>
      </MainContainer>
    </section>
  );
}