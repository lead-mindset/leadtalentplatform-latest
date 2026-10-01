import { LegalDoc } from "@/components/legal-doc";

export default function CookiesPage() {
  return (
    <LegalDoc
      title="Política de cookies"
      updated="1 de octubre de 2026"
      sections={[
        {
          heading: "Qué son las cookies",
          body: [
            "Las cookies son pequeños archivos que guardan información de tu sesión para que la plataforma funcione.",
          ],
        },
        {
          heading: "Qué cookies usamos",
          body: [
            "Cookies esenciales: para mantener tu sesión iniciada y recordar preferencias (como tu consentimiento de cookies). Sin ellas la plataforma no funciona.",
            "No usamos cookies de publicidad ni de terceros para rastrearte. Las imágenes de demostración pueden venir de servicios externos de imágenes.",
          ],
        },
        {
          heading: "Cómo gestionarlas",
          body: [
            "Puedes rechazar las cookies no esenciales desde el aviso de cookies. Las esenciales son necesarias para usar la plataforma.",
          ],
        },
      ]}
    />
  );
}