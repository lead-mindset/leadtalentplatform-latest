function normalizeUrl(value: string | undefined | null) {
  const trimmed = value?.trim().replace(/\/+$/, '')
  if (!trimmed) return null

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed
  }

  const isLocalhost =
    trimmed.startsWith('localhost') ||
    trimmed.startsWith('127.0.0.1') ||
    trimmed.startsWith('[::1]')

  return `${isLocalhost ? 'http' : 'https'}://${trimmed}`
}

export function getConfiguredAppUrl(fallback = 'http://localhost:3000') {
  return (
    normalizeUrl(process.env.FRONTEND_URL) ||
    normalizeUrl(process.env.NEXT_PUBLIC_FRONTEND_URL) ||
    normalizeUrl(process.env.NEXT_PUBLIC_APP_URL) ||
    normalizeUrl(process.env.VERCEL_PROJECT_PRODUCTION_URL) ||
    normalizeUrl(process.env.VERCEL_URL) ||
    fallback
  )
}

