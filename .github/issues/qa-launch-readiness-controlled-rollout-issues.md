# Issue Set: QA Launch Readiness Controlled Rollout

Source PRD: `.github/PRDs/qa-launch-readiness-controlled-rollout.prd.md`

Status: Created in GitHub under parent issue #282.

## Proposed Vertical Slices

### QALS-01 / #283: Publish launch scope and Spanish-first UI contract

Type: HITL

GitHub: #283

Labels: `documentation`, `product`, `design-system`, `i18n`, `qa`, `phase:launch-readiness`

Complexity: Medium

Dependencies: None

User stories covered: 11, 12, 13

#### What to build

Create the short launch UI contract and controlled rollout scope so implementation work has a single source of truth. The contract should preserve the existing Tailwind/global CSS/components base while defining how launch-critical Spanish routes use buttons, headers, forms, tables, modals, feedback states, and mobile behavior.

#### Acceptance criteria

- [ ] A launch UI contract exists in the handbook and covers Spanish-first copy, button intent, page headers, forms, tables, modals, states, and mobile overflow.
- [ ] The document explicitly scopes active launch routes and defers Recruiter/company, Alumni, and English polish.
- [ ] The document explains that existing global CSS and `components/ui` remain the base; the missing layer is usage enforcement.
- [ ] The contract includes a checklist future issues can cite during visual QA.
- [ ] The QA synthesis and PRD link to this contract.

#### Blocked by

None - can start immediately.

---

### QALS-02 / #284: Make restricted-route authorization fail safely

Type: AFK

GitHub: #284

Labels: `security`, `auth`, `routing`, `backend`, `frontend`, `testing`, `phase:launch-readiness`

Complexity: Large

Dependencies: QALS-01 / #283

User stories covered: 2, 6, 10, 13

#### What to build

Replace destructive wrong-role routing with safe authorization behavior. Anonymous users still go to login, but authenticated users who lack access to `/es/admin`, `/es/chapter`, or `/es/company` should remain signed in and land on a role-appropriate dashboard or unauthorized state with a clear Spanish explanation.

#### Acceptance criteria

- [ ] Authenticated wrong-role access no longer calls sign-out or destroys the valid session.
- [ ] Anonymous access still redirects to login.
- [ ] Participant, member, chapter operator, admin, staff, recruiter, and alumni route-boundary cases are covered by deterministic tests or Playwright QA.
- [ ] Chapter operators resolve to `/es/chapter` by default after login.
- [ ] Unauthorized messaging is user-friendly and Spanish-first.

#### Blocked by

- Blocked by QALS-01 / #283.

---

### QALS-03 / #285: Enforce profile and chapter membership integrity

Type: AFK

GitHub: #285

Labels: `membership`, `profile`, `data-integrity`, `services`, `frontend`, `testing`, `phase:launch-readiness`

Complexity: Medium

Dependencies: QALS-01 / #283

User stories covered: 3, 10, 13

#### What to build

Prevent members and alumni from changing official chapter affiliation through profile editing. Chapter affiliation should render as read-only membership data backed by `chapter_membership`; profile editing should remain limited to personal/contact/professional fields.

#### Acceptance criteria

- [ ] Member profile editing no longer writes chapter affiliation from a normal profile form.
- [ ] Alumni profile editing cannot mutate historical chapter affiliation.
- [ ] UI displays official chapter as read-only with Spanish support copy for transfer/support requests.
- [ ] Service/action tests assert profile updates do not create or mutate `chapter_membership` chapter affiliation.
- [ ] Manual QA confirms member and alumni seed personas cannot self-reassign chapters.

#### Blocked by

- Blocked by QALS-01 / #283.

---

### QALS-04 / #286: Harden event eligibility and registration lifecycle

Type: AFK

GitHub: #286

Labels: `events`, `security`, `services`, `server-actions`, `frontend`, `testing`, `phase:launch-readiness`

Complexity: Large

Dependencies: QALS-02 / #284, QALS-03 / #285

User stories covered: 4, 5, 13

#### What to build

Move event eligibility truth into service/API behavior and reflect it in UI. Ineligible users, including alumni for active-member-only events, must not be able to create valid registrations or QR check-in access. Fix registration cancellation and member event state refresh as part of the same registration lifecycle slice.

