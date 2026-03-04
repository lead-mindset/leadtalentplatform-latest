const LAST_UPDATED = 'March 6, 2026'

type Section = {
  title: string
  body: string
  list?: string[]
  footer?: string
}

type PrivacyContent = {
  meta: { title: string; description: string }
  badge: string
  title: string
  intro: string
  sections: Section[]
}

const en: PrivacyContent = {
  meta: {
    title: 'Privacy Policy – LEAD Talent Platform',
    description: 'How LEAD Talent Platform collects, uses, and protects your personal data.',
  },
  badge: `Last updated: ${LAST_UPDATED}`,
  title: 'Privacy Policy',
  intro:
    'LEAD Talent Platform is an internal talent management system for LEAD members. It is not a public social network or directory. This policy explains how we collect, use, and protect your personal data.',
  sections: [
    {
      title: '1. Data Controller',
      body: 'Your personal data is managed by ASOCIACIÓN LEAD MINDSET ("LEAD"), registered in Peru. For any data-related requests, please contact us via the form linked in Section 12.',
    },
    {
      title: '2. Data We Collect',
      body: 'To create your account we collect:',
      list: [
        'Personal information: full name, email address, phone number, gender',
        'Academic information: university / chapter, major, expected graduation year',
        'Professional information: LinkedIn profile URL, skills',
        'Résumé in PDF format (stored securely)',
        'Explicit consent for recruiter visibility (opt-in, not automatic)',
        'Technical data automatically collected by our infrastructure providers (IP address, browser type, OS)',
      ],
    },
    {
      title: '3. Purposes of Processing',
      body: 'We process your data exclusively for:',
      list: [
        'Creating and managing your account',
        'Allowing partner companies to view your profile — only if you have given explicit consent',
        'Sending platform notifications, technical alerts, and support messages',
        'Improving our services through anonymised usage analysis',
        'Sending LEAD community updates and opportunities (you can unsubscribe at any time)',
        'Fraud prevention and platform security',
        'Compliance with applicable Peruvian law (Ley N° 29733)',
      ],
    },
    {
      title: '4. Recruiter Visibility & Consent',
      body: 'Your profile is private by default and never visible to any external party without your explicit action. You must activate the "Make my profile visible" option to appear in any company talent view. The exact date and time of your consent is recorded in our database. You may revoke this consent at any time from your profile settings. Company access is restricted to formally invited representatives, is audited, and requires approval from the LEAD team.',
    },
    {
      title: '5. Data Recipients',
      body: 'Your data is not sold or shared with third parties. The only parties with access are:',
      list: [
        'You (always)',
        'LEAD internal team, for administration and reporting',
        'Infrastructure providers Supabase and Vercel, acting as data processors under our instructions and bound by data processing agreements',
        'In future phases: formally invited partner company representatives, only for members who have given consent',
      ],
    },
    {
      title: '6. Data Retention',
      body: 'Your data is retained while your account is active, or as long as needed to fulfil the purposes above, or as required by legal obligation. You may request deletion at any time.',
    },
    {
      title: '7. Your Rights (Ley N° 29733)',
      body: 'You have the right to:',
      list: [
        'Access your personal data',
        'Rectify or update inaccurate data',
        'Request cancellation or blocking of your data',
        'Object to specific processing purposes',
        'Revoke consent at any time',
        'Receive your data in a portable, structured format',
        'Not be subject to solely automated decisions that affect your rights',
      ],
      footer:
        'To exercise these rights, use the contact form in Section 12. We will respond within the legally required timeframe.',
    },
    {
      title: '8. Security',
      body: 'We implement technical and organisational measures to protect your data against loss, misuse, and unauthorised access. Authentication is handled by Supabase Auth (OAuth and email/password). Résumé files are stored in a private, access-controlled storage bucket.',
    },
    {
      title: '9. Cookies',
      body: 'We use only essential session cookies required for authentication. We do not use advertising or tracking cookies.',
    },
    {
      title: '10. Minimum Age',
      body: 'You must be at least 18 years old to use this platform. If we learn that a minor has provided data without parental authorisation, we will delete it immediately.',
    },
    {
      title: '11. Updates to This Policy',
      body: 'We may update this policy periodically. Material changes will be communicated by email or via a notice on the platform before taking effect. Continued use after the update constitutes acceptance of the revised policy.',
    },
    {
      title: '12. Contact',
      body: 'For questions, complaints, or to exercise your rights:\n\nASOCIACIÓN LEAD MINDSET\n[Address, Lima, Peru]\n[contact@leadmindset.org]\n\nFor purposes of D.S. 016-2024-JUS, the representative in Peru is ASOCIACIÓN LEAD MINDSET at the address above.',
    },
  ],
}

