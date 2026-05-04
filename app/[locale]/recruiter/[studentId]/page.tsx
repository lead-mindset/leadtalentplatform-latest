import { redirect } from 'next/navigation'

type RecruiterStudentRedirectPageProps = {
  params: Promise<{ studentId: string }>
}

export default async function RecruiterStudentRedirectPage({
  params,
}: RecruiterStudentRedirectPageProps) {
  const { studentId } = await params

  redirect(`/company/students/${studentId}`)
}
