import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Building } from 'lucide-react';
import Link from 'next/link';

async function processInvite(inviteId: string) {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    // Redirect to login with callback
    redirect(`/auth/login?redirect=${encodeURIComponent(`/company/join/${inviteId}`)}`);
  }

  // Fetch the user to verify they're a recruiter
  const { data: userData } = await supabase
    .from('User')
    .select('id, role')
    .eq('id', authUser.id)
    .single();

  if (!userData || userData.role !== 'recruiter') {
    return {
      success: false,
      error: 'You must have a recruiter account to accept this invitation',
    };
  }

  // Fetch invite details
  const { data: invite } = await supabase
    .from('RecruiterAccess')
    .select(
      `
      id, 
      recruiterEmail,
      inviteExpiresAt,
      acceptedAt,
      revokedAt,
      Company (name)
    `
    )
    .eq('id', inviteId)
    .single();

  if (!invite) {
    return { success: false, error: 'Invitation not found' };
  }

  if (invite.acceptedAt) {
    return { success: false, error: 'This invitation has already been accepted' };
  }

  if (invite.revokedAt) {
    return { success: false, error: 'This invitation has been revoked' };
  }

  if (invite.inviteExpiresAt && new Date(invite.inviteExpiresAt) < new Date()) {
    return { success: false, error: 'This invitation has expired' };
  }

  // Accept the invite
  const { error } = await supabase
    .from('RecruiterAccess')
    .update({
      acceptedAt: new Date().toISOString(),
      acceptedByUserId: authUser.id,
      isActive: true,
    })
    .eq('id', inviteId);

  if (error) {
    return { success: false, error: 'Failed to accept invitation' };
  }

  const companyName = Array.isArray(invite.Company)
    ? invite.Company[0]?.name
    : invite.Company?.name;

  return {
    success: true,
    companyName,
  };
}

export default async function JoinCompanyPage({
  params,
}: {
  params: { token: string };
}) {
  const result = await processInvite(params.token);

  if (result.success) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="h-6 w-6 text-green-500" />
              <CardTitle>Invitation Accepted!</CardTitle>
            </div>
            <CardDescription>
              You now have access to the recruiter portal
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {result.companyName && (
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <Building className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">{result.companyName}</p>
                  <p className="text-sm text-muted-foreground">Your company</p>
                </div>
              </div>
            )}
            <Button asChild className="w-full">
              <Link href="/company">Browse Students</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <XCircle className="h-6 w-6 text-destructive" />
            <CardTitle>Invitation Error</CardTitle>
          </div>
          <CardDescription>Unable to accept this invitation</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-3 bg-destructive/10 rounded-lg">
            <p className="text-sm text-destructive">{result.error}</p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline" className="flex-1">
              <Link href="/company/onboard">Back to Onboarding</Link>
            </Button>
            <Button asChild className="flex-1">
              <Link href="/auth/login">Login</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}