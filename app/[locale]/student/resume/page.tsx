import ResumeClient from './components/resume-form'
import { uploadResume } from '@/lib/actions/student/handle-resume'
import { getCurrentUserResume } from '@/lib/actions/student/profile'

export default async function StudentResumePage() {
  const resume = await getCurrentUserResume()

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4">
      <h1 className="text-3xl font-bold">My Resume</h1>
      <ResumeClient resume={resume} onUpload={uploadResume} />
    </div>
  )
}
