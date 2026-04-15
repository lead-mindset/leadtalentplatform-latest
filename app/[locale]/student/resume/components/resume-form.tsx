'use client'
import { useRef, useState, useTransition } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Upload, Download, FileText, CheckCircle2, AlertCircle, X, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import type { uploadResume } from '@/lib/actions/student/handle-resume'

interface Resume {
  id: string
  fileName: string
  fileSize: number
  fileUrl: string
  uploadedAt: string
}

export default function ResumeClient({
  resume,
  onUpload,
}: {
  resume: Resume | null
  onUpload: typeof uploadResume
}) {
  const t = useTranslations('resume')
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleFileSelect = (file: File | null) => {
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFileSelect(file)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    const nowOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    const diffInMs = nowOnly.getTime() - dateOnly.getTime()
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))
    
    if (diffInDays === 0) return t('today')
    if (diffInDays === 1) return t('yesterday')
    if (diffInDays < 7) return t('daysAgo', { count: diffInDays })
    if (diffInDays < 30) {
      const weeks = Math.floor(diffInDays / 7)
      return weeks === 1 ? t('weekAgo') : t('weeksAgo', { count: weeks })
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-5">
      {resume && (
        <Card className="overflow-hidden border-border/60 bg-gradient-to-br from-card/50 to-card/30 shadow-sm backdrop-blur-sm">
          <CardHeader className="pb-4 space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <CheckCircle2 className="h-4.5 w-4.5 text-primary" />
              </div>
              <CardTitle className="text-lg font-semibold tracking-tight">
                {t('currentResume')}
              </CardTitle>
            </div>
            <CardDescription className="text-sm">
              {t('currentResumeDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="group relative overflow-hidden rounded-lg border border-border/60 bg-gradient-to-br from-muted/40 to-muted/20 p-4 transition-all duration-200 hover:border-border hover:shadow-sm">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary/15 to-primary/5 transition-transform duration-200 group-hover:scale-105">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0 space-y-1.5">
                  <p className="font-medium text-foreground truncate text-sm sm:text-base">
                    {resume.fileName}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className="whitespace-nowrap font-medium">{formatFileSize(resume.fileSize)}</span>
                    <span className="hidden sm:inline text-muted-foreground/50">-</span>
                    <span className="whitespace-nowrap">{t('uploaded')} {formatDate(resume.uploadedAt)}</span>
                  </div>
                </div>
                  <Button
                    variant="outline" 
                    size="sm" 
                    className="shrink-0 shadow-sm hover:shadow transition-shadow"
                  asChild
                >
                  <Link
                    href={resume.fileUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    <span className="hidden sm:inline">{t('download')}</span>
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      <Card className="overflow-hidden border-border/60 bg-gradient-to-br from-card/50 to-card/30 shadow-sm backdrop-blur-sm">
        <CardHeader className="pb-4 space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <Upload className="h-4.5 w-4.5 text-primary" />
            </div>
            <CardTitle className="text-lg font-semibold tracking-tight">
              {resume ? t('updateResume') : t('uploadResume')}
            </CardTitle>
          </div>
          <CardDescription className="text-sm">
            {resume 
              ? t('updateResumeDesc') 
              : t('uploadResumeDesc')
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            ref={formRef}
            onSubmit={(e) => {
              e.preventDefault()
              if (!formRef.current || !selectedFile) return
              const formData = new FormData()
              formData.append('resume', selectedFile)
              setFeedback(null)
              startTransition(async () => {
                try {
                  const result = await onUpload(formData)
                  if (!result.success) {
                    setFeedback(result.error)
                    return
                  }
                  formRef.current?.reset()
                  setSelectedFile(null)
                  setFeedback('Resume uploaded successfully.')
                  router.refresh()
                } catch (error) {
                  setFeedback(error instanceof Error ? error.message : 'Failed to upload resume.')
                }
              })
            }}
            className="space-y-4"
          >
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={cn(
                "relative overflow-hidden rounded-xl border-2 border-dashed transition-all duration-300",
                isDragging 
                  ? "border-primary bg-primary/5 scale-[1.01] shadow-sm" 
                  : "border-border/60 hover:border-primary/40 hover:bg-muted/20",
                selectedFile && "border-primary/60 bg-primary/5 shadow-sm"
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                name="resume"
                accept=".pdf"
                required
                onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
                className="sr-only"
                disabled={isPending}
              />
              
              <div className="p-8 sm:p-10 text-center">
                {selectedFile ? (
                  <div className="space-y-4">
                    <div className="relative mx-auto">
                      <div className="flex h-14 w-14 mx-auto items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-primary/5">
                        <FileText className="h-7 w-7 text-primary" />
                      </div>
                      <div className="absolute -top-1 -right-1">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary shadow-sm">
                          <Sparkles className="h-3.5 w-3.5 text-primary-foreground" />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-1.5 min-w-0">
                      <p className="font-medium text-foreground break-words px-2 text-sm">
                        {selectedFile.name}
                      </p>
                      <p className="text-sm text-muted-foreground font-medium">
                        {formatFileSize(selectedFile.size)}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedFile(null)
                        if (fileInputRef.current) fileInputRef.current.value = ''
                      }}
                      className="mt-2 hover:bg-destructive/10 hover:text-destructive"
                    >
                      <X className="h-4 w-4 mr-2" />
                      {t('remove')}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex h-14 w-14 mx-auto items-center justify-center rounded-xl bg-gradient-to-br from-muted/60 to-muted/30 transition-transform duration-200 hover:scale-105">
                      <Upload className="h-7 w-7 text-muted-foreground" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-foreground">
                        {isDragging ? t('dropHere') : t('dropResume')}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {t('or')}{' '}
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="text-primary underline hover:underline font-semibold underline-offset-2 transition-colors"
                        >
                          {t('browse')}
                        </button>
                      </p>
                    </div>
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-muted/50 px-3 py-1 text-xs text-muted-foreground">
                      <FileText className="h-3 w-3" />
                      {t('pdfOnly')}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {selectedFile && selectedFile.size > 10 * 1024 * 1024 && (
              <div className="flex items-start gap-2.5 p-3.5 rounded-lg bg-destructive/10 border border-destructive/20">
                <AlertCircle className="h-4.5 w-4.5 text-destructive shrink-0 mt-0.5" />
                <p className="text-sm text-destructive font-medium">
                  {t('fileTooLarge')}
                </p>
              </div>
            )}

            {feedback ? (
              <div className="rounded-lg border bg-muted/40 p-3 text-sm text-muted-foreground">
                {feedback}
              </div>
            ) : null}

            <Button 
              type="submit" 
              disabled={isPending || !selectedFile || (selectedFile && selectedFile.size > 10 * 1024 * 1024)}
              className="w-full shadow-sm"
              size="lg"
            >
              {isPending ? (
                <>
                  <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  {t('uploading')}
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  {resume ? t('updateResume') : t('uploadResume')}
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
