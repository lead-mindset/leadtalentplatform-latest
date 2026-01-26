import type { StudentForRecruiter } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, GraduationCap, Mail, Phone, Linkedin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface StudentQuickViewProps {
  student: StudentForRecruiter;
}

export function StudentQuickView({ student }: StudentQuickViewProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">{student.name}</CardTitle>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Mail className="h-3 w-3" />
          {student.email}
        </div>
        {student.phone && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Phone className="h-3 w-3" />
            {student.phone}
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {student.StudentProfile?.major && (
          <div className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{student.StudentProfile.major}</span>
            {student.StudentProfile.graduationYear && (
              <Badge variant="secondary">Class of {student.StudentProfile.graduationYear}</Badge>
            )}
          </div>
        )}

        {student.Chapter && (
          <div className="flex items-start gap-2">
            <Building2 className="h-4 w-4 mt-0.5 text-muted-foreground" />
            <div className="text-sm">
              <p className="font-medium">{student.Chapter.name}</p>
              <p className="text-muted-foreground">{student.Chapter.university}</p>
            </div>
          </div>
        )}

        {student.StudentProfile?.skills && student.StudentProfile.skills.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2">Skills</p>
            <div className="flex flex-wrap gap-1">
              {student.StudentProfile.skills.map((skill, i) => (
                <Badge key={i} variant="outline">
                  {skill}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {student.StudentProfile?.linkedinUrl && (
          <Button asChild variant="outline" size="sm" className="w-full gap-2">
            <a href={student.StudentProfile.linkedinUrl} target="_blank" rel="noopener noreferrer">
              <Linkedin className="h-4 w-4" />
              View LinkedIn
            </a>
          </Button>
        )}

        <Button asChild className="w-full">
          <Link href={`/company/students/${student.id}`}>View Full Profile</Link>
        </Button>
      </CardContent>
    </Card>
  );
}