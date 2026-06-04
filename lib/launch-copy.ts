const EVENT_TITLE_LABELS: Record<string, string> = {
  'AI & Innovation Panel': 'Panel de IA e innovacion',
  'Product Design Sprint': 'Sprint de diseno de producto',
  'Career Readiness Clinic': 'Clinica de empleabilidad',
  'QA Pathway Event: AI Career Sprint': 'Evento QA Pathway: Sprint de carrera en IA',
  'Public Speaking Lab': 'Laboratorio de comunicacion publica',
  'Community Impact Challenge': 'Reto de impacto comunitario',
  'UX Research Workshop': 'Taller de investigacion UX',
}

const PROFILE_FOCUS_LABELS: Record<string, string> = {
  'Data and public policy': 'Datos y politicas publicas',
  'Industrial Engineering': 'Ingenieria industrial',
  'Software Engineering': 'Ingenieria de software',
  'Computer Science': 'Ciencias de la computacion',
}

export function presentLaunchEventTitle(title: string) {
  return EVENT_TITLE_LABELS[title] ?? title
}

export function presentLaunchProfileFocus(focus: string | null | undefined) {
  if (!focus) return null
  return PROFILE_FOCUS_LABELS[focus] ?? focus
}
