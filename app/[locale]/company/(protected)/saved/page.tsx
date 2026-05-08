import { getSavedStudents } from '@/lib/actions/company/get-data';
import { requireRecruiter } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart, Users } from 'lucide-react';
import { StudentsTable } from '../_components/students-table';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { MainContainer } from '@/components/global/main-container';
import { PageHeader } from '@/components/ui/page-header';

export default async function SavedStudentsPage() {
  const { supabase, user } = await requireRecruiter();
  const saved_students = await getSavedStudents(supabase, user.id);

  const students = saved_students.map((s) => s.student);
  const savedStudentIds = students.map((s) => s.id);

  return (
    <MainContainer className="space-y-5 py-8">
      <PageHeader
        eyebrow="Company portal"
        title="Saved Talent"
        description="Keep promising visible profiles in one place for follow-up."
        actions={
          <div className="rounded-lg border bg-card px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Heart className="h-4 w-4" />
            Saved profiles
          </div>
          <p className="mt-1 text-2xl font-semibold">{saved_students.length}</p>
        </div>
        }
      />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle>Your Saved Talent</CardTitle>
            <CardDescription>
              {saved_students.length} saved profile{saved_students.length !== 1 ? 's' : ''} available to your company.
            </CardDescription>
          </div>
          <Heart className="h-5 w-5 text-red-500" />
        </CardHeader>
        <CardContent>
          {saved_students.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="font-medium mb-2">No saved talent yet</p>
              <p className="text-sm text-muted-foreground mb-4">
                Save profiles while browsing to build a focused follow-up list.
              </p>
              <Button asChild>
                <Link href="/company/browse">Browse Talent</Link>
              </Button>
            </div>
          ) : (
            <StudentsTable students={students} savedStudentIds={savedStudentIds} />
          )}
        </CardContent>
      </Card>
    </MainContainer>
  );
}
