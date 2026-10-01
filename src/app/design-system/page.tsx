"use client";

import { Bell, Building2, ChevronsUpDown, Link2, Mail, Plus, Search, Settings, ShieldCheck, User, X } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Toggle } from "@/components/ui/toggle";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FilterChip } from "@/components/ui/filter-chip";
import { Segmented } from "@/components/ui/segmented";
import { SidebarOption } from "@/components/ui/sidebar-option";
import { InitialsAvatar } from "@/components/initials-avatar";
import { StatusBadge } from "@/components/ui/status-badge";
import { Chip } from "@/components/ui/chip";
import { IconTile } from "@/components/ui/icon-tile";
import { Field } from "@/components/form";
import { PhotoUpload } from "@/components/photo-upload";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-border/60 bg-card p-(--card-spacing)">
      <h2 className="text-h3 font-semibold">{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4 last:mb-0">
      <p className="mb-2 text-caption font-medium text-muted-foreground">{label}</p>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
  );
}

const swatches: { name: string; className: string; token: string }[] = [
  { name: "Fondo", className: "bg-background ring-1 ring-foreground/10", token: "--background" },
  { name: "Card", className: "bg-card ring-1 ring-foreground/10", token: "--card" },
  { name: "Primario", className: "bg-primary", token: "--primary" },
  { name: "Secondary", className: "bg-secondary", token: "--secondary" },
  { name: "Muted", className: "bg-muted ring-1 ring-foreground/10", token: "--muted" },
  { name: "Accent", className: "bg-accent", token: "--accent" },
  { name: "Destructive", className: "bg-destructive", token: "--destructive" },
  { name: "Success", className: "bg-success", token: "--success" },
  { name: "Border", className: "border border-foreground/20", token: "--border" },
  { name: "Marca morado", className: "bg-brand-purple", token: "--brand-purple" },
  { name: "Marca rosa", className: "bg-brand-rose", token: "--brand-rose" },
  { name: "Marca rojo", className: "bg-brand-red", token: "--brand-red" },
  { name: "Purple light", className: "bg-brand-purple-light", token: "--brand-purple-light" },
];

const typeSamples: { name: string; className: string }[] = [
  { name: "caption", className: "text-caption" },
  { name: "small", className: "text-small" },
  { name: "body", className: "text-body" },
  { name: "body-lg", className: "text-body-lg" },
  { name: "h3", className: "text-h3" },
  { name: "h2", className: "text-h2" },
  { name: "h1", className: "text-h1" },
  { name: "display", className: "text-display" },
];

