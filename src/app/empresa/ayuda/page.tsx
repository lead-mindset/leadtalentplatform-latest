import { Button } from "@/components/ui/button";
import { Bookmark, Check, FileText, LifeBuoy, Lightbulb, Lock, Mail, Search, ShieldCheck, Sparkles, UserPlus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const steps = [
  { icon: Lock, title: "Acceso por invitación", text: "LEAD invita a tu empresa. Entras con el correo corporativo de la invitación; el acceso es controlado y revocable." },
  { icon: Search, title: "Explora el talento", text: "Describe el rol que buscas o usa los criterios de elegibilidad: área, disponibilidad, autorización, idiomas y graduación." },
  { icon: Bookmark, title: "Guarda candidatos", text: "Los perfiles que te interesen se guardan en 'Guardados' para revisarlos juntos." },
  { icon: FileText, title: "Descarga resumes", text: "Cada perfil verificado tiene resume disponible. Descárgalo para evaluar en detalle." },
  { icon: UserPlus, title: "Contacta", text: "Cuando hayas elegido, contacta al candidato directamente desde el portal." },
];

const practices = [
  { icon: ShieldCheck, title: "Filtra por elegibilidad primero", text: "Autorización, disponibilidad y graduación son lo que decide si puedes contratar. Aplícalos antes de mirar skills." },
  { icon: Search, title: "Describe el rol, no una query", text: "Escribe el rol en lenguaje natural (\"backend, remoto, inglés\") — matchea skills, área, idiomas y escuela a la vez." },
  { icon: Sparkles, title: "Combina criterios", text: "Un candidato puede no tener la skill exacta pero sí la base + la actitud LEAD. Busca por área + skill + idioma, no solo una skill." },
  { icon: FileText, title: "El resume es la fuente de verdad", text: "El perfil es el resumen para filtrar; el resume tiene el detalle. Descárgalo antes de decidir." },
  { icon: Lightbulb, title: "Valora la señal de liderazgo", text: "Los capítulos LEAD son señal de comunidad y liderazgo, no solo de skills. Un Tech Lead de capítulo aporta más que su CV." },
  { icon: Check, title: "Actúa rápido y respeta el acceso", text: "El talento verificado LEAD está en demanda: contacta pronto. Y respeta la elegibilidad: no contactes a quien no califica." },
];

const faqs = [
  { q: "¿Cómo obtiene mi empresa acceso?", a: "LEAD invita a las empresas. Un administrador crea la invitación y tu empresa la acepta desde el flujo de acceso. El acceso se puede revocar en cualquier momento." },
  { q: "¿Qué perfiles puedo ver?", a: "Solo el talento verificado y marcado como visible para empresas. Los perfiles invisibles o no aprobados nunca aparecen en el portal." },
  { q: "¿Cómo descargo un resume?", a: "Abre el perfil y usa 'Descargar resume'. El enlace es autorizado y temporal; cada descarga queda registrada." },
  { q: "¿Los candidatos saben que los veo?", a: "El talento está visible para empresas por decisión propia. Cuando contactas, el candidato lo recibe desde el portal." },
  { q: "¿Puedo contratar talento de cualquier capítulo?", a: "Sí. El portal cubre talento de todos los capítulos LEAD en LATAM, con su autorización y disponibilidad claras." },
];

export default function AyudaPage() {
  return (
    <div className="mx-auto w-full max-w-4xl flex-1 px-6 py-8">
      <header className="mb-8">
        <h1 className="flex items-center gap-2 text-h1 font-bold tracking-tight">
          <LifeBuoy className="size-6 text-brand-purple-light" /> Centro de ayuda
        </h1>
        <p className="mt-1 text-small text-muted-foreground">
          Todo lo que tu empresa necesita para encontrar talento en LEAD.
        </p>
      </header>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-h3 font-semibold">Cómo funciona el portal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {steps.map((step, i) => (
            <div key={step.title} className="flex gap-4">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-small font-bold text-brand-purple-light">
                {i + 1}
              </span>
              <div>
                <p className="flex items-center gap-2 font-medium">
                  <step.icon className="size-4 text-brand-purple-light" /> {step.title}
                </p>
                <p className="mt-0.5 text-small text-muted-foreground">{step.text}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="mt-5 shadow-sm">
        <CardHeader>
          <CardTitle className="text-h3 font-semibold">Mejores prácticas para recruiters</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {practices.map((practice) => (
            <div key={practice.title} className="rounded-lg bg-muted/40 p-4">
              <p className="flex items-center gap-2 font-medium">
                <practice.icon className="size-4 shrink-0 text-brand-purple-light" /> {practice.title}
              </p>
              <p className="mt-1 text-small text-muted-foreground">{practice.text}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="mt-5 shadow-sm">
        <CardHeader>
          <CardTitle className="text-h3 font-semibold">Preguntas frecuentes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {faqs.map((faq) => (
            <div key={faq.q} className="border-b border-border/60 pb-4 last:border-b-0 last:pb-0">
              <p className="font-medium">{faq.q}</p>
              <p className="mt-1 text-small text-muted-foreground">{faq.a}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="mt-5 shadow-sm">
        <CardContent className="flex flex-wrap items-center justify-between gap-4 p-(--card-spacing)">
          <div className="flex items-center gap-3">
            <Mail className="size-5 text-brand-purple-light" />
            <div>
              <p className="font-medium">¿Necesitas ayuda con tu empresa?</p>
              <p className="text-small text-muted-foreground">El equipo de LEAD responde rápido.</p>
            </div>
          </div>
          <Button asChild className="mt-4">
            <a href="mailto:contact@leadmindset.org">Contactar a LEAD</a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}