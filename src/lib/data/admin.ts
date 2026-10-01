export type AdminMember = {
  id: string;
  name: string;
  initials: string;
  avatarColor: string;
  chapter: string;
  role: string;
  status: "active" | "pending" | "rejected";
  joined: string;
};

export const adminMembers: AdminMember[] = [
  { id: "m1", name: "Valeria Mendoza", initials: "VM", avatarColor: "brand-purple", chapter: "LEAD Perú", role: "Tech Lead", status: "active", joined: "Sep 2026" },
  { id: "m2", name: "Gabriela Torres", initials: "GT", avatarColor: "brand-rose", chapter: "LEAD Perú", role: "Miembro", status: "active", joined: "Ago 2026" },
  { id: "m3", name: "Mateo Ríos", initials: "MR", avatarColor: "brand-orange", chapter: "LEAD América", role: "Miembro", status: "pending", joined: "Solicitó hace 2 días" },
  { id: "m4", name: "Camila Rojas", initials: "CR", avatarColor: "brand-red", chapter: "LEAD Ecuador", role: "VP", status: "active", joined: "Jul 2026" },
  { id: "m5", name: "Iván Quispe", initials: "IQ", avatarColor: "brand-purple", chapter: "LEAD México", role: "Miembro", status: "pending", joined: "Solicitó hace 1 día" },
  { id: "m6", name: "Sebastián Flores", initials: "SF", avatarColor: "brand-rose", chapter: "LEAD América", role: "Miembro", status: "rejected", joined: "Rechazado" },
];

export type AdminChapter = {
  id: string;
  name: string;
  university: string;
  members: number;
  events: number;
  region: string;
};

export const adminChapters: AdminChapter[] = [
  { id: "c1", name: "LEAD Perú", university: "UTEC", members: 28, events: 5, region: "LatAm" },
  { id: "c2", name: "LEAD Colombia", university: "Universidad de los Andes", members: 41, events: 8, region: "Colombia" },
  { id: "c3", name: "LEAD Ecuador", university: "EPN", members: 12, events: 3, region: "Ecuador" },
  { id: "c4", name: "LEAD México", university: "UNAM", members: 9, events: 2, region: "LatAm" },
];

export type FundingRequest = {
  id: string;
  title: string;
  chapter: string;
  amount: string;
  status: "pending" | "approved" | "review";
};

export const fundingRequests: FundingRequest[] = [
  { id: "f1", title: "Discover Day 2027 — materiales", chapter: "LEAD Perú", amount: "$320", status: "pending" },
  { id: "f2", title: "Hackathon — premios", chapter: "LEAD América", amount: "$150", status: "review" },
  { id: "f3", title: "Networking — catering", chapter: "LEAD Ecuador", amount: "$90", status: "approved" },
];

export type ContactRole = "Recruiter" | "Talent Partner" | "Admin";
export type ContactStatus = "pending" | "accepted" | "revoked";

export type CompanyInvite = {
  id: string;
  company: string;
  contacts: { id: string; email: string; role: ContactRole; status: ContactStatus; sent: string }[];
};

export const companyInvites: CompanyInvite[] = [
  {
    id: "c1",
    company: "TechBridge Solutions",
    contacts: [
      { id: "c1a", email: "laura.garcia@techbridge.com", role: "Recruiter", status: "accepted", sent: "hace 1 semana" },
      { id: "c1b", email: "miguel.vargas@techbridge.com", role: "Talent Partner", status: "pending", sent: "hoy" },
    ],
  },
  {
    id: "c2",
    company: "DataVault",
    contacts: [
      { id: "c2a", email: "carlos.mendez@datavault.com", role: "Talent Partner", status: "pending", sent: "hace 2 días" },
    ],
  },
  {
    id: "c3",
    company: "Innova Tech",
    contacts: [
      { id: "c3a", email: "gabriel.soto@innova.com", role: "Admin", status: "revoked", sent: "hace 1 mes" },
    ],
  },
];

export const adminStats = {
  pendingApprovals: 2,
  activeMembers: 48,
  eventsThisMonth: 9,
  chapters: 4,
};

export type JuntaMember = {
  id: string;
  name: string;
  initials: string;
  avatarColor: string;
  role: string;
  area?: string;
  tier: "presidente" | "vp" | "director" | "voluntario";
};

export type ChapterJunta = {
  chapterId: string;
  name: string;
  university: string;
  region: string;
  members: number;
  volunteers: number;
  junta: JuntaMember[];
};

