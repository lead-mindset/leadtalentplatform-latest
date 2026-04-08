'use client'

import { useMemo, useState } from 'react'
import { StudentCard } from '../browse/student-card'
import type { TalentPoolStudent } from '@/lib/actions/recruiter/talent-pool'

type SavedStudentsGridProps = {
  initialStudents: TalentPoolStudent[]
  returnToBase: string
}

export function SavedStudentsGrid({ initialStudents, returnToBase }: SavedStudentsGridProps) {
  const [students, setStudents] = useState(initialStudents)

  const cards = useMemo(
    () =>
      students.map(student => {
        const profileHref = `/recruiter/${student.id}?returnTo=${encodeURIComponent(returnToBase)}`
        return (
          <StudentCard
            key={student.id}
            student={student}
            isSaved={true}
            profileHref={profileHref}
            onSavedChange={isSaved => {
              if (!isSaved) {
                setStudents(prev => prev.filter(item => item.id !== student.id))
              }
            }}
          />
        )
      }),
    [returnToBase, students]
  )

  return <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{cards}</div>
}
