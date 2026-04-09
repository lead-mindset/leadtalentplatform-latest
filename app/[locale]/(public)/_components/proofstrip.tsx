const PROOF_STATS = {
  chapters: {
    value: "14",
    label: "capítulos activos",
    isPromise: false,
  },
  members: {
    value: "1,400+",
    label: "estudiantes LEAD",
    isPromise: false,
  },
  time: {
    value: "5 min",
    label: "para completar tu perfil",
    isPromise: true,
  },
} as const;


export function ProofStrip() {
  const stats = Object.values(PROOF_STATS);
  const communityStats = stats.filter((s) => !s.isPromise);
  const promiseStats = stats.filter((s) => s.isPromise);

  return (
    <section
      className="bg-muted border border-border/60"
      aria-label="Cifras de la red LEAD"
    >
      <div className="absolute inset-0 opacity-20" style={{ background: "var(--gradient-card)" }} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="flex items-stretch justify-center">

          {communityStats.map((stat) => (
            <div
              key={stat.label}
              className="flex flex-col items-center justify-center py-5 px-8 sm:px-12 text-center"
            >
              <span className="text-2xl sm:text-3xl font-semibold text-foreground tabular-nums">
                {stat.value}
              </span>
              <span className="mt-1 text-xs text-muted-foreground leading-tight">
                {stat.label}
              </span>
            </div>
          ))}

          {promiseStats.map((stat) => (
            <div
              key={stat.label}
              className="flex flex-col items-center justify-center py-5 px-8 sm:px-12 text-center"
            >
              <span className="text-2xl sm:text-3xl font-semibold text-foreground tabular-nums">
                {stat.value}
              </span>
              <span className="mt-1 text-xs text-muted-foreground/70 leading-tight italic">
                {stat.label}
              </span>
            </div>
          ))}

        </div>
      </div>
    </section>
  );
}