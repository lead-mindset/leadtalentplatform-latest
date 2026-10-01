"use client";

import { useState } from "react";
import { Check, ChevronDown, Landmark, Plus, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Segmented } from "@/components/ui/segmented";
import { useAdminRole } from "@/lib/admin-role";

type BudgetItem = { name: string; amount: string };
type FundingStatus = "submitted" | "approved" | "changes_requested" | "rejected" | "receipts_due";

type FundingReq = {
  id: string;
  title: string;
  chapter: string;
  requester: string;
  tipo: "Evento" | "Iniciativa";
  event?: string;
  pillar: string;
  items: BudgetItem[];
  status: FundingStatus;
  requested: number;
  approved: number;
  source?: string;
  late?: boolean;
};

const statusTone: Record<FundingStatus, "info" | "success" | "muted" | "destructive"> = {
  submitted: "info",
  approved: "success",
  changes_requested: "muted",
  rejected: "destructive",
  receipts_due: "info",
};

const statusLabel: Record<FundingStatus, string> = {
  submitted: "Enviado",
  approved: "Aprobado",
  changes_requested: "Cambios pedidos",
  rejected: "Rechazado",
  receipts_due: "Recibos pendientes",
};

const initialRequests: FundingReq[] = [
  { id: "f1", title: "Discover Day 2027 — materiales", chapter: "LEAD Perú", requester: "Diego Salinas", tipo: "Evento", event: "Discover Day 2027", pillar: "Educación", items: [{ name: "Impresiones", amount: "120" }, { name: "Catering", amount: "200" }], status: "submitted", requested: 320, approved: 0, late: true },
  { id: "f2", title: "Hackathon — premios", chapter: "LEAD América", requester: "Fernando Chávez", tipo: "Iniciativa", pillar: "Tecnología", items: [{ name: "Premios", amount: "150" }], status: "approved", requested: 150, approved: 150, source: "Presupuesto 2026" },
  { id: "f3", title: "Networking — catering", chapter: "LEAD Ecuador", requester: "Camila Rojas", tipo: "Evento", pillar: "Comunidad", items: [{ name: "Catering", amount: "90" }], status: "submitted", requested: 90, approved: 0 },
];

const statusFilters: { value: "all" | FundingStatus; label: string }[] = [
  { value: "all", label: "Todas" },
  { value: "submitted", label: "Enviadas" },
  { value: "approved", label: "Aprobadas" },
  { value: "changes_requested", label: "Cambios" },
  { value: "rejected", label: "Rechazadas" },
  { value: "receipts_due", label: "Recibos" },
];

