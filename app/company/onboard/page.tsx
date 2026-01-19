import { Suspense } from "react"
import InviteContent from "./invite-content"

export default function CompanyOnboardPage() {
  return (
    <main className="max-w-xl mx-auto p-10">
      <h1 className="text-2xl font-bold">Company Invitation</h1>

      <Suspense fallback={<p className="mt-4">Loading invitation…</p>}>
        <InviteContent />
      </Suspense>
    </main>
  )
}
