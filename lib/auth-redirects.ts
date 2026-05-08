import type { Role } from '@/lib/types'

export function getPostAuthRedirectPath({
  hasProfile,
  role,
}: {
  hasProfile: boolean
  role: Role | null | undefined
}) {
  if (!role) return '/onboarding'

  if (role === 'member' || role === 'editor') {
    return hasProfile ? '/student' : '/onboarding'
  }

  if (role === 'recruiter') return '/company'
  if (role === 'admin') return '/admin'

  return '/auth/error'
}
