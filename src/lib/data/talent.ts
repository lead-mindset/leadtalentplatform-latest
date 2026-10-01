export type Talent = {
  id: string;
  name: string;
  initials: string;
  avatarColor: string;
  headline: string;
  school: string;
  graduation: string;
  location: string;
  country: string;
  chapter: string;
  area: string;
  skills: { name: string; level: string }[];
  languages: { name: string; level: string }[];
  workAuth: string;
  availability: string;
  availabilityType: "Internship" | "Full-time";
  verified: boolean;
};

export const talent: Talent[] = [
  {
    id: "t1",
    area: "Software",
    name: "Andrea Vargas",
    initials: "AV",
    avatarColor: "brand-purple",
    headline: "Software engineer",
    school: "Universidad de los Andes",
    graduation: "2028",
    location: "Bogotá",
    country: "Colombia",
    chapter: "LEAD Colombia",
    skills: [
      { name: "Java", level: "Avanzado" },
      { name: "AWS", level: "Avanzado" },
      { name: "System Design", level: "Avanzado" },
      { name: "Kotlin", level: "Intermedio" },
    ],
    languages: [
      { name: "Español", level: "Nativo" },
      { name: "Inglés", level: "Profesional" },
    ],
    workAuth: "Autorización de trabajo en Colombia",
    availability: "Disponible · Tiempo completo 2028",
    availabilityType: "Full-time",
    verified: true,
  },
  {
    id: "t2",
    area: "Data",
    name: "Lucía Campos",
    initials: "LC",
    avatarColor: "brand-orange",
    headline: "Data scientist",
    school: "ITESM",
    graduation: "2027",
    location: "Monterrey",
    country: "México",
    chapter: "LEAD México",
    skills: [
      { name: "Python", level: "Avanzado" },
      { name: "Machine Learning", level: "Avanzado" },
      { name: "SQL", level: "Avanzado" },
      { name: "Pandas", level: "Avanzado" },
    ],
    languages: [
      { name: "Español", level: "Nativo" },
      { name: "Inglés", level: "Profesional" },
    ],
    workAuth: "Remoto desde México",
    availability: "Disponible · Internship 2027",
    availabilityType: "Internship",
    verified: true,
  },
  {
    id: "t3",
    area: "Business",
    name: "Mateo Ríos",
    initials: "MR",
    avatarColor: "brand-rose",
    headline: "Estudiante de Economía",
    school: "PUCP",
    graduation: "2029",
    location: "Lima",
    country: "Perú",
    chapter: "LEAD Perú",
    skills: [
      { name: "Data Analysis", level: "Intermedio" },
      { name: "Econometrics", level: "Intermedio" },
      { name: "Stata", level: "Intermedio" },
    ],
    languages: [
      { name: "Español", level: "Nativo" },
      { name: "Inglés", level: "Profesional" },
      { name: "Portugués", level: "Conversacional" },
    ],
    workAuth: "Autorización de trabajo en Perú",
    availability: "Disponible · Internship 2029",
    availabilityType: "Internship",
    verified: true,
  },
  {
    id: "t4",
    area: "Product & Design",
    name: "Camila Rojas",
    initials: "CR",
    avatarColor: "brand-purple",
    headline: "Product designer",
    school: "EPN",
    graduation: "2027",
    location: "Quito",
    country: "Ecuador",
    chapter: "LEAD Ecuador",
    skills: [
      { name: "Figma", level: "Avanzado" },
      { name: "Design Systems", level: "Avanzado" },
      { name: "Prototyping", level: "Avanzado" },
    ],
    languages: [
      { name: "Español", level: "Nativo" },
      { name: "Inglés", level: "Profesional" },
    ],
    workAuth: "Autorización de trabajo en Ecuador",
    availability: "Disponible · Tiempo completo 2027",
    availabilityType: "Full-time",
    verified: true,
  },
  {
    id: "t5",
    area: "Software",
    name: "Gabriela Torres",
    initials: "GT",
    avatarColor: "brand-rose",
    headline: "Estudiante de Ingeniería de Software",
    school: "UTEC",
    graduation: "2028",
    location: "Lima",
    country: "Perú",
    chapter: "LEAD Perú",
    skills: [
      { name: "Python", level: "Avanzado" },
      { name: "React", level: "Avanzado" },
      { name: "ML", level: "Intermedio" },
    ],
    languages: [
      { name: "Español", level: "Nativo" },
      { name: "Inglés", level: "Profesional" },
    ],
    workAuth: "Remoto desde Perú",
    availability: "Disponible · Internship 2028",
    availabilityType: "Internship",
    verified: true,
  },
  {
    id: "t6",
    area: "Data",
    name: "Iván Quispe",
    initials: "IQ",
    avatarColor: "brand-red",
    headline: "Estudiante de IA",
    school: "UNAM",
    graduation: "2029",
    location: "Ciudad de México",
    country: "México",
    chapter: "LEAD México",
    skills: [
      { name: "Python", level: "Avanzado" },
      { name: "Deep Learning", level: "Avanzado" },
    ],
    languages: [
      { name: "Español", level: "Nativo" },
      { name: "Inglés", level: "Profesional" },
    ],
    workAuth: "Remoto desde México",
    availability: "Disponible · Tiempo completo 2029",
    availabilityType: "Full-time",
    verified: true,
  },
];