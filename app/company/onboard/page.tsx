import { Suspense } from "react"
import InviteContent from "./invite-content"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Company Invitation | LEAD",
  description: "Accept your invitation to the LEAD talent platform",
  robots: "noindex",
}

export default function CompanyOnboardPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-xl w-full space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">Company Invitation</h1>
          <p className="text-muted-foreground mt-2">
            Accept your invitation to access LEAD talent
          </p>
        </div>

        <Suspense fallback={<InvitationSkeleton />}>
          <InviteContent />
        </Suspense>
      </div>
    </main>
  )
}

function InvitationSkeleton() {
  return (
    <div className="border rounded-lg p-6 animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-4" />
      <div className="h-4 bg-gray-200 rounded w-1/2" />
    </div>
  )
}