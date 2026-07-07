import { redirect } from 'next/navigation'

export default async function CompanyPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  redirect(`/${locale}/company/dashboard`)
}