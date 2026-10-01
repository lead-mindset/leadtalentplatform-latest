import { LegalDoc } from "@/components/legal-doc";

export default function ReembolsosPage() {
  return (
    <LegalDoc
      title="Política de reembolsos"
      updated="1 de octubre de 2026"
      sections={[
        {
          heading: "La plataforma es gratuita",
          body: [
            "Crear tu perfil y participar en la comunidad LEAD es gratuito. No cobramos por pertenecer a la red de talento.",
          ],
        },
        {
          heading: "Pagos de terceros",
          body: [
            "Algunos eventos o programas pueden tener costos gestionados por los organizadores del capítulo. Cualquier reembolso de esos pagos se rige por la política del evento o programa correspondiente.",
          ],
        },
        {
          heading: "Contacto",
          body: [
            "Para consultas sobre pagos o reembolsos, escribe a contact@leadmindset.org con el detalle del evento o programa.",
          ],
        },
      ]}
    />
  );
}