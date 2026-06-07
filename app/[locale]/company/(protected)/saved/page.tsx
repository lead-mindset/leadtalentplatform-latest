import { getSavedStudentsResult } from '@/lib/actions/company/get-data';
import { requireRecruiter } from '@/lib/auth';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Heart, Users } from 'lucide-react';
import { StudentsTable } from '../_components/students-table';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { MainContainer } from '@/components/global/main-container';
import { PageHeader } from '@/components/ui/page-header';

export default async function SavedStudentsPage() {
  const { supabase, user } = await requireRecruiter();
  const savedStudentsResult = await getSavedStudentsResult(supabase, user.id);
  const saved_students = savedStudentsResult.data;

  const students = saved_students.map((s) => s.student);
  const savedStudentIds = students.map((s) => s.id);

  return (
    <MainContainer className="space-y-5 py-8">
      <PageHeader
        eyebrow="Portal de empresa"
        title="Talento guardado"
        description="Guarda perfiles visibles prometedores en un solo lugar para seguimiento."
        actions={
          <div className="rounded-lg border bg-card px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Heart className="h-4 w-4" />
            Perfiles guardados
          </div>
          <p className="mt-1 text-2xl font-semibold">{saved_students.length}</p>
        </div>
        }
      />

      {!savedStudentsResult.success ? (
        <Alert variant="warning">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No pudimos cargar tu talento guardado</AlertTitle>
          <AlertDescription>
            Esto puede ser temporal. Tus perfiles guardados no se perdieron; intenta nuevamente en unos minutos.
          </AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle>Tu talento guardado</CardTitle>
            <CardDescription>
              {saved_students.length} perfil{saved_students.length !== 1 ? 'es' : ''} guardado{saved_students.length !== 1 ? 's' : ''} disponible{saved_students.length !== 1 ? 's' : ''} para tu empresa.
            </CardDescription>
          </div>
          <Heart className="h-5 w-5 text-red-500" />
        </CardHeader>
        <CardContent>
          {saved_students.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="font-medium mb-2">
                {savedStudentsResult.success ? 'Todavia no hay talento guardado' : 'Talento guardado no disponible'}
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                {savedStudentsResult.success
                  ? 'Guarda perfiles mientras exploras para construir una lista enfocada de seguimiento.'
                  : 'No mostramos una lista vacía porque la carga falló. Vuelve a intentar en unos minutos.'}
              </p>
              <Button asChild>
                <Link href="/company/browse">Explorar talento</Link>
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
