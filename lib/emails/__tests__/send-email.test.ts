import { beforeEach, describe, expect, it, vi } from 'vitest'

const sendTransactionalEmailMock = vi.hoisted(() => vi.fn())

vi.mock('../provider', () => ({
  sendTransactionalEmail: sendTransactionalEmailMock,
}))

describe('transactional email senders', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.FRONTEND_URL = 'https://leadqa.vercel.app'
    sendTransactionalEmailMock.mockResolvedValue({ success: true, id: 'email-1' })
  })

  it('sends company representative invites as critical emails with QA URL', async () => {
    const { sendCompanyRepresentativeInviteEmail } = await import('../send-email')

    await sendCompanyRepresentativeInviteEmail('rep@example.com', 'token-123', 'Acme')

    expect(sendTransactionalEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'rep@example.com',
        subject: 'Invitacion de Acme a LEAD Talent Platform',
        critical: true,
      })
    )
    expect(sendTransactionalEmailMock.mock.calls[0][0].html).toContain(
      'https://leadqa.vercel.app/es/recruiter/access?token=token-123'
    )
  })

  it('sends chapter e-board invites with role, chapter, and exact email guidance', async () => {
    const { sendChapterEboardInviteEmail } = await import('../send-email')

    await sendChapterEboardInviteEmail('leader@example.edu', {
      chapterName: 'LEAD UNI',
      displayTitle: 'Directora de Eventos',
    })

    expect(sendTransactionalEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'leader@example.edu',
        subject: 'Activa tu rol en LEAD Talent Platform',
        critical: true,
      })
    )
    const html = sendTransactionalEmailMock.mock.calls[0][0].html
    expect(html).toContain('Directora de Eventos')
    expect(html).toContain('LEAD UNI')
    expect(html).toContain('leader@example.edu')
    expect(html).toContain('abriones@leadmindset.org')
    expect(html).toContain('https://leadqa.vercel.app/es/auth/sign-up')
  })

  it('sends member approval with member id and LEAD Americas copy', async () => {
    const { sendMemberApprovalEmail } = await import('../send-email')

    await sendMemberApprovalEmail('member@test.com', 'Abi', 'LEAD-123', 'LEAD PUCP')

    const payload = sendTransactionalEmailMock.mock.calls[0][0]
    expect(payload.subject).toBe('Membresia aprobada: LEAD-123')
    expect(payload.html).toContain('LEAD-123')
    expect(payload.html).toContain('LEAD Americas')
  })

  it('sends open event registration confirmation with event details', async () => {
    const { sendEventRegistrationConfirmedEmail } = await import('../send-email')

    await sendEventRegistrationConfirmedEmail('participant@test.com', {
      name: 'Participante',
      eventTitle: 'Networking Night Lima',
      eventDate: 'May 20, 2026',
      eventLocation: 'PUCP',
      eventType: 'in_person',
    })

    const payload = sendTransactionalEmailMock.mock.calls[0][0]
    expect(payload.subject).toBe('Registro confirmado: Networking Night Lima')
    expect(payload.html).toContain('Networking Night Lima')
    expect(payload.html).toContain('https://leadqa.vercel.app/es/student/events')
  })
})
