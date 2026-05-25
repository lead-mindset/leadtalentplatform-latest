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
    'LEAD Talent Platform is an internal talent management system for LEAD members. It is not a public social network or directory. Each member has a private profile that is not visible to anyone by default. Our main goal is to help our members connect their profiles with opportunities offered by high-impact national and international companies. We update our privacy policy regularly to ensure it clearly explains how we collect and use personal and non-personal data. Updates to this Privacy Policy will be published on the platform itself at /privacy. Each time the document is updated, users will be notified by email and the last updated date on that page will be refreshed.',
  sections: [
    {
      title: '1. Data Controller',
      body: "The personal data provided by the User, detailed in Section 2 of this document, will be incorporated into the database called \"Users of LEAD Talent Platform\", whose provisional holder during the formal constitution stage of the organization is Abigail Briones, acting as Director of Digital Transformation within LEAD MINDSET. Queries, requests, or exercise of rights regarding personal data must be directed to: admin@leadmindset.org\n\nThe holder commits to registering this database with the National Registry of Personal Data Protection of the National Authority for Personal Data Protection (APDP), in accordance with Law N° 29733 — Personal Data Protection Law — and its Regulations approved by Supreme Decree N° 003-2013-JUS, once the organization has legal status and an active RUC. LEAD MINDSET INC is incorporated at 7500 Daycoa Street, Fort Worth, Texas, 76120, and is in the process of incorporation in Peru under the name ASOCIACIÓN LEAD MINDSET.\n\nData will be stored on servers provided by Supabase Inc., a cloud infrastructure platform with servers located in us-east-1 (AWS), subject to international information security standards.",
    },
    {
      title: '2. Data We Collect',
      body: 'To create an account on this platform, the User must provide the following data:',
      list: [
        'Personal information: name, email, phone number',
        'Academic information: university / chapter, major, graduation year',
        'Professional information: LinkedIn, portfolio, skills',
        'Résumé in PDF format (stored securely)',
        'Explicit consent for recruiter visibility (opt-in, not automatic)',
        'IP address, browser, and other data automatically collected by Supabase and Vercel',
      ],
    },
    {
      title: '3. Purposes of Processing',
      body: 'Through LEAD Talent Platform, our Users will have the opportunity to connect with international opportunities. Data is not sold or shared with third parties outside the infrastructure providers (Supabase, Vercel). Specifically, the data provided by the User upon registration and/or use of the platform will be processed for the following purposes:',
      list: [
        'Account creation on the platform',
        'Allowing companies to view your profile and contact you for a position — only companies to which we grant access will be able to view your profile',
        'Automatic and free receipt of offers electronically, subject to the terms and privacy policies of the respective third parties',
        'Management of daily services and commercial tasks, including reminders, technical notices, updates, security alerts, and support messages',
        'Improving our services through the study of user behaviour via cookies',
        'Sending newsletters and promotions from our community (officially recognised LEAD chapters) and partner collaborators',
        'Prevention of abuse and fraud (e.g. fraudulent activity, denial-of-service attacks, spam)',
        'Transfer of data to bodies and authorities when required by applicable legal and regulatory provisions',
      ],
    },
    {
      title: '4. Legal Basis for Processing',
      body: 'The legal basis for processing personal data for the purposes in sections 3.1 and 3.2 is the performance of our services. The legal basis for sections 3.3 and 3.4 is user consent. The legal basis for section 3.5 is the legitimate interest of LEAD MINDSET INC as the data controller. The legal basis for section 3.6 is compliance with legal obligations applicable to LEAD MINDSET INC.\n\nLEAD MINDSET INC expressly states that any processing of personal data will comply with applicable Peruvian legislation (including but not limited to Law N° 29733 and its Regulations), and personal data will only be used for the limited purposes set out in this document.',
    },
    {
      title: '5. Data Retention',
      body: "The User authorises LEAD MINDSET to maintain their personal data in the database referenced in Section 1, for as long as it is useful for the purposes described. The User's account on LEAD Talent Platform will remain active as long as (i) it is necessary to provide our services, (ii) the User has not requested its cancellation, and/or (iii) it is necessary to comply with legal obligations. During this period, LEAD MINDSET is obligated to maintain the record of the personal data provided.",
    },
    {
      title: '6. Recipients',
      body: 'LEAD Talent Platform is in its early stages, so your data will not be exposed to third parties. However, in order to fulfil our purpose of connecting you with international job opportunities, your information will be visible only to companies to which we grant access. The names of companies granted access will be listed in our privacy policy updates, so we recommend staying up to date.',
    },
    {
      title: '7. Your Rights (Ley N° 29733)',
      body: 'As the holder of your personal data, the User has the right to: (i) access their data, (ii) know the characteristics of its processing, (iii) exercise the right to update, rectify, include, block, delete or cancel, (iv) object to the processing of their personal data for specific purposes, (v) request portability of their data in a structured and commonly used format, and (vi) not be subject to automated decisions that affect the exercise of their rights and freedoms.\n\nThe User may at any time revoke the consent granted, as well as limit the use or disclosure of their personal data.',
      footer:
        'To exercise these rights, the User must submit the relevant request in accordance with the Regulations of Law N° 29733, via the contact form in Section 1 or Section 11 of this policy. The request must include the User\'s name and address or other means of response; documents proving identity or legal representation; a clear and precise description of the data concerned; and any other documents that facilitate the location of the data. Requests will be processed within the timeframe assigned by applicable legal regulations, counted from when LEAD MINDSET confirms receipt.',
    },
    {
      title: '8. Security',
      body: 'We have adopted the legally required security measures and all technical means at our disposal to prevent the loss, misuse, alteration, unauthorised access, and theft of personal data or confidential information provided by Users. Unless stated in this document or required by law, information provided by the User will not be transmitted to third parties, will be kept strictly confidential, and will be processed in accordance with the privacy and security policies the User declares to be aware of.',
    },
    {
      title: '9. Cookie Policy',
      body: "A cookie is a small file placed on the user's computer, smartphone, or other electronic device that enables the functionality of our web portal. Cookies allow us to identify the user's device, provide secure access to the platform, and help detect if someone attempts to access the account from another device. Cookies also track user sessions, improve page load times, and avoid displaying repetitive information.\n\nWe use cookies to improve your browsing experience, offering personalised and relevant content through our platform.\n\nThe platform uses only essential cookies for its operation. Session cookies keep the user authenticated while navigating the platform, avoiding the need to log in on each page. Authentication cookies are generated by our provider Supabase Auth and allow us to verify the user's identity and manage secure access to their account. No tracking, advertising, or third-party analytics cookies are used.",
    },
    {
      title: '10. Minimum Age',
      body: 'To access or use our platform, the User must be at least 16 years old. If under 18 or under the legal age of majority in their country, use of the platform must be under the supervision of parents, guardians, or another responsible adult. If we become aware that a minor has provided information without parental authorisation, we will delete that information and close the account.',
    },
    {
      title: '11. Updates to This Policy',
      body: 'We reserve the right to update this Privacy Policy when deemed appropriate, by publishing an updated version on LEAD Talent Platform. If we make any changes that could affect the rights of the User, they will be notified by email or via a notice on the platform.\n\nWe recommend that Users periodically review the Privacy Policy and Cookie Policy to stay informed of any updates.\n\nBy accepting the terms of this Privacy Policy, the User declares that continued use of our services after publication of changes implies that the collection, use, and processing of their personal data is subject to the updated Privacy Policy. By clicking the acceptance checkbox, the User expressly authorises LEAD MINDSET to collect and process their personal data under the terms described in this document. If the User does not agree with any changes, they have the full right to close their LEAD Talent Platform account.',
    },
    {
      title: '12. Contact',
      body: 'If you wish to exercise any of your rights, or if you have any questions or complaints about this Privacy Policy, you may contact us via the form indicated in Section 1, or alternatively write to: admin@leadmindset.org\n\nPlease provide as much information as possible about your request, including your full name, the email address you use for our platform, and the reasons for your request, specifying the right you wish to exercise. You must also include the necessary documentation to support and process the request.',
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
    'LEAD Talent Platform es un sistema interno de gestión de talento para miembros de LEAD. No es una red social ni un directorio público. Cada miembro tiene un perfil privado que no es visible para nadie por defecto. Nuestro objetivo principal es ayudar a nuestros miembros a conectar sus perfiles con oportunidades ofrecidas por empresas nacionales e internacionales de gran impacto. Actualizamos nuestra política de privacidad con regularidad para asegurarnos de que su contenido mantenga una explicación clara sobre cómo recopilamos y utilizamos los datos personales y no personales. Las actualizaciones de la Política de Privacidad estarán publicadas en la propia plataforma en la sección /privacy. Cada vez que se actualice el documento se notificará a los usuarios por correo electrónico y se actualizará la fecha de última actualización visible en esa misma página.',
  sections: [
    {
      title: '1. Responsable del Tratamiento',
      body: 'Los Datos Personales que el Usuario nos facilite, los cuales constan detallados en el numeral 2 del presente documento, quedarán incorporados en el Banco de Datos denominado "Usuarios de LEAD Talent Platform"; cuyo titular, con carácter provisional durante la etapa de constitución formal de la organización, es Abigail Briones, quien desempeña funciones dentro de LEAD MINDSET como Director of Digital Transformation. Las consultas, solicitudes o ejercicio de derechos sobre sus datos personales deberán canalizarse a través del correo electrónico: admin@leadmindset.org\n\nEl titular se compromete a inscribir el presente Banco de Datos ante el Registro Nacional de Protección de Datos Personales de la Autoridad Nacional de Protección de Datos Personales (APDP), conforme a lo establecido en la Ley N° 29733 — Ley de Protección de Datos Personales — y su Reglamento aprobado por Decreto Supremo N° 003-2013-JUS, una vez que la organización cuente con personería jurídica y RUC activo. LEAD MINDSET INC se encuentra constituida en 7500 Daycoa Street, Fort Worth, Texas, 76120 y en proceso de constitución en el Perú bajo la denominación ASOCIACIÓN LEAD MINDSET.\n\nLos datos serán almacenados en servidores provistos por Supabase Inc., plataforma de infraestructura en la nube con servidores ubicados en us-east-1 (AWS), sujeta a estándares internacionales de seguridad de la información.',
    },
    {
      title: '2. Datos que Recopilamos',
      body: 'A fin de crear una cuenta en la presente página web el Usuario debe proporcionar los siguientes datos:',
      list: [
        'Información personal: nombre, email, teléfono',
        'Información académica: universidad/capítulo, carrera, año de graduación',
        'Información profesional: LinkedIn, portafolio, habilidades (skills)',
        'Currículum vitae en formato PDF (almacenado de forma segura)',
        'Consentimiento explícito para visibilidad ante empresas (opt-in, no automático)',
        'IP, navegador y demás datos que Supabase y Vercel recolecten de manera automática',
      ],
    },
    {
      title: '3. Finalidades del Tratamiento',
      body: 'A través de LEAD Talent Platform, nuestros Usuarios tendrán la posibilidad de conectar con oportunidades internacionales. Los datos no se venden ni comparten con terceros fuera de los proveedores de infraestructura (Supabase, Vercel). Los datos que el Usuario facilitará al registrarse y/o utilizar la página web serán tratados con las siguientes finalidades:',
      list: [
        'Creación de una cuenta en la página web',
        'Posibilidad de que empresas puedan ver tu perfil y contactarte para algún puesto — solo podrán acceder a tu perfil las empresas a las que les demos acceso',
        'Recepción automática y gratuita de ofertas por vía electrónica, sujeta a las condiciones y políticas de privacidad de los terceros titulares',
        'Gestión de servicios y tareas comerciales diarias, incluyendo recordatorios, avisos técnicos, actualizaciones, alertas de seguridad y mensajes de soporte',
        'Mejorar nuestros servicios mediante el estudio del comportamiento del usuario a través de cookies',
        'Enviar boletines y promociones de nuestra comunidad (chapters oficialmente reconocidos por LEAD) y de socios o partners colaboradores',
        'Prevención de abusos y fraudes (actividades fraudulentas, ataques de denegación de servicios, spam, entre otros)',
        'Transferencia de datos a organismos y autoridades cuando sean requeridos conforme a las disposiciones legales y reglamentarias',
      ],
    },
    {
      title: '4. Base Legal del Tratamiento',
      body: 'La base legal para el tratamiento de los Datos Personales en relación con las finalidades de los apartados 3.1 y 3.2 es la correcta gestión y prestación de nuestros servicios. La base legal de los apartados 3.3 y 3.4 radica en el consentimiento del usuario. La finalidad del apartado 3.5 radica en el interés legítimo de LEAD MINDSET INC como responsable del tratamiento. La finalidad del apartado 3.6 es necesaria para el cumplimiento de obligaciones legales aplicables a LEAD MINDSET INC.\n\nLEAD MINDSET INC deja expresa constancia de que cualquier tratamiento de datos personales se ajustará a la legislación vigente en el Perú (incluyendo más no limitándose a la Ley N° 29733 y su Reglamento), y estos datos solo podrán ser utilizados con propósitos limitados, conforme a lo expuesto en el presente documento.',
    },
    {
      title: '5. Plazo de Conservación de los Datos',
      body: 'El Usuario autoriza a LEAD MINDSET a mantener el registro de sus datos personales en el Banco de Datos referido en el numeral 1, en tanto sean útiles para las finalidades y usos antes mencionados. La cuenta del Usuario en LEAD Talent Platform se mantendrá activa en tanto (i) sea necesaria para proporcionar nuestros servicios, (ii) el Usuario no haya solicitado su cancelación, y/o (iii) sea necesario para cumplir con las obligaciones legales. Durante este periodo LEAD MINDSET se obliga a mantener el registro de los datos personales proporcionados.',
    },
    {
      title: '6. Destinatarios',
      body: 'LEAD Talent Platform se encuentra en sus fases iniciales por lo que tus datos no estarán expuestos a terceros. Sin embargo, para cumplir con nuestra finalidad de conectarte con oportunidades laborales internacionales, tu información será visible únicamente por empresas a las que nosotros les demos acceso. En nuestras políticas de privacidad se visibilizará el nombre de las empresas a las que les otorguemos acceso, por lo que te recomendamos estar al tanto de nuestras actualizaciones.',
    },
    {
      title: '7. Tus Derechos (Ley N° 29733)',
      body: 'Como titular de sus Datos Personales, el Usuario tiene el derecho de (i) acceder a sus datos, (ii) conocer las características de su tratamiento, (iii) ejercer su derecho de actualización, rectificación, inclusión, bloqueo, supresión o cancelación, (iv) oponerse al tratamiento de sus Datos Personales para fines específicos, (v) solicitar la portabilidad de sus datos en un formato estructurado y de uso común, y (vi) no ser sujeto de decisiones automatizadas que afecten el ejercicio de sus derechos y libertades.\n\nAsimismo, el Usuario puede en todo momento revocar el consentimiento otorgado, así como limitar el uso o divulgación de sus datos personales.',
      footer:
        'Para ejercer los derechos descritos, el Usuario deberá remitir la solicitud respectiva, conforme al Reglamento de la Ley N° 29733, mediante el formulario de contacto incluido en el apartado 1 u 11 de esta política. Se deberá señalar el nombre del Usuario y domicilio u otro medio para recibir respuesta; documentos que acrediten su identidad o representación legal; descripción clara y precisa de los datos respecto de los que se busca ejercer sus derechos; y demás documentos que faciliten su localización. Las solicitudes se atenderán dentro del plazo asignado por las regulaciones legales pertinentes, contado desde que LEAD MINDSET confirme la recepción.',
    },
    {
      title: '8. Seguridad',
      body: 'Se han adoptado las medidas y niveles de seguridad de protección de datos personales legalmente requeridos, e instalado todos los medios y medidas técnicas a nuestro alcance para evitar la pérdida, mal uso, alteración, acceso no autorizado y robo de los datos personales o información confidencial facilitada por los Usuarios. Salvo lo señalado en el presente documento u obligación legal, la información proporcionada por el Usuario no se transmitirá a terceros, se guardará en estricta confidencialidad y será tratada de acuerdo con las políticas de privacidad y seguridad que el Usuario declara conocer.',
    },
    {
      title: '9. Política de Cookies',
      body: 'Una cookie es un pequeño archivo colocado en la computadora del usuario, smartphone u otro dispositivo electrónico que habilita las funcionalidades de nuestro portal web. Las cookies nos permiten identificar el dispositivo del usuario, ofrecerle acceso seguro al portal, y saber si alguien intenta acceder a la cuenta desde otro dispositivo. También hacen seguimiento de la sesión del usuario, mejoran el tiempo de carga y evitan mostrar información reiterativa.\n\nUtilizamos cookies para mejorar tu experiencia de navegación y ofrecerte contenido personalizado y de interés.\n\nLa plataforma utiliza únicamente cookies esenciales para su funcionamiento. Las cookies de sesión permiten mantener al usuario autenticado mientras navega por la plataforma, evitando que deba iniciar sesión en cada página. Las cookies de autenticación son generadas por nuestro proveedor Supabase Auth y permiten verificar la identidad del usuario y gestionar el acceso seguro a su cuenta. No se utilizan cookies de seguimiento, publicidad ni analítica de terceros.',
    },
    {
      title: '10. Edad Mínima',
      body: 'Para acceder o utilizar nuestra página web el Usuario debe tener 16 años o más. Si es menor de 18 años o menor a la mayoría de edad legal de su país, el uso de nuestra página web debe estar bajo la supervisión de los padres, tutores u otro adulto responsable. Si tenemos conocimiento de que un menor de edad nos ha proporcionado información sin autorización parental, eliminaremos dicha información y suprimiremos la cuenta del referido menor.',
    },
    {
      title: '11. Actualizaciones de esta Política',
      body: 'Nos reservamos el derecho de actualizar la presente Política de Privacidad cuando así se considere oportuno mediante la publicación de una versión actualizada en LEAD Talent Platform. Si realizamos alguna modificación que pudiera afectar los derechos del Usuario se le notificará por email o mediante un aviso en la página web.\n\nRecomendamos al Usuario que revise de forma periódica la Política de Privacidad y Cookies para estar actualizado de todas las novedades.\n\nMediante la aceptación de esta política, el Usuario declara que el uso continuado de nuestros servicios tras publicar cambios implica que la recopilación, utilización y tratamiento de sus Datos Personales están sujetos a la Política de Privacidad actualizada. Al dar click en el recuadro de aceptación el Usuario autoriza expresamente a LEAD MINDSET a recabar y procesar sus Datos Personales bajo los términos descritos en el presente documento. Si el Usuario no está de acuerdo con cualquiera de los cambios, goza del pleno derecho de cerrar su cuenta de LEAD Talent Platform.',
    },
    {
      title: '12. Información de Contacto',
      body: 'Si deseas hacer uso de cualquiera de tus derechos o tienes alguna pregunta o queja sobre esta Política de Privacidad, puedes contactarnos en la dirección y/o formulario de contacto indicados en el apartado 1, o alternativamente escribir a: admin@leadmindset.org\n\nDebes facilitarnos la mayor información posible sobre tu solicitud: nombre y apellidos, dirección de correo electrónico que utilizas para nuestra página web, y los motivos de tu solicitud, especificando el derecho que deseas ejercer. Asimismo, será necesario acompañar la documentación necesaria para sustentar la solicitud y dar trámite a la misma.',
    },
  ],
}

export const privacyContent: Record<string, PrivacyContent> = { en, es }
