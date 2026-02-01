import { getSavedStudents } from '@/lib/actions/company/get-data';
import { requireRecruiter } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart } from 'lucide-react';
import { StudentsTable } from '../_components/students-table';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default async function SavedStudentsPage() {
  const { supabase, user } = await requireRecruiter();
  const savedStudents = await getSavedStudents(supabase, user.id);

  // Extract just the student data
  const students = savedStudents.map((s) => s.Student);
  const savedStudentIds = students.map((s) => s.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Saved Students</h1>
        <p className="text-muted-foreground">
          Students you've saved for future reference
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle>Your Collection</CardTitle>
            <CardDescription>{savedStudents.length} saved students</CardDescription>
          </div>
          <Heart className="h-5 w-5 text-red-500" />
        </CardHeader>
        <CardContent>
          {savedStudents.length === 0 ? (
            <div className="text-center py-12">
              <Heart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-2">No saved students yet</p>
              <p className="text-sm text-muted-foreground mb-4">
                Save students while browsing to build your collection
              </p>
              <Button asChild>
                <Link href="/company">Browse Students</Link>
              </Button>
            </div>
          ) : (
            <StudentsTable students={students} savedStudentIds={savedStudentIds} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}