import { LegalDoc } from "@/components/legal-doc";

export default function PrivacidadPage() {
  return (
    <LegalDoc
      title="Política de privacidad"
      updated="1 de octubre de 2026"
      sections={[
        {
          heading: "Qué datos recogemos",
          body: [
            "Recogemos la información que nos compartes al crear tu perfil: nombre, universidad, área, año de graduación, idiomas, skills, autorización de trabajo, disponibilidad y tu currículum.",
            "También recogemos datos de uso básicos (páginas visitadas) para mejorar la plataforma. No usamos rastreadores de terceros para publicidad.",
          ],
        },
        {
          heading: "Para qué usamos tus datos",
          body: [
            "Tu perfil hace que las empresas puedan encontrarte si lo marcas como visible para empresas. Nunca compartimos tu información sin tu consentimiento.",
            "Usamos tus datos para: mostrarte eventos de tu capítulo, conectar a las empresas con talento que eligió ser visible, y operar la plataforma.",
          ],
        },
        {
          heading: "Visibilidad y empresas",
          body: [
            "Solo el talento que marca su perfil como visible para empresas aparece en el portal empresarial. Las empresas acceden por invitación y cada descarga de tu currículum queda registrada.",
          ],
        },
        {
          heading: "Tus derechos",
          body: [
            "Puedes editar tu perfil, desactivar la visibilidad para empresas, o solicitar el borrado de todos tus datos en cualquier momento desde 'Borrar mis datos'.",
          ],
        },
      ]}
    />
  );
}