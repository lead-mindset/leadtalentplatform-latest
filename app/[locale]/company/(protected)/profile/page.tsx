import { getRecruiterProfile } from '@/lib/actions/company/profile'
import { redirect } from 'next/navigation'
import ProfileForm from './profile-form'
import { PageHeader } from '@/components/ui/page-header'

export default async function ProfilePage() {
  const result = await getRecruiterProfile()

  if (!result.success) {
    redirect('/auth/login')
  }

  const { user, company, accessInfo } = result.data!

  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader
        eyebrow="Company portal"
        title="Representative Profile"
        description={`Manage your profile information for ${company?.name || 'your company'} and confirm your access status.`}
      />

      <ProfileForm
        user={{ ...user, name: user.name ?? 'Company representative' }}
        company={company}
        accessInfo={accessInfo}
      />
    </div>
  )
}
