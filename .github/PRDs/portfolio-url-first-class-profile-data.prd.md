# Portfolio URL First-Class Profile Data PRD

## 1. Executive Summary

LEAD Talent Platform already stores `portfolio_url` on `person_profile` and collects it during onboarding, but the field is not consistently carried through the product. Students can add it in onboarding, yet they cannot manage it from their profile, and professional review surfaces such as company profile views and event application review do not show it.

The MVP goal is to make portfolio URL a first-class optional profile field without expanding scope into a public profile redesign. Portfolio should behave like LinkedIn and resume data: useful for professional evaluation, optional for students, and visible only in authorized career/review contexts.

## 2. Mission

Make student portfolio data reliable, editable, and useful across the LEAD professional workflow while preserving privacy, low-friction onboarding, and the canonical account model.

Core principles:

- Keep portfolio optional.
- Store portfolio on `person_profile`, not `public.user`.
- Normalize common URL input so students are not blocked by missing `https://`.
- Show portfolio only where LinkedIn/resume-style professional information already belongs.
- Do not expose non-approved participants in company discovery.
- Avoid redesigning profile or company UX as part of this foundation fix.

## 3. Target Users

### Student or Member

Pain points:

- They may have a GitHub, Behance, Notion, personal site, or portfolio but no place to maintain it after onboarding.
- They may type `github.com/name` and receive a confusing validation error.

Needs:

- Optional field
- Friendly URL handling
- Ability to edit later
- Confidence that the link is shown only in appropriate professional contexts

### Chapter Editor or Event Organizer

Pain points:

- Application review can be weaker if portfolio evidence is hidden.
- Reviewers should not hunt across multiple systems for candidate work.

Needs:

- Portfolio link shown beside LinkedIn when reviewing event applications
- No empty/noisy fields when no portfolio exists

### Company Representative

Pain points:

- They need complete professional context for approved and recruitable LEAD members.
- Portfolio is especially important for design, product, tech, marketing, and creative profiles.

Needs:

- Portfolio link visible when the student/member is eligible and has opted into professional visibility
- Same access boundaries as LinkedIn/resume

### Admin

Pain points:

- Admins need to inspect profile completeness and data quality.

Needs:

- Portfolio visible on admin user detail
- Service behavior that does not silently drop or ignore the field

## 4. MVP Scope

### In Scope

- [ ] Keep `portfolio_url` optional.
- [ ] Normalize portfolio URLs by adding `https://` when the scheme is missing.
- [ ] Validate normalized URLs before saving.
- [ ] Include portfolio URL in student profile read/update flows.
- [ ] Add portfolio editing to the student profile UI.
- [ ] Show portfolio in authorized company/member detail surfaces where LinkedIn/resume already appear.
- [ ] Show portfolio in event application review where applicant professional links appear.
- [ ] Add focused service/action tests for normalization, persistence, and display data mapping.
- [ ] Preserve existing access rules for company/recruiter visibility.

### Out of Scope

- [ ] Public portfolio/profile pages.
- [ ] Portfolio previews, thumbnails, embeds, or scraping metadata.
- [ ] Requiring portfolio for onboarding, company visibility, event applications, or membership approval.
- [ ] Changing recruiter/company eligibility rules.
- [ ] Redesigning dashboard, profile, or company portal layouts beyond the required field additions.
- [ ] Moving portfolio to `public.user`.

## 5. User Stories

1. As a student, I want to leave portfolio empty, so that onboarding remains fast and optional.
2. As a student, I want to enter `github.com/myname` and have the app save a valid URL, so that I do not need to know URL syntax details.
3. As a returning student, I want to edit my portfolio URL from my profile, so that my professional information stays current.
4. As a company representative, I want to see an eligible member's portfolio when present, so that I can evaluate their work.
5. As an event organizer, I want to see an applicant's portfolio during review when present, so that application decisions have better context.
6. As an admin, I want portfolio data to appear consistently on admin profile inspection surfaces, so that I can verify data quality.
7. As an engineer, I want services and tests to treat portfolio as part of `person_profile`, so that the field is not silently dropped in future refactors.

## 6. Core Architecture

Portfolio URL remains part of the canonical account model:

- `public.user`: universal account identity and contact fields
- `person_profile`: reusable basic profile fields, including `portfolio_url`
- `chapter_membership`: chapter application and approval state
- `lead_identity`: official LEAD identity display
- `recruiter_access`: company representative access scope

Likely implementation areas:

