import ResumeClient from './components/resume-form'
import { uploadResume } from '@/lib/actions/student/handle-resume'
import { getCurrentUserResume } from '@/lib/actions/student/profile'

export default async function StudentResumePage() {
  const resume = await getCurrentUserResume()

  return (
    <div className="container max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">My Resume</h1>
        <p className="text-muted-foreground text-lg">Upload and manage your resume for recruiters</p>
      </div>
      <ResumeClient resume={resume} onUpload={uploadResume} />
    </div>
  )
}
