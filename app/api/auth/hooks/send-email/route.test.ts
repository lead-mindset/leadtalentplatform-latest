import { beforeEach, describe, expect, it, vi } from 'vitest'

const verifyMock = vi.hoisted(() => vi.fn())
const sendTransactionalEmailMock = vi.hoisted(() => vi.fn())

vi.mock('standardwebhooks', () => ({
  Webhook: vi.fn(function MockWebhook() {
    return {
      verify: verifyMock,
    }
  }),
}))

vi.mock('@/lib/emails/provider', () => ({
  sendTransactionalEmail: sendTransactionalEmailMock,
}))

describe('Supabase auth email hook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.SUPABASE_HOOK_SECRET = 'v1,whsec_test'
    process.env.FRONTEND_URL = 'https://leadqa.vercel.app'
    sendTransactionalEmailMock.mockResolvedValue({ success: true, id: 'email-1' })
  })

  function makeRequest() {
    return new Request('https://leadqa.vercel.app/api/auth/hooks/send-email', {
      method: 'POST',
      headers: {
        'webhook-id': 'msg_1',
        'webhook-timestamp': '123',
        'webhook-signature': 'sig',
      },
      body: JSON.stringify({}),
    })
  }

  it('sends Spanish signup confirmation emails with canonical QA links', async () => {
    verifyMock.mockReturnValue({
      user: { email: 'participant@test.com', user_metadata: { locale: 'es' } },
      email_data: {
        site_url: 'http://localhost:3000',
        token_hash: 'token-hash',
        email_action_type: 'signup',
        redirect_to: '/es/onboarding',
      },
    })

    const { POST } = await import('./route')
    const response = await POST(makeRequest())

    expect(response.status).toBe(200)
    expect(sendTransactionalEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'participant@test.com',
        subject: 'Confirma tu cuenta en LEAD Talent Platform',
        critical: true,
      })
    )
    expect(sendTransactionalEmailMock.mock.calls[0][0].html).toContain(
      'https://leadqa.vercel.app/es/auth/confirm?token_hash=token-hash'
    )
    expect(sendTransactionalEmailMock.mock.calls[0][0].html).toContain('next=%2Fes%2Fonboarding')
  })

  it('sends password reset emails to the update password flow', async () => {
    verifyMock.mockReturnValue({
      user: { email: 'member@test.com', user_metadata: { locale: 'es' } },
      email_data: {
        site_url: 'http://localhost:3000',
        token_hash: 'recovery-token',
        email_action_type: 'recovery',
        redirect_to: '/es/auth/update-password',
      },
    })

    const { POST } = await import('./route')
    const response = await POST(makeRequest())

    expect(response.status).toBe(200)
    const payload = sendTransactionalEmailMock.mock.calls[0][0]
    expect(payload.subject).toBe('Restablece tu contrasena de LEAD Talent Platform')
    expect(payload.html).toContain('type=recovery')
    expect(payload.html).toContain('next=%2Fes%2Fauth%2Fupdate-password')
  })

  it('returns retryable failure when critical auth email cannot be sent', async () => {
    verifyMock.mockReturnValue({
      user: { email: 'participant@test.com', user_metadata: { locale: 'es' } },
      email_data: {
        site_url: 'http://localhost:3000',
        token_hash: 'token-hash',
        email_action_type: 'signup',
      },
    })
    sendTransactionalEmailMock.mockResolvedValue({ success: false, error: 'resend down' })

    const { POST } = await import('./route')
    const response = await POST(makeRequest())

    expect(response.status).toBe(503)
    expect(response.headers.get('retry-after')).toBe('true')
  })
})