#### Acceptance criteria

- [ ] Event registration service/action rejects ineligible users before creating or reactivating registration rows.
- [ ] Alumni cannot register for active-member-only events or receive valid QR/check-in state for those events.
- [ ] UI disables blocked registration actions and shows Spanish copy such as `Este evento es exclusivo para miembros activos de LEAD.`
- [ ] Cancel registration works for allowed future registrations and refreshes member event views.
- [ ] Tests cover eligible member, public participant, alumni, duplicate registration, cancelled reactivation, and ineligible direct action attempts.

#### Blocked by

- Blocked by QALS-02 / #284.
- Blocked by QALS-03 / #285.

---

### QALS-05 / #287: Recover admin user management for launch operations

Type: AFK

GitHub: #287

Labels: `admin`, `users`, `backend`, `frontend`, `testing`, `phase:launch-readiness`

Complexity: Medium

Dependencies: QALS-02 / #284

User stories covered: 8, 10, 13

#### What to build

Fix the admin users table so central operators can reliably view, search, filter, paginate, and inspect users before chapter leaders are activated. The page must distinguish real empty states from query failures and show Spanish-first operational copy.

#### Acceptance criteria

- [ ] Admin users table loads seeded users when users exist.
- [ ] Search, filters, and pagination do not incorrectly collapse results to `No users found`.
- [ ] Query failures render a clear error state instead of a silent empty table.
- [ ] Admin/staff boundary copy is clear and does not imply staff identity automatically grants unrestricted authority.
- [ ] Tests or Playwright QA cover admin and staff access to the user-management surface.

#### Blocked by

- Blocked by QALS-02 / #284.

---

### QALS-06 / #288: Replace empty Assign Editors modal with chapter leadership assignment

Type: AFK

GitHub: #288

Labels: `admin`, `chapter`, `permissions`, `services`, `frontend`, `testing`, `phase:launch-readiness`

Complexity: Large

Dependencies: QALS-05 / #287

User stories covered: 6, 9, 10, 13

#### What to build

Turn the empty `Assign Editors` modal into a real chapter leadership assignment workflow. The workflow should assign chapter-scoped responsibility and capability through `chapter_role_assignment` and `chapter_permission_grant`, not merely a broad global editor label.

#### Acceptance criteria

- [ ] Admin can select eligible users and assign chapter-scoped leadership roles for a chapter.
- [ ] Assignments create or update `chapter_role_assignment` and apply appropriate `chapter_permission_grant` records.
- [ ] The UI shows current assigned leaders, pending/invalid states, and Spanish-first save/error feedback.
- [ ] The workflow prevents invalid cross-chapter or duplicate protected-role assignments according to current launch rules.
- [ ] Service/action tests cover assignment, replacement, permission grants, invalid users, and audit/error cases.

#### Blocked by

- Blocked by QALS-05 / #287.

---

### QALS-07 / #289: Stabilize chapter operator event management UI

Type: AFK

GitHub: #289

Labels: `chapter`, `events`, `frontend`, `design-system`, `i18n`, `testing`, `phase:launch-readiness`

Complexity: Medium

Dependencies: QALS-01 / #283, QALS-02 / #284, QALS-06 / #288

User stories covered: 6, 7, 11, 12, 13

#### What to build

Make the chapter dashboard and chapter event-management surfaces operationally usable for presidents/VPs/editors. Critical row actions must stay visible, table overflow must not hide primary actions, and event create/edit flows should include Spanish-first labels, preview/publish clarity, breadcrumbs, feedback states, and mobile-safe layout.

#### Acceptance criteria

- [ ] Chapter event tables expose primary actions without requiring hidden horizontal scrolling.
- [ ] Event create/edit forms use Spanish-first labels, validation, breadcrumbs, loading, error, and success states.
- [ ] Event preview/publish intent is clear before publication.
- [ ] Chapter operator landing and dashboard actions align with the launch UI contract.
- [ ] Browser screenshots validate desktop and mobile/narrow layouts for chapter operator routes.

#### Blocked by

