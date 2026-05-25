import { describe, it, expect, vi } from 'vitest';
import { StudentService } from '../student.service';
import { SupabaseClient } from '@supabase/supabase-js';

/**
 * StudentService Tests
 *
 * All mocks follow the pattern from event.service.test.ts:
 * - Mock SupabaseClient with chained .fn().mockReturnThis()
 * - Use mockImplementation on from() to route to different table mocks
 */

describe('StudentService', () => {
  // ───────────────────────────────────────────────────────────────
  // Helper: Build a Supabase mock that routes `from(table)` calls
  // ───────────────────────────────────────────────────────────────
  interface TableMock {
    update?: ReturnType<typeof vi.fn>
    eq?: ReturnType<typeof vi.fn>
    select?: ReturnType<typeof vi.fn>
    single?: ReturnType<typeof vi.fn>
    upsert?: ReturnType<typeof vi.fn>
    insert?: ReturnType<typeof vi.fn>
    remove?: ReturnType<typeof vi.fn>
    list?: ReturnType<typeof vi.fn>
    maybeSingle?: ReturnType<typeof vi.fn>
    is?: ReturnType<typeof vi.fn>
    match?: ReturnType<typeof vi.fn>
  }

  const buildMockSupabase = (overrides: Record<string, unknown> = {}) => {
    // Per-table mock chains
    const tableMocks: Record<string, TableMock> = {
      user: {
        update: vi.fn().mockReturnThis(),
        upsert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn(),
      },
      person_profile: {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn(),
        upsert: vi.fn(),
        maybeSingle: vi.fn().mockResolvedValue({ data: { user_id: 'user-123' }, error: null }),
      },
      chapter_membership: {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        match: vi.fn().mockReturnThis(),
        single: vi.fn(),
        upsert: vi.fn(),
        insert: vi.fn().mockResolvedValue({ error: null }),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      },
      newsletter_subscription: {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn(),
        update: vi.fn().mockReturnThis(),
        insert: vi.fn(),
      },
      resume: {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn(),
        upsert: vi.fn(),
      },
      ...overrides,
    };

    const mockSupabase = {
      from: vi.fn().mockImplementation((table: string) => tableMocks[table]),
      storage: {
        from: vi.fn().mockReturnThis(),
        upload: vi.fn(),
        createSignedUrl: vi.fn().mockResolvedValue({ data: { signedUrl: 'https://example.com/signed-resume.pdf' }, error: null }),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://example.com/resume.pdf' } }),
      },
    } as unknown as SupabaseClient;

    return { mockSupabase, tableMocks };
  };

  // ───────────────────────────────────────────────────────────────
  // getProfile
  // ───────────────────────────────────────────────────────────────
   describe('getProfile', () => {
    it('should return profile data on success', async () => {
      const mockProfile = {
        user_id: 'user-123',
        major_or_interest: 'Computer Science',
        graduation_year: 2025,
        skills: ['TypeScript', 'React'],
        linkedin_url: 'https://linkedin.com/in/test',
        is_recruiter_visible: true,
        gender: 'female',
      };
      const mockMembership = {
        chapter_id: 'chapter-1',
        status: 'approved',
        member_id: 'M123',
      };

      const { mockSupabase, tableMocks } = buildMockSupabase();
      tableMocks.person_profile.single.mockResolvedValue({ data: mockProfile, error: null });
      tableMocks.chapter_membership.maybeSingle.mockResolvedValue({ data: mockMembership, error: null });

      const result = await StudentService.getProfile(mockSupabase as unknown as SupabaseClient, 'user-123');

      expect(result).toEqual({ ...mockProfile, ...mockMembership });
      expect(mockSupabase.from).toHaveBeenCalledWith('person_profile');
      expect(tableMocks.person_profile.select).toHaveBeenCalledWith(
        'user_id, university, major_or_interest, graduation_year, skills, linkedin_url, is_recruiter_visible, gender'
      );
      expect(tableMocks.person_profile.eq).toHaveBeenCalledWith('user_id', 'user-123');
      expect(mockSupabase.from).toHaveBeenCalledWith('chapter_membership');
      expect(tableMocks.chapter_membership.select).toHaveBeenCalledWith(
        'chapter_id, status, position, member_id, joined_at'
      );
      expect(tableMocks.chapter_membership.eq).toHaveBeenCalledWith('user_id', 'user-123');
    });

    it('should throw "Student profile not found" when Supabase returns an error', async () => {
      const { mockSupabase, tableMocks } = buildMockSupabase();
      tableMocks.person_profile.single.mockResolvedValue({
        data: null,
        error: { message: 'Row not found' },
      });

      await expect(StudentService.getProfile(mockSupabase as unknown as SupabaseClient, 'user-123')).rejects.toThrow(
        'Student profile not found'
      );
    });
  });

  // ───────────────────────────────────────────────────────────────
  // updateProfile
  // ───────────────────────────────────────────────────────────────
  describe('updateProfile', () => {
    const baseParams = {
      userId: 'user-123',
      fullName: 'Jane Doe',
      phone: '+1234567890',
      career: 'Computer Science',
      gender: 'female',
      graduation_year: 2025,
      skills: ['TypeScript', 'React'],
      linkedinUrl: 'https://linkedin.com/in/janedoe',
      consentRecruiterVisibility: true,
      emailNotificationsEnabled: true,
      chapter_id: 'chapter-1',
    };

    it('should update user table AND person_profile table', async () => {
      const { mockSupabase, tableMocks } = buildMockSupabase();

      // 1. User update succeeds
      tableMocks.user.eq.mockResolvedValue({ error: null });
      // 2. Profile upsert succeeds
      tableMocks.person_profile.upsert.mockResolvedValue({ error: null });
      // 3. Membership upsert succeeds
      tableMocks.chapter_membership.upsert.mockResolvedValue({ error: null });
      tableMocks.newsletter_subscription.maybeSingle.mockResolvedValue({ data: null, error: null });
      tableMocks.newsletter_subscription.insert.mockResolvedValue({ error: null });

      const result = await StudentService.updateProfile(mockSupabase as unknown as SupabaseClient, baseParams);

      expect(result).toEqual({ success: true });

      // Verify user table was updated
      expect(mockSupabase.from).toHaveBeenCalledWith('user');
      expect(tableMocks.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Jane Doe',
          phone: '+1234567890',
        })
      );
      expect(tableMocks.user.eq).toHaveBeenCalledWith('id', 'user-123');

      // Verify person_profile was upserted
      expect(mockSupabase.from).toHaveBeenCalledWith('person_profile');
      expect(tableMocks.person_profile.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'user-123',
          major_or_interest: 'Computer Science',
          gender: 'female',
          graduation_year: 2025,
          skills: ['TypeScript', 'React'],
          linkedin_url: 'https://linkedin.com/in/janedoe',
          is_recruiter_visible: true,
        }),
        { onConflict: 'user_id' }
      );

      // Verify chapter_membership application was inserted
      expect(mockSupabase.from).toHaveBeenCalledWith('chapter_membership');
      expect(tableMocks.chapter_membership.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'user-123',
          chapter_id: 'chapter-1',
        })
      );
    });

    it('should throw when user update fails', async () => {
      const { mockSupabase, tableMocks } = buildMockSupabase();

      const userError = new Error('User update failed');
      tableMocks.user.eq.mockResolvedValue({ error: userError });

      await expect(StudentService.updateProfile(mockSupabase as unknown as SupabaseClient, baseParams)).rejects.toThrow(
        'User update failed'
      );

      // Verify user update was attempted
      expect(tableMocks.user.update).toHaveBeenCalled();
      // Verify profile upsert was NOT attempted
      expect(tableMocks.person_profile.upsert).not.toHaveBeenCalled();
    });

    it('should throw when profile upsert fails', async () => {
      const { mockSupabase, tableMocks } = buildMockSupabase();

      tableMocks.user.eq.mockResolvedValue({ error: null });

      const profileError = new Error('Profile upsert failed');
      tableMocks.person_profile.upsert.mockResolvedValue({ error: profileError });

      await expect(StudentService.updateProfile(mockSupabase as unknown as SupabaseClient, baseParams)).rejects.toThrow(
        'Profile upsert failed'
      );
    });

    it('should create global and chapter newsletter subscriptions when opted in', async () => {
      const { mockSupabase, tableMocks } = buildMockSupabase();

      tableMocks.user.eq.mockResolvedValue({ error: null });
      tableMocks.person_profile.upsert.mockResolvedValue({ error: null });
      tableMocks.chapter_membership.upsert.mockResolvedValue({ error: null });
      tableMocks.newsletter_subscription.maybeSingle.mockResolvedValue({ data: null, error: null });
      tableMocks.newsletter_subscription.insert.mockResolvedValue({ error: null });

      const result = await StudentService.updateProfile(mockSupabase as unknown as SupabaseClient, baseParams);

      expect(result).toEqual({ success: true });
      expect(mockSupabase.from).toHaveBeenCalledWith('newsletter_subscription');
      expect(tableMocks.newsletter_subscription.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'user-123',
          scope: 'global',
          chapter_id: null,
          source: 'onboarding',
          status: 'active',
        })
      );
      expect(tableMocks.newsletter_subscription.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'user-123',
          scope: 'chapter',
          chapter_id: 'chapter-1',
          source: 'onboarding',
          status: 'active',
        })
      );
    });

    it('should skip newsletter subscriptions when opted out', async () => {
      const { mockSupabase, tableMocks } = buildMockSupabase();

      tableMocks.user.eq.mockResolvedValue({ error: null });
      tableMocks.person_profile.upsert.mockResolvedValue({ error: null });
      tableMocks.chapter_membership.upsert.mockResolvedValue({ error: null });

      const result = await StudentService.updateProfile(mockSupabase as unknown as SupabaseClient, {
        ...baseParams,
        emailNotificationsEnabled: false,
      });

      expect(result).toEqual({ success: true });
      expect(tableMocks.newsletter_subscription.insert).not.toHaveBeenCalled();
    });

    it('should upload resume when resumePdf is provided', async () => {
      const mockFile = new File(['pdf content'], 'resume.pdf', { type: 'application/pdf' });

      const { mockSupabase, tableMocks } = buildMockSupabase();

      tableMocks.user.eq.mockResolvedValue({ error: null });
      tableMocks.person_profile.upsert.mockResolvedValue({ error: null });
      tableMocks.chapter_membership.upsert.mockResolvedValue({ error: null });
      tableMocks.newsletter_subscription.maybeSingle.mockResolvedValue({ data: null, error: null });
      tableMocks.newsletter_subscription.insert.mockResolvedValue({ error: null });
      mockSupabase.storage.upload.mockResolvedValue({ error: null });
      tableMocks.resume.upsert.mockResolvedValue({ error: null });

      const result = await StudentService.updateProfile(mockSupabase as unknown as SupabaseClient, {
        ...baseParams,
        resumePdf: mockFile,
      });

      expect(result).toEqual({ success: true });
      expect(mockSupabase.storage.from).toHaveBeenCalledWith('resumes');
      expect(mockSupabase.storage.upload).toHaveBeenCalled();
    });
  });

  // ───────────────────────────────────────────────────────────────
  // getResume
  // ───────────────────────────────────────────────────────────────
  describe('getResume', () => {
    it('should return resume data on success', async () => {
      const mockResume = {
        student_id: 'user-123',
        file_url: 'https://example.com/resume.pdf',
        file_name: 'resume.pdf',
        file_size: 12345,
        uploaded_at: '2025-01-01T00:00:00Z',
      };

      const { mockSupabase, tableMocks } = buildMockSupabase();
      tableMocks.resume.single = vi.fn().mockResolvedValue({ data: mockResume, error: null });
      tableMocks.resume.select = vi.fn().mockReturnThis();
      tableMocks.resume.eq = vi.fn().mockReturnThis();

      const result = await StudentService.getResume(mockSupabase as unknown as SupabaseClient, 'user-123');

      expect(result).toEqual(mockResume);
      expect(mockSupabase.from).toHaveBeenCalledWith('resume');
    });

    it('should return null when Supabase returns an error', async () => {
      const { mockSupabase, tableMocks } = buildMockSupabase();
      tableMocks.resume.single = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Row not found' },
      });
      tableMocks.resume.select = vi.fn().mockReturnThis();
      tableMocks.resume.eq = vi.fn().mockReturnThis();

      const result = await StudentService.getResume(mockSupabase as unknown as SupabaseClient, 'user-123');

      expect(result).toBeNull();
    });
  });

  // ───────────────────────────────────────────────────────────────
  // createResumeSignedUrl
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  describe('createResumeSignedUrl', () => {
    it('creates a signed URL from a stored Supabase public-style resume URL', async () => {
      const { mockSupabase } = buildMockSupabase();

      const result = await StudentService.createResumeSignedUrl(
        mockSupabase as unknown as SupabaseClient,
        'https://example.supabase.co/storage/v1/object/public/resumes/user-123/resume.pdf'
      );

      expect(result).toBe('https://example.com/signed-resume.pdf');
      expect(mockSupabase.storage.from).toHaveBeenCalledWith('resumes');
      expect(mockSupabase.storage.createSignedUrl).toHaveBeenCalledWith('user-123/resume.pdf', 300);
    });

    it('returns null for an invalid resume file URL', async () => {
      const { mockSupabase } = buildMockSupabase();

      const result = await StudentService.createResumeSignedUrl(
        mockSupabase as unknown as SupabaseClient,
        'https://example.com/not-a-resume.pdf'
      );

      expect(result).toBeNull();
      expect(mockSupabase.storage.createSignedUrl).not.toHaveBeenCalled();
    });
  });

  // uploadResume
  // ───────────────────────────────────────────────────────────────
  describe('uploadResume', () => {
    it('should upload to Storage bucket resumes and insert into resume table', async () => {
      const mockFile = new File(['pdf content'], 'resume.pdf', { type: 'application/pdf' });

      const { mockSupabase, tableMocks } = buildMockSupabase();

      mockSupabase.storage.upload.mockResolvedValue({ error: null });
      tableMocks.resume.upsert.mockResolvedValue({ error: null });

      const result = await StudentService.uploadResume(mockSupabase as unknown as SupabaseClient, 'user-123', mockFile);

      expect(result).toBe('https://example.com/resume.pdf');

      // Verify storage upload
      expect(mockSupabase.storage.from).toHaveBeenCalledWith('resumes');
      expect(mockSupabase.storage.upload).toHaveBeenCalledWith(
        expect.stringMatching(/^user-123\/[\w-]+\.pdf$/),
        mockFile,
        expect.objectContaining({
          contentType: 'application/pdf',
          upsert: true,
        })
      );

      // Verify resume table insert
      expect(mockSupabase.from).toHaveBeenCalledWith('resume');
      expect(tableMocks.resume.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          student_id: 'user-123',
          file_url: 'https://example.com/resume.pdf',
          file_name: 'resume.pdf',
          file_size: mockFile.size,
        }),
        { onConflict: 'student_id' }
      );
    });

    it('should throw on Storage upload error', async () => {
      const mockFile = new File(['pdf content'], 'resume.pdf', { type: 'application/pdf' });

      const { mockSupabase } = buildMockSupabase();

      const uploadError = new Error('Storage upload failed');
      mockSupabase.storage.upload.mockResolvedValue({ error: uploadError });

      await expect(
        StudentService.uploadResume(mockSupabase as unknown as SupabaseClient, 'user-123', mockFile)
      ).rejects.toThrow('Storage upload failed');
    });

    it('should throw on resume table insert error', async () => {
      const mockFile = new File(['pdf content'], 'resume.pdf', { type: 'application/pdf' });

      const { mockSupabase, tableMocks } = buildMockSupabase();

      mockSupabase.storage.upload.mockResolvedValue({ error: null });

      const dbError = new Error('Resume insert failed');
      tableMocks.resume.upsert.mockResolvedValue({ error: dbError });

      await expect(
        StudentService.uploadResume(mockSupabase as unknown as SupabaseClient, 'user-123', mockFile)
      ).rejects.toThrow('Resume insert failed');
    });
  });

  describe('submitOnboarding newsletter preferences', () => {
    const baseParams = {
      userId: 'user-123',
      email: 'user@test.com',
      fullName: 'Jane Doe',
      phone: '+1234567890',
      career: 'Computer Science',
      gender: 'female',
      graduationYear: 2025,
      skills: ['TypeScript'],
      linkedinUrl: 'https://linkedin.com/in/janedoe',
      consentRecruiterVisibility: false,
      emailNotificationsEnabled: true,
      leadChapter: 'leaduni',
      resumePdf: null,
    };

    it('creates global and chapter newsletter subscriptions during onboarding opt-in', async () => {
      const { mockSupabase, tableMocks } = buildMockSupabase();

      tableMocks.user.single.mockResolvedValue({ data: { id: 'user-123' }, error: null });
      tableMocks.person_profile.upsert.mockResolvedValue({ error: null });
      tableMocks.chapter_membership.upsert.mockResolvedValue({ error: null });
      tableMocks.newsletter_subscription.maybeSingle.mockResolvedValue({ data: null, error: null });
      tableMocks.newsletter_subscription.insert.mockResolvedValue({ error: null });

      const result = await StudentService.submitOnboarding(mockSupabase as unknown as SupabaseClient, baseParams);

      expect(result).toEqual({ success: true });
      expect(tableMocks.newsletter_subscription.insert).toHaveBeenCalledTimes(2);
    });

    it('does not create newsletter subscriptions during onboarding opt-out', async () => {
      const { mockSupabase, tableMocks } = buildMockSupabase();

      tableMocks.user.single.mockResolvedValue({ data: { id: 'user-123' }, error: null });
      tableMocks.person_profile.upsert.mockResolvedValue({ error: null });
      tableMocks.chapter_membership.upsert.mockResolvedValue({ error: null });

      const result = await StudentService.submitOnboarding(mockSupabase as unknown as SupabaseClient, {
        ...baseParams,
        emailNotificationsEnabled: false,
      });

      expect(result).toEqual({ success: true });
      expect(tableMocks.newsletter_subscription.insert).not.toHaveBeenCalled();
    });
  });
});
