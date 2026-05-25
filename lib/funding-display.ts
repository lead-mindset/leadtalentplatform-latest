import type {
  FundingBudgetCategory,
  FundingFileType,
  FundingOkrKey,
  FundingPillarKey,
  FundingRequestStatus,
  FundingSourceKey,
} from '@/lib/services/funding.service'

export const FUNDING_STATUS_LABELS: Record<FundingRequestStatus, string> = {
  draft: 'Borrador',
  submitted: 'En revision',
  changes_requested: 'Cambios solicitados',
  approved: 'Aprobada',
  rejected: 'Rechazada',
  receipts_due: 'Comprobantes pendientes',
  closed: 'Cerrada',
}

export const FUNDING_STATUS_HELPER: Record<FundingRequestStatus, string> = {
  draft: 'Aun no fue enviada a revision.',
  submitted: 'Admin/finanzas debe revisarla.',
  changes_requested: 'Necesita ajustes antes de reenviar.',
  approved: 'Lista para seguimiento posterior al evento.',
  rejected: 'No fue aprobada en esta revision.',
  receipts_due: 'Falta regularizar comprobantes o evidencia.',
  closed: 'Solicitud regularizada y cerrada.',
}

export const FUNDING_OKR_LABELS: Record<FundingOkrKey, string> = {
  inspire: 'Inspire',
  unite: 'Unite',
  empower: 'Empower',
  elevate: 'Elevate',
}

export const FUNDING_PILLAR_LABELS: Record<FundingPillarKey, string> = {
  lead_academia: 'LEAD Academia',
  academic_excellence: 'Excelencia academica',
  womens_excellence: 'Excelencia femenina',
  professional_development: 'Desarrollo profesional',
  leadership_development: 'Liderazgo',
  community_outreach: 'Impacto comunitario',
  chapter_development: 'Desarrollo de chapter',
}

export const FUNDING_BUDGET_CATEGORY_LABELS: Record<FundingBudgetCategory, string> = {
  food_refreshments: 'Comida o refreshments',
  event_materials: 'Materiales del evento',
  minimal_decorations: 'Decoracion minima',
  learning_materials: 'Materiales de aprendizaje',
  recognition_items: 'Certificados o reconocimientos',
  software_platforms: 'Software o plataforma',
  speaker_support: 'Apoyo a ponente',
  transportation_exception: 'Transporte excepcional',
  other: 'Otro',
}

export const FUNDING_SOURCE_LABELS: Record<FundingSourceKey, string> = {
  lead_peru_chapter_budget: 'Budget de chapters LEAD Peru',
  lead_wide_event_budget: 'Budget de evento LEAD-wide',
  sponsor_partner: 'Sponsor o partner',
  hola_benevity: 'HOLA/Benevity o volunteer matching',
  other: 'Otra fuente',
}

export const FUNDING_FILE_TYPE_LABELS: Record<FundingFileType, string> = {
  supporting_material: 'Material de soporte',
  receipt: 'Comprobante',
  evidence: 'Evidencia',
}

export function formatFundingCurrency(value: number | string | null, currency = 'PEN') {
  const amount = Number(value ?? 0)
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0)
}

export function formatFundingDate(value: string | null) {
  if (!value) return 'Sin fecha'
  return new Intl.DateTimeFormat('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${value}T00:00:00`))
}

export function isLateFundingDate(value: string) {
  if (!value) return false
  const eventDate = new Date(`${value}T00:00:00`)
  if (Number.isNaN(eventDate.getTime())) return false
  return (eventDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000) < 14
}
