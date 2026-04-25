import Link from "next/link";
import Image from "next/image";
import { Share2, Globe } from "lucide-react";
import { MainContainer } from "@/components/global/main-container";

export function Footer() {
  return (
    <footer className="bg-card border-t border-border/20 pt-20 pb-10">
      <MainContainer>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 mb-16">
          <div className="col-span-2">
            <Image
              src="/leadl2.svg"
              alt="LEAD"
              width={100}
              height={32}
              className="h-8 w-auto mb-6 brightness-0 invert opacity-80 object-contain"
            />
            <p className="text-muted-foreground mb-6 pr-4">
              Empowering Latin American tech talent through community, mentorship, and opportunity.
            </p>
          </div>
          <div>
            <h4 className="font-bold mb-4 text-foreground">Community</h4>
            <ul className="space-y-3 text-muted-foreground">
              <li><Link className="hover:text-primary transition-colors" href="/chapters">Chapters</Link></li>
              <li><Link className="hover:text-primary transition-colors" href="/mentorship">Mentorship</Link></li>
              <li><Link className="hover:text-primary transition-colors" href="/events">Events</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4 text-foreground">Companies</h4>
            <ul className="space-y-3 text-muted-foreground">
              <li><Link className="hover:text-primary transition-colors" href="/company/login">Talent Search</Link></li>
              <li><Link className="hover:text-primary transition-colors" href="/sponsor">Sponsorship</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4 text-foreground">Resources</h4>
            <ul className="space-y-3 text-muted-foreground">
              <li><Link className="hover:text-primary transition-colors" href="/blog">Blog</Link></li>
              <li><Link className="hover:text-primary transition-colors" href="/guidelines">Guidelines</Link></li>
              <li><Link className="hover:text-primary transition-colors" href="/faq">FAQ</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4 text-foreground">Legal</h4>
            <ul className="space-y-3 text-muted-foreground">
              <li><Link className="hover:text-primary transition-colors" href="/privacy">Privacy</Link></li>
              <li><Link className="hover:text-primary transition-colors" href="/terms">Terms</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-border/20 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-muted-foreground text-sm">© 2026 LEAD Americas. All rights reserved.</p>
          <div className="flex gap-4">
            <Link 
              className="w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:bg-primary transition-colors group" 
              href="#"
              aria-label="Share on social media"
            >
              <Share2 className="w-4 h-4 text-muted-foreground group-hover:text-primary-foreground" />
            </Link>
            <Link 
              className="w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:bg-primary transition-colors group" 
              href="#"
              aria-label="Visit website"
            >
              <Globe className="w-4 h-4 text-muted-foreground group-hover:text-primary-foreground" />
            </Link>
          </div>
        </div>
      </MainContainer>
    </footer>
  );
}