export default function DesignSystemPage() {
  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
      <header className="mb-8">
        <h1 className="text-display font-bold tracking-tight">Sistema de diseño</h1>
        <p className="mt-2 text-body text-muted-foreground">
          Auditoría de todos los componentes, variantes y estados de la plataforma. Todo sale de los
          tokens definidos en <code className="rounded bg-muted px-1.5 py-0.5 text-small">globals.css</code>.
        </p>
      </header>

      <div className="mb-6 rounded-xl border border-border/60 bg-muted/30 px-4 py-3 text-small text-muted-foreground">
        <p className="font-semibold text-foreground">Regla de primitivas — nada hardcodeado</p>
        <p className="mt-1">
          Estados → <code className="rounded bg-muted px-1 text-caption">StatusBadge</code> · etiquetas →{" "}
          <code className="rounded bg-muted px-1 text-caption">Chip</code> · avatares →{" "}
          <code className="rounded bg-muted px-1 text-caption">InitialsAvatar</code> · icono en cuadro →{" "}
          <code className="rounded bg-muted px-1 text-caption">IconTile</code> · selección →{" "}
          <code className="rounded bg-muted px-1 text-caption">FilterChip</code>/<code className="rounded bg-muted px-1 text-caption">Segmented</code> ·
          acciones → variantes de <code className="rounded bg-muted px-1 text-caption">Button</code>. Nunca clases sueltas
          de color en páginas.
        </p>
      </div>

      <div className="space-y-6">
        <Section title="Tokens de color">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-5">
            {swatches.map((swatch) => (
              <div key={swatch.name} className="rounded-lg bg-muted/30 p-2">
                <div className={`h-12 w-full rounded-md ${swatch.className}`} />
                <p className="mt-2 text-small font-medium">{swatch.name}</p>
                <p className="text-caption text-muted-foreground">{swatch.token}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Botones — variantes">
          <Row label="default (gradiente de marca)">
            <Button>Acción principal</Button>
            <Button disabled>Deshabilitado</Button>
          </Row>
          <Row label="secondary">
            <Button variant="secondary">Secundario</Button>
            <Button variant="secondary" disabled>Deshabilitado</Button>
          </Row>
          <Row label="outline">
            <Button variant="outline">Contorno</Button>
            <Button variant="outline" disabled>Deshabilitado</Button>
          </Row>
          <Row label="ghost">
            <Button variant="ghost">Fantasma</Button>
          </Row>
          <Row label="destructive">
            <Button variant="destructive">Eliminar</Button>
          </Row>
          <Row label="link">
            <Button variant="link">Enlace</Button>
          </Row>
        </Section>

        <Section title="Botones — tamaños">
          <Row label="xs · sm · default · lg">
            <Button size="xs">xs</Button>
            <Button size="sm">sm</Button>
            <Button size="default">default</Button>
            <Button size="lg">lg</Button>
          </Row>
          <Row label="icon · icon-sm · icon-lg">
            <Button size="icon" aria-label="Buscar"><Search /></Button>
            <Button size="icon-sm" variant="secondary" aria-label="Plus"><Plus /></Button>
            <Button size="icon-lg" variant="outline" aria-label="Mail"><Mail /></Button>
          </Row>
        </Section>

        <Section title="Botones — sistema destructivo">
          <Row label="gravedad máxima · relleno suave (Revocar acceso, Solicitar borrado)">
            <Button variant="destructive">Revocar acceso</Button>
          </Row>
          <Row label="media · contorno rojo (Rechazar en colas)">
            <Button variant="destructive-outline"><X className="size-3.5" /> Rechazar</Button>
          </Row>
          <Row label="terciaria · solo icono (Quitar item, Eliminar)">
            <Button variant="destructive-ghost" size="icon-sm" aria-label="Quitar item"><X className="size-3.5" /></Button>
          </Row>
          <div className="mb-4 rounded-xl border border-border/60 bg-muted/30 px-4 py-3 text-small text-muted-foreground">
            <p className="font-semibold text-foreground">Regla destructiva</p>
            <p className="mt-1">
              Elige la variante según la <strong>gravedad real</strong>: solo lo que quita un acceso activo o borra es{" "}
              <code className="rounded bg-muted px-1 text-caption">destructive</code>. Cancelar algo pendiente (nada concedido
              aún) es <code className="rounded bg-muted px-1 text-caption">outline</code> neutro. Nunca colores{" "}
              <code className="rounded bg-muted px-1 text-caption">text-destructive-…</code> sueltos en un Button.
            </p>
          </div>
        </Section>

        <Section title="Botones — acción de marca suave">
          <Row label="brand-ghost (agregar, secundaria de marca)">
            <Button variant="brand-ghost"><Plus className="size-3.5" /> Agregar item</Button>
          </Row>
        </Section>

        <Section title="Filtros — estados seleccionado">
          <Row label="FilterChip">
            <FilterChip active onClick={() => {}}>Seleccionado</FilterChip>
            <FilterChip active={false} onClick={() => {}}>No seleccionado</FilterChip>
          </Row>
          <Row label="Segmented">
            <Segmented
              value="a"
              onChange={() => {}}
              options={[
                { value: "a", label: "Opción A" },
                { value: "b", label: "Opción B" },
              ]}
            />
          </Row>
          <Row label="SidebarOption">
            <div className="w-44 max-w-full">
              <SidebarOption active onClick={() => {}}>Seleccionado</SidebarOption>
              <SidebarOption active={false} onClick={() => {}}>No seleccionado</SidebarOption>
            </div>
          </Row>
        </Section>

        <Section title="Badges">
          <Row label="variantes">
            <Badge>Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge variant="destructive">Destructive</Badge>
            <Badge className="rounded-full bg-brand-purple/15 font-semibold text-brand-purple-light">Capítulo</Badge>
            <Badge className="rounded-full bg-brand-purple/15 font-medium text-brand-purple-light">Área</Badge>
          </Row>
        </Section>

        <Section title="Badge de estado (StatusBadge)">
          <Row label="tonos · info · success · destructive · muted">
            <StatusBadge tone="info">Pendiente</StatusBadge>
            <StatusBadge tone="success">Aceptada</StatusBadge>
            <StatusBadge tone="destructive">Rechazada</StatusBadge>
            <StatusBadge tone="muted">Revocada</StatusBadge>
          </Row>
          <p className="text-caption text-muted-foreground">
            Para estados de acciones (validaciones, invitaciones, financiamiento, miembros) — nunca
            clases sueltas <code className="rounded bg-muted px-1 text-caption">bg-… text-…</code> en las páginas.
          </p>
        </Section>

        <Section title="Chip (etiqueta no interactiva)">
          <Row label="tonos · brand · muted · outline">
            <Chip tone="brand">★ Python</Chip>
            <Chip tone="muted">SQL</Chip>
            <Chip tone="outline">Prácticas</Chip>
          </Row>
          <Row label="uso">
            <p className="text-caption text-muted-foreground">
              Skills, top-skills y etiquetas de solo lectura. Los interactivos son <code className="rounded bg-muted px-1 text-caption">FilterChip</code>.
            </p>
          </Row>
        </Section>

        <Section title="IconTile (icono en cuadro)">
          <Row label="tamaño por defecto">
            <IconTile><Building2 /></IconTile>
            <IconTile className="rounded-xl"><ShieldCheck /></IconTile>
          </Row>
          <p className="text-caption text-muted-foreground">
            Cuadro estándar para iconos de fila (empresas, secciones). Reemplaza los{" "}
            <code className="rounded bg-muted px-1 text-caption">grid size-10 place-items-center</code> a mano.
          </p>
        </Section>

        <Section title="Formularios validados (Field + useForm)">
          <Row label="Field con error (aria-invalid + mensaje)">
            <div className="w-full max-w-sm space-y-4">
              <Field label="Correo" htmlFor="ds-email" required error="Escribe un correo válido">
                <Input id="ds-email" type="email" value="correo@mal" onChange={() => {}} aria-invalid />
              </Field>
              <Field label="Nombre" htmlFor="ds-name" hint="Opcional">
                <Input id="ds-name" placeholder="Tu nombre" />
              </Field>
            </div>
          </Row>
          <p className="text-caption text-muted-foreground">
            Todos los formularios usan <code className="rounded bg-muted px-1 text-caption">useForm</code> +{" "}
            <code className="rounded bg-muted px-1 text-caption">validators</code> (required, email, minLen, url). Nunca
            validar a mano dentro de una página.
          </p>
        </Section>

        <Section title="PhotoUpload">
          <Row label="con iniciales · con foto">
            <div className="flex items-center gap-6">
              <PhotoUpload onChange={() => {}} initials="VM" label="Tu foto (opcional)" />
              <PhotoUpload value="/placeholder.svg" onChange={() => {}} label="Cambiar foto" />
            </div>
          </Row>
          <p className="text-caption text-muted-foreground">
            Un único círculo: iniciales o foto + badge de cámara. Valida tipo de imagen y tamaño (máx 5 MB).
          </p>
        </Section>

        <Section title="Inputs">
          <Row label="default · con icono · deshabilitado">
            <Input placeholder="Nombre" className="w-56 max-w-full" />
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Buscar…" className="w-56 max-w-full rounded-full pl-9" />
            </div>
            <Input placeholder="Deshabilitado" disabled className="w-56 max-w-full" />
          </Row>
        </Section>

        <Section title="Tipografía">
          <div className="space-y-2">
            {typeSamples.map((sample) => (
              <div key={sample.name} className="flex items-baseline gap-4">
                <span className="w-20 shrink-0 text-caption text-muted-foreground">{sample.name}</span>
                <span className={`${sample.className} font-medium`}>La comunidad LEAD te espera</span>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Avatares">
          <Row label="tamaños">
            <InitialsAvatar initials="VM" color="brand-purple" className="size-8" />
            <InitialsAvatar initials="VM" color="brand-purple" className="size-10" />
            <InitialsAvatar initials="VM" color="brand-purple" className="size-12" />
            <InitialsAvatar initials="VM" color="brand-purple" className="size-16 rounded-2xl" />
          </Row>
          <Row label="colores">
            <InitialsAvatar initials="AB" color="brand-purple" />
            <InitialsAvatar initials="CD" color="brand-rose" />
            <InitialsAvatar initials="EF" color="brand-red" />
            <InitialsAvatar initials="GH" color="brand-orange" />
          </Row>
        </Section>

        <Section title="Cards">
          <Row label="card estándar">
            <Card className="w-72 max-w-full shadow-sm">
              <CardHeader>
                <CardTitle className="text-h3 font-semibold">Título de la card</CardTitle>
              </CardHeader>
              <CardContent className="text-small text-muted-foreground">
                Contenido de ejemplo para auditar el ritmo, el padding y la superficie de las cards.
              </CardContent>
            </Card>
          </Row>
        </Section>

        <Section title="Enlaces">
          <Row label="texto · con icono">
            <a href="#" className="flex items-center gap-1 text-small font-medium text-brand-purple-light hover:underline">
              Enlace de marca <Link2 className="size-3.5" />
            </a>
            <a href="#" className="text-small text-muted-foreground hover:text-foreground">
              Enlace secundario
            </a>
          </Row>
        </Section>

        <Section title="Formularios">
          <Row label="Label + Input + Textarea">
            <div className="w-full max-w-sm space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="audit-name">Nombre</Label>
                <Input id="audit-name" placeholder="Tu nombre" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="audit-bio">Sobre ti</Label>
                <Textarea id="audit-bio" placeholder="Cuéntanos de ti…" rows={3} />
              </div>
            </div>
          </Row>
          <Row label="Checkbox">
            <label className="flex items-center gap-2 text-small">
              <Checkbox /> Acepto los términos
            </label>
          </Row>
          <Row label="RadioGroup">
            <RadioGroup defaultValue="a" className="flex gap-4">
              <label className="flex items-center gap-2 text-small"><RadioGroupItem value="a" /> Nativo</label>
              <label className="flex items-center gap-2 text-small"><RadioGroupItem value="b" /> Profesional</label>
            </RadioGroup>
          </Row>
          <Row label="Switch">
            <label className="flex items-center gap-2 text-small"><Switch /> Visible para empresas</label>
          </Row>
          <Row label="Select">
            <Select defaultValue="peru">
              <SelectTrigger className="w-48 max-w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="peru">LEAD Perú</SelectItem>
                <SelectItem value="mexico">LEAD México</SelectItem>
                <SelectItem value="america">LEAD América</SelectItem>
              </SelectContent>
            </Select>
          </Row>
          <Row label="Toggle">
            <Toggle aria-label="Notificaciones"><Bell /></Toggle>
          </Row>
          <Row label="Combobox">
            <Command className="w-72 max-w-full rounded-xl border border-border bg-card">
              <CommandInput placeholder="Buscar persona…" />
              <CommandList>
                <CommandEmpty>Sin resultados</CommandEmpty>
                <CommandGroup heading="Personas">
                  <CommandItem>Andrea Vargas</CommandItem>
                  <CommandItem>Lucía Campos</CommandItem>
                  <CommandItem>Gabriela Torres</CommandItem>
                </CommandGroup>
              </CommandList>
            </Command>
          </Row>
        </Section>

        <Section title="Tabs">
          <Row label="line (subrayado)">
            <Tabs defaultValue="a" className="w-full">
              <TabsList variant="line" className="w-full border-b border-border">
                <TabsTrigger value="a" className="px-3 py-2 after:bg-brand-purple-light">Perfil</TabsTrigger>
                <TabsTrigger value="b" className="px-3 py-2 after:bg-brand-purple-light">Eventos</TabsTrigger>
              </TabsList>
              <TabsContent value="a" className="pt-3 text-small text-muted-foreground">Contenido del tab Perfil.</TabsContent>
              <TabsContent value="b" className="pt-3 text-small text-muted-foreground">Contenido del tab Eventos.</TabsContent>
            </Tabs>
          </Row>
        </Section>

        <Section title="Popups">
          <Row label="Dialog">
            <Dialog>
              <DialogTrigger asChild><Button variant="outline">Abrir diálogo</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Confirmar registro</DialogTitle>
                  <DialogDescription>Estás a punto de registrarte al evento. ¿Continuamos?</DialogDescription>
                </DialogHeader>
                <div className="flex justify-end gap-2">
                  <Button variant="secondary">Cancelar</Button>
                  <Button>Confirmar</Button>
                </div>
              </DialogContent>
            </Dialog>
          </Row>
          <Row label="DropdownMenu">
            <DropdownMenu>
              <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" aria-label="Menú"><Settings /></Button></DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Mi cuenta</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem><User className="mr-2 size-4" /> Perfil</DropdownMenuItem>
                <DropdownMenuItem><Settings className="mr-2 size-4" /> Ajustes</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </Row>
          <Row label="Tooltip">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild><Button variant="outline" size="icon" aria-label="Ayuda"><Bell /></Button></TooltipTrigger>
                <TooltipContent>Notificaciones</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </Row>
        </Section>

        <Section title="Banners / Alert">
          <Row label="variantes">
            <div className="w-full max-w-md space-y-3">
              <Alert>
                <AlertTitle>Información</AlertTitle>
                <AlertDescription>Los eventos de tu capítulo se actualizan cada semana.</AlertDescription>
              </Alert>
              <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>No pudimos guardar tu perfil. Intenta de nuevo.</AlertDescription>
              </Alert>
              <div className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-small text-muted-foreground">
                Banner sutil de ejemplo (aviso o nota).
              </div>
            </div>
          </Row>
        </Section>

        <Section title="Sidebar (navegación)">
          <Row label="ejemplo vertical">
            <div className="w-48 max-w-full space-y-1 rounded-xl border border-border bg-card p-3">
              <SidebarOption active onClick={() => {}}>Perfil</SidebarOption>
              <SidebarOption active={false} onClick={() => {}}>Eventos</SidebarOption>
              <SidebarOption active={false} onClick={() => {}}>Guardados</SidebarOption>
              <Separator className="my-2" />
              <SidebarOption active={false} onClick={() => {}}>Ayuda</SidebarOption>
            </div>
          </Row>
        </Section>

        <Section title="Loading / Separator">
          <Row label="Skeleton">
            <div className="w-full max-w-sm space-y-2">
              <Skeleton className="h-4 w-40 max-w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
          </Row>
          <Row label="Separator">
            <Separator className="w-full" />
          </Row>
        </Section>
      </div>
    </div>
  );
}