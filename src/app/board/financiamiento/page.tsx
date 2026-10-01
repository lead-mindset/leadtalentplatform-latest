"use client";
import { Chip } from "@/components/ui/chip";

import { useState } from "react";
import { ChevronDown, Check, MessageSquare, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { Textarea } from "@/components/ui/textarea";

type RequestStatus = "pending" | "review" | "changes_requested" | "approved" | "rejected";

type Request = {
  id: string;
  title: string;
  chapter: string;
  requester: string;
  tipo: string;
  pillar: string;
  items: { name: string; amount: number }[];
  requested: number;
  status: RequestStatus;
  noteSent?: string;
};

const seed: Request[] = [
  {
    id: "f1",
    title: "Discover Day 2027 — materiales",
    chapter: "LEAD Perú",
    requester: "Diego Salinas",
    tipo: "Evento",
    pillar: "Educación",
    items: [{ name: "Impresiones", amount: 120 }, { name: "Catering", amount: 200 }],
    requested: 320,
    status: "pending",
  },
  {
    id: "f2",
    title: "Hackathon — premios",
    chapter: "LEAD América",
    requester: "Fernando Chávez",
    tipo: "Iniciativa",
    pillar: "Tecnología",
    items: [{ name: "Premios", amount: 150 }],
    requested: 150,
    status: "review",
  },
  {
    id: "f3",
    title: "Networking — catering",
    chapter: "LEAD Ecuador",
    requester: "Camila Rojas",
    tipo: "Evento",
    pillar: "Comunidad",
    items: [{ name: "Catering", amount: 90 }],
    requested: 90,
    status: "approved",
  },
];

const tone: Record<RequestStatus, "info" | "muted" | "success" | "destructive"> = {
  pending: "info",
  review: "info",
  changes_requested: "muted",
  approved: "success",
  rejected: "destructive",
};

const label: Record<RequestStatus, string> = {
  pending: "Por decidir",
  review: "En revisión",
  changes_requested: "Cambios pedidos",
  approved: "Aprobado",
  rejected: "Rechazado",
};

const money = (n: number) => `$${n.toLocaleString("en-US")}`;

const sections: { title: string; statuses: RequestStatus[]; desc: string }[] = [
  { title: "Por decidir", statuses: ["pending"], desc: "Esperan tu decisión." },
  { title: "En curso", statuses: ["review", "changes_requested"], desc: "En análisis o esperando cambios del capítulo." },
  { title: "Cerradas", statuses: ["approved", "rejected"], desc: "Ya decididas." },
];

export default function BoardFinanciamientoPage() {
  const [requests, setRequests] = useState<Request[]>(seed);
  const [open, setOpen] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  const setStatus = (id: string, status: RequestStatus) =>
    setRequests((prev) => prev.map((request) => (request.id === id ? { ...request, status } : request)));

  const decide = (id: string, status: RequestStatus) => {
    const note = notes[id]?.trim();
    setRequests((prev) => prev.map((request) => (request.id === id ? { ...request, status, noteSent: note || undefined } : request)));
    setNotes((prev) => ({ ...prev, [id]: "" }));
    setOpen(id);
  };

  const totalRequested = requests.reduce((sum, r) => sum + r.requested, 0);
  const totalApproved = requests.filter((r) => r.status === "approved").reduce((sum, r) => sum + r.requested, 0);
  const pending = requests.filter((r) => r.status === "pending").length;
  const inCourse = requests.filter((r) => r.status === "review" || r.status === "changes_requested").length;

  const stats = [
    { name: "Por decidir", value: String(pending), hint: "Solicitudes esperando al board" },
    { name: "En curso", value: String(inCourse), hint: "Analizando o esperando cambios" },
    { name: "Solicitado", value: money(totalRequested), hint: "Total en esta cola" },
    { name: "Aprobado", value: money(totalApproved), hint: "Comprometido a capítulos" },
  ];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-h1 font-bold tracking-tight">Financiamiento</h1>
        <p className="mt-1 text-small text-muted-foreground">
          El board decide los fondos de los capítulos. Revisa el detalle y deja una nota con tu decisión.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.name} className="card-surface rounded-xl border border-border/60 p-4">
            <p className="text-caption font-medium text-muted-foreground">{stat.name}</p>
            <p className="mt-1 text-h2 font-bold tracking-tight">{stat.value}</p>
            <p className="mt-0.5 text-caption text-muted-foreground">{stat.hint}</p>
          </div>
        ))}
      </div>

      {sections.map((section) => {
        const items = requests.filter((request) => section.statuses.includes(request.status));
        if (items.length === 0) return null;
        return (
          <div key={section.title} className="space-y-3">
            <div className="flex items-baseline gap-2 pt-1">
              <h2 className="text-h3 font-semibold tracking-tight">{section.title}</h2>
              <Chip tone="muted">{items.length}</Chip>
              <p className="text-caption text-muted-foreground">· {section.desc}</p>
            </div>
            {items.map((request) => {
              const isOpen = open === request.id;
              return (
                <div key={request.id} className="card-surface rounded-xl border border-border/60 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-body font-semibold leading-snug">{request.title}</p>
                        <StatusBadge tone={tone[request.status]}>{label[request.status]}</StatusBadge>
                      </div>
                      <p className="mt-1 text-caption text-muted-foreground">
                        {request.chapter} · {request.pillar} · {request.tipo} · solicita {request.requester}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-h2 font-bold tracking-tight">{money(request.requested)}</p>
                      <p className="text-caption text-muted-foreground">solicitado</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : request.id)}
                    aria-expanded={isOpen}
                    className="mt-3 inline-flex items-center gap-1 text-small font-medium text-brand-purple-light hover:underline"
                  >
                    {isOpen ? "Ocultar detalle" : "Ver detalle del presupuesto"}
                    <ChevronDown className={`size-3.5 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                  </button>

                  {isOpen && (
                    <div className="mt-3 grid gap-4 lg:grid-cols-2">
                      <div className="rounded-xl bg-muted/40 p-4">
                        <p className="text-caption font-medium text-muted-foreground">Presupuesto</p>
                        <div className="mt-2 divide-y divide-border/40">
                          {request.items.map((item) => (
                            <div key={item.name} className="flex items-center justify-between py-1.5 text-small">
                              <span className="text-muted-foreground">{item.name}</span>
                              <span className="font-medium">{money(item.amount)}</span>
                            </div>
                          ))}
                          <div className="flex items-center justify-between pt-2 text-small font-semibold">
                            <span>Total</span>
                            <span>{money(request.requested)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-xl bg-muted/40 p-4">
                        <p className="flex items-center gap-1.5 text-caption font-medium text-muted-foreground">
                          <MessageSquare className="size-3.5" /> Nota para el capítulo
                        </p>
                        {request.status === "pending" ? (
                          <Textarea
                            value={notes[request.id] ?? ""}
                            onChange={(e) => setNotes((prev) => ({ ...prev, [request.id]: e.target.value }))}
                            placeholder="Ej. agrega una cotización del catering antes de aprobarla…"
                            className="mt-2 min-h-20 bg-card"
                          />
                        ) : (
                          <p className="mt-2 text-small text-muted-foreground">
                            {request.noteSent ? `“${request.noteSent}”` : "No se envió nota con la decisión."}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="mt-4 flex flex-wrap items-center justify-end gap-2 border-t border-border/60 pt-4">
                    {request.status === "pending" ? (
                      <>
                        <Button size="sm" variant="outline" onClick={() => decide(request.id, "changes_requested")}>
                          Pedir cambios
                        </Button>
                        <Button size="sm" variant="destructive-outline" onClick={() => decide(request.id, "rejected")}>
                          <X className="size-3.5" /> Rechazar
                        </Button>
                        <Button size="sm" className="gap-1" onClick={() => decide(request.id, "approved")}>
                          <Check className="size-3.5" /> Aprobar {money(request.requested)}
                        </Button>
                      </>
                    ) : (
                      <Button size="sm" variant="outline" className="gap-1" onClick={() => setStatus(request.id, "pending")}>
                        <RotateCcw className="size-3.5" /> Deshacer
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}