```text
lib/
  memberschema.ts
  actions/
    person-profile.ts
    student/profile.ts
    student/onboarding.helpers.ts
  services/
    person-profile.service.ts
    student.service.ts
    company.service.ts
    recruiter.service.ts
    event.service.ts
app/[locale]/
  student/profile/
  company/(protected)/
  chapter/events/[id]/applications/
components/
  onboarding.tsx
  events/application-review-card.tsx
```

## 7. Tools and Features

### URL Normalization

Add a reusable helper for optional profile URLs:

- Trim input.
- Treat empty string as `null`.
- If no URL scheme is present, prepend `https://`.
- Validate with URL parsing or Zod after normalization.
- Store the normalized value.

### Student Profile Management

The student-owned profile flow should:

- Load `portfolio_url` from `person_profile`.
- Display it as an optional field.
- Save it without clearing unrelated profile fields.
- Use Spanish-first copy where the surrounding route is Spanish.

### Professional Review Surfaces

Portfolio should appear only when present:

- Company/candidate detail
- Company quick view if enough room without clutter
- Event application review cards
- Admin user detail

### Access Rules

Portfolio follows LinkedIn/resume visibility rules:

- User can manage their own portfolio.
- Admin can inspect it.
- Company representatives can see it only for eligible visible members within existing company access rules.
- Participants without approved chapter membership do not appear in company discovery.

## 8. Technology Stack

- Next.js 15 App Router
- React 19
- Supabase Postgres
- Generated types in `lib/database.generated.ts`
- Zod validation
- Tailwind CSS 4
- Vitest for service/action coverage

## 9. Security and Configuration

No new environment variables are required.

Security requirements:

- Do not render unvalidated URLs.
- Use `target="_blank"` with `rel="noopener noreferrer"` for external links.
- Preserve RLS and service-layer access rules.
- Do not expose portfolio on public surfaces unless a future explicit public profile feature is approved.

## 10. API Specification

No new API endpoint is required.

Affected service/action contracts should include optional portfolio values:

```typescript
type OptionalPortfolioInput = {
  portfolio_url?: string | null
}

type BasicProfile = {
  portfolioUrl: string | null
}
```

Expected behavior:

- Input: `""` -> stored as `null`
- Input: `"github.com/lead"` -> stored as `"https://github.com/lead"`
- Input: `"https://github.com/lead"` -> stored unchanged
- Input: `"not a url"` -> validation error

## 11. Success Criteria

- A student can save onboarding with no portfolio URL.
- A student can save and later edit a portfolio URL from the profile screen.
- Missing `https://` is normalized instead of rejected.
- Company/candidate and event application review surfaces show portfolio only when present and authorized.
- Service tests cover optional, normalized, invalid, and empty portfolio behavior.
- Existing auth, company visibility, and chapter eligibility rules are unchanged.

## 12. Implementation Phases

### Phase 1: Normalize and Persist

- Add optional URL normalization helper.
- Wire it into onboarding/profile actions.
- Ensure `PersonProfileService` and `StudentService` preserve portfolio.
- Add focused tests.

### Phase 2: Student Profile UI

- Add optional portfolio field to profile edit.
- Load current portfolio value.
- Improve validation and Spanish-first helper/error copy.

### Phase 3: Review and Company Surfaces

- Include portfolio in company/recruiter profile service mappings.
- Display portfolio links beside LinkedIn/resume where appropriate.
- Include portfolio in event application review data.

### Phase 4: Verification

- Run service/action tests.
- Manually verify onboarding, profile edit, company profile, and application review.
- Confirm no public route leaks the portfolio URL.

## 13. Future Considerations

- Portfolio preview cards.
- Public member profile pages.
- Multiple portfolio links by category.
- Importing GitHub/LinkedIn metadata.
- Profile completeness scoring.

## 14. Risks and Mitigations

### Risk: Portfolio leaks into public UI

Mitigation: Only add it to authenticated, authorized review/company/admin surfaces in this PRD.

### Risk: URL validation is too strict

Mitigation: Normalize missing schemes before validation and keep portfolio optional.

### Risk: Service drift silently drops portfolio again

Mitigation: Add tests around service mappings and update architecture guidance if needed.

### Risk: Company UI becomes cluttered

Mitigation: Hide missing portfolio links and display it only near existing professional links.

### Risk: Legacy student service paths remain incomplete

Mitigation: Include `StudentService` in the implementation scope until profile update/read paths agree with `person_profile`.
