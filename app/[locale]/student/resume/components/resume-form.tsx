'use client'

import { useRef, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Icons } from '@/components/ui/icons'
import { cn } from '@/lib/utils'
import type { uploadResume } from '@/lib/actions/student/handle-resume'

interface Resume {
  id: string
  fileName: string
  fileSize: number
  fileUrl: string
  uploadedAt: string
}

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024

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

    if (file.type !== 'application/pdf') {
      setFeedback('Solo puedes subir archivos PDF.')
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

  const clearSelectedFile = () => {
    setSelectedFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const uploadDisabled = isPending || !selectedFile || selectedFile.size > MAX_FILE_SIZE_BYTES

  return (
    <div className="w-full space-y-6">
      <Card>
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Icons.Upload className="h-4 w-4 text-primary" />
            </span>
            <span className="min-w-0">
              <span className="block">Subir nueva version</span>
              <span className="mt-1 block text-sm font-normal leading-relaxed text-muted-foreground">
                Archivo PDF de hasta 10 MB. Mantenerlo actualizado mejora tus oportunidades.
              </span>
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form
            ref={formRef}
            onSubmit={(event) => {
              event.preventDefault()
              if (!selectedFile) return

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
                  clearSelectedFile()
                  setFeedback('CV actualizado correctamente.')
                  setFeedbackType('success')
                  router.refresh()
                } catch (error) {
                  setFeedback(error instanceof Error ? error.message : 'No se pudo subir el CV.')
                  setFeedbackType('error')
                }
              })
            }}
            className="space-y-4"
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
                'relative flex min-h-[190px] cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed px-4 py-8 text-center transition-colors sm:min-h-[220px]',
                isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-muted/40',
                selectedFile && 'border-primary/60 bg-primary/5',
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                aria-label="Subir CV en PDF"
                name="resume"
                accept=".pdf"
                required
                onChange={(event) => handleFileSelect(event.target.files?.[0] ?? null)}
                className="sr-only"
                disabled={isPending}
              />

              {selectedFile ? (
                <div className="w-full max-w-md space-y-3">
                  <div className="flex items-center gap-3 rounded-lg border bg-background p-3 text-left shadow-xs">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <Icons.FileText className="h-5 w-5 text-primary" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">{selectedFile.name}</span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        {formatFileSize(selectedFile.size)}
                      </span>
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={(event) => {
                        event.stopPropagation()
                        clearSelectedFile()
                      }}
                      aria-label="Quitar archivo seleccionado"
                    >
                      <Icons.X className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">Haz clic para reemplazar el archivo.</p>
                </div>
              ) : (
                <div className="flex max-w-md flex-col items-center gap-4">
                  <span className="flex h-14 w-14 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <Icons.Upload className="h-6 w-6" />
                  </span>
                  <div className="space-y-1">
                    <p className="font-semibold text-foreground">Arrastra tu CV aqui</p>
                    <p className="text-sm text-muted-foreground">
                      o <span className="font-semibold text-primary underline underline-offset-4">busca un archivo</span>
                    </p>
                  </div>
                  <div className="flex flex-wrap justify-center gap-2">
                    <Badge variant="neutral">PDF</Badge>
                    <Badge variant="neutral">Max. 10 MB</Badge>
                    <Badge variant="student">Perfil profesional</Badge>
                  </div>
                </div>
              )}
            </div>

            {selectedFile && selectedFile.size > MAX_FILE_SIZE_BYTES && (
              <div className="flex items-start gap-2.5 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm font-medium text-destructive">
                <Icons.AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <p>{t('fileTooLarge')}</p>
              </div>
            )}

            {feedback && (
              <div
                className={cn(
                  'flex items-start gap-2.5 rounded-lg border p-3 text-sm font-medium',
                  feedbackType === 'success'
                    ? 'border-success/20 bg-success/10 text-success'
                    : 'border-border bg-muted/40 text-muted-foreground',
                )}
              >
                {feedbackType === 'success' ? (
                  <Icons.CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                ) : (
                  <Icons.Info className="mt-0.5 h-4 w-4 shrink-0" />
                )}
                <p>{feedback}</p>
              </div>
            )}

            {selectedFile && (
              <Button type="submit" disabled={uploadDisabled} className="w-full" size="lg">
                {isPending ? (
                  <>
                    <Icons.Loader2 className="h-4 w-4 animate-spin" />
                    {t('uploading')}
                  </>
                ) : (
                  <>
                    <Icons.Upload className="h-4 w-4" />
                    Confirmar subida
                  </>
                )}
              </Button>
            )}
          </form>
        </CardContent>
      </Card>

      {resume && (
        <Card>
          <CardHeader className="border-b">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-success/10">
                  <Icons.FileText className="h-4 w-4 text-success" />
                </span>
                <span className="min-w-0">
                  <span className="block">CV actual</span>
                  <span className="mt-1 block text-sm font-normal leading-relaxed text-muted-foreground">
                    Ultima actualizacion: {formatDate(resume.uploadedAt)}
                  </span>
                </span>
              </CardTitle>

              {resume.fileUrl && (
                <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                  <Button variant="outline" size="sm" className="w-full sm:w-auto" asChild>
                    <Link href={resume.fileUrl} target="_blank" rel="noopener noreferrer">
                      <Icons.Download className="h-4 w-4" />
                      Descargar
                    </Link>
                  </Button>
                  <Button size="sm" className="w-full sm:w-auto" asChild>
                    <Link href={resume.fileUrl} target="_blank" rel="noopener noreferrer">
                      <Icons.Eye className="h-4 w-4" />
                      Ver
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>

          <CardContent>
            <div className="relative overflow-hidden rounded-lg border bg-muted/30">
              <div className="aspect-[1/1.414] p-6 opacity-50 sm:p-10">
                <div className="mb-6 border-b-2 border-primary/20 pb-6">
                  <div className="mb-2 h-4 w-3/4 rounded-full bg-foreground/20" />
                  <div className="h-2.5 w-1/2 rounded-full bg-foreground/10" />
                </div>
                <div className="space-y-4">
                  {[60, 45, 70, 50, 55, 40].map((width, index) => (
                    <div
                      key={index}
                      className="h-2 rounded-full bg-foreground/10"
                      style={{ width: `${width}%` }}
                    />
                  ))}
                </div>
                <div className="mt-6 space-y-2">
                  <div className="mb-3 h-2.5 w-1/4 rounded-full bg-primary/20" />
                  {[80, 65, 55].map((width, index) => (
                    <div
                      key={index}
                      className="h-2 rounded-full bg-foreground/10"
                      style={{ width: `${width}%` }}
                    />
                  ))}
                </div>
              </div>

              <div className="absolute inset-x-4 bottom-4 flex flex-col gap-3 rounded-lg border bg-background/95 p-3 shadow-sm backdrop-blur sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">{resume.fileName}</p>
                  <p className="text-xs text-muted-foreground">{formatFileSize(resume.fileSize)} - almacenado seguro</p>
                </div>
                <Badge variant="success">Activo</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
