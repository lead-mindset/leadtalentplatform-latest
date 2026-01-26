import { validateInviteToken } from './actions'
import OnboardContent from './onboard-content'
import { redirect } from 'next/navigation'

export default async function OnboardPage({
  searchParams,
}: {
  searchParams: Promise<{ inviteToken?: string }>
}) {
  const { inviteToken } = await searchParams

  if (!inviteToken) {
    redirect('/auth/login')
  }

  const result = await validateInviteToken(inviteToken)

  if (!result.success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Invalid Invite</h1>
          <p className="text-gray-600">{result.error}</p>
          <a
            href="/auth/login"
            className="mt-6 inline-block text-blue-600 hover:underline"
          >
            Go to Login
          </a>
        </div>
      </div>
    )
  }

  return (
    <OnboardContent
      inviteToken={inviteToken}
      companyName={result.data!.companyName}
      companyLogo={result.data!.companyLogo}
      recruiterEmail={result.data!.recruiterEmail}
    />
  )
}
