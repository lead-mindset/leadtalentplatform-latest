import { getRecruiterProfile } from '@/lib/actions/company/profile'
import { redirect } from 'next/navigation'
import ProfileForm from './profile-form'

export default async function ProfilePage() {
  const result = await getRecruiterProfile()

  if (!result.success) {
    redirect('/auth/login')
  }

  const { user, company, accessInfo } = result.data!

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Recruiter Profile</h1>
        <p className="text-muted-foreground mt-2">
          Manage your profile information for {company?.name || 'your company'}
        </p>
      </div>

      <ProfileForm
        user={{ ...user, name: user.name ?? 'Recruiter' }}
        company={company}
        accessInfo={accessInfo}
      />
    </div>
  )
}