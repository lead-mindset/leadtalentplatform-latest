export type AuthFormLocale = 'en' | 'es'

export function isValidAuthEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

export function getAuthEmailValidationMessage(locale: AuthFormLocale = 'es'): string {
  if (locale === 'en') return 'Enter a valid email address.'
  return 'Ingresa un correo electronico valido.'
}