const es: PrivacyContent = {
  meta: {
    title: 'Política de Privacidad – LEAD Talent Platform',
    description: 'Cómo LEAD Talent Platform recopila, usa y protege tus datos personales.',
  },
  badge: `Última actualización: ${LAST_UPDATED}`,
  title: 'Política de Privacidad',
  intro:
    'LEAD Talent Platform es un sistema interno de gestión de talento para miembros de LEAD. No es una red social ni un directorio público. Esta política explica cómo recopilamos, usamos y protegemos tus datos personales.',
  sections: [
    {
      title: '1. Responsable del Tratamiento',
      body: 'Tus datos personales son gestionados por ASOCIACIÓN LEAD MINDSET ("LEAD"), registrada en Perú. Para cualquier solicitud sobre tus datos, contáctanos mediante el formulario indicado en la Sección 12.',
    },
    {
      title: '2. Datos que Recopilamos',
      body: 'Para crear tu cuenta recopilamos:',
      list: [
        'Información personal: nombre completo, correo electrónico, teléfono, género',
        'Información académica: universidad / capítulo, carrera, año de graduación esperado',
        'Información profesional: URL de LinkedIn, habilidades',
        'Currículum en formato PDF (almacenado de forma segura)',
        'Consentimiento explícito para visibilidad ante empresas (opt-in, no automático)',
        'Datos técnicos recopilados automáticamente por nuestros proveedores de infraestructura (dirección IP, navegador, sistema operativo)',
      ],
    },
    {
      title: '3. Finalidades del Tratamiento',
      body: 'Tratamos tus datos exclusivamente para:',
      list: [
        'Creación y gestión de tu cuenta',
        'Permitir que empresas asociadas vean tu perfil — solo si diste tu consentimiento explícito',
        'Envío de notificaciones, alertas técnicas y mensajes de soporte',
        'Mejora de nuestros servicios mediante análisis de uso anonimizado',
        'Envío de actualizaciones y oportunidades de la comunidad LEAD (puedes darte de baja en cualquier momento)',
        'Prevención de fraudes y seguridad de la plataforma',
        'Cumplimiento de la legislación peruana aplicable (Ley N° 29733)',
      ],
    },
    {
      title: '4. Visibilidad ante Empresas y Consentimiento',
      body: 'Tu perfil es privado por defecto y nunca es visible para ninguna parte externa sin tu acción explícita. Debes activar la opción "Hacer visible mi perfil" para aparecer en la vista de talento de las empresas. La fecha y hora exacta de tu consentimiento queda registrada en nuestra base de datos. Puedes revocar este consentimiento en cualquier momento desde tu configuración. El acceso de empresas está restringido a representantes formalmente invitados, es auditado y requiere aprobación del equipo de LEAD.',
    },
    {
      title: '5. Destinatarios',
      body: 'Tus datos no se venden ni se comparten con terceros. Las únicas partes con acceso son:',
      list: [
        'Tú (siempre)',
        'El equipo interno de LEAD, para administración y reportes',
        'Los proveedores de infraestructura Supabase y Vercel, actuando como encargados del tratamiento bajo nuestras instrucciones y vinculados por acuerdos de procesamiento de datos',
        'En fases futuras: representantes de empresas asociadas formalmente invitados, solo para miembros que hayan dado su consentimiento',
      ],
    },
    {
      title: '6. Plazo de Conservación',
      body: 'Tus datos se conservan mientras tu cuenta esté activa, o el tiempo necesario para cumplir las finalidades descritas, o según obligación legal. Puedes solicitar su eliminación en cualquier momento.',
    },
    {
      title: '7. Tus Derechos (Ley N° 29733)',
      body: 'Tienes derecho a:',
      list: [
        'Acceder a tus datos personales',
        'Rectificar o actualizar datos inexactos',
        'Solicitar la cancelación o bloqueo de tus datos',
        'Oponerte a finalidades específicas del tratamiento',
        'Revocar tu consentimiento en cualquier momento',
        'Recibir tus datos en formato portable y estructurado',
        'No ser sujeto de decisiones exclusivamente automatizadas que afecten tus derechos',
      ],
      footer:
        'Para ejercer estos derechos, usa el formulario de la Sección 12. Responderemos dentro del plazo legal correspondiente.',
    },
    {
      title: '8. Seguridad',
      body: 'Implementamos medidas técnicas y organizativas para proteger tus datos contra pérdida, mal uso y acceso no autorizado. La autenticación es gestionada por Supabase Auth. Los archivos de currículum se almacenan en un bucket privado con controles de acceso.',
    },
    {
      title: '9. Cookies',
      body: 'Solo utilizamos cookies esenciales de sesión necesarias para la autenticación. No usamos cookies de publicidad ni de seguimiento.',
    },
    {
      title: '10. Edad Mínima',
      body: 'Debes tener al menos 18 años para usar esta plataforma. Si tenemos conocimiento de que un menor ha proporcionado datos sin autorización parental, los eliminaremos de inmediato.',
    },
    {
      title: '11. Actualizaciones de esta Política',
      body: 'Podemos actualizar esta política periódicamente. Los cambios materiales se comunicarán por correo electrónico o mediante un aviso en la plataforma antes de entrar en vigor. El uso continuado tras la actualización implica la aceptación de la política revisada.',
    },
    {
      title: '12. Contacto',
      body: 'Para consultas, reclamaciones o ejercicio de derechos:\n\nASOCIACIÓN LEAD MINDSET\n[Dirección, Lima, Perú]\n[contact@leadmindset.org]\n\nPara efectos del D.S. 016-2024-JUS, el representante en el territorio peruano es ASOCIACIÓN LEAD MINDSET en el domicilio indicado.',
    },
  ],
}

export const privacyContent: Record<string, PrivacyContent> = { en, es }