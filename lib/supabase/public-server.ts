import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.generated'

export function createPublicServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!supabaseUrl || !publishableKey) {
    throw new Error('Missing Supabase public credentials')
  }

  return createClient<Database>(supabaseUrl, publishableKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
