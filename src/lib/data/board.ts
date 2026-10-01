export type BoardMember = {
  id: string;
  name: string;
  initials: string;
  avatarColor: string;
  role: string;
  email: string;
};

export const boardTeam: BoardMember[] = [
  { id: "b1", name: "Luis Coronel", initials: "LR", avatarColor: "brand-purple", role: "Fundador · Tech", email: "lcoronel@leadmindset.org" },
  { id: "b2", name: "Antonny Porlles", initials: "AV", avatarColor: "brand-rose", role: "Fundador · Ops", email: "aporlles@leadmindset.org" },
  { id: "b3", name: "Mariana Torres", initials: "MT", avatarColor: "brand-orange", role: "Admin LEAD", email: "mtorres@leadmindset.org" },
  { id: "b4", name: "Valeria Córdova", initials: "VC", avatarColor: "brand-purple", role: "Operaciones", email: "ops@leadmindset.org" },
  { id: "b5", name: "Diego Salinas", initials: "DS", avatarColor: "brand-red", role: "Presidente · LEAD Perú", email: "dsalinas@leadmindset.org" },
];

export const boardKpis = {
  members: 48,
  chapters: 4,
  eventsThisMonth: 9,
  fundingPending: 2,
  pendingInvites: 3,
  growthMembers: "+12%",
};

export const boardInsights = [
  { title: "Crecimiento de miembros", value: "+12%", note: "vs. mes anterior" },
  { title: "Capítulos activos", value: "4", note: "Perú, México y Colombia" },
  { title: "Eventos este mes", value: "9", note: "workshops, paneles y networking" },
  { title: "Talento visible para empresas", value: "6", note: "perfiles completos y verificados" },
];