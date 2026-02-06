'use client';

import { useEffect } from 'react';
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
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <CardTitle>Something went wrong</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            We encountered an error while loading this page. Please try again.
          </p>
          {error.message && (
            <div className="bg-muted p-3 rounded-lg">
              <p className="text-xs font-mono">{error.message}</p>
            </div>
          )}
          <div className="flex gap-2">
            <Button onClick={reset} variant="default">
              Try Again
            </Button>
            <Button asChild variant="outline">
              <a href="/company/dashboard">Go to Dashboard</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}