- Blocked by QALS-01 / #283.
- Blocked by QALS-02 / #284.
- Blocked by QALS-06 / #288.

---

### QALS-08 / #290: Harden auth and contact conversion flows in Spanish

Type: AFK

GitHub: #290

Labels: `auth`, `forms`, `i18n`, `security`, `frontend`, `testing`, `phase:launch-readiness`

Complexity: Medium

Dependencies: QALS-01 / #283

User stories covered: 1, 11, 12, 13

#### What to build

Stabilize Spanish-first auth and public contact flows. Enforce stronger password requirements, improve login/recovery validation and feedback states, preserve Spanish copy, and add a required return email plus optional phone/WhatsApp to the organization/contact form.

#### Acceptance criteria

- [ ] Signup validates stronger password requirements: minimum 8 characters, at least one letter, one number, and one symbol unless a stronger configured policy supersedes it.
- [ ] Login, signup, forgot-password, recovery, and post-submit states use Spanish-first copy where app-controlled.
- [ ] Auth metadata and visible labels avoid launch-visible English in Spanish routes.
- [ ] Organization/contact form includes required email and optional phone/WhatsApp and preserves loading/success/error feedback.
- [ ] Tests or browser QA cover weak password, missing/invalid email, submit loading, success, and recovery guidance states.

#### Blocked by

- Blocked by QALS-01 / #283.

---

### QALS-09 / #291: Spanish-first active route cleanup and accessible UI sweep

Type: AFK

GitHub: #291

Labels: `i18n`, `accessibility`, `frontend`, `design-system`, `qa`, `phase:launch-readiness`

Complexity: Large

Dependencies: QALS-01 / #283, QALS-04 / #286, QALS-07 / #289, QALS-08 / #290

User stories covered: 1, 4, 7, 11, 12, 13

#### What to build

Apply the Spanish-first launch UI contract across active routes: public landing, auth, onboarding, participant/member dashboard, events, chapter dashboard, and admin/staff console. Fix mixed English labels, missing accessible names, duplicated/dead links, placeholder copy, accents where desired in app copy, empty states, and mobile overflow.

#### Acceptance criteria

- [ ] Active Spanish routes no longer show launch-visible English labels such as admin/table/action defaults.
- [ ] Public landing fixes visible asset references, partner alt text, footer dead/duplicate links, and contact states.
- [ ] Onboarding and member dashboard copy/states align with current role scope and do not imply deferred Alumni/Recruiter behavior.
- [ ] Tables, cards, buttons, and modals follow the launch UI contract.
- [ ] Accessibility and keyboard checks cover active launch routes with no critical violations introduced.

#### Blocked by

- Blocked by QALS-01 / #283.
- Blocked by QALS-04 / #286.
- Blocked by QALS-07 / #289.
- Blocked by QALS-08 / #290.

---

### QALS-10 / #292: Run seeded-persona launch QA and publish readiness report

Type: AFK

GitHub: #292

Labels: `qa`, `playwright`, `documentation`, `release-readiness`, `phase:launch-readiness`

Complexity: Medium

Dependencies: QALS-02 / #284, QALS-03 / #285, QALS-04 / #286, QALS-05 / #287, QALS-06 / #288, QALS-07 / #289, QALS-08 / #290, QALS-09 / #291

User stories covered: 13

#### What to build

Validate the controlled rollout end to end with deterministic seed personas and visual screenshots. Publish a readiness report that states whether the platform is ready for a small president/VP pilot, what remains deferred, and what validation evidence supports the decision.

#### Acceptance criteria

- [ ] Validation uses seed personas for participant, member, president, vice president, editor/eboard, admin, staff, recruiter, and alumni where applicable.
- [ ] Recruiter/company and Alumni are verified as deferred/safely guarded rather than launch-ready.
- [ ] Playwright or documented browser QA covers desktop and mobile/narrow layouts for active launch routes.
- [ ] Report includes pass/fail evidence for route safety, membership integrity, event eligibility, admin users, chapter assignment, Spanish-first copy, and UI overflow.
- [ ] Final recommendation says either ready for controlled pilot or names remaining launch blockers.

#### Blocked by

- Blocked by all implementation slices QALS-02 / #284 through QALS-09 / #291.
