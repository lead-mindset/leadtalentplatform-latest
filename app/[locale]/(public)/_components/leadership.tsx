import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { MainContainer } from "@/components/global/main-container";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";

const TEAM = [
  {
    name: "Alejandro Ortiz",
    role: "Executive Director",
    bio: "Ex-Google Engineer. Passionate about regional equity.",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCH0Yp-YyC0F6p8uIuF-D5E3vN9-M5V6G7H8I9J0K1L2M3N4O5P6Q7R8S9T",
  },
  {
    name: "Lucia Mendez",
    role: "Head of Operations",
    bio: "Scaling community impact across 5 countries.",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDJ7Yp-YyC0F6p8uIuF-D5E3vN9-M5V6G7H8I9J0K1L2M3N4O5P6Q7R8S9U",
  },
  {
    name: "Carlos Silva",
    role: "Lead Mentorship",
    bio: "Connecting students with 500+ global mentors.",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuEK7Yp-YyC0F6p8uIuF-D5E3vN9-M5V6G7H8I9J0K1L2M3N4O5P6Q7R8S9V",
  },
  {
    name: "Elena Ruiz",
    role: "External Relations",
    bio: "Building bridges between academia and industry.",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuFL7Yp-YyC0F6p8uIuF-D5E3vN9-M5V6G7H8I9J0K1L2M3N4O5P6Q7R8S9W",
  },
];

export function Leadership() {
  return (
    <section className="py-24 bg-muted/20">
      <MainContainer>
        <div className="flex flex-col md:flex-row items-center md:items-end justify-between mb-20 gap-8">
          <div className="text-center md:text-left">
            <h2 className="fluid-h1 mb-4">
              Guided by Visionaries
            </h2>
            <p className="fluid-body text-muted-foreground max-w-2xl">
              Meet the team dedicated to empowering the next generation of Latin American leaders.
            </p>
          </div>
          <div className="flex gap-4">
            <Icon icon={ArrowLeft} size="md" variant="default" className="cursor-pointer hover:border-primary/40 hover:text-primary transition-colors" aria-label="Previous team member" />
            <Icon icon={ArrowRight} size="md" variant="default" className="cursor-pointer hover:border-primary/40 hover:text-primary transition-colors" aria-label="Next team member" />
            <Button 
              variant="outline" 
              asChild
              className="px-6 py-3 rounded-full bg-muted/40 border border-border/30 text-sm font-bold hover:bg-muted transition-all"
            >
              <Link href="/team">View All Team</Link>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">
          {TEAM.map((member) => (
            <div key={member.name} className="text-center group">
              <div className="w-full aspect-square bg-muted mb-6 rounded-xl overflow-hidden border border-border/20 grayscale group-hover:grayscale-0 transition-all duration-500">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  alt={member.role} 
                  className="w-full h-full object-cover" 
                  src={member.image} 
                  loading="lazy"
                  width={300}
                  height={300}
                />
              </div>
              <h4 className="font-bold text-xl mb-1">{member.name}</h4>
              <p className="text-primary text-sm font-bold uppercase tracking-widest mb-3">{member.role}</p>
              <p className="text-muted-foreground text-sm">{member.bio}</p>
            </div>
          ))}
        </div>
      </MainContainer>
    </section>
  );
}
