import { requireRecruiter, getStudentById } from '@/lib/company-actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Building2,
  GraduationCap,
  Mail,
  Phone,
  Linkedin,
  Heart,
  ArrowLeft,
  Calendar,
} from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export default async function StudentProfilePage({
  params,
}: {
  params: { id: string };
}) {
  const { supabase, user } = await requireRecruiter();
  const student = await getStudentById(supabase, params.id);

  if (!student) {
    notFound();
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="sm">
          <Link href="/company">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Browse
          </Link>
        </Button>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">{student.name}</h1>
          <div className="flex items-center gap-4 text-muted-foreground">
            <div className="flex items-center gap-1">
              <Mail className="h-4 w-4" />
              <span>{student.email}</span>
            </div>
            {student.phone && (
              <div className="flex items-center gap-1">
                <Phone className="h-4 w-4" />
                <span>{student.phone}</span>
              </div>
            )}
          </div>
        </div>
        <Button className="gap-2">
          <Heart className="h-4 w-4" />
          Save Student
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Education</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {student.StudentProfile?.major && (
              <div className="flex items-start gap-3">
                <GraduationCap className="h-5 w-5 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="font-medium">{student.StudentProfile.major}</p>
                  <p className="text-sm text-muted-foreground">Major</p>
                </div>
              </div>
            )}

            {student.StudentProfile?.graduationYear && (
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Class of {student.StudentProfile.graduationYear}</p>
                  <p className="text-sm text-muted-foreground">Expected Graduation</p>
                </div>
              </div>
            )}

            {student.Chapter && (
              <div className="flex items-start gap-3">
                <Building2 className="h-5 w-5 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="font-medium">{student.Chapter.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {student.Chapter.university}
                  </p>
                  {(student.Chapter.city || student.Chapter.region) && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {[student.Chapter.city, student.Chapter.region]
                        .filter(Boolean)
                        .join(', ')}
                    </p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Skills</CardTitle>
            <CardDescription>Technical and professional skills</CardDescription>
          </CardHeader>
          <CardContent>
            {student.StudentProfile?.skills && student.StudentProfile.skills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {student.StudentProfile.skills.map((skill, i) => (
                  <Badge key={i} variant="secondary">
                    {skill}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No skills listed</p>
            )}
          </CardContent>
        </Card>
      </div>

      {student.StudentProfile?.linkedinUrl && (
        <Card>
          <CardHeader>
            <CardTitle>Professional Links</CardTitle>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="gap-2">
              <a
                href={student.StudentProfile.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Linkedin className="h-4 w-4" />
                View LinkedIn Profile
              </a>
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
          <CardDescription>Reach out to this student</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <a href={`mailto:${student.email}`} className="text-sm hover:underline">
              {student.email}
            </a>
          </div>
          {student.phone && (
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <a href={`tel:${student.phone}`} className="text-sm hover:underline">
                {student.phone}
              </a>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}