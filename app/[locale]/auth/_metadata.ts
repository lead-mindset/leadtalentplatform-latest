import type { Metadata } from 'next'

type AuthMetadataKey = 'login' | 'signUp' | 'forgotPassword' | 'updatePassword'

const AUTH_METADATA: Record<'en' | 'es', Record<AuthMetadataKey, Metadata>> = {
  en: {
    login: {
      title: 'Sign in - LEAD Talent Platform',
      description: 'Sign in to your LEAD Talent Platform account.',
    },
    signUp: {
      title: 'Create account - LEAD Talent Platform',
      description: 'Create your LEAD Talent Platform account.',
    },
    forgotPassword: {
      title: 'Reset password - LEAD Talent Platform',
      description: 'Request a password reset link for your LEAD Talent Platform account.',
    },
    updatePassword: {
      title: 'Update password - LEAD Talent Platform',
      description: 'Save a new password for your LEAD Talent Platform account.',
    },
  },
  es: {
    login: {
      title: 'Iniciar sesion - Plataforma de Talento LEAD',
      description: 'Inicia sesion en tu cuenta de la Plataforma de Talento LEAD.',
    },
    signUp: {
      title: 'Crear cuenta - Plataforma de Talento LEAD',
      description: 'Crea tu cuenta en la Plataforma de Talento LEAD.',
    },
    forgotPassword: {
      title: 'Restablecer contrasena - Plataforma de Talento LEAD',
      description: 'Solicita un enlace para restablecer la contrasena de tu cuenta LEAD.',
    },
    updatePassword: {
      title: 'Actualizar contrasena - Plataforma de Talento LEAD',
      description: 'Guarda una nueva contrasena para tu cuenta LEAD.',
    },
  },
}

export async function getAuthMetadata(
  params: Promise<{ locale: string }> | { locale: string },
  key: AuthMetadataKey
): Promise<Metadata> {
  const { locale } = await params
  return AUTH_METADATA[locale === 'en' ? 'en' : 'es'][key]
}
