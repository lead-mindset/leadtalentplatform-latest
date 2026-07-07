import ResumeClient from './components/resume-form'
import { uploadResume } from '@/lib/actions/student/handle-resume'
import { getCurrentUserResume } from '@/lib/actions/student/profile'
import { MainContainer } from '@/components/global/main-container'
import { PageHeader } from '@/components/ui/page-header'
import { Badge } from '@/components/ui/badge'

export default async function StudentResumePage() {
  const resume = await getCurrentUserResume()

  return (
    <MainContainer maxWidth="7xl" className="space-y-6 py-6 pb-24 sm:py-8">
      <PageHeader
        eyebrow="Mi LEAD"
        title="Mi CV"
        description="Sube un PDF actualizado para mantener tu perfil listo y compartirlo solo con oportunidades autorizadas."
        badge={
          resume ? (
            <Badge variant="success" size="lg">
              CV activo
            </Badge>
          ) : (
            <Badge variant="warning" size="lg">
              Pendiente
            </Badge>
          )
        }
      />

      <div className="mx-auto w-full max-w-4xl">
        <ResumeClient resume={resume} onUpload={uploadResume} />
      </div>
    </MainContainer>
  )
}
