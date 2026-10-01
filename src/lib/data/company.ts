export type RecruiterAccount = {
  company: {
    name: string;
    initials: string;
    avatarColor: string;
    industry: string;
    location: string;
    partnership: string;
  };
  recruiter: {
    name: string;
    role: string;
    email: string;
  };
  access: {
    status: "active" | "revoked";
    source: string;
    tier: "Ver" | "Descargar" | "Contactar";
    capabilities: { browse: boolean; resume: boolean; contact: boolean };
    validUntil: string;
    revocable: boolean;
  };
  seats: { used: number; total: number };
};

export const companyAccount: RecruiterAccount = {
  company: {
    name: "TechBridge Solutions",
    initials: "TS",
    avatarColor: "brand-purple",
    industry: "Software & IA",
    location: "Nueva York",
    partnership: "Partner LEAD 2026",
  },
  recruiter: {
    name: "Laura García",
    role: "Talent Acquisition Lead",
    email: "laura@techbridge.com",
  },
  access: {
    status: "active",
    source: "Invitación de LEAD",
    tier: "Contactar",
    capabilities: { browse: true, resume: true, contact: true },
    validUntil: "2027-06-30",
    revocable: true,
  },
  seats: { used: 2, total: 3 },
};

export const tierExplainer: Record<string, { label: string; text: string }[]> = {
  Ver: [{ label: "Ver perfiles", text: "Navega el talento visible para empresas." }],
  Descargar: [
    { label: "Ver perfiles", text: "Navega el talento visible para empresas." },
    { label: "Descargar resumes", text: "Descarga el resume de los perfiles verificado." },
  ],
  Contactar: [
    { label: "Ver perfiles", text: "Navega el talento visible para empresas." },
    { label: "Descargar resumes", text: "Descarga el resume de los perfiles verificado." },
    { label: "Contactar candidatos", text: "Contacta directamente al talento." },
  ],
};