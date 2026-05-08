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
        eyebrow="Portal de empresa"
        title="Perfil de representante"
        description={`Gestiona tu informacion de perfil para ${company?.name || 'tu empresa'} y confirma tu estado de acceso.`}
      />

      <ProfileForm
        user={{ ...user, name: user.name ?? 'Representante de empresa' }}
        company={company}
        accessInfo={accessInfo}
      />
    </div>
  )
}
