const RANDOM_MIN = 100001
const RANDOM_MAX = 999999
export const MAX_RETRIES = 10

export function generateRandomNumber(): number {
  return Math.floor(Math.random() * (RANDOM_MAX - RANDOM_MIN + 1)) + RANDOM_MIN
}

export function formatMemberId(number: number): string {
  return `LEAD-${number.toString().padStart(6, '0')}` 
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
