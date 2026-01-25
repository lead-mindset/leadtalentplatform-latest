'use client'
import { useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Upload, Trash2, Download, FileText } from 'lucide-react'
interface Resume {
  id: string
  fileName: string
  fileSize: number
  fileUrl: string
  uploadedAt: string
}
export default function ResumeClient({
  resume,
  isPending,
  onUpload,
  onDelete,
}: {
  resume: Resume | null
  isPending: boolean
  onUpload: (formData: FormData) => Promise<void>
  onDelete: () => Promise<void>
}) {
  const formRef = useRef<HTMLFormElement>(null)
  return (
    <div className="space-y-6">
      {resume && (
        <Card>
          <CardHeader>
            <CardTitle>Current Resume</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-center gap-4 p-4 border rounded-lg">
              <FileText className="h-10 w-10 text-muted-foreground" />
              <div className="flex-1">
                <p className="font-medium">{resume.fileName}</p>
                <p className="text-sm text-muted-foreground">
                  {(resume.fileSize / 1024).toFixed(2)} KB • Uploaded{' '}
                  {new Date(resume.uploadedAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" asChild>
                  <a href={resume.fileUrl} target="_blank" rel="noopener noreferrer">
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </a>
                </Button>
                <Button variant="destructive" size="sm" onClick={onDelete}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      <Card>
        <CardHeader>
          <CardTitle>{resume ? 'Upload New Resume' : 'Upload Resume'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            ref={formRef}
            onSubmit={async (e) => {
              e.preventDefault()
              if (!formRef.current) return
              const formData = new FormData(formRef.current)
              await onUpload(formData)
              formRef.current.reset()
            }}
            className="space-y-4"
          >
            <input type="file" name="resume" accept=".pdf" required />
            <Button type="submit" disabled={isPending}>
              <Upload className="h-4 w-4 mr-2" />
              {isPending ? 'Uploading...' : 'Upload'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
