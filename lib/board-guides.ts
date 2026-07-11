import type { ChapterRoleLevel } from '@/lib/services/chapter-permission.service'

export type BoardGuideEntry = {
  roleOverview: string
  manual: { title: string; content: string }[]
  faq: { question: string; answer: string }[]
}

export const BOARD_CONTACT = {
  email: 'abriones@leadmindset.org',
  phone: '+51 967 111 332',
} as const

export const BOARD_GUIDES: Record<ChapterRoleLevel, BoardGuideEntry> = {
  president: {
    roleOverview:
      'Como presidente o presidenta del capítulo, eres la máxima autoridad ejecutiva. Representas a LEAD ante la universidad, aliados estratégicos y la organización nacional. Lideras la visión estratégica, coordinas al equipo directivo y aseguras que el capítulo cumpla su misión.',
    manual: [
      {
        title: 'Visión y planificación estratégica',
        content:
          'Define los objetivos semestrales del capítulo alineados con la misión de LEAD. Organiza reuniones periódicas con la directiva para dar seguimiento a metas, indicadores y planes de acción.',
      },
      {
        title: 'Representación institucional',
        content:
          'Eres el rostro del capítulo ante autoridades universitarias, aliados y la organización nacional. Asegura una comunicación fluida y profesional con todos los stakeholders.',
      },
      {
        title: 'Supervisión de equipos',
        content:
          'Delega responsabilidades en la directiva y da seguimiento al progreso de cada área. Realiza check-ins regulares con vicepresidencia, jefatura de gabinete y direcciones.',
      },
    ],
    faq: [
      {
        question: '¿Qué hago si un miembro de la directiva no cumple sus funciones?',
        answer:
          'Primero, agota la conversación directa para entender la situación. Si persiste, involucra a jefatura de gabinete para definir un plan de mejora. Como último recurso, puedes solicitar la desactivación del rol siguiendo el proceso establecido.',
      },
      {
        question: '¿Cómo gestiono conflictos dentro del equipo?',
        answer:
          'Escucha a todas las partes por separado, luego facilita una conversación grupal mediada. El objetivo es llegar a acuerdos claros. Si el conflicto escala, contacta a la organización nacional para orientación.',
      },
      {
        question: '¿Cada cuánto debo reportar a la organización nacional?',
        answer:
          'La frecuencia de reportes puede variar. Mantén comunicación constante con tu enlace nacional y responde a los requerimientos de información en los plazos solicitados.',
      },
    ],
  },
  vice_president: {
    roleOverview:
      'Como vicepresidente o vicepresidenta, apoyas a la presidencia en la gestión del capítulo y aseguras la continuidad operativa. Supervisas áreas clave, coordinas proyectos transversales y reemplazas a la presidencia cuando sea necesario.',
    manual: [
      {
        title: 'Apoyo a la presidencia',
        content:
          'Trabaja de la mano con la presidencia para ejecutar la visión estratégica. Anticipa necesidades, prepara informes y asegura que las decisiones se implementen.',
      },
      {
        title: 'Supervisión de proyectos',
        content:
          'Monitorea los proyectos en curso y asegura que los equipos cumplan sus entregables. Identifica riesgos temprano y propone soluciones.',
      },
      {
        title: 'Continuidad del capítulo',
        content:
          'En ausencia de la presidencia, asumes sus funciones. Mantente al día con todas las áreas para poder tomar decisiones informadas.',
      },
    ],
    faq: [
      {
        question: '¿Cuál es mi rol en las reuniones de directiva?',
        answer:
          'Participas activamente en la planificación y toma de decisiones. Puedes liderar reuniones en ausencia de la presidencia y dar seguimiento a los acuerdos.',
      },
      {
        question: '¿Qué hago si la presidencia no está disponible?',
        answer:
          'Asumes temporalmente sus funciones. Toma decisiones operativas y consulta a la organización nacional solo para asuntos estratégicos que no puedan esperar.',
      },
    ],
  },
  chief_of_staff: {
    roleOverview:
      'Como jefe o jefa de gabinete, eres el puente entre la directiva y la operación del capítulo. Gestionas la comunicación interna, los procesos administrativos y el cumplimiento de acuerdos. Aseguras que el equipo trabaje de manera organizada y alineada.',
    manual: [
      {
        title: 'Gestión de reuniones',
        content:
          'Coordina la agenda de reuniones de directiva, prepara las minutas y da seguimiento a los acuerdos. Asegura que cada reunión tenga un propósito claro y entregables definidos.',
      },
      {
        title: 'Comunicación interna',
        content:
          'Mantén canales de comunicación fluidos entre todas las áreas del capítulo. Asegura que la información relevante llegue a las personas correctas en el momento adecuado.',
      },
      {
        title: 'Procesos administrativos',
        content:
          'Gestiona la documentación oficial del capítulo, incluyendo actas, informes y archivos. Asegura que los procesos de onboarding y offboarding de miembros de directiva se realicen correctamente.',
      },
    ],
    faq: [
      {
        question: '¿Cómo organizo la agenda de la directiva?',
        answer:
          'Mantén un calendario compartido con hitos, reuniones periódicas y deadlines. Coordina con cada dirección para evitar conflictos de agenda.',
      },
      {
        question: '¿Qué información debe llegar a toda la directiva?',
        answer:
          'Comparte minutas de reuniones, acuerdos tomados, cambios en procesos, fechas importantes y cualquier comunicación de la organización nacional.',
      },
    ],
  },
  director: {
    roleOverview:
      'Como director o directora, lideras un área específica del capítulo (marketing, eventos, finanzas, desarrollo, etc.). Defines la estrategia de tu área, coordinas a tu equipo y ejecutas las iniciativas alineadas con los objetivos del capítulo.',
    manual: [
      {
        title: 'Planificación del área',
        content:
          'Define los objetivos, el plan de trabajo y los indicadores de tu área para el semestre. Alinea tus metas con la visión general del capítulo.',
      },
      {
        title: 'Gestión de equipo',
        content:
          'Coordina a los coordinadores y voluntarios de tu área. Realiza reuniones periódicas, da feedback y asegura un ambiente de trabajo colaborativo.',
      },
      {
        title: 'Reporte de avances',
        content:
          'Presenta informes periódicos a la directiva sobre el progreso de tu área. Reporta logros, desafíos y necesidades de apoyo.',
      },
    ],
    faq: [
      {
        question: '¿Cómo gestiono mi presupuesto de área?',
        answer:
          'Planifica tus gastos al inicio del semestre y solicita aprobación según el flujo establecido. Lleva un registro de todos los gastos y presenta reportes cuando se soliciten.',
      },
      {
        question: '¿Puedo proponer nuevas iniciativas para mi área?',
        answer:
          'Sí, las propuestas son bienvenidas. Preséntalas a la directiva con una breve justificación, objetivos y recursos necesarios para su evaluación.',
      },
    ],
  },
  coordinator: {
    roleOverview:
      'Como coordinador o coordinadora, ejecutas las actividades operativas de tu área. Apoyas a la dirección en la implementación de iniciativas, coordinas voluntarios y aseguras que las tareas se completen a tiempo.',
    manual: [
      {
        title: 'Ejecución de actividades',
        content:
          'Implementa las actividades planificadas por tu dirección. Sigue los cronogramas establecidos y comunica cualquier desviación a tu director o directora.',
      },
      {
        title: 'Coordinación con voluntarios',
        content:
          'Organiza y lidera a los voluntarios asignados a tus actividades. Asegura que tengan claras sus responsabilidades y los recursos necesarios.',
      },
      {
        title: 'Reporte operativo',
        content:
          'Informa a tu dirección sobre el avance de las actividades, incidentes y resultados obtenidos. Mantén registros actualizados de tu trabajo.',
      },
    ],
    faq: [
      {
        question: '¿A quién reporto directamente?',
        answer:
          'Reportas al director o directora de tu área. Ellos son tu enlace con la directiva y te apoyan con recursos y orientación.',
      },
      {
        question: '¿Puedo proponer mejoras en los procesos?',
        answer:
          'Sí, tus observaciones desde la operación son valiosas. Compártelas con tu dirección para que sean evaluadas e implementadas.',
      },
    ],
  },
  member: {
    roleOverview:
      'Esta guía está diseñada para miembros de la junta directiva. Si eres miembro regular del capítulo, revisa las secciones de preguntas frecuentes generales en la página de FAQ.',
    manual: [],
    faq: [],
  },
}