export default function AdminFinanciamientoPage() {
  const role = useAdminRole();
  const [requests, setRequests] = useState<FundingReq[]>(initialRequests);
  const [filter, setFilter] = useState<"all" | FundingStatus>("submitted");
  const [form, setForm] = useState({ title: "", tipo: "Evento" as "Evento" | "Iniciativa", pillar: "Educación", eventTitle: "" });
  const [items, setItems] = useState<BudgetItem[]>([{ name: "", amount: "" }]);
  const [openReview, setOpenReview] = useState<string | null>(null);

  // ---- chapter request form ----
  const total = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const setItem = (index: number, key: keyof BudgetItem, value: string) => setItems((prev) => prev.map((item, i) => (i === index ? { ...item, [key]: value } : item)));
  const addItem = () => setItems((prev) => [...prev, { name: "", amount: "" }]);
  const removeItem = (index: number) => setItems((prev) => prev.filter((_, i) => i !== index));
  const canSubmit = form.title.trim() && total > 0 && items.every((item) => item.name.trim());
  const send = () => {
    if (!canSubmit) return;
    setRequests((prev) => [{ id: `new-${Date.now()}`, title: form.title, chapter: "LEAD UTEC", requester: "Valeria Mendoza", tipo: form.tipo, event: form.eventTitle || undefined, pillar: form.pillar, items: items.filter((item) => item.name.trim()), status: "submitted", requested: total, approved: 0 }, ...prev]);
    setForm({ title: "", tipo: "Evento", pillar: "Educación", eventTitle: "" });
    setItems([{ name: "", amount: "" }]);
  };

  // ---- admin review actions ----
  const approve = (id: string, amount?: number, note?: string) =>
    setRequests((prev) => prev.map((request) => (request.id === id ? { ...request, status: "approved", approved: amount ?? request.requested } : request)));
  const setStatus = (id: string, status: FundingStatus) =>
    setRequests((prev) => prev.map((request) => (request.id === id ? { ...request, status } : request)));
  const setSource = (id: string, source: string) =>
    setRequests((prev) => prev.map((request) => (request.id === id ? { ...request, source } : request)));

  const visible = filter === "all" ? requests : requests.filter((request) => request.status === filter);
  const submittedCount = requests.filter((request) => request.status === "submitted").length;

  if (role === "board") {
    return (
      <div className="space-y-6">
        <header>
          <h1 className="text-h1 font-bold tracking-tight">Financiamiento</h1>
          <p className="mt-1 text-small text-muted-foreground">
            Revisa las solicitudes y decide: aprueba, pide cambios o rechaza.
          </p>
        </header>

        <div className="flex flex-wrap items-center gap-2">
          <Segmented value={filter} onChange={setFilter} options={statusFilters.map((f) => ({ value: f.value, label: f.value === "submitted" ? `Enviadas · ${submittedCount}` : f.label }))} />
        </div>

        <div className="card-surface divide-y divide-border/60 rounded-xl border border-border/60">
          {visible.map((request) => {
            const open = openReview === request.id;
            return (
              <div key={request.id} className="px-4 py-3">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2 truncate font-medium">
                      {request.title}
                      {request.late && <StatusBadge tone="destructive">Tardía</StatusBadge>}
                    </p>
                    <p className="truncate text-caption text-muted-foreground">
                      {request.chapter} · {request.pillar} · {request.tipo}
                    </p>
                  </div>
                  <span className="font-semibold">${request.requested}</span>
                  <StatusBadge tone={statusTone[request.status]}>{statusLabel[request.status]}</StatusBadge>

                  {request.status === "submitted" ? (
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Button size="sm" className="gap-1" onClick={() => approve(request.id)}><Check className="size-3.5" /> Aprobar</Button>
                      <Button size="sm" variant="outline" onClick={() => setStatus(request.id, "changes_requested")}>Cambios</Button>
                      <Button size="sm" variant="destructive-outline" onClick={() => setStatus(request.id, "rejected")}><X className="size-3.5" /> Rechazar</Button>
                    </div>
                  ) : (
                    <Button size="sm" variant="outline" className="gap-1" onClick={() => setStatus(request.id, "submitted")}>
                      <RotateCcw className="size-3.5" /> Deshacer
                    </Button>
                  )}

                  <button type="button" onClick={() => setOpenReview(open ? null : request.id)} aria-expanded={open} aria-label="Ver detalle" className="text-muted-foreground hover:text-foreground">
                    <ChevronDown className={`size-4 transition-transform ${open ? "rotate-180" : ""}`} />
                  </button>
                </div>

                {open && (
                  <div className="mt-3 grid gap-4 border-t border-border/60 pt-3 sm:grid-cols-2">
                    <div>
                      <p className="text-caption font-medium text-muted-foreground">Detalle</p>
                      <p className="mt-1 text-small text-muted-foreground">
                        Solicitada por {request.requester}{request.event ? ` · ${request.event}` : ""}
                      </p>
                      <div className="mt-2 space-y-1">
                        {request.items.map((item, i) => (
                          <div key={i} className="flex justify-between text-small text-muted-foreground">
                            <span>{item.name}</span><span className="font-medium text-foreground">${item.amount}</span>
                          </div>
                        ))}
                      </div>
                      {request.source && (
                        <p className="mt-2 flex items-center gap-1.5 text-caption text-muted-foreground">
                          <Landmark className="size-3.5 text-brand-purple-light" /> Fuente: {request.source}
                        </p>
                      )}
                    </div>
                    {request.status === "submitted" && (
                      <div className="space-y-2">
                        <p className="text-caption font-medium text-muted-foreground">Opciones</p>
                        <div className="flex items-center gap-1.5">
                          <Input type="number" placeholder="Monto parcial…" className="w-28" aria-label="Monto parcial" />
                          <Button size="sm" variant="outline" onClick={() => approve(request.id, Number(100))}>Aprobar parcial</Button>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Input placeholder="Fuente interna…" className="max-w-44" aria-label="Fuente de fondos" />
                          <Button size="sm" variant="secondary" onClick={() => setSource(request.id, "Presupuesto 2026")}>Fuente</Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ---- chapter request view ----
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-h1 font-bold tracking-tight">Solicitar financiamiento</h1>
        <p className="mt-1 text-small text-muted-foreground">Itemiza el presupuesto y alínea tu solicitud con los pilares de LEAD.</p>
      </header>

      <div className="card-surface rounded-xl border border-border/60 p-5">
        <h2 className="text-h3 font-semibold">Nueva solicitud</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="fr-title">Concepto <span className="text-destructive-light">*</span></Label>
            <Input id="fr-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Discover Day — materiales" />
          </div>
          <div className="space-y-1.5">
            <Label>Tipo</Label>
            <Segmented value={form.tipo} onChange={(tipo) => setForm({ ...form, tipo })} options={[{ value: "Evento", label: "Evento" }, { value: "Iniciativa", label: "Iniciativa" }]} />
          </div>
        </div>
        {form.tipo === "Evento" && (
          <div className="mt-4 space-y-1.5">
            <Label htmlFor="fr-event">Evento vinculado</Label>
            <Input id="fr-event" value={form.eventTitle} onChange={(e) => setForm({ ...form, eventTitle: e.target.value })} placeholder="Discover Day 2027" />
          </div>
        )}
        <div className="mt-4 space-y-1.5">
          <Label>Pilar / OKR</Label>
          <Segmented value={form.pillar} onChange={(pillar) => setForm({ ...form, pillar })} options={["Educación", "Liderazgo", "Tecnología", "Talento", "Comunidad"].map((p) => ({ value: p, label: p }))} />
        </div>

        <div className="mt-5">
          <div className="flex items-center justify-between">
            <Label>Desglose <span className="text-destructive-light">*</span></Label>
            <Button size="sm" variant="brand-ghost" className="gap-1" onClick={addItem}><Plus className="size-3.5" /> Agregar item</Button>
          </div>
          <div className="mt-2 space-y-2">
            {items.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input value={item.name} onChange={(e) => setItem(index, "name", e.target.value)} placeholder="Item (ej. impresiones)" className="flex-1" />
                <Input value={item.amount} onChange={(e) => setItem(index, "amount", e.target.value)} type="number" placeholder="$" className="w-28" />
                {items.length > 1 && <Button size="icon-sm" variant="destructive-ghost" aria-label="Quitar item" onClick={() => removeItem(index)}><X className="size-3.5" /></Button>}
              </div>
            ))}
          </div>
          <div className="mt-3 flex justify-between border-t border-border/60 pt-3"><span className="text-small text-muted-foreground">Total</span><span className="text-h3 font-bold">${total}</span></div>
          {form.tipo === "Evento" && form.eventTitle && (
            <p className="mt-2 rounded-md bg-muted/50 px-3 py-2 text-caption text-muted-foreground">Aviso: fecha del evento dentro de 14 días — las solicitudes tardías pueden no alcanzar revisión.</p>
          )}
        </div>
        <Button size="sm" className="mt-4 gap-1.5" onClick={send} disabled={!canSubmit}><Check className="size-3.5" /> Enviar solicitud</Button>
      </div>

      <div className="card-surface divide-y divide-border/60 rounded-xl border border-border/60">
        {requests.map((request) => {
          return (
            <div key={request.id} className="flex flex-wrap items-center gap-4 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{request.title}</p>
                <p className="truncate text-caption text-muted-foreground">{request.chapter} · {request.tipo} · {request.pillar}</p>
              </div>
              <span className="font-semibold">${request.requested}</span>
              <StatusBadge tone={statusTone[request.status]}>{statusLabel[request.status]}</StatusBadge>
            </div>
          );
        })}
      </div>
    </div>
  );
}