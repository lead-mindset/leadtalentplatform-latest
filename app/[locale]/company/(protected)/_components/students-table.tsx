import type { StudentForRecruiter } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Building2, GraduationCap, Mail, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { SaveStudentButton } from './save-student-button'

interface StudentsTableProps {
  students: StudentForRecruiter[]
  savedStudentIds?: string[]
}

export function StudentsTable({ students, savedStudentIds = [] }: StudentsTableProps) {
  const savedStudentIdSet = new Set(savedStudentIds)

  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <div className="hidden lg:block">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40">
            <TableHead className="min-w-[220px] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Perfil</TableHead>
            <TableHead className="min-w-[210px] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Capítulo</TableHead>
            <TableHead className="min-w-[180px] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Área</TableHead>
            <TableHead className="w-[130px] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Graduación</TableHead>
            <TableHead className="min-w-[240px] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Habilidades</TableHead>
            <TableHead className="sticky right-0 z-20 w-[150px] bg-card px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground shadow-[-12px_0_18px_-18px_rgba(15,23,42,0.6)]">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.map((student) => (
            <TableRow key={student.id} className="last:border-0">
              <TableCell className="px-4 py-3 align-top">
                <div className="space-y-1">
                  <p className="font-medium leading-none">{student.name}</p>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Mail className="h-3.5 w-3.5" />
                    <span>{student.email}</span>
                  </div>
                </div>
              </TableCell>
              <TableCell className="px-4 py-3 align-top">
                {student.chapter ? (
                  <div className="flex items-start gap-2">
                    <Building2 className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                    <div className="text-sm">
                      <p className="font-medium">{student.chapter.name}</p>
                      <p className="text-muted-foreground text-xs">{student.chapter.university}</p>
                    </div>
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">Capítulo no registrado</span>
                )}
              </TableCell>
              <TableCell className="px-4 py-3 align-top">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-sm">
                    {student.person_profile?.major_or_interest || 'Área no especificada'}
                  </span>
                </div>
              </TableCell>
              <TableCell className="px-4 py-3 align-top">
                <div className="flex items-center gap-2 text-sm">
                  <GraduationCap className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span>
                    {student.person_profile?.graduation_year
                      ? student.person_profile.graduation_year
                      : 'No registrado'}
                  </span>
                </div>
              </TableCell>
              <TableCell className="px-4 py-3 align-top">
                <div className="flex flex-wrap gap-1">
                  {student.person_profile?.skills?.slice(0, 3).map((skill: string, i: number) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                  {(student.person_profile?.skills?.length || 0) > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{(student.person_profile?.skills?.length || 0) - 3}
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell className="sticky right-0 z-10 bg-card px-4 py-3 text-right align-top shadow-[-12px_0_18px_-18px_rgba(15,23,42,0.6)]">
                <div className="flex justify-end gap-2">
                  <SaveStudentButton
                    studentId={student.id}
                    initialSaved={savedStudentIdSet.has(student.id)}
                    studentName={student.name}
                    compact
                    responsiveLabel
                  />
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/company/students/${student.id}`}>Perfil</Link>
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      </div>

      <div className="divide-y divide-border lg:hidden">
        {students.map((student) => {
          const skills = student.person_profile?.skills ?? []

          return (
            <div key={student.id} className="space-y-4 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <p className="break-words font-semibold text-foreground">{student.name}</p>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Mail className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{student.email}</span>
                  </div>
                </div>
                <SaveStudentButton
                  studentId={student.id}
                  initialSaved={savedStudentIdSet.has(student.id)}
                  studentName={student.name}
                  compact
                  responsiveLabel
                />
              </div>

              <div className="grid gap-3 text-sm">
                <div className="flex items-start gap-2">
                  <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <p className="font-medium">
                      {student.chapter?.name ?? 'Capítulo no registrado'}
                    </p>
                    {student.chapter?.university ? (
                      <p className="text-xs text-muted-foreground">{student.chapter.university}</p>
                    ) : null}
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <span>{student.person_profile?.major_or_interest || 'Área no especificada'}</span>
                </div>
                <div className="flex items-start gap-2">
                  <GraduationCap className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <span>
                    {student.person_profile?.graduation_year
                      ? `Promoción ${student.person_profile.graduation_year}`
                      : 'Año de graduación no registrado'}
                  </span>
                </div>
              </div>

              {skills.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {skills.slice(0, 4).map((skill: string, i: number) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                  {skills.length > 4 ? (
                    <Badge variant="outline" className="text-xs">
                      +{skills.length - 4}
                    </Badge>
                  ) : null}
                </div>
              ) : null}

              <Button asChild variant="outline" className="w-full">
                <Link href={`/company/students/${student.id}`}>Ver perfil</Link>
              </Button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
