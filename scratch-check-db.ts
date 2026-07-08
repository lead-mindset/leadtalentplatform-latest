import { createServiceClient } from './lib/supabase/server-service'
import dotenv from 'dotenv'

dotenv.config()

async function check() {
  try {
    const supabase = createServiceClient()
    const { data: all, error: errAll } = await supabase
      .from('recruiter_access')
      .select('*')
    
    console.log('All recruiter_access entries count:', all?.length)
    console.log('All recruiter_access:', JSON.stringify(all, null, 2))
  } catch (e) {
    console.error('Error during check:', e)
  }
}

check()
