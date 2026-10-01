import type { Person } from "./people";

export type Post = {
  id: string;
  author: Person;
  timeAgo: string;
  body: string;
  action?: { label: string; href: string };
  pinned?: boolean;
};

export const posts: Post[] = [
  {
    id: "post-1",
    author: {
      id: "lead",
      name: "LEAD Perú",
      initials: "LP",
      avatarColor: "brand-purple",
      headline: "Comunidad LEAD",
      school: "",
      classYear: "",
      major: "",
      skills: [],
      location: "",
      openToWork: false,
    },
    timeAgo: "hace 2 horas",
    body: "📢 ¡Más de 100 estudiantes de secundaria, múltiples colegios de Lima, 13 capítulos universitarios y más de 70 voluntarios! Así fue el Discover Day 2026 en UTEC. Ya estamos pensando en el Discover Day 2027 🚀 #LEAD #DiscoverDay #TalentPipeline",
    action: { label: "Ver evento", href: "/eventos" },
    pinned: true,
  },
  {
    id: "post-2",
    author: {
      id: "lead-am",
      name: "LEAD América",
      initials: "LA",
      avatarColor: "brand-rose",
      headline: "Expansión Colombia",
      school: "",
      classYear: "",
      major: "",
      skills: [],
      location: "",
      openToWork: false,
    },
    timeAgo: "hace 1 día",
    body: "¡LEAD llegó a Colombia! 🇨🇴 Organizamos el primer evento universitario, LEAD Future, en la Universidad Santo Tomás y lanzamos un nuevo capítulo en la Pontificia Universidad Javeriana. Del Perú al mundo. #LEADColombia #Liderazgo",
  },
  {
    id: "post-3",
    author: {
      id: "utp",
      name: "LEAD UTP",
      initials: "UT",
      avatarColor: "brand-orange",
      headline: "Capítulo UTP",
      school: "",
      classYear: "",
      major: "",
      skills: [],
      location: "",
      openToWork: false,
    },
    timeAgo: "hace 3 días",
    body: "El equipo UTP representó a LEAD en el RAISE Summit Hackathon en París con ContextCore, una memoria compartida para agentes de IA. ¡Orgullo UTP! #OrgulloUTP #IA",
  },
];

export type LeadEvent = {
  id: string;
  month: string;
  day: string;
  title: string;
  location: string;
  type: "Workshop" | "Panel" | "Networking" | "Charla";
  description: string;
  date: string;
  time: string;
  host: string;
  calendar: string;
  image?: string;
};

export const events: LeadEvent[] = [
  {
    id: "ev-1",
    month: "OCT",
    day: "06",
    title: "Workshop de entrevistas técnicas",
    location: "Virtual · Zoom",
    type: "Workshop",
    description: "Practica entrevistas técnicas con ingenieros de Google. Trae tus dudas y un problema preparado.",
    date: "2026-10-06",
    time: "18:00",
    host: "LEAD Perú · Tech",
    calendar: "LEAD Perú",
  },
  {
    id: "ev-2",
    month: "OCT",
    day: "12",
    title: "Panel: Mujeres en Tecnología",
    location: "LEAD Perú · Lima",
    type: "Panel",
    description: "Mujeres líderes de la industria comparten sus trayectorias y cómo navegar el tech desde LATAM.",
    date: "2026-10-12",
    time: "17:00",
    host: "LEAD Perú",
    calendar: "LEAD Perú",
  },
  {
    id: "ev-3",
    month: "OCT",
    day: "19",
    title: "Networking con empresas",
    location: "EPN",
    type: "Networking",
    description: "Conecta directamente con recruiters de empresas que buscan talento LEAD.",
    date: "2026-10-19",
    time: "15:00",
    host: "LEAD América",
    calendar: "LEAD Ecuador",
  },
  {
    id: "ev-4",
    month: "NOV",
    day: "03",
    title: "Charla: cómo armar tu portafolio",
    location: "Virtual · Zoom",
    type: "Charla",
    description: "Aprende a mostrar tus proyectos de la mejor forma para que las empresas te encuentren.",
    date: "2026-11-03",
    time: "19:00",
    host: "LEAD Perú",
    calendar: "LEAD Global",
  },
  {
    id: "ev-5",
    month: "NOV",
    day: "09",
    title: "Workshop de CV y LinkedIn",
    location: "LEAD Perú · Lima",
    type: "Workshop",
    description: "Optimiza tu currículum y perfil para destacar frente a recruiters.",
    date: "2026-11-09",
    time: "18:30",
    host: "LEAD Perú · Carrera",
    calendar: "LEAD Perú",
  },
  {
    id: "ev-6",
    month: "NOV",
    day: "15",
    title: "Hackathon LEAD 2026",
    location: "Virtual + Presencial",
    type: "Networking",
    description: "48 horas para construir algo increíble con otros miembros de la comunidad.",
    date: "2026-11-15",
    time: "09:00",
    host: "LEAD Global",
    calendar: "LEAD Global",
    image: "https://picsum.photos/seed/lead-hackathon/400/300",
  },
  {
    id: "ev-7",
    month: "OCT",
    day: "10",
    title: "AI Workshop: construyendo con agentes",
    location: "Ciudad de México · Híbrido",
    type: "Workshop",
    description: "Introducción práctica a agentes de IA y cómo aplicarlos en proyectos reales.",
    date: "2026-10-10",
    time: "17:00",
    host: "LEAD México",
    calendar: "LEAD México",
    image: "https://picsum.photos/seed/lead-ai/400/300",
  },
  {
    id: "ev-8",
    month: "OCT",
    day: "23",
    title: "Coffee Chat CS",
    location: "EPN",
    type: "Networking",
    description: "Café y networking relajado entre estudiantes de computación de Quito.",
    date: "2026-10-23",
    time: "16:00",
    host: "LEAD Ecuador",
    calendar: "LEAD Ecuador",
    image: "https://picsum.photos/seed/lead-coffee/400/300",
  },
  {
    id: "ev-9",
    month: "NOV",
    day: "07",
    title: "Día de la comunidad LEAD",
    location: "Virtual · Todas las regiones",
    type: "Charla",
    description: "Celebración anual de la comunidad LEAD en todas las regiones.",
    date: "2026-11-07",
    time: "12:00",
    host: "LEAD América",
    calendar: "LEAD América",
    image: "https://picsum.photos/seed/lead-community-day/600/400",
  },
  {
    id: "ev-10",
    month: "SEP",
    day: "14",
    title: "Workshop de introducción a React",
    location: "Virtual · Zoom",
    type: "Workshop",
    description: "Primeros pasos con React para quienes empiezan en frontend.",
    date: "2026-09-14",
    time: "18:00",
    host: "LEAD Perú · Tech",
    calendar: "LEAD Perú",
  },
  {
    id: "ev-11",
    month: "SEP",
    day: "22",
    title: "Meetup: Data Science en LATAM",
    location: "Lima · Híbrido",
    type: "Charla",
    description: "Cómo se usa data science en la industria latinoamericana hoy.",
    date: "2026-09-22",
    time: "19:00",
    host: "LEAD América",
    calendar: "LEAD América",
  },
  {
    id: "ev-12",
    month: "NOV",
    day: "21",
    title: "Discover Day 2027",
    location: "UTEC · Lima",
    type: "Networking",
    description: "Más de 100 estudiantes de secundaria, 13 capítulos universitarios y 70+ voluntarios para descubrir la educación superior.",
    date: "2026-11-21",
    time: "09:00",
    host: "LEAD Perú",
    calendar: "LEAD Perú",
    image: "https://picsum.photos/seed/lead-discover/400/300",
  },
];