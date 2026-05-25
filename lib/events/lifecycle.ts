import type { EventAccessModel, RegistrationStatus } from '@/lib/types'

export type EventLifecycleState =
  | 'registration_open'
  | 'application_required'
  | 'full'
  | 'live'
  | 'past'
  | 'registered'
  | 'pending_review'
  | 'rejected'
  | 'cancelled'
  | 'attended'
  | 'date_pending'

export type EventLifecycleBadgeVariant =
  | 'success'
  | 'info'
  | 'warning'
  | 'destructive'
  | 'outline'
  | 'neutral'
  | 'live'

export type EventLifecycleInput = {
  startAt: string | Date | null | undefined
  endAt: string | Date | null | undefined
  accessModel: EventAccessModel
  capacity?: number | null
  registeredCount?: number | null
  registrationStatus?: RegistrationStatus | null
  checkedInAt?: string | null
}

export type EventLifecycle = {
  state: EventLifecycleState
  label: string
  description: string
  badgeVariant: EventLifecycleBadgeVariant
  canRegister: boolean
  canApply: boolean
  canShowQr: boolean
  isActionable: boolean
}

function toTime(value: EventLifecycleInput['startAt']) {
  if (!value) return Number.NaN
  const date = value instanceof Date ? value : new Date(value)
  return date.getTime()
}

function isAtCapacity(capacity?: number | null, registeredCount?: number | null) {
  if (capacity === null || capacity === undefined) return false
  return (registeredCount ?? 0) >= capacity
}

export function getEventLifecycle(
  input: EventLifecycleInput,
  now: Date = new Date()
): EventLifecycle {
  const registrationStatus = input.registrationStatus ?? null

  if (registrationStatus === 'attended' || input.checkedInAt) {
    return {
      state: 'attended',
      label: 'Check-in realizado',
      description: 'Tu asistencia ya fue registrada para este evento.',
      badgeVariant: 'success',
      canRegister: false,
      canApply: false,
      canShowQr: false,
      isActionable: false,
    }
  }

  if (registrationStatus === 'registered') {
    return {
      state: 'registered',
      label: 'Registrado',
      description: 'Tu codigo QR de check-in esta listo para este evento.',
      badgeVariant: 'success',
      canRegister: false,
      canApply: false,
      canShowQr: true,
      isActionable: true,
    }
  }

  if (registrationStatus === 'pending_review') {
    return {
      state: 'pending_review',
      label: 'En revision',
      description: 'Tu postulacion fue enviada y esta esperando decision del equipo.',
      badgeVariant: 'warning',
      canRegister: false,
      canApply: false,
      canShowQr: false,
      isActionable: false,
    }
  }

  if (registrationStatus === 'rejected') {
    return {
      state: 'rejected',
      label: 'No seleccionado',
      description: 'No fuiste seleccionado para este evento.',
      badgeVariant: 'destructive',
      canRegister: false,
      canApply: false,
      canShowQr: false,
      isActionable: false,
    }
  }

  if (registrationStatus === 'cancelled') {
    return {
      state: 'cancelled',
      label: 'Cancelado',
      description: 'Tu registro esta inactivo. Puedes registrarte otra vez si el evento sigue abierto.',
      badgeVariant: 'outline',
      canRegister: false,
      canApply: false,
      canShowQr: false,
      isActionable: false,
    }
  }

  const start = toTime(input.startAt)
  const end = toTime(input.endAt)
  const current = now.getTime()

  if (!Number.isFinite(start) || !Number.isFinite(end)) {
    return {
      state: 'date_pending',
      label: 'Fecha pendiente',
      description: 'El horario del evento aun no esta disponible.',
      badgeVariant: 'outline',
      canRegister: false,
      canApply: false,
      canShowQr: false,
      isActionable: false,
    }
  }

  if (current >= start && current <= end) {
    return {
      state: 'live',
      label: 'En vivo',
      description: 'Este evento esta ocurriendo ahora.',
      badgeVariant: 'live',
      canRegister: false,
      canApply: false,
      canShowQr: false,
      isActionable: false,
    }
  }

  if (current > end) {
    return {
      state: 'past',
      label: 'Evento pasado',
      description: 'Este evento ya finalizo.',
      badgeVariant: 'outline',
      canRegister: false,
      canApply: false,
      canShowQr: false,
      isActionable: false,
    }
  }

  if (isAtCapacity(input.capacity, input.registeredCount)) {
    return {
      state: 'full',
      label: 'Lleno',
      description: 'Este evento alcanzo su capacidad actual.',
      badgeVariant: 'destructive',
      canRegister: false,
      canApply: false,
      canShowQr: false,
      isActionable: false,
    }
  }

  if (input.accessModel === 'application') {
    return {
      state: 'application_required',
      label: 'Requiere postulacion',
      description: 'Envia una postulacion para revision antes de asistir.',
      badgeVariant: 'info',
      canRegister: false,
      canApply: true,
      canShowQr: false,
      isActionable: true,
    }
  }

  return {
    state: 'registration_open',
    label: 'Registro abierto',
    description: 'El registro esta abierto para este proximo evento.',
    badgeVariant: 'success',
    canRegister: true,
    canApply: false,
    canShowQr: false,
    isActionable: true,
  }
}

