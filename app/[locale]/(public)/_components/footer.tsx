import Image from "next/image";
import Link from "next/link";
import { Globe, Share2 } from "lucide-react";
import { MainContainer } from "@/components/global/main-container";

export function Footer() {
  return (
    <footer className="border-t border-border/20 bg-card pb-10 pt-20">
      <MainContainer>
        <div className="mb-16 grid grid-cols-2 gap-8 md:grid-cols-6">
          <div className="col-span-2">
            <Image
              src="/leadl2.svg"
              alt="LEAD"
              width={100}
              height={32}
              className="mb-6 h-8 w-auto object-contain brightness-0 invert opacity-80"
            />
            <p className="mb-6 pr-4 text-muted-foreground">
              Empowering Latin American tech talent through community, mentorship, and opportunity.
            </p>
          </div>
          <div>
            <h4 className="mb-4 font-bold text-foreground">Community</h4>
            <ul className="space-y-3 text-muted-foreground">
              <li><Link className="transition-colors hover:text-primary" href="/chapters">Chapters</Link></li>
              <li><Link className="transition-colors hover:text-primary" href="/mentorship">Mentorship</Link></li>
              <li><Link className="transition-colors hover:text-primary" href="/events">Events</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-4 font-bold text-foreground">Companies</h4>
            <ul className="space-y-3 text-muted-foreground">
              <li><Link className="transition-colors hover:text-primary" href="/company/login">Talent Search</Link></li>
              <li><Link className="transition-colors hover:text-primary" href="/sponsor">Sponsorship</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-4 font-bold text-foreground">Resources</h4>
            <ul className="space-y-3 text-muted-foreground">
              <li><Link className="transition-colors hover:text-primary" href="/blog">Blog</Link></li>
              <li><Link className="transition-colors hover:text-primary" href="/guidelines">Guidelines</Link></li>
              <li><Link className="transition-colors hover:text-primary" href="/faq">FAQ</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-4 font-bold text-foreground">Legal</h4>
            <ul className="space-y-3 text-muted-foreground">
              <li><Link className="transition-colors hover:text-primary" href="/privacy">Privacy</Link></li>
              <li><Link className="transition-colors hover:text-primary" href="/terms">Terms</Link></li>
            </ul>
          </div>
        </div>
        <div className="flex flex-col items-center justify-between gap-4 border-t border-border/20 pt-8 md:flex-row">
          <p className="text-sm text-muted-foreground">&copy; 2026 LEAD Americas. All rights reserved.</p>
          <div className="flex gap-4">
            <Link
              className="flex h-10 w-10 items-center justify-center rounded-full bg-muted transition-colors hover:bg-primary group"
              href="#"
              aria-label="Share on social media"
            >
              <Share2 className="h-4 w-4 text-muted-foreground group-hover:text-primary-foreground" />
            </Link>
            <Link
              className="flex h-10 w-10 items-center justify-center rounded-full bg-muted transition-colors hover:bg-primary group"
              href="#"
              aria-label="Visit website"
            >
              <Globe className="h-4 w-4 text-muted-foreground group-hover:text-primary-foreground" />
            </Link>
          </div>
        </div>
      </MainContainer>
    </footer>
  );
}
