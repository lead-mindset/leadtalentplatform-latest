import { unstable_cache } from 'next/cache'
import { EventService } from '@/lib/services/event.service'
import { createPublicServerClient } from '@/lib/supabase/public-server'

export const PUBLIC_EVENTS_CACHE_TAG = 'public-events'

export const getCachedPublishedEvents = unstable_cache(
  async () => EventService.getPublishedEvents(createPublicServerClient()),
  ['published-event-listing-v1'],
  {
    revalidate: 60,
    tags: [PUBLIC_EVENTS_CACHE_TAG],
  }
)
