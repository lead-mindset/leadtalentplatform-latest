# Issue #331 Report - Clean Company Service Comments

GitHub issue: https://github.com/lead-mindset/leadtalentplatform-latest/issues/331

## Summary

`lib/services/company.service.ts` no longer contains noisy separator comments or mojibake dash characters. The change is comment-only and does not alter service behavior.

## Implementation

- Removed corrupted ornamental separator comment lines.
- Removed a stale separator note.
- Replaced mojibake em dash comments with ASCII hyphen comments.
- Kept useful section comments:
  - `// Types`
  - `// Shared company talent visibility helpers`
  - `// Profile actions`

## Validation

- `rg "Ã|Â|â|�" -n lib/services/company.service.ts`
  - Passed; no matches.
- `rg "[^\x00-\x7F]" -n lib/services/company.service.ts`
  - Passed; no matches.
- `pnpm exec tsc --noEmit --pretty false`
  - Passed.
- `pnpm run lint`
  - Passed with existing warnings only, 0 errors.
- `pnpm exec vitest run lib/services/__tests__/company.service.test.ts`
  - Passed, 1 file / 25 tests.
- `pnpm test`
  - Passed, 59 files / 533 tests.
