import { z } from 'zod'
import {
  FUNDING_BUDGET_CATEGORIES,
  FUNDING_OKR_KEYS,
  FUNDING_PILLAR_KEYS,
  FUNDING_REQUEST_STATUSES,
  FUNDING_SOURCE_KEYS,
} from '@/lib/services/funding.service'

export const FundingBudgetItemSchema = z.object({
  label: z.string().trim().min(1).max(160),
  category: z.enum(FUNDING_BUDGET_CATEGORIES),
  amount: z.coerce.number().positive(),
  notes: z.string().trim().max(500).optional().nullable(),
})

export const FundingRequestInputSchema = z.object({
  eventId: z.string().uuid().optional().nullable(),
  title: z.string().trim().min(1).max(180),
  purpose: z.string().trim().min(1).max(2000),
  expectedAudience: z.string().trim().min(1).max(500),
  expectedAttendeeCount: z.coerce.number().int().nonnegative().optional().nullable(),
  requestedAmount: z.coerce.number().positive(),
  currency: z.enum(['PEN', 'USD']).default('PEN'),
  eventDate: z.string().trim().min(1),
  okrKeys: z.array(z.enum(FUNDING_OKR_KEYS)).min(1),
  pillarKeys: z.array(z.enum(FUNDING_PILLAR_KEYS)).min(1),
  partnerName: z.string().trim().max(180).optional().nullable(),
  partnerDetails: z.string().trim().max(1000).optional().nullable(),
  supportingNotes: z.string().trim().max(2000).optional().nullable(),
  budgetItems: z.array(FundingBudgetItemSchema).min(1),
})

export const SaveFundingRequestSchema = FundingRequestInputSchema.extend({
  requestId: z.string().uuid(),
})

export const SubmitFundingRequestSchema = z.object({
  requestId: z.string().uuid(),
})

export const AdminFundingStatusFilterSchema = z.object({
  status: z.enum([...FUNDING_REQUEST_STATUSES, 'all']).optional().nullable(),
})

export const ReviewFundingRequestSchema = z.object({
  requestId: z.string().uuid(),
  decision: z.enum(['approve_full', 'approve_partial', 'request_changes', 'reject']),
  approvedAmount: z.coerce.number().positive().optional().nullable(),
  note: z.string().trim().max(1000).optional().nullable(),
  fundingSource: z.enum(FUNDING_SOURCE_KEYS).optional().nullable(),
})

export const FundingSourceSchema = z.object({
  requestId: z.string().uuid(),
  fundingSource: z.enum(FUNDING_SOURCE_KEYS).optional().nullable(),
  fundingSourceNote: z.string().trim().max(1000).optional().nullable(),
})

export const FundingAccountabilitySchema = z.object({
  requestId: z.string().uuid(),
  actualSpendAmount: z.coerce.number().nonnegative().optional().nullable(),
  accountabilityNote: z.string().trim().max(2000).optional().nullable(),
  resultSummary: z.string().trim().max(2000).optional().nullable(),
  markReceiptsDue: z.coerce.boolean().optional(),
})

export const CloseFundingRequestSchema = z.object({
  requestId: z.string().uuid(),
  closureNote: z.string().trim().max(1000).optional().nullable(),
})

