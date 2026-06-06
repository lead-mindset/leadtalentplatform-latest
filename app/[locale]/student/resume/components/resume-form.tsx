'use client'

import { useRef, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Icons } from '@/components/ui/icons'
import { cn } from '@/lib/utils'
import type { uploadResume } from '@/lib/actions/student/handle-resume'

interface Resume {
  id: string
  fileName: string
  fileSize: number
  fileUrl: string | null
  uploadedAt: string
}

const MAX_RESUME_SIZE_BYTES = 10 * 1024 * 1024

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
    if (!file) return
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
    if (!isPdf) {
      setSelectedFile(null)
      setFeedback('Selecciona un archivo PDF.')
      setFeedbackType('error')
      return
    }
    setFeedback(null)
    setFeedbackType(null)
    setSelectedFile(file)
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
    const diffInDays = Math.floor((nowOnly.getTime() - dateOnly.getTime()) / (1000 * 60 * 60 * 24))

    if (diffInDays === 0) return t('today')
    if (diffInDays === 1) return t('yesterday')
    if (diffInDays < 7) return t('daysAgo', { count: diffInDays })
    if (diffInDays < 30) {
      const weeks = Math.floor(diffInDays / 7)
      return weeks === 1 ? t('weekAgo') : t('weeksAgo', { count: weeks })
    }
    return date.toLocaleDateString('es-PE', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const selectedFileTooLarge = Boolean(selectedFile && selectedFile.size > MAX_RESUME_SIZE_BYTES)

  return (
    <div className="w-full space-y-6">
      <section className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
        <div className="flex items-center gap-3 border-b border-border px-6 py-5">
          <div className="rounded-lg bg-primary/10 p-2">
            <Icons.Upload className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">Subir CV en PDF</h2>
            <p className="text-xs leading-4 text-muted-foreground">Archivo PDF, máximo 10 MB</p>
          </div>
        </div>

        <form
          ref={formRef}
          onSubmit={(event) => {
            event.preventDefault()
            if (!formRef.current || !selectedFile || selectedFileTooLarge) return
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
                setFeedback('CV actualizado correctamente.')
                setFeedbackType('success')
                router.refresh()
              } catch (error) {
                setFeedback(error instanceof Error ? error.message : 'No se pudo subir el CV.')
                setFeedbackType('error')
              }
            })
          }}
          className="space-y-4 p-6"
        >
          <div
            onDragOver={(event) => {
              event.preventDefault()
              setIsDragging(true)
            }}
            onDragLeave={(event) => {
              event.preventDefault()
              setIsDragging(false)
            }}
            onDrop={(event) => {
              event.preventDefault()
              setIsDragging(false)
              handleFileSelect(event.dataTransfer.files[0] ?? null)
            }}
            onClick={() => {
              if (!selectedFile) fileInputRef.current?.click()
            }}
            className={cn(
              'relative flex min-h-[190px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed text-center transition-all duration-200',
              isDragging ? 'scale-[1.01] border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-muted/30',
              selectedFile && 'border-primary/60 bg-primary/5'
            )}
          >
            <input
              ref={fileInputRef}
              type="file"
              aria-label="Subir CV en PDF"
              name="resume"
              accept=".pdf,application/pdf"
              required
              onChange={(event) => handleFileSelect(event.target.files?.[0] ?? null)}
              className="sr-only"
              disabled={isPending}
            />

            {selectedFile ? (
              <div className="w-full max-w-sm space-y-3 px-4">
                <div className="flex items-center gap-3 rounded-lg border border-border bg-background p-4 shadow-sm">
                  <div className="shrink-0 rounded-lg bg-primary/10 p-2.5">
                    <Icons.FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1 text-left">
                    <p className="truncate text-sm font-semibold">{selectedFile.name}</p>
                    <p className="mt-0.5 text-xs leading-4 text-muted-foreground">
                      {formatFileSize(selectedFile.size)}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={(event) => {
                      event.stopPropagation()
                      setSelectedFile(null)
                      if (fileInputRef.current) fileInputRef.current.value = ''
                    }}
                    className="shrink-0 rounded-lg hover:bg-destructive/10 hover:text-destructive"
                    aria-label="Quitar archivo seleccionado"
                  >
                    <Icons.X className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs leading-4 text-muted-foreground">Quita el archivo si quieres elegir otro.</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4 p-8">
                <div
                  className={cn(
                    'flex h-14 w-14 items-center justify-center rounded-lg transition-all duration-200',
                    isDragging ? 'scale-110 bg-primary/20' : 'bg-muted'
                  )}
                >
                  <Icons.Upload
                    className={cn(
                      'h-7 w-7 transition-colors',
                      isDragging ? 'text-primary' : 'text-muted-foreground'
                    )}
                  />
                </div>
                <div className="space-y-1">
                  <p className="font-semibold text-foreground">Arrastra tu CV aquí</p>
                  <p className="text-sm leading-5 text-muted-foreground">
                    o{' '}
                    <span className="cursor-pointer font-semibold text-primary underline underline-offset-2">
                      selecciona un archivo
                    </span>
                  </p>
                </div>
                <div className="flex flex-wrap justify-center gap-2">
                  <span className="rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                    PDF
                  </span>
                  <span className="rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                    MAX 10 MB
                  </span>
                </div>
              </div>
            )}
          </div>

          {selectedFileTooLarge ? (
            <div className="flex items-start gap-2.5 rounded-lg border border-destructive/20 bg-destructive/10 p-3.5">
              <Icons.AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
              <p className="text-sm font-medium text-destructive">{t('fileTooLarge')}</p>
            </div>
          ) : null}

          {feedback ? (
            <div
              className={cn(
                'flex items-start gap-2.5 rounded-lg border p-3.5 text-sm font-medium',
                feedbackType === 'success'
                  ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                  : 'border-border bg-muted/40 text-muted-foreground'
              )}
            >
              {feedbackType === 'success' ? (
                <Icons.CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
              ) : (
                <Icons.Info className="mt-0.5 h-4 w-4 shrink-0" />
              )}
              {feedback}
            </div>
          ) : null}

          {selectedFile && !selectedFileTooLarge ? (
            <Button type="submit" disabled={isPending} className="h-11 w-full font-semibold" size="lg">
              {isPending ? (
                <>
                  <Icons.Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('uploading')}
                </>
              ) : (
                <>
                  <Icons.Upload className="mr-2 h-4 w-4" />
                  Subir CV
                </>
              )}
            </Button>
          ) : null}
        </form>
      </section>

      {resume ? (
        <section className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
          <div className="flex flex-col gap-3 border-b border-border px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-emerald-500/10 p-2">
                <Icons.FileText className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground">CV actual</h3>
                <p className="text-xs leading-4 text-muted-foreground">
                  Última actualización: {formatDate(resume.uploadedAt)}
                </p>
              </div>
            </div>

            {resume.fileUrl ? (
              <div className="flex items-center gap-2 sm:ml-auto">
                <Button variant="outline" size="sm" className="gap-2 rounded-lg text-xs font-medium" asChild>
                  <Link href={resume.fileUrl} target="_blank">
                    <Icons.Download className="h-3.5 w-3.5" />
                    Descargar
                  </Link>
                </Button>
                <Button size="sm" className="gap-2 rounded-lg text-xs font-medium" asChild>
                  <Link href={resume.fileUrl} target="_blank">
                    <Icons.Eye className="h-3.5 w-3.5" />
                    Ver
                  </Link>
                </Button>
              </div>
            ) : null}
          </div>

          <div className="p-6">
            <div className="rounded-lg border border-border/70 bg-muted/25 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">{resume.fileName}</p>
                  <p className="mt-1 text-xs leading-4 text-muted-foreground">
                    {formatFileSize(resume.fileSize)} · Almacenado de forma segura
                  </p>
                </div>
                <Badge variant="success">Activo</Badge>
              </div>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  )
}
