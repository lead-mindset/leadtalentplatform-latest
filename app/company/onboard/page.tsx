import { Suspense } from 'react'
import OnboardContent from './onboard-content'
import { redirect } from 'next/navigation'
import { validateInviteToken } from './actions'

function OnboardLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        </div>
      </div>
    </div>
  )
}

async function OnboardLoader({ 
  searchParams 
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
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            Invalid Invite
          </h1>
          <p className="text-gray-600">{result.error}</p>
            <a
            href="/auth/login"
            className="mt-6 inline-block text-blue-600 hover:underline">
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
      recruiterEmail={result.data!.recruiterEmail}
    />
  )
}

export default function OnboardPage({
  searchParams,
}: {
  searchParams: Promise<{ inviteToken?: string }>
}) {
  return (
    <Suspense fallback={<OnboardLoading />}>
      <OnboardLoader searchParams={searchParams} />
    </Suspense>
  )
}