"use client"

import { useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, CheckCircle2, XCircle, Mail } from "lucide-react"

type InviteState = 
  | { status: "loading" }
  | { status: "invalid"; message: string }
  | { status: "valid"; companyName: string; recruiterEmail: string }
  | { status: "accepted" }

export default function InviteContent() {
  const params = useSearchParams()
  const token = params.get("token")
  const [state, setState] = useState<InviteState>({ status: "loading" })
  const [isAccepting, setIsAccepting] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    if (!token) {
      setState({ status: "invalid", message: "Missing invitation token" })
      return
    }

    verifyInvite(token)
  }, [token])

  async function verifyInvite(token: string) {
    try {
      const res = await fetch(`/api/company/invite?token=${token}`)
      const data = await res.json()

      if (!res.ok) {
        setState({ status: "invalid", message: data.error || "Invalid invitation" })
        return
      }

      setState({ 
        status: "valid", 
        companyName: data.companyName,
        recruiterEmail: data.recruiterEmail 
      })
    } catch (error) {
      setState({ status: "invalid", message: "Failed to verify invitation" })
    }
  }

  async function handleAccept() {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      const callbackUrl = encodeURIComponent(`/company/onboard?token=${token}`)
      window.location.href = `/auth/signin?redirect=${callbackUrl}`
      return
    }

    setIsAccepting(true)
    try {
      const res = await fetch("/api/company/accept-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      })

      if (!res.ok) {
        const data = await res.json()
        alert(data.error || "Failed to accept invitation")
        return
      }

      setState({ status: "accepted" })
      
      setTimeout(() => {
        window.location.href = "/company/dashboard"
      }, 2000)
    } catch (error) {
      alert("An error occurred")
    } finally {
      setIsAccepting(false)
    }
  }

  // Loading state
  if (state.status === "loading") {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // Invalid/expired state
  if (state.status === "invalid") {
    return (
      <Alert variant="destructive">
        <XCircle className="h-4 w-4" />
        <AlertDescription>{state.message}</AlertDescription>
      </Alert>
    )
  }

  // Accepted state
  if (state.status === "accepted") {
    return (
      <Alert>
        <CheckCircle2 className="h-4 w-4" />
        <AlertDescription>
          Invitation accepted! Redirecting to dashboard...
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="border rounded-lg p-6 space-y-4">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">{state.companyName}</h2>
        <p className="text-sm text-muted-foreground flex items-center gap-2">
          <Mail className="h-4 w-4" />
          {state.recruiterEmail}
        </p>
      </div>

      <p className="text-sm">
        You've been invited to access the LEAD talent platform for <strong>{state.companyName}</strong>.
      </p>

      <Button 
        onClick={handleAccept} 
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
    </div>
  )
}