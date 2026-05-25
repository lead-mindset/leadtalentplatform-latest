'use server';

import { z } from 'zod';
import { revalidatePath, revalidateTag } from 'next/cache';
import { requireChapterEditor } from '@/lib/auth';
import { EventService } from '@/lib/services/event.service';
import { EventApplicationService } from '@/lib/services/event-application.service';
import { ChapterPermissionService } from '@/lib/services/chapter-permission.service';
import { PUBLIC_EVENTS_CACHE_TAG } from '@/lib/data/public-events';
import type { EventRow } from '@/lib/types';

const ApplicationQuestionSchema = z.object({
  id: z.string().uuid().optional(),
  questionText: z.string().min(1),
  questionType: z.enum(['short_text', 'long_text', 'single_select', 'checkbox', 'url']),
  options: z.array(z.string()).nullable().optional(),
  isRequired: z.boolean().optional(),
})

const EventInputSchema = z
  .object({
    title: z.string().min(1),
    description: z.string().optional(),
    coverImage: z.string().url().optional().or(z.literal('')),
    startAt: z.string().min(1),
    endAt: z.string().min(1),
    location: z.string().optional(),
    meetingUrl: z.string().url().optional().or(z.literal('')),
    eventType: z.enum(['in_person', 'online', 'hybrid']),
    capacity: z.coerce.number().int().nonnegative().optional(),
    chapter_id: z.string().optional().nullable(),
    isPublished: z.coerce.boolean().optional(),
    accessModel: z.enum(['open', 'application']).default('open'),
    applicationFormUrl: z.string().url().nullable().optional(),
    applicationQuestions: z.array(ApplicationQuestionSchema).optional(),
    locationName: z.string().optional(),
    locationAddress: z.string().optional(),
    locationCity: z.string().optional(),
    locationRegion: z.string().optional(),
    locationLatitude: z.number().optional().nullable(),
    locationLongitude: z.number().optional().nullable(),
  })
  .refine(
    (data) => {
      if (data.isPublished === true && data.accessModel === 'application') {
        return Boolean(data.applicationQuestions?.length);
      }
      return true;
    },
    {
      message: 'Application events need at least one native question.',
      path: ['applicationQuestions'],
    }
  )
  .refine(
    (data) => {
      if (data.isPublished === true && data.eventType !== 'in_person') {
        return data.meetingUrl && data.meetingUrl.trim().length > 0;
      }
      return true;
    },
    {
      message: 'Meeting URL is required for online or hybrid events',
      path: ['meetingUrl'],
    }
  )
  .refine(
    (data) => {
      return new Date(data.endAt) > new Date(data.startAt);
    },
    {
      message: 'End time must be after start time',
      path: ['endAt'],
    }
  );

export type CreateEventInput = z.infer<typeof EventInputSchema>;

export type CreateEventResponse =
  | { success: true; event: EventRow }
  | { error: string };

export async function createEvent(input: CreateEventInput): Promise<CreateEventResponse> {
  const parsed = EventInputSchema.safeParse(input);
  if (!parsed.success) return { error: 'Validation failed' };

  const data = parsed.data;
  const { supabase, user, chapter_id } = await requireChapterEditor();

  try {
    let targetChapterId: string | null = null;
    let redirectPath = '/student';

    if (user.role === 'admin') {
      targetChapterId = data.chapter_id ?? null;
      redirectPath = '/admin/events';
    } else {
      if (!chapter_id) return { error: 'No chapter assigned' };
      const permission = await ChapterPermissionService.requireChapterPermission(supabase, {
        userId: user.id,
        chapterId: chapter_id,
        permissionKey: 'chapter.events.manage',
      });
      if (!permission.success) return { error: permission.error };

      targetChapterId = chapter_id;
      redirectPath = '/chapter/events';
    }

    const event = await EventService.createEvent(supabase, {
      ...data,
      applicationFormUrl: null,
      chapter_id: targetChapterId,
      createdById: user.id,
    });

    if (data.accessModel === 'application') {
      const questionsResult = await EventApplicationService.upsertQuestionsForEvent(supabase, {
        eventId: event.id,
        questions: data.applicationQuestions ?? [],
        requireCompleteQuestions: data.isPublished === true,
      });

      if (!questionsResult.success) {
        await EventService.deleteEvent(supabase, event.id);
        return { error: questionsResult.error };
      }
    }

    revalidateTag(PUBLIC_EVENTS_CACHE_TAG, { expire: 0 });
    revalidatePath(redirectPath);
    return { success: true, event };
  } catch (err) {
    console.error('[createEvent] error:', err);
    return { error: err instanceof Error ? err.message : 'Failed to create event' };
  }
}
