import ResumeClient from './components/resume-form'
import { uploadResume } from '@/lib/actions/student/handle-resume'
import { getCurrentUserResume } from '@/lib/actions/student/profile'
import { MainContainer } from '@/components/global/main-container'
import { PageHeader } from '@/components/ui/page-header'

export default async function StudentResumePage() {
  const resume = await getCurrentUserResume()

  return (
    <MainContainer maxWidth="7xl" className="space-y-6 py-6 pb-24 sm:py-8">
      <PageHeader
        title="Mi CV"
        description={
          resume
            ? 'Sube un PDF actualizado para mantener tu perfil listo y compartirlo solo con oportunidades autorizadas.'
            : 'Pendiente — Aún no has subido tu CV. Sube un PDF actualizado para mantener tu perfil listo.'
        }
      />

      <div className="mx-auto w-full max-w-4xl">
        <ResumeClient resume={resume} onUpload={uploadResume} />
      </div>
    </MainContainer>
  )
}
