import { Suspense } from "react"
import DashboardContent from "./dashboard-content"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Recruiter Dashboard | LEAD",
  description: "Access LEAD talent",
}

export default function CompanyDashboardPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent />
      </Suspense>
    </main>
  )
}

function DashboardSkeleton() {
  return (
    <div className="max-w-7xl mx-auto p-8">
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-8" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-gray-200 rounded" />
          ))}
        </div>
      </div>
    </div>
  )
}