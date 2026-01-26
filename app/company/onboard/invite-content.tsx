"use client"

import { useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, CheckCircle2, XCircle, Mail, Clock, AlertCircle } from "lucide-react"

type InviteState = 
  | { status: "loading" }
  | { status: "invalid"; message: string }
  | { status: "valid"; companyName: string; recruiterEmail: string; inviteId: string }
  | { status: "accepted" }

type PendingInvite = {
  id: string
  recruiterEmail: string
  inviteToken: string
  inviteExpiresAt: string | null
  Company: Array<{ name: string }> | { name: string }
}

export default function InviteContent({ 
  pendingInvites, 
  hasExpiredInvites 
}: { 
  pendingInvites: PendingInvite[]
  hasExpiredInvites: boolean 
}) {
  const params = useSearchParams()
  const token = params.get("token")
  const [state, setState] = useState<InviteState | null>(null)
  const [isAccepting, setIsAccepting] = useState(false)

  useEffect(() => {
    if (token) {
      verifyInvite(token)
    }
  }, [token])

  async function verifyInvite(token: string) {
    setState({ status: "loading" })
    
    try {
      
      const { data: invite, error } = await supabase
        .from('RecruiterAccess')
        .select(`
          id, recruiterEmail, inviteToken, inviteExpiresAt, 
          acceptedAt, revokedAt,
          Company (name)
        `)
        .eq('inviteToken', token)
        .single()

      if (error || !invite) {
        setState({ status: "invalid", message: "Invalid invitation token" })
        return
      }

      if (invite.acceptedAt) {
        setState({ status: "invalid", message: "This invitation has already been accepted" })
        return
      }

      if (invite.revokedAt) {
        setState({ status: "invalid", message: "This invitation has been revoked" })
        return
      }

      if (invite.inviteExpiresAt && new Date(invite.inviteExpiresAt) < new Date()) {
        setState({ status: "invalid", message: "This invitation has expired" })
        return
      }

      const companyName = Array.isArray(invite.Company) 
        ? invite.Company[0]?.name 
        : invite.Company?.name

      setState({ 
        status: "valid", 
        companyName: companyName || "Unknown Company",
        recruiterEmail: invite.recruiterEmail,
        inviteId: invite.id
      })
    } catch (error) {
      console.error('Verify error:', error)
      setState({ status: "invalid", message: "Failed to verify invitation" })
    }
  }

  async function handleAccept(inviteId: string) {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      const callbackUrl = encodeURIComponent(window.location.href)
      window.location.href = `/auth/login?redirect=${callbackUrl}`
      return
    }

    setIsAccepting(true)
    try {
      const { error } = await supabase
        .from('RecruiterAccess')
        .update({
          acceptedAt: new Date().toISOString(),
          acceptedByUserId: user.id,
          isActive: true,
        })
        .eq('id', inviteId)

      if (error) {
        alert("Failed to accept invitation: " + error.message)
        return
      }

      setState({ status: "accepted" })
      
      setTimeout(() => {
        window.location.href = "/company"
      }, 1500)
    } catch (error) {
      console.error('Accept error:', error)
      alert("An error occurred while accepting the invitation")
    } finally {
      setIsAccepting(false)
    }
  }

  // Token-based invite flow
  if (token) {
    if (!state || state.status === "loading") {
      return (
        <Card>
          <CardContent className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </CardContent>
        </Card>
      )
    }

    if (state.status === "invalid") {
      return (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )
    }

    if (state.status === "accepted") {
      return (
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>
            Invitation accepted! Redirecting to browse students...
          </AlertDescription>
        </Alert>
      )
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle>Accept Your Invitation</CardTitle>
          <CardDescription>{state.companyName}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Mail className="h-4 w-4" />
              {state.recruiterEmail}
            </p>
          </div>

          <p className="text-sm">
            You've been invited to access the LEAD talent platform for <strong>{state.companyName}</strong>.
          </p>

          <Button 
            onClick={() => handleAccept(state.inviteId)} 
            disabled={isAccepting}
            className="w-full"
          >
            {isAccepting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Accepting...
              </>
            ) : (
              "Accept Invitation"
            )}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            By accepting, you'll be able to view opted-in student profiles
          </p>
        </CardContent>
      </Card>
    )
  }

  // No token - show pending invites
  return (
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
            {pendingInvites.map((invite) => {
              const companyName = Array.isArray(invite.Company)
                ? invite.Company[0]?.name
                : invite.Company?.name

              return (
                <div
                  key={invite.id}
                  className="p-3 border rounded-lg flex items-center justify-between"
                >
                  <div>
                    <p className="font-medium">{companyName || 'Company'}</p>
                    <p className="text-sm text-muted-foreground">
                      Sent to {invite.recruiterEmail}
                    </p>
                  </div>
                  <Button 
                    size="sm"
                    onClick={() => handleAccept(invite.id)}
                    disabled={isAccepting}
                  >
                    {isAccepting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Accept"
                    )}
                  </Button>
                </div>
              )
            })}
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
  )
}