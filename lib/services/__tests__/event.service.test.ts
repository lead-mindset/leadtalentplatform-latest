import { describe, it, expect, vi } from 'vitest';
import { EventService } from '../event.service';
import { SupabaseClient } from '@supabase/supabase-js';

describe('EventService', () => {
  const mockSupabase = {
    from: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    single: vi.fn(),
  } as unknown as SupabaseClient;

  it('should successfully create an event and sanitize the description', async () => {
    const mockEvent = { id: '123', title: 'Test Event' };
    
    // Setup the mock response
    (mockSupabase.single as any).mockResolvedValue({ data: mockEvent, error: null });

    const result = await EventService.createEvent(mockSupabase as any, {
      title: 'Test Event',
      description: 'Hello <script>alert("hack")</script>World',
      startAt: new Date().toISOString(),
      endAt: new Date().toISOString(),
      eventType: 'in_person',
      accessModel: 'open',
      chapterId: 'chapter-123',
      createdById: 'user-123',
    });

    expect(result).toEqual(mockEvent);
    
    // Verify sanitization happened
    expect(mockSupabase.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        description: 'Hello World', // The script tag should be gone
      })
    );
  });

  it('should throw an error if supabase returns an error', async () => {
    (mockSupabase.single as any).mockResolvedValue({ 
      data: null, 
      error: { message: 'Database error' } 
    });

    await expect(
      EventService.createEvent(mockSupabase as any, {
        title: 'Fail Event',
        startAt: new Date().toISOString(),
        endAt: new Date().toISOString(),
        eventType: 'in_person',
        accessModel: 'open',
        chapterId: 'chapter-123',
        createdById: 'user-123',
      })
    ).rejects.toThrow('Database error');
  });
});
