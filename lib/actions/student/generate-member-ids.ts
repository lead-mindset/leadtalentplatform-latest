import { SupabaseClient } from '@supabase/supabase-js'

const RESERVED_MAX = 100000 
const RANDOM_MIN = 100001
const RANDOM_MAX = 999999

export async function generateUniqueMemberId(supabase: SupabaseClient): Promise<string> {
  while (true) {
    const randomNum = Math.floor(RANDOM_MIN + Math.random() * (RANDOM_MAX - RANDOM_MIN + 1))

    if (randomNum <= RESERVED_MAX) continue

    const memberId = `LEAD-${randomNum}`

    const { data } = await supabase
      .from('student_profile')
      .select('member_id')
      .eq('member_id', memberId)
      .maybeSingle()

    if (!data) return memberId
  }
}