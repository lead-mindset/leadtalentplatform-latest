export type Opportunity = {
  id: string;
  title: string;
  description: string;
  type: string;
  open: boolean;
};

export const opportunities: Opportunity[] = [
  {
    id: "op-1",
    title: "Programa de Mentoría",
    description: "Conéctate 1:1 con mentores de la industria que ya recorrieron tu camino.",
    type: "Mentoría",
    open: true,
  },
  {
    id: "op-2",
    title: "Becas LEAD",
    description: "Apoyo financiero para conferencias, eventos y certificaciones.",
    type: "Beca",
    open: true,
  },
  {
    id: "op-3",
    title: "Programa de Embajadores",
    description: "Representa a LEAD en tu universidad y lidera tu comunidad.",
    type: "Programa",
    open: false,
  },
  {
    id: "op-4",
    title: "Talleres de preparación",
    description: "Entrevistas técnicas, CV, LinkedIn y portafolio con expertos.",
    type: "Taller",
    open: true,
  },
  {
    id: "op-5",
    title: "Bootcamp de proyectos",
    description: "Construye un proyecto real en equipo con feedback de la industria.",
    type: "Programa",
    open: true,
  },
];

export type Resource = { title: string; description: string };
export type ResourceCategory = { name: string; items: Resource[] };

export const resourceCategories: ResourceCategory[] = [
  {
    name: "Guías",
    items: [
      { title: "Cómo armar tu portafolio de datos", description: "De Lucía Campos · para no perderte sin experiencia laboral" },
      { title: "Guía de entrevistas técnicas", description: "Patrones, práctica y qué esperar en una entrevista SWE" },
      { title: "CV que destaca frente a recruiters", description: "Estructura y ejemplos de la comunidad" },
    ],
  },
  {
    name: "Base de conocimiento",
    items: [
      { title: "¿Qué es LEAD?", description: "La comunidad, su propósito y cómo funciona el talent network" },
      { title: "Prácticas y trabajo en LATAM", description: "Actualizaciones para estudiantes en la región" },
      { title: "Grupos oficiales", description: "Canales de la comunidad y cómo unirte" },
    ],
  },
  {
    name: "Plantillas",
    items: [
      { title: "Plantilla de LinkedIn", description: "Headline y resumen listos para personalizar" },
      { title: "Plantilla de CV", description: "Formato limpio compatible con ATS" },
      { title: "Plantilla de pitch de proyecto", description: "Presenta tu proyecto en 60 segundos" },
    ],
  },
];