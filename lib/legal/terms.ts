// ─────────────────────────────────────────────────────────────────────────────
// LEGAL DOCUMENT — DO NOT EDIT WITHOUT LEGAL REVIEW
// Last reviewed: March 6, 2026
// When Cristhy finalises the text, replace the strings below and bump the date.
// ─────────────────────────────────────────────────────────────────────────────

const LAST_UPDATED = 'March 6, 2026'

type Section = {
  title: string
  body: string
  list?: string[]
}

type TermsContent = {
  meta: { title: string; description: string }
  badge: string
  title: string
  intro: string
  sections: Section[]
}

const en: TermsContent = {
  meta: {
    title: 'Terms of Service – LEAD Talent Platform',
    description: 'Terms and conditions for using the LEAD Talent Platform.',
  },
  badge: `Last updated: ${LAST_UPDATED}`,
  title: 'Terms of Service',
  intro:
    'By creating an account on LEAD Talent Platform, you agree to these Terms. Please read them carefully.',
  sections: [
    {
      title: '1. About the Platform',
      body: 'LEAD Talent Platform is an internal talent management system exclusively for members of LEAD MINDSET. It is not a public social network or directory. Access is restricted to verified LEAD members, chapter editors, and formally invited company representatives.',
    },
    {
      title: '2. Eligibility',
      body: 'To use this platform you must:',
      list: [
        'Be at least 18 years old',
        'Be an active member of a recognised LEAD chapter',
        'Provide accurate and truthful information during registration',
        'Agree to these Terms and our Privacy Policy',
      ],
    },
    {
      title: '3. Your Account',
      body: 'You are responsible for the confidentiality of your credentials. You must notify LEAD immediately if you suspect unauthorised access to your account. You may not share or transfer your account to any other person.',
    },
    {
      title: '4. Acceptable Use',
      body: 'You agree to use the platform only for its intended purposes. You must not:',
      list: [
        "Upload false, misleading, or inaccurate information",
        "Attempt to access other users' data without authorisation",
        "Use the platform for any commercial purpose not authorised by LEAD",
        "Interfere with or disrupt the platform's infrastructure",
        "Upload content that is illegal, harmful, or infringes third-party rights",
      ],
    },
    {
      title: '5. Profile Visibility & Consent',
      body: 'Your profile is private by default. You may voluntarily opt in to make it visible to partner companies. You may revoke this consent at any time from your settings. LEAD does not guarantee employment or interview outcomes resulting from profile visibility.',
    },
    {
      title: '6. Your Content',
      body: "You retain ownership of all content you upload, including your résumé and profile information. By uploading content, you grant LEAD a limited, non-exclusive licence to store and display it for the purposes described in the Privacy Policy. You are solely responsible for ensuring your content does not infringe third-party rights.",
    },
    {
      title: '7. Platform Availability',
      body: "LEAD provides this platform on a best-effort basis and does not guarantee uninterrupted or error-free access. We reserve the right to suspend or modify any features, with reasonable notice where possible.",
    },
    {
      title: '8. Account Termination',
      body: 'You may delete your account at any time from your settings. LEAD may suspend or terminate your account if you violate these Terms, provide false information, or cease to be an active LEAD member. Your data will be handled in accordance with our Privacy Policy upon termination.',
    },
    {
      title: '9. Limitation of Liability',
      body: 'To the maximum extent permitted by applicable law, LEAD shall not be liable for any indirect, incidental, or consequential damages arising from use of the platform. LEAD is not responsible for decisions made by partner companies based on your profile.',
    },
    {
      title: '10. Changes to These Terms',
      body: 'We may update these Terms periodically. Significant changes will be communicated by email or a notice on the platform before taking effect. Continued use after publication constitutes acceptance of the updated Terms.',
    },
    {
      title: '11. Governing Law',
      body: 'These Terms are governed by the laws of the Republic of Peru. Any disputes shall be resolved by the competent courts of Lima, Peru.',
    },
    {
      title: '12. Contact',
      body: 'For questions about these Terms:\n\nASOCIACIÓN LEAD MINDSET\n[Address, Lima, Peru]\n[contact@leadmindset.org]',
    },
  ],
}

