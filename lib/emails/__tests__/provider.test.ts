import { beforeEach, describe, expect, it, vi } from 'vitest'

const sendMock = vi.hoisted(() => vi.fn())
const resendConstructorMock = vi.hoisted(() =>
  vi.fn(function MockResend() {
    return { emails: { send: sendMock } }
  })
)

vi.mock('resend', () => ({
  Resend: resendConstructorMock,
}))

describe('sendTransactionalEmail', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    delete process.env.RESEND_API_KEY
    delete process.env.EMAIL_FROM
    delete process.env.EMAIL_REPLY_TO
  })

  it('returns failure when Resend is not configured', async () => {
    const { sendTransactionalEmail } = await import('../provider')

    const result = await sendTransactionalEmail({
      to: 'student@test.com',
      subject: 'Subject',
      html: '<p>Hello</p>',
      critical: true,
    })

    expect(result).toEqual({ success: false, error: 'RESEND_API_KEY is not configured' })
    expect(resendConstructorMock).not.toHaveBeenCalled()
  })

  it('sends through Resend with configured sender and reply-to', async () => {
    process.env.RESEND_API_KEY = 're_test'
    process.env.EMAIL_FROM = 'LEAD Americas <qa@example.com>'
    process.env.EMAIL_REPLY_TO = 'support@example.com'
    sendMock.mockResolvedValue({ data: { id: 'email-1' }, error: null })

    const { sendTransactionalEmail } = await import('../provider')
    const result = await sendTransactionalEmail({
      to: 'student@test.com',
      subject: 'Welcome',
      html: '<p>Hello</p>',
    })

    expect(result).toEqual({ success: true, id: 'email-1' })
    expect(sendMock).toHaveBeenCalledWith({
      from: 'LEAD Americas <qa@example.com>',
      to: 'student@test.com',
      subject: 'Welcome',
      html: '<p>Hello</p>',
      text: undefined,
      replyTo: 'support@example.com',
    })
  })

  it('returns provider errors without throwing', async () => {
    process.env.RESEND_API_KEY = 're_test'
    sendMock.mockResolvedValue({ data: null, error: { message: 'bad sender' } })

    const { sendTransactionalEmail } = await import('../provider')
    const result = await sendTransactionalEmail({
      to: 'student@test.com',
      subject: 'Subject',
      html: '<p>Hello</p>',
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain('bad sender')
    }
  })
})
