const RANDOM_MIN = 100001
const RANDOM_MAX = 999999
const MAX_RETRIES = 10

function generateRandomNumber(): number {
  return Math.floor(Math.random() * (RANDOM_MAX - RANDOM_MIN + 1)) + RANDOM_MIN
}

function formatMemberId(number: number): string {
  return `LEAD-${number.toString().padStart(6, '0')}` 
}

async function isMemberIdUnique(
  supabase: any,
  memberId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('StudentProfile')
    .select('memberId')
    .eq('memberId', memberId)
    .single()

  if (error && error.code === 'PGRST116') {
    return true
  }

  if (data) {
    return false
  }

  if (error) {
    console.error('Error checking member ID uniqueness:', error)
    return false
  }

  return true
}

export async function generateUniqueMemberId(supabase: any): Promise<string> {
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
