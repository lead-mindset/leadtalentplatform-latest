import type { Person } from "./people";

export type Experience = { role: string; company: string; period: string };
export type Education = { school: string; degree: string; period: string };

export const profile: Person & {
  about: string;
  experience: Experience[];
  education: Education[];
  languages: { name: string; level: string }[];
  workAuth: string;
  availability: string;
  githubUrl: string;
  linkedinUrl: string;
  contactEmail: string;
  leadRole: string;
  leadChapter: string;
  validationStatus: "pending" | "approved" | "rejected";
  areasOfInterest: string[];
  gender: string;
  cv: { uploaded: boolean; name: string };
} = {
  ...({
    id: "me",
    name: "Valeria Mendoza",
    initials: "VM",
    avatarColor: "brand-purple",
    headline: "Estudiante de Ingeniería de Software",
    school: "UTEC",
    classYear: "Class of 2029",
    major: "Computer Science",
    skills: [
      { name: "TypeScript", level: "Avanzado" },
      { name: "React", level: "Avanzado" },
      { name: "Next.js", level: "Intermedio" },
      { name: "Python", level: "Intermedio" },
      { name: "SQL", level: "Intermedio" },
    ],
    location: "Lima, Perú",
    openToWork: true,
  } satisfies Person),
  about:
    "Estudiante de Ingeniería de Software interesada en construir productos que conecten comunidades. Formé parte del capítulo LEAD Perú y ahora busco conectar mi experiencia con nuevas oportunidades en tecnología.",
  experience: [
    { role: "Software Engineering Intern", company: "LEAD Perú · Tech", period: "Verano 2026" },
    { role: "Chapter Tech Lead", company: "LEAD Perú", period: "2025 – 2026" },
  ],
  education: [
    { school: "UTEC", degree: "B.S. Computer Science", period: "2025 – 2029" },
    { school: "Colegio de Alto Rendimiento", degree: "Bachillerato", period: "2019 – 2024" },
  ],
  languages: [
    { name: "Español", level: "Nativo" },
    { name: "Inglés", level: "Profesional" },
    { name: "Portugués", level: "Conversacional" },
  ],
  workAuth: "Autorización de trabajo en Perú",
  availability: "Disponible para internship · Verano 2027",
  githubUrl: "https://github.com/valeriamendoza",
  linkedinUrl: "https://linkedin.com/in/valeriamendoza",
  contactEmail: "valeria.mendoza@example.com",
  leadRole: "Tech Lead",
  leadChapter: "LEAD Perú",
  validationStatus: "pending",
  areasOfInterest: ["Software Engineering", "Data", "Product"],
  gender: "Mujer",
  cv: { uploaded: true, name: "resume-valeria.pdf" },
};

export const resources = [
  { title: "Biblioteca de recursos", description: "Guías, plantillas y conocimiento de la comunidad", href: "/recursos" },
  { title: "Base de conocimiento", description: "Preguntas frecuentes y documentos oficiales", href: "/recursos" },
  { title: "Programas y becas", description: "Oportunidades de financiamiento y programas", href: "/recursos" },
];

export const socials = [
  { name: "Instagram", handle: "@lead_americas", href: "https://www.instagram.com/lead_americas/" },
  { name: "LinkedIn", handle: "LEAD", href: "https://www.linkedin.com/company/leadmindsetorg/" },
  { name: "Slack", handle: "LEAD Workspace", href: "https://join.slack.com/t/leadmindsetworkspace/shared_invite/zt-3k9782iqo-lm1xNxkptWdSbkkXOR5mvg" },
];