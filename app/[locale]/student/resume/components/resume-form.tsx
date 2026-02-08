'use client'
import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Upload, Download, FileText, CheckCircle2, AlertCircle, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTranslations } from 'next-intl'

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
}: {
  resume: Resume | null
  isPending: boolean
  onUpload: (formData: FormData) => Promise<void>
}) {
  const t = useTranslations('resume')
  const formRef = useRef<HTMLFormElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)

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
    <div className="w-full max-w-2xl mx-auto space-y-6 px-4 py-6 sm:px-6">
      {resume && (
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">{t('currentResume')}</CardTitle>
            </div>
            <CardDescription>
              {t('currentResumeDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg bg-muted/30 border border-border/50 transition-colors hover:bg-muted/50">
              <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <p className="font-medium text-foreground truncate text-sm sm:text-base">{resume.fileName}</p>
                <div className="flex flex-wrap items-center gap-1 sm:gap-2 text-xs sm:text-sm text-muted-foreground">
                  <span>{formatFileSize(resume.fileSize)}</span>
                  <span className="hidden sm:inline">•</span>
                  <span className="w-full sm:w-auto">{t('uploaded')} {formatDate(resume.uploadedAt)}</span>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="shrink-0"
                asChild
              >
                <a 
                  href={resume.fileUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:inline">{t('download')}</span>
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">
            {resume ? t('updateResume') : t('uploadResume')}
          </CardTitle>
          <CardDescription>
            {resume 
              ? t('updateResumeDesc') 
              : t('uploadResumeDesc')
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            ref={formRef}
            onSubmit={async (e) => {
              e.preventDefault()
              if (!formRef.current || !selectedFile) return
              const formData = new FormData()
              formData.append('resume', selectedFile)
              await onUpload(formData)
              formRef.current.reset()
              setSelectedFile(null)
            }}
            className="space-y-4"
          >
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={cn(
                "relative rounded-lg border-2 border-dashed transition-all duration-200",
                isDragging 
                  ? "border-primary bg-primary/5 scale-[1.02]" 
                  : "border-border hover:border-primary/50 hover:bg-muted/30",
                selectedFile && "border-primary bg-primary/5"
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
              
              <div className="p-6 sm:p-8 text-center">
                {selectedFile ? (
                  <div className="space-y-3">
                    <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-lg bg-primary/10">
                      <FileText className="h-6 w-6 text-primary" />
                    </div>
                    <div className="space-y-1 min-w-0">
                      <p className="font-medium text-foreground break-words px-2">{selectedFile.name}</p>
                      <p className="text-sm text-muted-foreground">
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
                      className="mt-2"
                    >
                      <X className="h-4 w-4 mr-2" />
                      {t('remove')}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-lg bg-muted">
                      <Upload className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-foreground">
                        {isDragging ? t('dropHere') : t('dropResume')}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {t('or')}{' '}
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="text-primary hover:underline font-medium"
                        >
                          {t('browse')}
                        </button>
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {t('pdfOnly')}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {selectedFile && selectedFile.size > 10 * 1024 * 1024 && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                <p className="text-sm text-destructive">
                  {t('fileTooLarge')}
                </p>
              </div>
            )}

            <Button 
              type="submit" 
              disabled={isPending || !selectedFile || (selectedFile && selectedFile.size > 10 * 1024 * 1024)}
              className="w-full"
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