'use client'

import { useState, useEffect, useTransition } from 'react'
import { uploadResume } from '@/lib/actions/student/handle-resume'
import ResumeClient from './components/resume-form'
import { supabase } from '@/lib/supabase/client'

interface Resume {
  id: string
  fileName: string
  fileSize: number
  fileUrl: string
  uploadedAt: string
}

export default function StudentResumePage() {
  const [resume, setResume] = useState<Resume | null>(null)
  const [loading, setLoading] = useState(true)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    async function fetchResume() {
      setLoading(true)
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: resumeData } = await supabase
          .from('Resume')
          .select('*')
          .eq('studentId', user.id)
          .maybeSingle()

        setResume(resumeData || null)
      } catch (err) {
        console.error('Failed to fetch resume', err)
      } finally {
        setLoading(false)
      }
    }

    fetchResume()
  }, [])

  async function handleUpload(formData: FormData) {
    startTransition(async () => {
      try {
        await uploadResume(formData)
        alert('Resume uploaded successfully!')
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: resumeData } = await supabase
          .from('Resume')
          .select('*')
          .eq('studentId', user.id)
          .maybeSingle()

        setResume(resumeData || null)
      } catch (err: any) {
        console.error(err)
        alert(err.message || 'Failed to upload resume')
      }
    })
  }

  if (loading) return <div className="p-8">Loading...</div>

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">My Resume</h1>

      <ResumeClient
        resume={resume}
        isPending={isPending}
        onUpload={handleUpload}
      />
    </div>
  )
}