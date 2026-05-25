# Plan: Issue #212 - Clean Public Homepage Asset And Hydration Warnings

GitHub Issue: #212
Source PRD: `.github/PRDs/launch-user-flow-qa-fixes.prd.md`
Type: Bug / Frontend
Complexity: Small

## Summary

Public QA reported launch-visible console noise on `/es`: a localized video request, a `leadl2.svg` aspect-ratio warning, and a caret-color hydration mismatch on public forms. The current video references are already root-relative, but we will make the video source explicit at the `<video>` level, preserve the SVG logo aspect ratio everywhere it is used, and suppress browser-injected input caret style mismatches at the input primitive.

## Implementation Status

- [x] Task 1: Make public video asset resolution explicit.
- [x] Task 2: Preserve `leadl2.svg` image aspect ratio.
- [x] Task 3: Stop browser-injected input caret styles from producing hydration warnings.
- [x] Task 4: Validate focused and repo-wide checks.

## Patterns To Follow

| Category | File | Pattern |
| --- | --- | --- |
| Public media | `app/[locale]/(public)/_components/hero.tsx` | Public assets under `public/` should be referenced with root-relative URLs. |
| Logo image | `app/[locale]/(public)/_components/navbar-client.tsx` | Next Image width/height should preserve intrinsic SVG aspect ratio or use `w-auto/h-auto` correctly. |
| Form primitive | `components/ui/input.tsx` | Centralize browser hydration behavior in the shared input instead of patching every form. |

## Files To Change

| File | Action | Purpose |
| --- | --- | --- |
| `app/[locale]/(public)/_components/hero.tsx` | Update | Use explicit root video `src` and avoid localized asset resolution. |
| `app/[locale]/(public)/_components/final-cta.tsx` | Update | Same video asset fix for the lower public CTA. |
| `app/[locale]/(public)/_components/navbar-client.tsx` | Update | Use aspect-ratio-correct logo dimensions. |
| `app/[locale]/(public)/_components/footer.tsx` | Update | Use aspect-ratio-correct logo dimensions. |
| `components/global/navigation/NavBar.tsx` | Update | Keep shared/global LEAD logo usage ratio-safe. |
| `components/ui/input.tsx` | Update | Suppress hydration warnings from browser-injected caret-color styles. |

## Tasks

### Task 1: Video Asset Resolution

- Add shared root-relative video constants in public media components.
- Put `src="/video3.mp4"` directly on `<video>` elements.
- Keep autoplay/muted/loop/playsInline behavior unchanged.

### Task 2: Logo Aspect Ratio

- Use dimensions matching `leadl2.svg` intrinsic ratio (`270 x 148`).
- Preserve existing visual size with `h-* w-auto` classes where needed.

### Task 3: Caret Hydration

- Add `suppressHydrationWarning` to the shared `Input` primitive.
- Keep normal `style`, value, disabled, and validation props intact.

### Task 4: Validate

```bash
pnpm run lint
pnpm exec tsc --noEmit
pnpm test
```

## Acceptance Criteria Mapping

- Public video requests resolve against `/video3.mp4`, not `/es/video3.mp4`.
- `leadl2.svg` usage no longer distorts the intrinsic aspect ratio.
- Public form inputs avoid launch-visible caret-color hydration warnings caused by browser-injected inline styles.
- The fixes do not alter public page layout or auth/company form behavior.
