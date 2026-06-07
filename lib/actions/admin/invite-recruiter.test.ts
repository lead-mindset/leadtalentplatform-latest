import { beforeEach, describe, expect, it, vi } from 'vitest'

const requireAdminMock = vi.hoisted(() => vi.fn())
const revalidatePathMock = vi.hoisted(() => vi.fn())
const sendCompanyRepresentativeInviteEmailMock = vi.hoisted(() => vi.fn())
const loggerInfoMock = vi.hoisted(() => vi.fn())

vi.mock('@/lib/auth', () => ({
  requireAdmin: requireAdminMock,
}))

vi.mock('next/cache', () => ({
  revalidatePath: revalidatePathMock,
}))

vi.mock('@/lib/emails/send-email', () => ({
  sendCompanyRepresentativeInviteEmail: sendCompanyRepresentativeInviteEmailMock,
}))

vi.mock('@/lib/logger', () => ({
  logger: {
    info: loggerInfoMock,
  },
}))

vi.mock('@/lib/services/admin.service', () => ({
  AdminService: {
    validateCompanyExists: vi.fn(),
    checkExistingRecruiterInvite: vi.fn(),
    createRecruiterInvite: vi.fn(),
    deleteInvite: vi.fn(),
    getInviteForResend: vi.fn(),
    regenerateInviteToken: vi.fn(),
    getInviteForRevoke: vi.fn(),
    revokeInvite: vi.fn(),
  },
}))

describe('company representative invite actions', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    requireAdminMock.mockResolvedValue({
      supabase: {},
      user: { id: 'admin-1' },
    })
    sendCompanyRepresentativeInviteEmailMock.mockResolvedValue({ success: true, id: 'email-1' })
    const { AdminService } = await import('@/lib/services/admin.service')
    vi.mocked(AdminService.validateCompanyExists).mockResolvedValue({ id: 'company-1', name: 'Acme' })
    vi.mocked(AdminService.checkExistingRecruiterInvite).mockResolvedValue(null)
    vi.mocked(AdminService.createRecruiterInvite).mockResolvedValue({
      success: true,
      inviteId: 'invite-1',
      token: 'token-123',
    })
  })

  it('sends company representative invite through the central email sender', async () => {
    const { createRecruiterInvite } = await import('./invite-recruiter')

    const result = await createRecruiterInvite({
      recruiterEmail: 'rep@acme.com',
      companyId: 'company-1',
    })

    expect(result).toEqual({
      success: true,
      inviteId: 'invite-1',
      message: 'Invite sent successfully',
    })
    expect(sendCompanyRepresentativeInviteEmailMock).toHaveBeenCalledWith(
      'rep@acme.com',
      'token-123',
      'Acme'
    )
    expect(loggerInfoMock).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'CREATE_INVITE',
        adminAuthenticated: true,
        recruiterEmailPresent: true,
        companyIdPresent: true,
        inviteIdPresent: true,
      }),
      'Recruiter invite action'
    )
    const auditPayload = JSON.stringify(loggerInfoMock.mock.calls)
    expect(auditPayload).not.toContain('admin-1')
    expect(auditPayload).not.toContain('rep@acme.com')
    expect(auditPayload).not.toContain('company-1')
    expect(auditPayload).not.toContain('invite-1')
    expect(auditPayload).not.toContain('token-123')
    expect(revalidatePathMock).toHaveBeenCalledWith('/admin/invites')
  })

  it('deletes the invite when critical email sending fails', async () => {
    const { AdminService } = await import('@/lib/services/admin.service')
    sendCompanyRepresentativeInviteEmailMock.mockResolvedValue({ success: false, error: 'resend down' })

    const { createRecruiterInvite } = await import('./invite-recruiter')
    const result = await createRecruiterInvite({
      recruiterEmail: 'rep@acme.com',
      companyId: 'company-1',
    })

    expect(result).toEqual({ success: false, error: 'Failed to send email: resend down' })
    expect(AdminService.deleteInvite).toHaveBeenCalledWith({}, 'invite-1')
    expect(revalidatePathMock).not.toHaveBeenCalled()
  })
})
