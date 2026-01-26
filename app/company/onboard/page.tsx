import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Clock, AlertCircle } from 'lucide-react';
import { Suspense } from 'react';
import InviteContent from './invite-content';

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
      RecruiterAccess!RecruiterAccess_acceptedByUserId_fkey (
        id, isActive, acceptedAt, revokedAt, inviteExpiresAt, inviteToken,
        Company (name)
      )
    `
    )
    .eq('id', authUser.id)
    .single();

  if (!userData) redirect('/auth/login');

  // If they're not a recruiter, redirect away
  if (userData.role !== 'recruiter') {
    redirect('/dashboard');
  }

  // Check for active access
  const activeAccess = Array.isArray(userData.RecruiterAccess)
    ? userData.RecruiterAccess.find((a: any) => a.isActive && !a.revokedAt)
    : null;

  if (activeAccess) {
    // They have active access, redirect to browse page
    redirect('/company');
  }

  // Check for pending invites by email
  const { data: pendingByEmail } = await supabase
    .from('RecruiterAccess')
    .select(
      `
      id, recruiterEmail, inviteExpiresAt, acceptedAt, revokedAt, inviteToken,
      Company (name)
    `
    )
    .eq('recruiterEmail', userData.email)
    .is('acceptedAt', null)
    .is('revokedAt', null);

  const pendingInvites = (pendingByEmail || []).filter(
    (a: any) => !a.inviteExpiresAt || new Date(a.inviteExpiresAt) > new Date()
  );

  return {
    user: userData,
    pendingInvites,
    hasExpiredInvites: (pendingByEmail || []).some(
      (a: any) => a.inviteExpiresAt && new Date(a.inviteExpiresAt) < new Date()
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

        <Suspense fallback={<div>Loading...</div>}>
          <InviteContent 
            pendingInvites={pendingInvites}
            hasExpiredInvites={hasExpiredInvites}
          />
        </Suspense>

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
                <span>Click the invitation link in your email</span>
              </li>
              <li className="flex gap-2">
                <span className="font-semibold">3.</span>
                <span>Accept the invitation to get instant access</span>
              </li>
              <li className="flex gap-2">
                <span className="font-semibold">4.</span>
                <span>Browse and connect with talented students</span>
              </li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}