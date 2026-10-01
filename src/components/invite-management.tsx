"use client";

import { useState } from "react";
import { Building2, RotateCcw, Send, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { IconTile } from "@/components/ui/icon-tile";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, useForm } from "@/components/form";
import { Segmented } from "@/components/ui/segmented";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { InitialsAvatar } from "@/components/initials-avatar";
import { buildValidate, email, required } from "@/lib/validators";
import { companyInvites, type CompanyInvite, type ContactRole } from "@/lib/data/admin";

const ROLE_OPTIONS: ContactRole[] = ["Recruiter", "Talent Partner", "Admin"];

const ROLE_INFO: Record<ContactRole, string> = {
  Recruiter: "Ve el talento, guarda perfiles y contacta a estudiantes. Ideal para quien busca candidatos.",
  "Talent Partner": "Todo lo de Recruiter, además gestiona a las personas de su empresa en el portal.",
  Admin: "Control total del acceso de su empresa: invita más personas, revoca accesos y gestiona la cuenta.",
};

const validate = buildValidate({
  company: [required("Elige una empresa o escribe su nombre")],
  email: [required("Escribe el correo de contacto"), email()],
});

const statusTone: Record<string, "info" | "success" | "muted"> = {
  pending: "info",
  accepted: "success",
  revoked: "muted",
};

const statusLabel: Record<string, string> = {
  pending: "Pendiente",
  accepted: "Aceptada",
  revoked: "Revocada",
};

const normalize = (value: string) => value.trim().toLowerCase().replace(/\s+/g, "");

