import { LegalDoc } from "@/components/legal-doc";

export default function TerminosPage() {
  return (
    <LegalDoc
      title="Términos de servicio"
      updated="1 de octubre de 2026"
      sections={[
        {
          heading: "Uso de la plataforma",
          body: [
            "LEAD es una plataforma para conectar a estudiantes y líderes de la comunidad con oportunidades. Al usarla aceptas proporcionar información veraz en tu perfil.",
          ],
        },
        {
          heading: "Comportamiento",
          body: [
            "Respeta a los demás miembros y a las empresas. No compartas acceso, no uses la plataforma para fines no relacionados con su propósito y no publiques contenido ajeno a la comunidad.",
          ],
        },
        {
          heading: "Visibilidad para empresas",
          body: [
            "Al marcar tu perfil como visible para empresas, autorizas a que tu perfil y currículum sean consultados por empresas invitadas a la plataforma. Puedes desactivar esta visibilidad cuando quieras.",
          ],
        },
        {
          heading: "Suspensión",
          body: [
            "LEAD puede suspender o revocar accesos que incumplan estos términos o que pongan en riesgo a la comunidad.",
          ],
        },
      ]}
    />
  );
}