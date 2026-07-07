import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { InviteEmailSignInButton } from './invite-email-signin-button'

const { signInWithOtpMock } = vi.hoisted(() => ({
  signInWithOtpMock: vi.fn(),
}))

vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    auth: {
      signInWithOtp: signInWithOtpMock,
    },
  },
}))

vi.mock('next-intl', () => ({
  useLocale: () => 'en',
}))

describe('InviteEmailSignInButton', () => {
  beforeEach(() => {
    signInWithOtpMock.mockReset()
  })

  it('sends a magic link to the invited email and preserves the invite token in the callback redirect', async () => {
    signInWithOtpMock.mockResolvedValue({ error: null })

    render(<InviteEmailSignInButton email="recruiter@example.com" token="invite-token" />)

    fireEvent.click(screen.getByRole('button', { name: /send login link/i }))

    await waitFor(() => {
      expect(signInWithOtpMock).toHaveBeenCalledWith({
        email: 'recruiter@example.com',
        options: {
          emailRedirectTo: expect.stringContaining('/en/auth/callback?next=%2Frecruiter%2Faccess%3Ftoken%3Dinvite-token'),
        },
      })
    })

    expect(await screen.findByText(/login link sent/i)).toBeTruthy()
  })
})