const initialsFromEmail = (email: string) =>
  email
    .split("@")[0]
    .split(/[._-]/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "?";

export function InviteManagement({ subtitle }: { subtitle: string }) {
  const [companies, setCompanies] = useState<CompanyInvite[]>(companyInvites.map((c) => ({ ...c, contacts: c.contacts.map((x) => ({ ...x })) })));
  const [companyMode, setCompanyMode] = useState<"existing" | "new">("existing");
  const [selectedId, setSelectedId] = useState<string | undefined>(companies[0]?.id);
  const [role, setRole] = useState<ContactRole>("Recruiter");

  const form = useForm({
    initial: { company: "", email: "", note: "" },
    validate,
    onSubmit: (values) => {
      const companyName =
        companyMode === "existing"
          ? companies.find((c) => c.id === selectedId)?.company ?? ""
          : values.company.trim();
      if (!companyName) return;
      const contact = { id: `ct-${Date.now()}`, email: values.email.trim(), role, status: "pending" as const, sent: "ahora mismo" };
      setCompanies((prev) => {
        const existing = prev.find((c) => normalize(c.company) === normalize(companyName));
        if (existing) {
          return prev.map((c) => (c.id === existing.id ? { ...c, contacts: [...c.contacts, contact] } : c));
        }
        return [...prev, { id: `co-${Date.now()}`, company: companyName, contacts: [contact] }];
      });
      form.set("company", "");
      form.set("email", "");
      form.set("note", "");
    },
  });

  const setContactStatus = (companyId: string, contactId: string, status: CompanyInvite["contacts"][number]["status"]) =>
    setCompanies((prev) =>
      prev.map((c) =>
        c.id === companyId ? { ...c, contacts: c.contacts.map((ct) => (ct.id === contactId ? { ...ct, status } : ct)) } : c
      )
    );

  const matchSuggestion = companyMode === "new" && form.values.company.trim().length >= 3
    ? companies.find((c) => {
        const typed = normalize(form.values.company);
        const existing = normalize(c.company);
        return existing !== typed && (existing.includes(typed) || typed.includes(existing));
      })
    : undefined;

  const counts = companies.reduce(
    (acc, c) => {
      acc.pending += c.contacts.filter((ct) => ct.status === "pending").length;
      acc.total += c.contacts.length;
      return acc;
    },
    { pending: 0, total: 0 }
  );

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-h1 font-bold tracking-tight">Invitaciones</h1>
        <p className="mt-1 max-w-xl text-small text-muted-foreground">{subtitle}</p>
      </header>

      <div className="card-surface rounded-xl border border-border/60 p-6">
        <p className="flex items-center gap-2 font-semibold">
          <UserPlus className="size-4 text-brand-purple-light" /> Invitar a una empresa
        </p>
        <p className="mt-1 text-caption text-muted-foreground">
          Una empresa, varias personas. Puedes revocar cada acceso cuando quieras.
        </p>
        <form onSubmit={form.handleSubmit} className="mt-4 grid gap-3 sm:grid-cols-2" noValidate>
          <div className="sm:col-span-2">
            <p className="text-small font-medium">¿Ya está invitada la empresa?</p>
            <Segmented
              options={[{ value: "existing", label: "Ya está en LEAD" }, { value: "new", label: "Nueva empresa" }]}
              value={companyMode}
              onChange={setCompanyMode}
              className="mt-1.5"
            />
          </div>
          {companyMode === "existing" ? (
            <div className="sm:col-span-2">
              <Field label="Empresa" htmlFor="inv-existing" required>
                <Select value={selectedId} onValueChange={setSelectedId}>
                  <SelectTrigger id="inv-existing" className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {companies.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.company} · {c.contacts.length} {c.contacts.length === 1 ? "persona" : "personas"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
          ) : (
            <div className="sm:col-span-2">
              <Field label="Empresa" htmlFor="inv-company" required error={form.errors.company}>
                <Input id="inv-company" value={form.values.company} onChange={(e) => form.set("company", e.target.value)} placeholder="TechBridge Solutions" autoFocus />
              </Field>
              {matchSuggestion && (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="text-caption text-muted-foreground">
                    Se parece a <strong className="text-foreground">{matchSuggestion.company}</strong>. ¿Agregar ahí?
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedId(matchSuggestion.id);
                      setCompanyMode("existing");
                      form.set("company", "");
                    }}
                  >
                    Usar {matchSuggestion.company}
                  </Button>
                </div>
              )}
            </div>
          )}
          <Field label="Correo de contacto" htmlFor="inv-email" required error={form.errors.email}>
            <Input id="inv-email" type="email" value={form.values.email} onChange={(e) => form.set("email", e.target.value)} placeholder="laura@empresa.com" />
          </Field>
          <div>
            <p className="text-small font-medium">Rol en el portal</p>
            <Segmented options={ROLE_OPTIONS.map((value) => ({ value, label: value }))} value={role} onChange={setRole} className="mt-1.5" />
            <p className="mt-1.5 text-caption text-muted-foreground">{ROLE_INFO[role]}</p>
          </div>
          <Field label="Nota" htmlFor="inv-note" hint="Opcional" className="sm:col-span-2">
            <Textarea id="inv-note" value={form.values.note} onChange={(e) => form.set("note", e.target.value)} placeholder="Hola, te invitamos a descubrir el talento LEAD…" className="min-h-20" />
          </Field>
          <Button type="submit" className="w-full gap-1.5 sm:col-span-2">
            <Send className="size-3.5" /> Enviar invitación
          </Button>
        </form>
      </div>

      <div className="card-surface divide-y divide-border/60 rounded-xl border border-border/60">
        {companies.map((company) => {
          const companyPending = company.contacts.filter((ct) => ct.status === "pending").length;
          return (
            <div key={company.id} className="px-4 py-4">
              <div className="flex items-center gap-3">
                <IconTile className="rounded-xl"><Building2 className="size-4" /></IconTile>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{company.company}</p>
                  <p className="text-caption text-muted-foreground">
                    {company.contacts.length} {company.contacts.length === 1 ? "persona" : "personas"}
                    {companyPending > 0 && ` · ${companyPending} pendiente${companyPending === 1 ? "" : "s"}`}
                  </p>
                </div>
              </div>
              <div className="mt-3 overflow-hidden rounded-xl bg-muted/40">
                {company.contacts.map((contact, index) => {
                  return (
                    <div key={contact.id} className={`flex flex-wrap items-center gap-3 px-3 py-2.5 ${index > 0 ? "border-t border-border/40" : ""}`}>
                      <InitialsAvatar initials={initialsFromEmail(contact.email)} color={index % 2 === 0 ? "brand-purple" : "brand-rose"} className="size-10 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-small font-medium">{contact.email}</p>
                        <p className="truncate text-caption text-muted-foreground">
                          {contact.role} · enviada {contact.sent}
                        </p>
                      </div>
                      <StatusBadge tone={statusTone[contact.status]}>{statusLabel[contact.status]}</StatusBadge>
                      {contact.status === "pending" && (
                        <Button size="sm" variant="outline" onClick={() => setContactStatus(company.id, contact.id, "revoked")}>
                          Cancelar invitación
                        </Button>
                      )}
                      {contact.status === "accepted" && (
                        <Button size="sm" variant="destructive" onClick={() => setContactStatus(company.id, contact.id, "revoked")}>
                          Revocar acceso
                        </Button>
                      )}
                      {contact.status === "revoked" && (
                        <Button size="sm" variant="outline" className="gap-1" onClick={() => setContactStatus(company.id, contact.id, "pending")}>
                          <RotateCcw className="size-3.5" /> Deshacer
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}