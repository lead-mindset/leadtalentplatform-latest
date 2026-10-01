export type TestUser = {
  id: string;
  name: string;
  initials: string;
  avatarColor: string;
  group: string;
  role: string;
  scope: string;
  views: { label: string; href: string }[];
};

export const testUsers: TestUser[] = [
  {
    id: "luis", name: "Luis Coronel", initials: "LR", avatarColor: "brand-purple", group: "Board", role: "Fundador · Tech", scope: "Global",
    views: [{ label: "Board", href: "/board" }, { label: "Miembro", href: "/inicio" }],
  },
  {
    id: "antonny", name: "Antonny Porlles", initials: "AV", avatarColor: "brand-rose", group: "Board", role: "Fundador · Ops", scope: "Global",
    views: [{ label: "Board", href: "/board" }, { label: "Miembro", href: "/inicio" }],
  },
  {
    id: "admin", name: "Mariana Torres", initials: "MT", avatarColor: "brand-red", group: "Admin", role: "Admin LEAD", scope: "Global",
    views: [{ label: "Admin", href: "/admin" }, { label: "Miembro", href: "/inicio" }],
  },
  {
    id: "presidente1", name: "Diego Salinas", initials: "DS", avatarColor: "brand-orange", group: "Presidente", role: "Presidente", scope: "LEAD Perú",
    views: [{ label: "Capítulo", href: "/admin" }, { label: "Miembro", href: "/inicio" }],
  },
  {
    id: "presidente2", name: "Fernando Chávez", initials: "FC", avatarColor: "brand-purple", group: "Presidente", role: "Presidente", scope: "LEAD UTEC",
    views: [{ label: "Capítulo", href: "/admin" }, { label: "Miembro", href: "/inicio" }],
  },
  {
    id: "eboard", name: "Lucía Herrera", initials: "LH", avatarColor: "brand-rose", group: "E-board", role: "E-board · Tech", scope: "LEAD Perú",
    views: [{ label: "Capítulo", href: "/admin" }, { label: "Miembro", href: "/inicio" }],
  },
  {
    id: "miembro", name: "Valeria Mendoza", initials: "VM", avatarColor: "brand-purple", group: "Miembro", role: "Miembro · Tech Lead", scope: "LEAD Perú",
    views: [{ label: "Miembro", href: "/inicio" }],
  },
  {
    id: "recruiter", name: "Laura García", initials: "LG", avatarColor: "brand-rose", group: "Recruiter", role: "Talent Acquisition", scope: "TechBridge",
    views: [{ label: "Portal empresa", href: "/empresa" }],
  },
];
