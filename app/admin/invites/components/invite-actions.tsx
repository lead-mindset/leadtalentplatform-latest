'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Loader2, Mail, XCircle } from 'lucide-react';
import { revokeInvite, resendInvite } from '@/lib/admin-invite-actions';

interface InviteActionsProps {
  inviteId: string;
  status: 'pending' | 'accepted' | 'expired' | 'revoked';
}

export function InviteActions({ inviteId, status }: InviteActionsProps) {
  const router = useRouter();
  const [isRevoking, setIsRevoking] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const handleRevoke = async () => {
    setIsRevoking(true);
    const result = await revokeInvite(inviteId);
    
    if (result.success) {
      router.refresh();
    } else {
      alert(result.error);
    }
    
    setIsRevoking(false);
  };

  const handleResend = async () => {
    setIsResending(true);
    const result = await resendInvite(inviteId);
    
    if (result.success) {
      alert(result.message);
      router.refresh();
    } else {
      alert(result.error);
    }
    
    setIsResending(false);
  };

  if (status === 'accepted') {
    return (
      <span className="text-sm text-muted-foreground">
        Active
      </span>
    );
  }

  if (status === 'revoked') {
    return (
      <span className="text-sm text-muted-foreground">
        Revoked
      </span>
    );
  }

  return (
    <div className="flex gap-2">
      {(status === 'pending' || status === 'expired') && (
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={handleResend}
            disabled={isResending}
          >
            {isResending && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
            <Mail className="h-3 w-3 mr-1" />
            Resend
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                disabled={isRevoking}
              >
                {isRevoking && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                <XCircle className="h-3 w-3 mr-1" />
                Revoke
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Revoke Invitation</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to revoke this invitation? This action cannot be undone.
                  The recruiter will no longer be able to use this invite link.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleRevoke}>
                  Revoke
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </div>
  );
}