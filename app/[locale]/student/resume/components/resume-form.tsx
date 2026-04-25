'use client'
import { useRef, useState, useTransition } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Icons } from '@/components/ui/icons'
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
  const [feedbackType, setFeedbackType] = useState<'success' | 'error' | null>(null)
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
    <div className="w-full space-y-6">

      {/* ── Upload Zone Card ── */}
      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        {/* Card header */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-border">
          <div className="p-2 rounded-xl bg-primary/10">
            <Icons.Upload className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h2 className="font-bold text-base text-foreground">Upload New Version</h2>
            <p className="text-xs text-muted-foreground">PDF only · Max 5 MB · ATS optimized</p>
          </div>
        </div>

        <div className="p-6">
          <form
            ref={formRef}
            onSubmit={(e) => {
              e.preventDefault()
              if (!formRef.current || !selectedFile) return
              const formData = new FormData()
              formData.append('resume', selectedFile)
              setFeedback(null)
              setFeedbackType(null)
              startTransition(async () => {
                try {
                  const result = await onUpload(formData)
                  if (!result.success) {
                    setFeedback(result.error)
                    setFeedbackType('error')
                    return
                  }
                  formRef.current?.reset()
                  setSelectedFile(null)
                  setFeedback('Resume uploaded successfully.')
                  setFeedbackType('success')
                  router.refresh()
                } catch (error) {
                  setFeedback(error instanceof Error ? error.message : 'Failed to upload resume.')
                  setFeedbackType('error')
                }
              })
            }}
            className="space-y-4"
          >
            {/* Drop Zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => {
                if (!selectedFile) fileInputRef.current?.click()
              }}
              className={cn(
                'relative rounded-2xl border-2 border-dashed flex flex-col items-center justify-center text-center',
                'min-h-[220px] cursor-pointer transition-all duration-200',
                isDragging
                  ? 'border-primary bg-primary/5 scale-[1.01]'
                  : 'border-border hover:border-primary/50 hover:bg-muted/30',
                selectedFile && 'border-primary/60 bg-primary/5',
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

              {selectedFile ? (
                /* ── File selected state ── */
                <div className="w-full max-w-sm px-4 space-y-3">
                  <div className="flex items-center gap-3 p-4 bg-background rounded-xl border border-border shadow-sm">
                    <div className="p-2.5 bg-primary/10 rounded-xl shrink-0">
                      <Icons.FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <p className="font-semibold text-sm truncate">{selectedFile.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{formatFileSize(selectedFile.size)}</p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedFile(null)
                        if (fileInputRef.current) fileInputRef.current.value = ''
                      }}
                      className="hover:bg-destructive/10 hover:text-destructive shrink-0 rounded-lg"
                    >
                      <Icons.X className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">Click to replace file</p>
                </div>
              ) : (
                /* ── Empty state ── */
                <div className="flex flex-col items-center gap-4 p-8">
                  <div className={cn(
                    'w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-200',
                    isDragging ? 'bg-primary/20 scale-110' : 'bg-muted group-hover:bg-primary/10',
                  )}>
                    <Icons.Upload className={cn(
                      'h-7 w-7 transition-colors',
                      isDragging ? 'text-primary' : 'text-muted-foreground',
                    )} />
                  </div>
                  <div className="space-y-1">
                    <p className="font-semibold text-foreground">
                      Drag & drop your resume
                    </p>
                    <p className="text-sm text-muted-foreground">
                      or{' '}
                      <span className="text-primary font-semibold underline underline-offset-2 cursor-pointer">
                        browse files
                      </span>
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <span className="px-3 py-1 bg-muted rounded-full text-xs font-medium text-muted-foreground border border-border">
                      PDF ONLY
                    </span>
                    <span className="px-3 py-1 bg-muted rounded-full text-xs font-medium text-muted-foreground border border-border">
                      MAX 5 MB
                    </span>
                    <span className="px-3 py-1 bg-primary/10 rounded-full text-xs font-semibold text-primary border border-primary/20">
                      ATS OPTIMIZED
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* File size error */}
            {selectedFile && selectedFile.size > 5 * 1024 * 1024 && (
              <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-destructive/10 border border-destructive/20">
                <Icons.AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                <p className="text-sm text-destructive font-medium">{t('fileTooLarge')}</p>
              </div>
            )}

            {/* Feedback message */}
            {feedback && (
              <div className={cn(
                'flex items-start gap-2.5 p-3.5 rounded-xl border text-sm font-medium',
                feedbackType === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                  : 'bg-muted/40 border-border text-muted-foreground',
              )}>
                {feedbackType === 'success'
                  ? <Icons.CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-500" />
                  : <Icons.Info className="h-4 w-4 shrink-0 mt-0.5" />
                }
                {feedback}
              </div>
            )}

            {/* Submit button */}
            {selectedFile && selectedFile.size <= 5 * 1024 * 1024 && (
              <Button
                type="submit"
                disabled={isPending}
                className="w-full h-11 font-semibold shadow-sm"
                size="lg"
              >
                {isPending ? (
                  <>
                    <Icons.Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t('uploading')}
                  </>
                ) : (
                  <>
                    <Icons.Upload className="h-4 w-4 mr-2" />
                    Confirm Upload
                  </>
                )}
              </Button>
            )}
          </form>
        </div>
      </div>

      {/* ── Current Live Resume Card ── */}
      {resume && (
        <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
          {/* Card header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-6 py-5 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/10">
                <Icons.FileText className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h3 className="font-bold text-base text-foreground">Current Live Resume</h3>
                <p className="text-xs text-muted-foreground">
                  Last updated: {formatDate(resume.uploadedAt)}
                </p>
              </div>
            </div>

            {resume.fileUrl && (
              <div className="flex items-center gap-2 ml-auto">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl gap-2 text-xs font-medium"
                  asChild
                >
                  <Link href={resume.fileUrl} target="_blank">
                    <Icons.Download className="h-3.5 w-3.5" />
                    Download
                  </Link>
                </Button>
                <Button
                  size="sm"
                  className="rounded-xl gap-2 text-xs font-medium"
                  asChild
                >
                  <Link href={resume.fileUrl} target="_blank">
                    <Icons.Eye className="h-3.5 w-3.5" />
                    View
                  </Link>
                </Button>
              </div>
            )}
          </div>

          {/* Document preview area */}
          <div className="p-6">
            <div className="relative group rounded-xl overflow-hidden border border-border/60 bg-muted/30 aspect-[1/1.414]">
              {/* Faux resume content (placeholder) */}
              <div className="absolute inset-0 p-6 md:p-10 opacity-40 group-hover:opacity-20 transition-opacity pointer-events-none select-none">
                <div className="border-b-2 border-primary/20 pb-4 md:pb-6 mb-4 md:mb-6">
                  <div className="h-4 bg-foreground/20 rounded-full w-3/4 mb-2" />
                  <div className="h-2.5 bg-foreground/10 rounded-full w-1/2" />
                </div>
                <div className="space-y-4">
                  {[60, 45, 70, 50, 55, 40].map((w, i) => (
                    <div key={i} className="h-2 bg-foreground/10 rounded-full" style={{ width: `${w}%` }} />
                  ))}
                </div>
                <div className="mt-6 space-y-2">
                  <div className="h-2.5 bg-primary/20 rounded-full w-1/4 mb-3" />
                  {[80, 65, 55].map((w, i) => (
                    <div key={i} className="h-2 bg-foreground/10 rounded-full" style={{ width: `${w}%` }} />
                  ))}
                </div>
              </div>

              {/* Document info overlay on hover */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-4 bg-background/60 backdrop-blur-[3px]">
                <div className="text-center space-y-1 px-4">
                  <p className="font-semibold text-sm text-foreground truncate max-w-xs">{resume.fileName}</p>
                  <p className="text-xs text-muted-foreground">{formatFileSize(resume.fileSize)} · Securely stored</p>
                </div>
                {resume.fileUrl && (
                  <Button
                    className="rounded-full font-bold shadow-xl gap-2"
                    size="lg"
                    asChild
                  >
                    <Link href={resume.fileUrl} target="_blank">
                      <Icons.Eye className="h-4 w-4" />
                      View Full Document
                    </Link>
                  </Button>
                )}
              </div>

              {/* Status badge pinned bottom-right */}
              <div className="absolute bottom-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Active</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
