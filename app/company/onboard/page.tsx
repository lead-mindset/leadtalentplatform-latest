import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, Clock, AlertCircle } from 'lucide-react';
import Link from 'next/link';

async function checkRecruiterStatus() {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) redirect('/auth/login');

  const { data: userData } = await supabase
    .from('User')
    .select(
      `
      id, email, name, role,
      RecruiterAccess!RecruiterAccess_recruiterId_fkey (
        id, isActive, acceptedAt, revokedAt, inviteExpiresAt,
        Company (name)
      )
    `
    )
    .eq('id', authUser.id)
    .single();

  if (!userData) redirect('/auth/login');

  if (userData.role !== 'recruiter') {
    redirect('/dashboard');
  }

  const activeAccess = Array.isArray(userData.RecruiterAccess)
    ? userData.RecruiterAccess.find((a: any) => a.isActive)
    : null;

  if (activeAccess) {
    redirect('/company/dashboard');
  }

  const pendingInvites = Array.isArray(userData.RecruiterAccess)
    ? userData.RecruiterAccess.filter(
        (a: any) =>
          !a.acceptedAt &&
          !a.revokedAt &&
          (!a.inviteExpiresAt || new Date(a.inviteExpiresAt) > new Date())
      )
    : [];

  return {
    user: userData,
    pendingInvites,
    hasExpiredInvites:
      Array.isArray(userData.RecruiterAccess) &&
      userData.RecruiterAccess.some(
        (a: any) =>
          !a.acceptedAt &&
          !a.revokedAt &&
          a.inviteExpiresAt &&
          new Date(a.inviteExpiresAt) < new Date()
      ),
  };
}

export default async function CompanyOnboardPage() {
  const { user, pendingInvites, hasExpiredInvites } = await checkRecruiterStatus();

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <div className="max-w-2xl w-full space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Welcome to Recruiter Portal</h1>
          <p className="text-muted-foreground">
            You'll need an invitation to access student profiles
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Invitation Required</CardTitle>
            </div>
            <CardDescription>
              Contact your company administrator for an invitation link
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {pendingInvites.length > 0 ? (
              <div className="space-y-3">
                <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <Clock className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-900 dark:text-blue-100">
                      Pending Invitations
                    </p>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      You have {pendingInvites.length} pending invitation(s). Check your
                      email for the invitation link.
                    </p>
                  </div>
                </div>
                {pendingInvites.map((invite: any) => (
                  <div
                    key={invite.id}
                    className="p-3 border rounded-lg flex items-center justify-between"
                  >
                    <div>
                      <p className="font-medium">
                        {invite.Company?.[0]?.name || 'Company'}
                      </p>
                      <p className="text-sm text-muted-foreground">Awaiting acceptance</p>
                    </div>
                    <Button asChild size="sm">
                      <Link href={`/company/join/${invite.id}`}>Accept Invitation</Link>
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-2">No pending invitations</p>
                <p className="text-sm text-muted-foreground">
                  Contact your company admin to request access
                </p>
              </div>
            )}

            {hasExpiredInvites && (
              <div className="flex items-start gap-2 p-3 bg-orange-50 dark:bg-orange-950 rounded-lg">
                <AlertCircle className="h-5 w-5 text-orange-500 mt-0.5" />
                <div>
                  <p className="font-medium text-orange-900 dark:text-orange-100">
                    Expired Invitations
                  </p>
                  <p className="text-sm text-orange-700 dark:text-orange-300">
                    Some of your invitations have expired. Request a new invitation from
                    your administrator.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>How it works</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3 text-sm">
              <li className="flex gap-2">
                <span className="font-semibold">1.</span>
                <span>Your company admin sends you an invitation email</span>
              </li>
              <li className="flex gap-2">
                <span className="font-semibold">2.</span>
                <span>Click the invitation link or accept it here</span>
              </li>
              <li className="flex gap-2">
                <span className="font-semibold">3.</span>
                <span>Get instant access to browse student profiles</span>
              </li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
