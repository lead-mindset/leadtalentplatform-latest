# Lead Platform Prototype

Frontend prototype of the new LEAD platform (community + talent). It is real code (Next.js) with dummy data, no backend. It works as a high-fidelity mockup to validate with users and as the base of the design system.

This is not the final `lead-platform` we will build later. This is the prototype.

## Stack

- Next.js 16 (app router) · Tailwind v4 · shadcn/ui (Radix) · Lucide · Lenis
- Spanish-first · no backend (dummy data in `src/lib/data/`)
- Dark navy + brand gradient, tokens in `globals.css`

## Run

```bash
pnpm install
pnpm dev        # localhost:3001
```

## Roles (View As)

Open the "Ver como" panel (bottom right) to simulate each role. The community topbar shows "Panel"/"Board" only for users who have that access.

| Role | View |
|---|---|
| Student / Member | `/inicio` · `/eventos` · `/personas` · `/perfil` · `/perfil/nuevo` |
| Chapter President / E-board | `/admin` |
| Board (Founders) | `/board` |
| Company (Recruiter) | `/empresa` |

Demo logins: `/login` (student) · `/login/capitulo` · `/login/board` · `/login/empresa`

## Design System

Everything is documented in `/design-system`. Primitives: `StatusBadge`, `Chip`, `IconTile`, `InitialsAvatar`, `FilterChip`, `Segmented`. Forms are validated with `Field` + `useForm` + `validators`. Destructive `Button` variants are severity-based.

## Demo Video

```bash
pnpm record-demos     # records the 36 views as video + screenshot (requires the dev server)
```

The concatenated video lives in `~/Videos/lead-demos/` (outside the repo).

## Status

Validation prototype. Nothing here is production.