'use client'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FileText, Upload, Trash2, Download } from 'lucide-react'

interface Resume {
  id: string
  fileUrl: string
  fileName: string
  fileSize: number
  uploadedAt: string
}

export default function StudentResumePage() {
  const [resume, setResume] = useState<Resume | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [userId, setUserId] = useState<string>('')

  useEffect(() => {
    async function fetchResume() {
      try {
        // First get user ID from profile
        const profileRes = await fetch('/api/profile')
        const profileData = await profileRes.json()
        setUserId(profileData.id)

        // Then fetch resume
        const res = await fetch(`/api/students/${profileData.id}/resume`)
        if (res.ok) {
          const data = await res.json()
          setResume(data)
        }
      } catch (error) {
        console.error('Failed to fetch resume:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchResume()
  }, [])

  async function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!userId) return

    const formData = new FormData(e.currentTarget)
    const file = formData.get('resume') as File

    if (!file) {
      alert('Please select a file')
      return
    }

    setUploading(true)

    try {
      const res = await fetch(`/api/students/${userId}/resume`, {
        method: 'POST',
        body: formData,
      })

      if (res.ok) {
        const data = await res.json()
        setResume(data.resume)
        alert('Resume uploaded successfully!')
        // Reset form
        e.currentTarget.reset()
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to upload resume')
      }
    } catch (error) {
      alert('Failed to upload resume')
    } finally {
      setUploading(false)
    }
  }

  async function handleDelete() {
    if (!resume || !userId) return
    if (!confirm('Are you sure you want to delete your resume?')) return

    try {
      const res = await fetch(`/api/students/${userId}/resume?resumeId=${resume.id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        setResume(null)
        alert('Resume deleted successfully')
      } else {
        alert('Failed to delete resume')
      }
    } catch (error) {
      alert('Failed to delete resume')
    }
  }

  if (loading) {
    return <div className="p-8">Loading...</div>
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Resume</h1>
        <p className="text-muted-foreground">
          Upload and manage your resume (PDF only)
        </p>
      </div>

      {/* Current Resume */}
      {resume && (
        <Card>
          <CardHeader>
            <CardTitle>Current Resume</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4 p-4 border rounded-lg">
              <FileText className="h-10 w-10 text-muted-foreground" />
              <div className="flex-1">
                <p className="font-medium">{resume.fileName}</p>
                <p className="text-sm text-muted-foreground">
                  {(resume.fileSize / 1024).toFixed(2)} KB • Uploaded {new Date(resume.uploadedAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" asChild>
                  <a href={resume.fileUrl} target="_blank" rel="noopener noreferrer">
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </a>
                </Button>
                <Button variant="destructive" size="sm" onClick={handleDelete}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload New Resume */}
      <Card>
        <CardHeader>
          <CardTitle>{resume ? 'Upload New Resume' : 'Upload Resume'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpload} className="space-y-4">
            <div>
              <Label htmlFor="resume">Choose PDF file</Label>
              <Input
                id="resume"
                name="resume"
                type="file"
                accept=".pdf"
                required
              />
              <p className="text-sm text-muted-foreground mt-2">
                Only PDF files are accepted. Max size: 5MB
              </p>
            </div>

            <Button type="submit" disabled={uploading}>
              <Upload className="h-4 w-4 mr-2" />
              {uploading ? 'Uploading...' : 'Upload Resume'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}