import { z } from 'zod'

export const eventSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(100, 'Title must be less than 100 characters'),
  
  description: z.string()
    .max(2000, 'Description must be less than 2000 characters')
    .optional(),
  
  coverImage: z.string()
    .url('Invalid image URL')
    .optional()
    .or(z.literal('')),
  
  startAt: z.string()
    .min(1, 'Start date and time are required')
    .refine((val) => !isNaN(Date.parse(val)), 'Invalid start date'),
  
  endAt: z.string()
    .min(1, 'End date and time are required')
    .refine((val) => !isNaN(Date.parse(val)), 'Invalid end date'),
  
  location: z.string()
    .max(200, 'Location must be less than 200 characters')
    .optional(),
  
  meetingUrl: z.string()
    .url('Invalid meeting URL')
    .optional()
    .or(z.literal('')),
  
  eventType: z.enum(['in_person', 'online', 'hybrid'] as const, {
    message: 'Event type is required'
  }),
  
  capacity: z.string()
    .optional()
    .refine((val) => {
      if (!val) return true
      const num = parseInt(val)
      return !isNaN(num) && num > 0 && num <= 10000
    }, 'Capacity must be a number between 1 and 10000'),
  
  accessModel: z.enum(['open', 'application'] as const, {
    message: 'Access model is required'
  }),
  
  applicationFormUrl: z.string()
    .url('Invalid application form URL')
    .optional()
    .or(z.literal('')),
  
  isPublished: z.boolean()
}).refine((data) => {
  // Validate date logic
  const start = new Date(data.startAt)
  const end = new Date(data.endAt)
  
  if (start >= end) {
    return false
  }
  
  // Validate event type requirements
  if (data.eventType === 'in_person' && !data.location?.trim()) {
    return false
  }
  
  if (data.eventType === 'online' && !data.meetingUrl?.trim()) {
    return false
  }
  
  if (data.eventType === 'hybrid' && (!data.location?.trim() || !data.meetingUrl?.trim())) {
    return false
  }
  
  // Validate application model requirements
  if (data.accessModel === 'application' && !data.applicationFormUrl?.trim()) {
    return false
  }
  
  return true
}, {
  message: 'Please check the following requirements: end date must be after start date, location required for in-person events, meeting URL required for online events, both required for hybrid events, and application form URL required for application-gated events'
})

export type EventFormData = z.infer<typeof eventSchema>

export const validateEventForm = (data: unknown) => {
  return eventSchema.safeParse(data)
}
