export function AmbientBackground() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[75vh] overflow-hidden">
      <svg
        className="h-full w-full"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        focusable="false"
      >
        <defs>
          <radialGradient id="lead-a" cx="12%" cy="0%" r="62%">
            <stop offset="0%" stopColor="var(--brand-purple)" stopOpacity="0.2" />
            <stop offset="100%" stopColor="var(--brand-purple)" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="lead-b" cx="92%" cy="4%" r="55%">
            <stop offset="0%" stopColor="var(--brand-rose)" stopOpacity="0.14" />
            <stop offset="100%" stopColor="var(--brand-rose)" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="1440" height="900" fill="url(#lead-a)" />
        <rect width="1440" height="900" fill="url(#lead-b)" />
      </svg>
    </div>
  );
}