'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Icons } from '@/components/ui/icons'
import {
  FUNDING_BUDGET_CATEGORIES,
  FUNDING_OKR_KEYS,
  FUNDING_PILLAR_KEYS,
  type FundingBudgetCategory,
  type FundingOkrKey,
  type FundingPillarKey,
} from '@/lib/services/funding.service'
import {
  FUNDING_BUDGET_CATEGORY_LABELS,
  FUNDING_OKR_LABELS,
  FUNDING_PILLAR_LABELS,
  formatFundingCurrency,
  isLateFundingDate,
} from '@/lib/funding-display'
import {
  createFundingDraft,
  saveFundingDraft,
  submitFundingRequest,
} from '@/lib/actions/funding/requests'
import type {
  FundingBudgetItemRow,
  FundingRequestRow,
} from '@/lib/services/funding.service'

type EventOption = {
  id: string
  title: string
  start_at: string
}

type BudgetDraft = {
  label: string
  category: FundingBudgetCategory
  amount: string
  notes: string
}

type FundingRequestFormInitial = {
  request: FundingRequestRow
  budgetItems: FundingBudgetItemRow[]
}

const INITIAL_BUDGET_ITEM: BudgetDraft = {
  label: '',
  category: 'event_materials',
  amount: '',
  notes: '',
}
const NO_EVENT_VALUE = 'no-event'

function toDateInputValue(value: string) {
  return new Date(value).toISOString().slice(0, 10)
}

function toggleValue<T extends string>(values: T[], value: T) {
  return values.includes(value)
    ? values.filter(item => item !== value)
    : [...values, value]
}

