"use client";

import { useState } from "react";
import { Check, MapPin, Pencil, Plus, Video, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Segmented } from "@/components/ui/segmented";
import { Textarea } from "@/components/ui/textarea";
import { events } from "@/lib/data/community";

type EventType = "in_person" | "online" | "hybrid";
type AccessModel = "open" | "application";

const emptyForm = {
  title: "",
  description: "",
  eventType: "in_person" as EventType,
  startAt: "",
  endAt: "",
  locationName: "",
  locationAddress: "",
  locationCity: "",
  meetingUrl: "",
  capacity: "",
  accessModel: "open" as AccessModel,
  coverImageUrl: "",
  published: false,
};

export default function AdminEventosPage() {
  const [list, setList] = useState(
    events.filter((event) => event.calendar === "LEAD Perú").map((event) => ({ id: event.id, title: event.title, date: `${event.month} ${event.day}`, location: event.location, type: event.type }))
  );
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => setForm((prev) => ({ ...prev, [key]: value }));

  const canSubmit = form.title.trim() && form.startAt && (form.eventType === "online" || form.meetingUrl || form.locationName);

  const create = () => {
    if (!canSubmit) return;
    const { month, day } = monthDay(form.startAt);
    setList((prev) => [{ id: `new-${Date.now()}`, title: form.title, date: `${month} ${day}`, location: form.locationName || (form.eventType === "online" ? "Virtual" : form.locationCity || "Por confirmar"), type: form.eventType === "online" ? "Online" : form.eventType === "hybrid" ? "Híbrido" : "Presencial" }, ...prev]);
    setForm(emptyForm);
    setCreating(false);
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-h1 font-bold tracking-tight">Eventos del capítulo</h1>
          <p className="mt-1 text-small text-muted-foreground">Crea y administra los eventos de LEAD UTEC.</p>
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => setCreating((prev) => !prev)}>
          {creating ? <><X className="size-3.5" /> Cancelar</> : <><Plus className="size-3.5" /> Crear evento</>}
        </Button>
      </header>

      {creating && (
        <div className="card-surface rounded-xl border border-border/60 p-5">
          <h2 className="text-h3 font-semibold">Nuevo evento</h2>

          <div className="mt-4 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="ev-title">Título <span className="text-destructive-light">*</span></Label>
              <Input id="ev-title" value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Workshop de entrevistas técnicas" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ev-desc">Descripción</Label>
              <Textarea id="ev-desc" rows={3} value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="De qué trata el evento…" />
            </div>

            <div className="space-y-1.5">
              <Label>Modalidad</Label>
              <Segmented
                value={form.eventType}
                onChange={(value) => set("eventType", value)}
                options={[
                  { value: "in_person", label: "Presencial" },
                  { value: "online", label: "Online" },
                  { value: "hybrid", label: "Híbrido" },
                ]}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="ev-start">Inicio <span className="text-destructive-light">*</span></Label>
                <Input id="ev-start" type="datetime-local" value={form.startAt} onChange={(e) => set("startAt", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ev-end">Fin</Label>
                <Input id="ev-end" type="datetime-local" value={form.endAt} onChange={(e) => set("endAt", e.target.value)} />
              </div>
            </div>

            {form.eventType !== "online" && (
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label htmlFor="ev-loc">Lugar</Label>
                  <Input id="ev-loc" value={form.locationName} onChange={(e) => set("locationName", e.target.value)} placeholder="Auditorio UTEC" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ev-addr">Dirección</Label>
                  <Input id="ev-addr" value={form.locationAddress} onChange={(e) => set("locationAddress", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ev-city">Ciudad</Label>
                  <Input id="ev-city" value={form.locationCity} onChange={(e) => set("locationCity", e.target.value)} placeholder="Lima" />
                </div>
              </div>
            )}

            {form.eventType !== "in_person" && (
              <div className="space-y-1.5">
                <Label htmlFor="ev-url">Enlace de reunión</Label>
                <Input id="ev-url" type="url" value={form.meetingUrl} onChange={(e) => set("meetingUrl", e.target.value)} placeholder="https://zoom.us/…" />
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="ev-cap">Capacidad</Label>
                <Input id="ev-cap" type="number" value={form.capacity} onChange={(e) => set("capacity", e.target.value)} placeholder="50" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ev-cover">Imagen de portada (URL)</Label>
                <Input id="ev-cover" value={form.coverImageUrl} onChange={(e) => set("coverImageUrl", e.target.value)} placeholder="https://…" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Acceso</Label>
              <Segmented
                value={form.accessModel}
                onChange={(value) => set("accessModel", value)}
                options={[
                  { value: "open", label: "Abierto" },
                  { value: "application", label: "Con postulación" },
                ]}
              />
              {form.accessModel === "application" && (
                <p className="mt-1.5 text-caption text-muted-foreground">
                  Los participantes postulan y el e-board revisa las solicitudes antes de aprobar.
                </p>
              )}
            </div>

            <label className="flex items-center gap-2 text-small">
              <Switch checked={form.published} onCheckedChange={(checked) => set("published", checked === true)} />
              Publicar de inmediato
            </label>
          </div>

          <div className="mt-5 flex gap-2 border-t border-border/60 pt-4">
            <Button size="sm" className="gap-1.5" onClick={create} disabled={!canSubmit}>
              <Check className="size-3.5" /> Guardar evento
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setCreating(false)}>Guardar borrador</Button>
          </div>
        </div>
      )}

      <div className="card-surface divide-y divide-border/60 rounded-xl border border-border/60">
        {list.map((event) => (
          <div key={event.id} className="flex items-center gap-4 px-4 py-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-muted text-caption font-bold text-brand-purple-light">{event.date}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{event.title}</p>
              <p className="flex items-center gap-1 truncate text-caption text-muted-foreground">
                {event.type === "Online" ? <Video className="size-3" /> : <MapPin className="size-3" />} {event.location}
              </p>
            </div>
            <Badge variant="secondary" className="rounded-full">{event.type}</Badge>
            <Button size="sm" variant="ghost" aria-label={`Editar ${event.title}`}><Pencil className="size-3.5" /></Button>
          </div>
        ))}
      </div>
    </div>
  );
}