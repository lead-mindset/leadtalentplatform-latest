'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import type { EventRow, EventRegistrationRow, RegistrationStatus } from '@/lib/types'

export function useRegistration(eventId: string) {
  const [isLoading, setIsLoading] = useState(true)
  const [event, setEvent] = useState<EventRow | null>(null)
  const [registration, setRegistration] = useState<EventRegistrationRow | null>(null)

  useEffect(() => {
    async function loadData() {
      const client = supabase
      
      try {
        // Load event data
        const { data: eventData, error: eventError } = await client
          .from('Event')
          .select('*')
          .eq('id', eventId)
          .single<EventRow>()

        if (eventError) {
          console.error('[useRegistration] Event load error:', eventError)
          return
        }

        setEvent(eventData)

        // Load user's registration for this event
        const { data: { user } } = await client.auth.getUser()
        if (user) {
          const { data: regData, error: regError } = await client
            .from('EventRegistration')
            .select('*')
            .eq('eventId', eventId)
            .eq('userId', user.id)
            .maybeSingle<EventRegistrationRow>()

          if (regError && regError.code !== 'PGRST116') {
            console.error('[useRegistration] Registration load error:', regError)
          }

          setRegistration(regData)
        }
      } catch (error) {
        console.error('[useRegistration] Load error:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [eventId])

  const registerForEvent = async () => {
    const client = supabase
    
    const { data, error } = await client
      .from('EventRegistration')
      .insert({
        eventId,
        userId: (await client.auth.getUser()).data.user?.id,
        status: 'registered' as RegistrationStatus,
        qrToken: crypto.randomUUID(), // Explicitly generate QR token
      })
      .select()
      .single<EventRegistrationRow>()

    if (error) throw error
    return data
  }

  const applyForEvent = async () => {
    const client = supabase
    
    // For application-gated events, qrToken is NULL explicitly
    const { data, error } = await client
      .from('EventRegistration')
      .insert({
        eventId,
        userId: (await client.auth.getUser()).data.user?.id,
        status: 'pending_review' as RegistrationStatus,
        qrToken: null, // EXPLICITLY NULL - no default
      })
      .select()
      .single<EventRegistrationRow>()

    if (error) throw error
    return data
  }

  return {
    event,
    registration,
    isLoading,
    registerForEvent,
    applyForEvent,
  }
}