export function FundingRequestForm({
  events,
  initial,
}: {
  events: EventOption[]
  initial?: FundingRequestFormInitial
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [eventId, setEventId] = useState(initial?.request.event_id ?? '')
  const [title, setTitle] = useState(initial?.request.title ?? '')
  const [purpose, setPurpose] = useState(initial?.request.purpose ?? '')
  const [expectedAudience, setExpectedAudience] = useState(initial?.request.expected_audience ?? '')
  const [expectedAttendeeCount, setExpectedAttendeeCount] = useState(
    initial?.request.expected_attendee_count?.toString() ?? ''
  )
  const [requestedAmount, setRequestedAmount] = useState(
    initial?.request.requested_amount == null ? '' : String(initial.request.requested_amount)
  )
  const [eventDate, setEventDate] = useState(initial?.request.event_date ?? '')
  const [partnerName, setPartnerName] = useState(initial?.request.partner_name ?? '')
  const [partnerDetails, setPartnerDetails] = useState(initial?.request.partner_details ?? '')
  const [supportingNotes, setSupportingNotes] = useState(initial?.request.supporting_notes ?? '')
  const [okrKeys, setOkrKeys] = useState<FundingOkrKey[]>((initial?.request.okr_keys ?? []) as FundingOkrKey[])
  const [pillarKeys, setPillarKeys] = useState<FundingPillarKey[]>((initial?.request.pillar_keys ?? []) as FundingPillarKey[])
  const [budgetItems, setBudgetItems] = useState<BudgetDraft[]>(
    initial?.budgetItems.length
      ? initial.budgetItems.map(item => ({
          label: item.label,
          category: item.category as FundingBudgetCategory,
          amount: String(item.amount),
          notes: item.notes ?? '',
        }))
      : [{ ...INITIAL_BUDGET_ITEM }]
  )

  const requested = Number(requestedAmount || 0)
  const budgetTotal = useMemo(
    () => budgetItems.reduce((sum, item) => sum + Number(item.amount || 0), 0),
    [budgetItems]
  )
  const budgetDiff = Math.round((requested - budgetTotal) * 100) / 100
  const isLate = isLateFundingDate(eventDate)

  function handleEventChange(nextEventId: string) {
    const selectedEventId = nextEventId === NO_EVENT_VALUE ? '' : nextEventId
    setEventId(selectedEventId)
    if (!selectedEventId) return
    const selected = events.find(event => event.id === selectedEventId)
    if (!selected) return
    setEventDate(toDateInputValue(selected.start_at))
    if (!title.trim()) setTitle(selected.title)
  }

  function updateBudgetItem(index: number, patch: Partial<BudgetDraft>) {
    setBudgetItems(items =>
      items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...patch } : item
      )
    )
  }

  function addBudgetItem() {
    setBudgetItems(items => [...items, { ...INITIAL_BUDGET_ITEM }])
  }

  function removeBudgetItem(index: number) {
    setBudgetItems(items => items.length === 1 ? items : items.filter((_, itemIndex) => itemIndex !== index))
  }

  function buildPayload() {
    return {
      eventId: eventId || null,
      title,
      purpose,
      expectedAudience,
      expectedAttendeeCount: expectedAttendeeCount ? Number(expectedAttendeeCount) : null,
      requestedAmount: Number(requestedAmount),
      currency: 'PEN' as const,
      eventDate,
      okrKeys,
      pillarKeys,
      partnerName: partnerName || null,
      partnerDetails: partnerDetails || null,
      supportingNotes: supportingNotes || null,
      budgetItems: budgetItems.map(item => ({
        label: item.label,
        category: item.category,
        amount: Number(item.amount),
        notes: item.notes || null,
      })),
    }
  }

  function submitFlow(shouldSubmit: boolean) {
    startTransition(() => {
      void (async () => {
        const payload = buildPayload()
        const draftResult = initial
          ? await saveFundingDraft({ ...payload, requestId: initial.request.id })
          : await createFundingDraft(payload)
        if (!draftResult.success) {
          toast.error(draftResult.error)
          return
        }

        if (shouldSubmit) {
          const submitResult = await submitFundingRequest({ requestId: draftResult.requestId })
          if (!submitResult.success) {
            toast.error(submitResult.error)
            router.push('/chapter/funding')
            return
          }
          toast.success('Solicitud enviada a revisión.')
        } else {
          toast.success('Borrador guardado.')
        }

        router.push('/chapter/funding')
        router.refresh()
      })()
    })
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="space-y-5">
        <Card>
          <CardHeader>
            <CardTitle>Contexto de la solicitud</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="event">Evento vinculado <span className="text-muted-foreground">(opcional)</span></Label>
              <Select value={eventId || NO_EVENT_VALUE} onValueChange={handleEventChange}>
                <SelectTrigger id="event" className="w-full">
                  <SelectValue placeholder="Iniciativa sin evento vinculado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_EVENT_VALUE}>Iniciativa sin evento vinculado</SelectItem>
                {events.map(event => (
                  <SelectItem key={event.id} value={event.id}>
                    {event.title}
                  </SelectItem>
                ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="title">Evento o iniciativa <span className="text-primary">*</span></Label>
              <Input id="title" value={title} onChange={(event) => setTitle(event.target.value)} />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="purpose">Propósito <span className="text-primary">*</span></Label>
              <Textarea
                id="purpose"
                value={purpose}
                onChange={(event) => setPurpose(event.target.value)}
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="eventDate">Fecha <span className="text-primary">*</span></Label>
              <Input
                id="eventDate"
                type="date"
                value={eventDate}
                onChange={(event) => setEventDate(event.target.value)}
              />
              {isLate && (
                <p className="text-xs text-warning">
                  Solicitud tardía: faltan menos de 14 días. Se puede enviar, pero puede requerir revisión especial.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="attendees">Asistencia esperada <span className="text-muted-foreground">(opcional)</span></Label>
              <Input
                id="attendees"
                inputMode="numeric"
                value={expectedAttendeeCount}
                onChange={(event) => setExpectedAttendeeCount(event.target.value)}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="audience">Audiencia objetivo <span className="text-primary">*</span></Label>
              <Input
                id="audience"
                value={expectedAudience}
                onChange={(event) => setExpectedAudience(event.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Alineación con LEAD</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-3">
              <Label>OKRs relacionados <span className="text-primary">*</span></Label>
              <div className="grid gap-2 sm:grid-cols-2">
                {FUNDING_OKR_KEYS.map(key => (
                  <label key={key} className="flex items-center gap-2 rounded-md border border-border/60 p-3 text-sm">
                    <Checkbox
                      checked={okrKeys.includes(key)}
                      onCheckedChange={() => setOkrKeys(values => toggleValue(values, key))}
                    />
                    <span>{FUNDING_OKR_LABELS[key]}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label>Pilares relacionados <span className="text-primary">*</span></Label>
              <div className="grid gap-2 sm:grid-cols-2">
                {FUNDING_PILLAR_KEYS.map(key => (
                  <label key={key} className="flex items-center gap-2 rounded-md border border-border/60 p-3 text-sm">
                    <Checkbox
                      checked={pillarKeys.includes(key)}
                      onCheckedChange={() => setPillarKeys(values => toggleValue(values, key))}
                    />
                    <span>{FUNDING_PILLAR_LABELS[key]}</span>
                  </label>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Desglose del presupuesto</CardTitle>
            <Button type="button" variant="outline" onClick={addBudgetItem} className="w-full sm:w-auto">
              <Icons.Plus className="mr-2 h-4 w-4" />
              Agregar ítem
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-[1fr_12rem]">
              <div className="space-y-2">
                <Label htmlFor="amount">Monto solicitado <span className="text-primary">*</span></Label>
                <Input
                  id="amount"
                  inputMode="decimal"
                  value={requestedAmount}
                  onChange={(event) => setRequestedAmount(event.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div className="rounded-md border border-border/60 p-3">
                <p className="text-xs text-muted-foreground">Total de ítems</p>
                <p className="text-lg font-semibold">{formatFundingCurrency(budgetTotal)}</p>
                <p className={budgetDiff === 0 ? 'text-xs text-success' : 'text-xs text-warning'}>
                  {budgetDiff === 0 ? 'Cuadra con el monto' : `${formatFundingCurrency(Math.abs(budgetDiff))} por ajustar`}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {budgetItems.map((item, index) => (
                <div key={index} className="grid gap-3 rounded-md border border-border/60 p-3 md:grid-cols-[minmax(0,1fr)_13rem_8rem_auto]">
                  <div className="space-y-2">
                    <Label htmlFor={`budget-label-${index}`}>Ítem <span className="text-primary">*</span></Label>
                    <Input
                      id={`budget-label-${index}`}
                      value={item.label}
                      onChange={(event) => updateBudgetItem(index, { label: event.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`budget-category-${index}`}>Tipo</Label>
                    <Select
                      value={item.category}
                      onValueChange={(value) => updateBudgetItem(index, { category: value as FundingBudgetCategory })}
                    >
                      <SelectTrigger id={`budget-category-${index}`} className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                      {FUNDING_BUDGET_CATEGORIES.map(category => (
                        <SelectItem key={category} value={category}>
                          {FUNDING_BUDGET_CATEGORY_LABELS[category]}
                        </SelectItem>
                      ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`budget-amount-${index}`}>Monto</Label>
                    <Input
                      id={`budget-amount-${index}`}
                      inputMode="decimal"
                      value={item.amount}
                      onChange={(event) => updateBudgetItem(index, { amount: event.target.value })}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeBudgetItem(index)}
                      disabled={budgetItems.length === 1}
                      aria-label="Quitar ítem"
                    >
                      <Icons.Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contexto adicional</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="partner">Partner externo <span className="text-muted-foreground">(opcional)</span></Label>
              <Input id="partner" value={partnerName} onChange={(event) => setPartnerName(event.target.value)} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="partnerDetails">Detalle del partner <span className="text-muted-foreground">(opcional)</span></Label>
              <Textarea id="partnerDetails" value={partnerDetails} onChange={(event) => setPartnerDetails(event.target.value)} rows={3} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="notes">Notas adicionales <span className="text-muted-foreground">(opcional)</span></Label>
              <Textarea id="notes" value={supportingNotes} onChange={(event) => setSupportingNotes(event.target.value)} rows={3} />
            </div>
          </CardContent>
        </Card>
      </div>

      <aside className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Reglas rápidas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>Normalmente califica comida moderada, materiales, decoración mínima y recursos de aprendizaje.</p>
            <p>Giveaways, gastos personales, merch no aprobado y transporte normal no califican por defecto.</p>
            <p>Después del evento se esperan comprobantes, evidencia y una breve reflexión de impacto.</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3 pt-6">
            <Button
              type="button"
              className="w-full"
              onClick={() => submitFlow(true)}
              disabled={isPending}
            >
              {isPending ? <Icons.Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Enviar solicitud
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => submitFlow(false)}
              disabled={isPending}
            >
              Guardar borrador
            </Button>
          </CardContent>
        </Card>
      </aside>
    </div>
  )
}
