'use client'

import { useLocale } from "next-intl";
import { type FormEvent, useState } from "react";
import { CheckCircle2, Zap } from "lucide-react";
import { MainContainer } from "@/components/global/main-container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { SectionLabel } from "@/components/ui/section-label";

export function CompanyBand() {
  const locale = useLocale();
  const isEnglish = locale === "en";
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState("");
  const copy = isEnglish
    ? {
        eyebrow: "For Organizations",
        title: "Partner with a trusted LATAM student network.",
        body:
          "LEAD helps sponsors and partner companies connect with chapter communities, public programs, and students who explicitly choose to make their profiles visible.",
        firstTitle: "Opt-in talent visibility",
        firstBody: "Company representatives only see eligible profiles from students who have chosen to be visible.",
        secondTitle: "Chapter and event collaboration",
        secondBody: "Support workshops, applications, and community programs with clear operational workflows.",
        formTitle: "Start a partnership conversation",
        name: "Name",
        namePlaceholder: "Full name",
        company: "Organization",
        companyPlaceholder: "Company or institution",
        email: "Reply email",
        emailPlaceholder: "name@company.com",
        phone: "Phone or WhatsApp",
        phonePlaceholder: "Optional contact number",
        message: "Message",
        messagePlaceholder: "Tell us what you want to explore...",
        cta: "Contact LEAD Team",
        success: "Thanks. We opened an email draft with your request so the LEAD team can follow up.",
        error: "Add a valid reply email before contacting the LEAD team.",
      }
    : {
        eyebrow: "Para organizaciones",
        title: "Conecta con talento y comunidades LEAD.",
        body:
          "LEAD ayuda a empresas aliadas y sponsors a colaborar con capitulos, eventos y estudiantes que eligen hacer visible su perfil.",
        firstTitle: "Visibilidad con consentimiento",
        firstBody: "Los representantes solo ven perfiles elegibles de estudiantes que activaron su visibilidad.",
        secondTitle: "Colaboracion con capitulos",
        secondBody: "Apoya talleres, postulaciones y programas de comunidad con flujos claros.",
        formTitle: "Inicia una conversacion",
        name: "Nombre",
        namePlaceholder: "Nombre completo",
        company: "Organizacion",
        companyPlaceholder: "Empresa o institucion",
        email: "Correo de respuesta",
        emailPlaceholder: "nombre@empresa.com",
        phone: "Telefono o WhatsApp",
        phonePlaceholder: "Numero de contacto opcional",
        message: "Mensaje",
        messagePlaceholder: "Cuentanos que quieres explorar...",
        cta: "Contactar al equipo LEAD",
        success: "Gracias. Abrimos un borrador de correo con tu solicitud para que el equipo LEAD pueda responder.",
        error: "Agrega un correo de respuesta valido antes de contactar al equipo LEAD.",
      };

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setStatus("error");
      setError(copy.error);
      return;
    }

    setStatus("loading");
    const subject = encodeURIComponent(`Contacto organizacion LEAD - ${company || name || email}`);
    const body = encodeURIComponent(
      [
        `Nombre: ${name}`,
        `Organizacion: ${company}`,
        `Correo: ${email}`,
        `Telefono/WhatsApp: ${phone || "No indicado"}`,
        "",
        "Mensaje:",
        message || "Quiero conversar sobre una alianza con LEAD.",
      ].join("\n")
    );

    window.location.href = `mailto:partnerships@leadamericas.org?subject=${subject}&body=${body}`;
    setStatus("success");
  }

  return (
    <section id="para-empresas" className="py-24 bg-background relative overflow-hidden">
      <MainContainer>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 sm:gap-16 items-center">
        
        <div className="relative z-10">
          <SectionLabel variant="primary">{copy.eyebrow}</SectionLabel>
          <h2 className="fluid-h2 mb-8">
            {copy.title}
          </h2>
          <p className="fluid-body text-muted-foreground leading-relaxed mb-10">
            {copy.body}
          </p>
          
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-card flex items-center justify-center flex-shrink-0 border border-border/30">
                <CheckCircle2 className="text-accent w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-lg mb-1">{copy.firstTitle}</h4>
                <p className="text-muted-foreground">{copy.firstBody}</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-card flex items-center justify-center flex-shrink-0 border border-border/30">
                <Zap className="text-accent w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-lg mb-1">{copy.secondTitle}</h4>
                <p className="text-muted-foreground">{copy.secondBody}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card p-10 md:p-12 rounded-[2rem] border border-border/30 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-primary/10 transition-colors"></div>
          
          <form className="space-y-6 relative z-10" onSubmit={handleSubmit}>
            <h3 className="fluid-h3 mb-6">
              {copy.formTitle}
            </h3>
            
            <div className="space-y-2">
              <Label htmlFor="name">{copy.name}</Label>
              <Input 
                id="name" 
                placeholder={copy.namePlaceholder}
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="bg-muted/30 border-border/40 rounded-2xl px-6 py-4 h-12 focus:border-border/60"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="company">{copy.company}</Label>
              <Input 
                id="company" 
                placeholder={copy.companyPlaceholder}
                value={company}
                onChange={(event) => setCompany(event.target.value)}
                className="bg-muted/30 border-border/40 rounded-2xl px-6 py-4 h-12 focus:border-border/60"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company-email">{copy.email}</Label>
              <Input
                id="company-email"
                type="email"
                required
                placeholder={copy.emailPlaceholder}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="bg-muted/30 border-border/40 rounded-2xl px-6 py-4 h-12 focus:border-border/60"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company-phone">{copy.phone}</Label>
              <Input
                id="company-phone"
                type="tel"
                placeholder={copy.phonePlaceholder}
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                className="bg-muted/30 border-border/40 rounded-2xl px-6 py-4 h-12 focus:border-border/60"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="message">{copy.message}</Label>
              <Textarea 
                id="message" 
                placeholder={copy.messagePlaceholder}
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                className="bg-muted/30 border-border/40 rounded-2xl px-6 py-4 h-32 focus:border-border/60 resize-none"
              />
            </div>

            {status === "error" && error ? (
              <p className="text-sm text-destructive" role="alert">{error}</p>
            ) : null}

            {status === "success" ? (
              <p className="text-sm text-muted-foreground" role="status">{copy.success}</p>
            ) : null}
            
            <Button 
              type="submit"
              size="lg"
              disabled={status === "loading"}
              className="w-full gradient-luminescent text-primary-foreground py-5 rounded-full font-bold text-lg shadow-lg hover:shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
            >
              {status === "loading" ? (isEnglish ? "Opening..." : "Abriendo...") : copy.cta}
            </Button>
          </form>
        </div>

      </div>
      </MainContainer>
    </section>
  );
}
