"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Search, Download, ExternalLink, AlertCircle } from "lucide-react"

type Student = {
  userId: string
  name: string | null
  email: string
  major: string | null
  graduationYear: number | null
  linkedinUrl: string | null
  skills: string[] | null
  chapterId: string | null
}

type RecruiterInfo = {
  companyName: string
  isActive: boolean
}

export default function DashboardContent() {
  const [students, setStudents] = useState<Student[]>([])
  const [recruiterInfo, setRecruiterInfo] = useState<RecruiterInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    loadDashboard()
  }, [])

async function loadDashboard() {
  try {
    // 1. Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      setError("You must be signed in to view this page")
      setLoading(false)
      return
    }

    // 2. Check if user is an active recruiter
    const { data: recruiterAccess, error: accessError } = await supabase
      .from("RecruiterAccess")
      .select(`
        *,
        Company!RecruiterAccess_companyId_fkey(name)
      `)
      .eq("acceptedByUserId", user.id)
      .eq("isActive", true)
      .single()

    if (accessError || !recruiterAccess) {
      setError("You do not have active recruiter access")
      setLoading(false)
      return
    }

    setRecruiterInfo({
      companyName: recruiterAccess.Company.name,
      isActive: recruiterAccess.isActive,
    })

    // 3. Fetch students who have opted in for recruiter visibility
    const { data: studentProfiles, error: studentsError } = await supabase
      .from("StudentProfile")
      .select(`
        userId,
        major,
        graduationYear,
        linkedinUrl,
        skills,
        User!StudentProfile_userId_fkey(
          id,
          name,
          email,
          chapterId
        )
      `)
      .eq("isRecruiterVisible", true)
      .eq("isFilled", true)

    if (studentsError) {
      console.error("Failed to fetch students:", studentsError)
      setError("Failed to load students")
      setLoading(false)
      return
    }

    // 4. Transform data
    const formattedStudents: Student[] = (studentProfiles || []).map((profile: any) => ({
      userId: profile.userId,
      name: profile.User.name,
      email: profile.User.email,
      major: profile.major,
      graduationYear: profile.graduationYear,
      linkedinUrl: profile.linkedinUrl,
      skills: profile.skills,
      chapterId: profile.User.chapterId,
    }))

    setStudents(formattedStudents)
    setLoading(false)

  } catch (err) {
    console.error("Dashboard error:", err)
    setError("An unexpected error occurred")
    setLoading(false)
  }
}

  // Filter students by search term
  const filteredStudents = students.filter((student) => {
    const search = searchTerm.toLowerCase()
    return (
      student.name?.toLowerCase().includes(search) ||
      student.email.toLowerCase().includes(search) ||
      student.major?.toLowerCase().includes(search) ||
      student.skills?.some(skill => skill.toLowerCase().includes(search))
    )
  })

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="max-w-2xl mx-auto p-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button 
          onClick={() => window.location.href = "/"} 
          className="mt-4"
        >
          Go Home
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Recruiter Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Welcome to {recruiterInfo?.companyName} recruiter portal
        </p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search by name, major, or skills..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-6 rounded-lg border">
          <p className="text-sm text-muted-foreground">Total Students</p>
          <p className="text-3xl font-bold mt-2">{students.length}</p>
        </div>
        <div className="bg-white p-6 rounded-lg border">
          <p className="text-sm text-muted-foreground">Filtered Results</p>
          <p className="text-3xl font-bold mt-2">{filteredStudents.length}</p>
        </div>
        <div className="bg-white p-6 rounded-lg border">
          <p className="text-sm text-muted-foreground">Your Company</p>
          <p className="text-xl font-semibold mt-2">{recruiterInfo?.companyName}</p>
        </div>
      </div>

      {/* Students List */}
      {filteredStudents.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border">
          <p className="text-muted-foreground">
            {searchTerm ? "No students match your search" : "No students have opted in yet"}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredStudents.map((student) => (
            <StudentCard key={student.userId} student={student} />
          ))}
        </div>
      )}
    </div>
  )
}

function StudentCard({ student }: { student: Student }) {
  return (
    <div className="bg-white p-6 rounded-lg border hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h3 className="text-xl font-semibold">{student.name || "Anonymous"}</h3>
          <p className="text-sm text-muted-foreground">{student.email}</p>
          
          <div className="mt-4 space-y-2">
            {student.major && (
              <p className="text-sm">
                <span className="font-medium">Major:</span> {student.major}
              </p>
            )}
            {student.graduationYear && (
              <p className="text-sm">
                <span className="font-medium">Graduation:</span> {student.graduationYear}
              </p>
            )}
            {student.chapterId && (
              <p className="text-sm">
                <span className="font-medium">Chapter:</span> {student.chapterId}
              </p>
            )}
          </div>

          {student.skills && student.skills.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-medium mb-2">Skills:</p>
              <div className="flex flex-wrap gap-2">
                {student.skills.map((skill, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 bg-gray-100 text-sm rounded-full"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 ml-4">
          {student.linkedinUrl && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(student.linkedinUrl!, "_blank")}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              LinkedIn
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.href = `mailto:${student.email}`}
          >
            Contact
          </Button>
        </div>
      </div>
    </div>
  )
}