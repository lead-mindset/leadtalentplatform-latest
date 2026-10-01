"use client";
import { InitialsAvatar } from "@/components/initials-avatar";

import { useState } from "react";
import { Check, Mail, Plus, X } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FilterChip } from "@/components/ui/filter-chip";
import { adminMembers, type AdminMember } from "@/lib/data/admin";

const statusBadge: Record<string, { label: string; tone: "success" | "info" | "destructive" }> = {
  active: { label: "Activo", tone: "success" },
  pending: { label: "Pendiente", tone: "info" },
  rejected: { label: "Rechazado", tone: "destructive" },
};

export default function AdminMiembrosPage() {
  const [members, setMembers] = useState(adminMembers);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [invited, setInvited] = useState<string[]>([]);

  const setStatus = (id: string, status: "active" | "rejected") =>
    setMembers((prev) => prev.map((member) => (member.id === id ? { ...member, status } : member)));

  const setRole = (id: string, role: string) =>
    setMembers((prev) => prev.map((member) => (member.id === id ? { ...member, role } : member)));

  const sendInvite = () => {
    if (!inviteEmail.includes("@")) return;
    setInvited((prev) => [...prev, inviteEmail]);
    setInviteEmail("");
    setShowInvite(false);
  };

  const pending = members.filter((member) => member.status === "pending");
  const junta = members.filter((member) => member.status === "active" && !["Miembro", "Voluntario"].includes(member.role));
  const regulares = members.filter((member) => member.status === "active" && ["Miembro", "Voluntario"].includes(member.role));

  const MemberRow = ({ member, showRole }: { member: AdminMember; showRole?: boolean }) => {
    const badge = statusBadge[member.status];
    return (
      <div className="flex flex-wrap items-center gap-4 px-4 py-3">
        <InitialsAvatar initials={member.initials} color={member.avatarColor} className="size-10 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{member.name}</p>
          <p className="truncate text-caption text-muted-foreground">{member.chapter} · {member.role} · {member.joined}</p>
        </div>
        <StatusBadge tone={badge.tone}>{badge.label}</StatusBadge>
        {member.status === "pending" ? (
          <div className="flex gap-2">
            <Button size="sm" className="gap-1" onClick={() => setStatus(member.id, "active")}><Check className="size-3.5" /> Aprobar</Button>
            <Button size="sm" variant="destructive-outline" className="gap-1" onClick={() => setStatus(member.id, "rejected")}><X className="size-3.5" /> Rechazar</Button>
          </div>
        ) : (
          showRole && (
            <div className="flex flex-wrap items-center gap-2">
              <FilterChip active={member.role === "Presidente"} onClick={() => setRole(member.id, "Presidente")}>Presidente</FilterChip>
              <FilterChip active={member.role === "Vicepresidente"} onClick={() => setRole(member.id, "Vicepresidente")}>Vicepresidente</FilterChip>
              <Input
                value={member.role}
                onChange={(event) => setRole(member.id, event.target.value)}
                placeholder="Rol del capítulo…"
                className="w-44"
                aria-label={`Rol de ${member.name}`}
              />
            </div>
          )
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-h1 font-bold tracking-tight">Miembros</h1>
          <p className="mt-1 text-small text-muted-foreground">
            Aprueba solicitudes, invita al e-board y asigna roles.
          </p>
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => setShowInvite((prev) => !prev)}>
          {showInvite ? <><X className="size-3.5" /> Cancelar</> : <><Plus className="size-3.5" /> Invitar e-board</>}
        </Button>
      </header>

      {showInvite && (
        <div className="card-surface rounded-xl border border-border/60 p-5">
          <h2 className="text-h3 font-semibold">Invitar al e-board</h2>
          <div className="mt-4 max-w-md space-y-1.5">
            <Label htmlFor="inv-email">Correo <span className="text-destructive-light">*</span></Label>
            <Input id="inv-email" type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="persona@capitulo.org" />
          </div>
          <p className="mt-2 max-w-md text-caption text-muted-foreground">
            Los roles del e-board se asignan cuando acepte la invitación (cada capítulo tiene los suyos).
          </p>
          <Button size="sm" className="mt-4 gap-1.5" onClick={sendInvite} disabled={!inviteEmail.includes("@")}>
            <Mail className="size-3.5" /> Enviar invitación
          </Button>
          {invited.length > 0 && (
            <p className="mt-3 text-caption text-muted-foreground">
              Invitado{invited.length > 1 ? "s" : ""}: {invited.join(", ")}
            </p>
          )}
        </div>
      )}

      <div className="card-surface divide-y divide-border/60 rounded-xl border border-border/60">
        {pending.map((member) => <MemberRow key={member.id} member={member} />)}
        {junta.map((member) => <MemberRow key={member.id} member={member} showRole />)}
        {regulares.map((member) => <MemberRow key={member.id} member={member} showRole />)}
      </div>
    </div>
  );
}