export const juntas: ChapterJunta[] = [
  {
    chapterId: "utec",
    name: "LEAD UTEC",
    university: "Universidad de Ingeniería y Tecnología",
    region: "Perú · Lima",
    members: 28,
    volunteers: 22,
    junta: [
      { id: "u1", name: "Diego Salinas", initials: "LM", avatarColor: "brand-purple", role: "Presidente", tier: "presidente" },
      { id: "u2", name: "Camila Ruiz", initials: "AA", avatarColor: "brand-rose", role: "Vicepresidente", tier: "vp" },
      { id: "u3", name: "Mateo Torres", initials: "DM", avatarColor: "brand-orange", role: "Director", area: "Excelencia Académica", tier: "director" },
      { id: "u4", name: "Iván Paredes", initials: "CE", avatarColor: "brand-red", role: "Director", area: "LEAD Academia", tier: "director" },
      { id: "u5", name: "Sofía Ríos", initials: "NG", avatarColor: "brand-purple", role: "Directora", area: "Excelencia Femenina", tier: "director" },
    ],
  },
  {
    chapterId: "upn-trujillo",
    name: "LEAD UPN-Trujillo",
    university: "Universidad Privada del Norte",
    region: "Perú · Trujillo",
    members: 15,
    volunteers: 9,
    junta: [
      { id: "t1", name: "Valeria Córdova", initials: "MQ", avatarColor: "brand-rose", role: "Presidenta", tier: "presidente" },
      { id: "t2", name: "Lucía Mendoza", initials: "YB", avatarColor: "brand-purple", role: "Vicepresidente", tier: "vp" },
      { id: "t3", name: "Gabriela Vega", initials: "LC", avatarColor: "brand-orange", role: "Coordinadora", area: "Desarrollo de Capítulo", tier: "director" },
      { id: "t4", name: "Andrés Silva", initials: "LQ", avatarColor: "brand-red", role: "Coordinador", area: "Desarrollo Profesional", tier: "director" },
      { id: "t5", name: "María Prado", initials: "VG", avatarColor: "brand-purple", role: "Coordinadora", area: "Marketing", tier: "director" },
      { id: "t6", name: "Camila Duarte", initials: "MR", avatarColor: "brand-orange", role: "Coordinadora", area: "Impacto Comunitario", tier: "director" },
    ],
  },
];

export const standardRoles = ["Presidente", "Vicepresidente"];

export type ProfileReview = {
  id: string;
  name: string;
  initials: string;
  avatarColor: string;
  university: string;
  major: string;
  year: string;
  chapter: string;
  skills: string[];
  topSkills: string[];
  submitted: string;
  status: "pending" | "approved" | "rejected";
};

export const profileReviews: ProfileReview[] = [
  { id: "r1", name: "Valeria Mendoza", initials: "VM", avatarColor: "brand-purple", university: "UTEC", major: "Ingeniería de Software", year: "2028", chapter: "LEAD Perú", skills: ["Python", "SQL", "Machine Learning", "Git"], topSkills: ["Python", "SQL"], submitted: "hoy", status: "pending" },
  { id: "r2", name: "Camila Torres", initials: "CT", avatarColor: "brand-rose", university: "UTEC", major: "Ingeniería de Sistemas", year: "2027", chapter: "LEAD UTEC", skills: ["JavaScript", "React", "TypeScript"], topSkills: ["React"], submitted: "hace 2 días", status: "pending" },
  { id: "r3", name: "Daniela Castro", initials: "DC", avatarColor: "brand-orange", university: "Universidad de Buenos Aires", major: "Computer Science", year: "2028", chapter: "", skills: ["Python", "C++", "Data Analysis"], topSkills: ["Python"], submitted: "hace 3 días", status: "pending" },
  { id: "r4", name: "Sofía Ramírez", initials: "SR", avatarColor: "brand-red", university: "EPN", major: "CS + Statistics", year: "2027", chapter: "LEAD Ecuador", skills: ["SQL", "Data Analysis", "R"], topSkills: ["SQL"], submitted: "hace 1 semana", status: "pending" },
  { id: "r5", name: "Ana Lucía Paredes", initials: "AP", avatarColor: "brand-purple", university: "Universidad de los Andes", major: "Computer Science", year: "2027", chapter: "LEAD Colombia", skills: ["Java", "AWS", "Docker"], topSkills: ["AWS"], submitted: "hace 3 días", status: "approved" },
  { id: "r6", name: "Diego Salas", initials: "DS", avatarColor: "brand-rose", university: "UTEC", major: "Ingeniería Mecatrónica", year: "2028", chapter: "LEAD Perú", skills: ["C++", "Arduino"], topSkills: ["C++"], submitted: "hace 5 días", status: "rejected" },
];