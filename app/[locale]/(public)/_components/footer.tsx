import Image from "next/image";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/routing";
import { Globe, Share2 } from "lucide-react";
import { MainContainer } from "@/components/global/main-container";

export function Footer() {
  const locale = useLocale() === "en" ? "en" : "es";
  const copy = locale === "en"
    ? {
        description:
          "LEAD Talent Platform connects students, chapter leaders, and partner companies to strengthen the community and create professional opportunities.",
        community: "Community",
        events: "Events",
        partners: "Partners",
        help: "Help",
        companies: "Companies",
        companyAccess: "Company access",
        partnerInfo: "Partner info",
        resources: "Resources",
        privacy: "Privacy",
        terms: "Terms",
        legal: "Legal",
        rights: "All rights reserved.",
      }
    : {
        description:
          "LEAD Talent Platform conecta estudiantes, l\u00edderes de cap\u00edtulos y empresas aliadas para fortalecer la comunidad y crear oportunidades profesionales.",
        community: "Comunidad",
        events: "Eventos",
        partners: "Aliados",
        help: "Ayuda",
        companies: "Empresas",
        companyAccess: "Acceso empresa",
        partnerInfo: "Informacion para aliados",
        resources: "Recursos",
        privacy: "Privacidad",
        terms: "Terminos",
        legal: "Legal",
        rights: "Todos los derechos reservados.",
      };

  return (
    <footer className="border-t border-border/20 bg-card pb-10 pt-20">
      <MainContainer>
        <div className="mb-16 grid grid-cols-2 gap-8 md:grid-cols-6">
          <div className="col-span-2">
            <Image
              src="/leadl2.svg"
              alt="LEAD"
              width={270}
              height={148}
              className="mb-6 h-8 w-auto object-contain brightness-0 invert opacity-80"
            />
            <p className="mb-6 pr-4 text-muted-foreground">
              {copy.description}
            </p>
          </div>
          <div>
            <h4 className="mb-4 font-bold text-foreground">{copy.community}</h4>
            <ul className="space-y-3 text-muted-foreground">
              <li><Link className="transition-colors hover:text-primary" href="/events">{copy.events}</Link></li>
              <li><Link className="transition-colors hover:text-primary" href="/partner-info">{copy.partners}</Link></li>
              <li><Link className="transition-colors hover:text-primary" href="/help">{copy.help}</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-4 font-bold text-foreground">{copy.companies}</h4>
            <ul className="space-y-3 text-muted-foreground">
              <li><Link className="transition-colors hover:text-primary" href="/company/login">{copy.companyAccess}</Link></li>
              <li><Link className="transition-colors hover:text-primary" href="/partner-info">{copy.partnerInfo}</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-4 font-bold text-foreground">{copy.resources}</h4>
            <ul className="space-y-3 text-muted-foreground">
              <li><Link className="transition-colors hover:text-primary" href="/help">{copy.help}</Link></li>
              <li><Link className="transition-colors hover:text-primary" href="/events">{copy.events}</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-4 font-bold text-foreground">{copy.legal}</h4>
            <ul className="space-y-3 text-muted-foreground">
              <li><Link className="transition-colors hover:text-primary" href="/privacy">{copy.privacy}</Link></li>
              <li><Link className="transition-colors hover:text-primary" href="/terms">{copy.terms}</Link></li>
            </ul>
          </div>
        </div>
        <div className="flex flex-col items-center justify-between gap-4 border-t border-border/20 pt-8 md:flex-row">
          <p className="text-sm text-muted-foreground">&copy; 2026 LEAD Americas. {copy.rights}</p>
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
