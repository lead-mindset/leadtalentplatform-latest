export type PasswordPolicyLocale = 'en' | 'es'

export function isStrongPassword(password: string): boolean {
  return (
    password.length >= 8 &&
    /[A-Za-z]/.test(password) &&
    /\d/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  )
}

export function getPasswordPolicyMessage(locale: PasswordPolicyLocale = 'es'): string {
  if (locale === 'en') {
    return 'Use at least 8 characters with one letter, one number, and one symbol.'
  }

  return 'Usa al menos 8 caracteres con una letra, un numero y un simbolo.'
}
