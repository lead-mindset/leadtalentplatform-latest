import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types'

const RANDOM_MIN = 100001
const RANDOM_MAX = 999999
export const MAX_RETRIES = 10

export function generateRandomNumber(): number {
  return Math.floor(Math.random() * (RANDOM_MAX - RANDOM_MIN + 1)) + RANDOM_MIN
}

export function formatMemberId(number: number): string {
  return `LEAD-${number.toString().padStart(6, '0')}` 
}

async function isMemberIdUnique(
  supabase: SupabaseClient<Database>,
  memberId: string
): Promise<boolean> {
  const { data: cmData, error: cmError } = await supabase
    .from('chapter_membership')
    .select('member_id')
    .eq('member_id', memberId)
    .maybeSingle()

  if (cmData) return false

  const { data: ppData, error: ppError } = await supabase
    .from('person_profile')
    .select('lead_id')
    .eq('lead_id', memberId)
    .maybeSingle()

  if (ppData) return false

  if (cmError && cmError.code !== 'PGRST116') {
    console.error('Error checking member ID uniqueness (chapter_membership):', cmError)
  }
  if (ppError && ppError.code !== 'PGRST116') {
    console.error('Error checking member ID uniqueness (person_profile):', ppError)
  }

  return true
}

export async function generateUniqueMemberId(supabase: SupabaseClient<Database>): Promise<string> {
  let attempts = 0

  while (attempts < MAX_RETRIES) {
    const randomNumber = generateRandomNumber()
    const memberId = formatMemberId(randomNumber)
    const isUnique = await isMemberIdUnique(supabase, memberId)

    if (isUnique) {
      console.log(`Member ID generated after ${attempts + 1} attempt(s): ${memberId}`)
      return memberId
    }

    attempts++
    console.warn(`Member ID collision for ${memberId}, retrying... (${attempts}/${MAX_RETRIES})`)
  }

  console.error(`Failed to generate unique member ID after ${MAX_RETRIES} attempts`)
  throw new Error('Could not generate a member ID — please try again.')
}

export function isValidMemberId(memberId: string): boolean {
  const regex = /^LEAD-\d{6}$/
  if (!regex.test(memberId)) return false
  
  const number = parseInt(memberId.split('-')[1], 10)
  return number >= RANDOM_MIN && number <= RANDOM_MAX
}

export function extractMemberNumber(memberId: string): number | null {
  if (!isValidMemberId(memberId)) return null
  return parseInt(memberId.split('-')[1], 10)
}
