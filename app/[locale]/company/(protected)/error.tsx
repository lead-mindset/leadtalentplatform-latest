'use client';

import { useEffect } from 'react';
import { Link } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

export default function CompanyError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Company route error:', error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <CardTitle>Algo salio mal</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Ocurrio un error al cargar esta pagina. Intentalo de nuevo.
          </p>
          {error.message ? (
            <div className="rounded-lg bg-muted p-3">
              <p className="text-xs font-mono">{error.message}</p>
            </div>
          ) : null}
          <div className="flex gap-2">
            <Button onClick={reset} variant="default">
              Intentar de nuevo
            </Button>
            <Button asChild variant="outline">
              <Link href="/company/dashboard">Ir al resumen</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
