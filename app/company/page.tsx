import { requireRecruiter, getVisibleStudents, getSavedStudents } from '@/lib/company-actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';
import { StudentsTable } from './_components/students-table';
import { SearchFilter } from './_components/search-filter';

export default async function CompanyPage() {
  const { supabase, user } = await requireRecruiter();
  
  const [students, savedStudents] = await Promise.all([
    getVisibleStudents(supabase),
    getSavedStudents(supabase, user.id),
  ]);

  const savedStudentIds = savedStudents.map((s) => s.studentId);

  if (students.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              <CardTitle>No Students Available</CardTitle>
            </div>
            <CardDescription>
              There are currently no student profiles visible to recruiters. Check back later.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Browse Students</h1>
        <p className="text-muted-foreground">
          Discover talented students from chapters across the network
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{students.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saved Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{savedStudents.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Views</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Search & Filter</CardTitle>
          <CardDescription>Find students that match your criteria</CardDescription>
        </CardHeader>
        <CardContent>
          <SearchFilter />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Students</CardTitle>
          <CardDescription>
            {students.length} students available for recruitment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <StudentsTable students={students} savedStudentIds={savedStudentIds} />
        </CardContent>
      </Card>
    </div>
  );
}