const es: TermsContent = {
  meta: {
    title: 'Términos de Servicio – LEAD Talent Platform',
    description: 'Términos y condiciones de uso de LEAD Talent Platform.',
  },
  badge: `Última actualización: ${LAST_UPDATED}`,
  title: 'Términos de Servicio',
  intro:
    'Al crear una cuenta en LEAD Talent Platform, aceptas estos Términos. Por favor léelos detenidamente.',
  sections: [
    {
      title: '1. Sobre la Plataforma',
      body: 'LEAD Talent Platform es un sistema interno de gestión de talento exclusivo para miembros de LEAD MINDSET. No es una red social ni un directorio público. El acceso está restringido a miembros verificados de LEAD, editores de capítulo y representantes de empresas formalmente invitados.',
    },
    {
      title: '2. Requisitos de Acceso',
      body: 'Para usar esta plataforma debes:',
      list: [
        'Tener al menos 18 años',
        'Ser miembro activo de un capítulo LEAD reconocido',
        'Proporcionar información veraz y precisa durante el registro',
        'Aceptar estos Términos y nuestra Política de Privacidad',
      ],
    },
    {
      title: '3. Tu Cuenta',
      body: 'Eres responsable de la confidencialidad de tus credenciales. Debes notificar a LEAD de inmediato si sospechas acceso no autorizado. No puedes compartir ni transferir tu cuenta a otra persona.',
    },
    {
      title: '4. Uso Aceptable',
      body: 'Aceptas usar la plataforma solo para sus finalidades previstas. Está prohibido:',
      list: [
        'Subir información falsa, engañosa o inexacta',
        'Intentar acceder a los datos de otros usuarios sin autorización',
        'Usar la plataforma con fines comerciales no autorizados por LEAD',
        'Interferir o interrumpir la infraestructura de la plataforma',
        'Subir contenido ilegal, dañino o que infrinja derechos de terceros',
      ],
    },
    {
      title: '5. Visibilidad del Perfil y Consentimiento',
      body: 'Tu perfil es privado por defecto. Puedes optar voluntariamente por hacerlo visible ante empresas asociadas. Puedes revocar este consentimiento en cualquier momento desde tu configuración. LEAD no garantiza resultados de empleo o entrevistas derivados de la visibilidad del perfil.',
    },
    {
      title: '6. Tu Contenido',
      body: 'Conservas la titularidad de todo el contenido que subes, incluyendo tu currículum e información de perfil. Al subir contenido, otorgas a LEAD una licencia limitada y no exclusiva para almacenarlo y mostrarlo según los fines descritos en la Política de Privacidad. Eres el único responsable de asegurarte de que tu contenido no infringe derechos de terceros.',
    },
    {
      title: '7. Disponibilidad de la Plataforma',
      body: 'LEAD ofrece esta plataforma en la medida de lo posible y no garantiza acceso ininterrumpido ni libre de errores. Nos reservamos el derecho de suspender o modificar funciones, con aviso razonable cuando sea posible.',
    },
    {
      title: '8. Terminación de Cuenta',
      body: 'Puedes eliminar tu cuenta en cualquier momento desde tu configuración. LEAD puede suspender o terminar tu cuenta si incumples estos Términos, proporcionas información falsa o dejas de ser miembro activo de LEAD. Tus datos se gestionarán conforme a nuestra Política de Privacidad tras la terminación.',
    },
    {
      title: '9. Limitación de Responsabilidad',
      body: 'En la máxima medida permitida por la ley aplicable, LEAD no será responsable por daños indirectos, incidentales o consecuentes derivados del uso de la plataforma. LEAD no es responsable por las decisiones que tomen las empresas asociadas en base a tu perfil.',
    },
    {
      title: '10. Cambios en estos Términos',
      body: 'Podemos actualizar estos Términos periódicamente. Los cambios significativos se comunicarán por correo electrónico o mediante un aviso en la plataforma antes de entrar en vigor. El uso continuado tras la publicación implica la aceptación de los Términos actualizados.',
    },
    {
      title: '11. Ley Aplicable',
      body: 'Estos Términos se rigen por las leyes de la República del Perú. Cualquier controversia será resuelta por los juzgados competentes de Lima, Perú.',
    },
    {
      title: '12. Contacto',
      body: 'Para consultas sobre estos Términos:\n\nASOCIACIÓN LEAD MINDSET\n[Dirección, Lima, Perú]\n[contact@leadmindset.org]',
    },
  ],
}

export const termsContent: Record<string, TermsContent> = { en, es }