'use client';

import { useState } from 'react';
import type { StudentForRecruiter } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Heart, ExternalLink, Building2, GraduationCap } from 'lucide-react';
import Link from 'next/link';

interface StudentsTableProps {
  students: StudentForRecruiter[];
  savedStudentIds?: string[];
}

export function StudentsTable({ students, savedStudentIds = [] }: StudentsTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="text-left p-3 font-medium">Student</th>
            <th className="text-left p-3 font-medium">Major</th>
            <th className="text-left p-3 font-medium">Graduation</th>
            <th className="text-left p-3 font-medium">Chapter</th>
            <th className="text-left p-3 font-medium">Skills</th>
            <th className="text-right p-3 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {students.map((student) => {
            const isSaved = savedStudentIds.includes(student.id);
            
            return (
              <tr key={student.id} className="border-b last:border-0 hover:bg-muted/50">
                <td className="p-3">
                  <div>
                    <p className="font-medium">{student.name}</p>
                    <p className="text-sm text-muted-foreground">{student.email}</p>
                  </div>
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {student.StudentProfile?.major || 'Not specified'}
                    </span>
                  </div>
                </td>
                <td className="p-3">
                  <span className="text-sm">
                    {student.StudentProfile?.graduationYear || 'N/A'}
                  </span>
                </td>
                <td className="p-3">
                  {student.Chapter ? (
                    <div className="flex items-start gap-2">
                      <Building2 className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                      <div className="text-sm">
                        <p className="font-medium">{student.Chapter.name}</p>
                        <p className="text-muted-foreground">{student.Chapter.university}</p>
                      </div>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">No chapter</span>
                  )}
                </td>
                <td className="p-3">
                  <div className="flex flex-wrap gap-1">
                    {student.StudentProfile?.skills?.slice(0, 3).map((skill, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                    {(student.StudentProfile?.skills?.length || 0) > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{student.StudentProfile.skills.length - 3}
                      </Badge>
                    )}
                  </div>
                </td>
                <td className="p-3 text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant={isSaved ? 'default' : 'outline'}
                      size="sm"
                      className="gap-1"
                    >
                      <Heart className={`h-3 w-3 ${isSaved ? 'fill-current' : ''}`} />
                    </Button>
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/company/students/${student.id}`}>
                        View Profile
                      </Link>
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
