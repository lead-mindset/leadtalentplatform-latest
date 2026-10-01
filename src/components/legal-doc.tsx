import Link from "next/link";

export function LegalDoc({
  title,
  updated,
  sections,
}: {
  title: string;
  updated: string;
  sections: { heading: string; body: string[] }[];
}) {
  return (
    <article className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
      <header className="mb-8">
        <h1 className="text-h1 font-bold tracking-tight">{title}</h1>
        <p className="mt-1 text-small text-muted-foreground">Última actualización: {updated}</p>
      </header>
      <div className="space-y-7">
        {sections.map((section) => (
          <section key={section.heading}>
            <h2 className="text-h3 font-semibold">{section.heading}</h2>
            {section.body.map((paragraph, i) => (
              <p key={i} className="mt-2 text-body text-muted-foreground">
                {paragraph}
              </p>
            ))}
          </section>
        ))}
      </div>
      <footer className="mt-12 border-t border-border/60 pt-6 text-small text-muted-foreground">
        ¿Dudas? Escríbenos a{" "}
        <a href="mailto:contact@leadmindset.org" className="font-medium text-brand-purple-light hover:underline">
          contact@leadmindset.org
        </a>
        . También puedes <Link href="/eliminar-datos" className="font-medium text-brand-purple-light hover:underline">solicitar el borrado de tus datos</Link>.
      </footer>
    </article>
  );
}