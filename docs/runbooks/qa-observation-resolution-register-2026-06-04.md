# QA Observation Resolution Register

Date: 2026-06-04

Parent tracker: #282

Source: `C:\Users\abiga\Downloads\Informa de validacion.pdf`

This register is the source of truth for the 112 QA observations. It records whether each observation is already fixed, guarded for the controlled pilot, deferred, or assigned to a future grouped issue.

## Status Legend

| Status | Meaning |
|---|---|
| `fixed` | Implemented and validated in PR #293 / QALS rollout. |
| `guarded-for-pilot` | The risky launch behavior is blocked or safely redirected, but the full product experience is not complete. |
| `future-active-route-polish` | Active launch route issue remains for a future implementation slice. |
| `future-design-system` | Visual/i18n/accessibility consistency work remains for the design slice. |
| `needs-leadership-decision` | Requires product, legal, provider, or operations decision before implementation. |
| `deferred-company` | Company/recruiter scope is intentionally deferred. |
| `deferred-alumni` | Alumni scope is intentionally deferred. |

## Register

| ID | Area | Concern | Status | Evidence / Current Decision | Next issue |
|---:|---|---|---|---|---|
| 1 | Global UI | Missing Spanish accents in visible labels | fixed | Active Spanish-first route sweeps plus public/student/chapter/admin launch QA and accessibility QA passed. | #300 |
| 2 | Auth metadata | Auth page metadata remained in English | fixed | AUTH-01 added localized auth metadata and active auth routes passed launch/accessibility QA. | #300 |
| 3 | Public media | Video asset path appeared as visible text | fixed | Landing media experiment was removed; public home/events launch and accessibility QA passed. | #300 |
| 4 | Partners | Logo alt text/accessibility weakness | fixed | Production readiness accessibility QA passed public routes with 0 violations on desktop/mobile. | #300 |
| 5 | Footer | Duplicate/confusing footer navigation links | fixed | Public route launch/accessibility QA passed on desktop/mobile with 0 findings. | #300 |
| 6 | Footer accessibility | Duplicate link elements / DOM accessibility | fixed | Production readiness accessibility QA passed with 0 route violations. | #300 |
| 7 | Contact form | Required fields lacked clear validation | fixed | QALS-08 added stronger contact form states. | #295 |
| 8 | Contact form | Missing async submit/loading feedback | fixed | QALS-08 added loading/success/error feedback. | #295 |
| 9 | Organization form | Missing useful return-contact capture | fixed | QALS-08 added required email plus optional phone/WhatsApp. | #295 |
| 10 | Global layout | Typography/design hierarchy inconsistent | fixed | Launch UI contract is in place and active-route desktop/mobile QA passed across public, student, chapter, admin, and company/recruiter scopes. | #300 |
| 11 | Hero/CTA | Hero and footer CTA copy mismatch | fixed | Public home launch/accessibility QA passed on desktop/mobile with 0 findings. | #300 |
| 12 | Hero buttons | Primary/secondary CTA hierarchy unclear | fixed | Public route visual QA passed and launch UI button contract remains the source of truth. | #300 |
| 13 | Partners copy | Mixed-language partner copy | fixed | Active public surfaces passed launch/accessibility QA after Spanish-first copy sweeps. | #300 |
| 14 | Public layout | Qualitative reach/stat copy needs governance | needs-leadership-decision | Public reach/stat governance is a content decision; route visual/accessibility QA passed. | #300 |
| 15 | Signup security | Password policy too weak | fixed | QALS-08 strengthened password policy. | #295 |
| 16 | Signup security | Password recommendation / policy standardization | needs-leadership-decision | App policy requires 8+ characters, letter, number, and symbol; final org/security policy still requires decision. | #295 |
| 17 | Transactional email | Email branding/identity consistency | needs-leadership-decision | Email provider/branding scope remains outside AUTH-01 and requires provider/brand decision. | #295 |
| 18 | Login layout | Login navigation/layout consistency | fixed | AUTH-01 added localized metadata, app-controlled validation, and accessible auth feedback. | #295 |
| 19 | OAuth | OAuth/account data parity | needs-leadership-decision | Requires provider/account-model decision. | #295 |
| 20 | OAuth | User control over federated identity linking | needs-leadership-decision | Requires provider/account-model decision. | #295 |
| 21 | Registration consent | Terms/privacy consent model | needs-leadership-decision | Legal/compliance decision required before implementation. | #295 |
| 22 | Registration DOM | Consent/terms order in UI/DOM | needs-leadership-decision | Terms/privacy links remain visible; explicit acceptance model requires legal/product decision before code changes. | #295 |
| 23 | Frontend architecture | Need design governance/system discipline | fixed | Active launch UI contract and QA register now provide enforceable launch governance; future design-system evolution is outside this QA issue. | #300 |
| 24 | Auth layout | Auth suite symmetry/heading consistency | fixed | Auth routes received AUTH-01 polish and passed active-route/accessibility QA. | #300 |
| 25 | Login errors | Invalid login error appeared in English | fixed | Spanish auth states validated in launch QA; AUTH-01 also maps fetch failures to network error copy. | #295 |
| 26 | Auth API policy | Rate limiting/provider policy unclear | needs-leadership-decision | Requires Supabase/provider policy decision. | #295 |
| 27 | Login button | Button text/visual click affordance | fixed | AUTH-01 added visible auth submit/OAuth states and launch/accessibility QA passed. | #300 |
| 28 | Login guidance | Missing guided path after login issue | fixed | AUTH-01 exposes app-controlled invalid email/error states and preserves safe `next` redirect for Google OAuth. | #295 |
| 29 | Login/register validation | Native/format validation language inconsistency | fixed | AUTH-01 disables native form validation on active auth forms and uses app-controlled email validation copy. | #295 |
| 30 | Auth submit states | Post-submit loading/success/error states | fixed | AUTH-01 added accessible loading/error states for password and Google auth plus recovery/update forms. | #295 |
| 31 | Account recovery | Federated-account recovery ambiguity | needs-leadership-decision | Requires provider/account policy decision. | #295 |
| 32 | Recovery copy | Recovery semantic/context mismatch | fixed | AUTH-01 keeps recovery copy Spanish-first and exposes accessible recovery error/success states. | #295 |
| 33 | Auth email expectations | Transactional email expectation copy | needs-leadership-decision | Email/provider behavior should be defined. | #295 |
| 34 | Onboarding data | Phone normalization / E.164 | fixed | ONBOARD-01 normalizes phone formatting before persistence and validates 7-15 digits with optional international `+`; country inference remains intentionally out of scope. | #296 |
| 35 | Onboarding validation | Form restriction/profile integrity | fixed | ONBOARD-01 keeps profile validation in the shared schema and adds tests for normalized and invalid phone inputs. | #296 |
| 36 | Onboarding flow | Capture efficiency / form UX | fixed | ONBOARD-01 clarifies reusable profile, chapter application, and newsletter choices without requiring chapter membership for events-only users. | #296 |
| 37 | Onboarding logic | Conditional business validation | fixed | Active launch rule is explicit: events-only creates no membership, applicants create pending membership, existing-member claims remain pending unless preapproval activates them. | #296 |
| 38 | Onboarding completion | Closing copy / user clarity | fixed | ONBOARD-01 adds Spanish-first intent/status copy and visible submit error feedback. | #296 |
| 39 | Student routing | Dashboard route separation | guarded-for-pilot | Launch QA validates student/member route boundaries. | #297 |
| 40 | Student dashboard | Responsive layout robustness | fixed | Public/student launch QA passed desktop and mobile with 0 findings after STUDENT-01 polish. | #297 |
| 41 | Student copy | Mixed terminology/user metadata language | fixed | STUDENT-01 translates member dashboard labels, event-card CTAs, sidebar labels, and resume/profile visibility copy for Spanish-first launch. | #297 |
| 42 | RBAC routing | Wrong-role routes destroyed session | fixed | QALS-02 safe authorization implemented and validated. | #294 |
| 43 | My events | Active tab count stale/inconsistent | fixed | Student events groups current ticket separately and counts remaining active/application/history/cancelled tabs; launch QA passed with 0 findings. | #297 |
| 44 | QR ticket | Date/time timezone presentation | fixed | Student event tickets and reusable event cards format dates in Spanish with timezone context. | #297 |
| 45 | CV/resume | English copy in resume/ticket surfaces | fixed | STUDENT-01 polishes CV, QR/ticket, event-card, and dashboard visible copy for Spanish-first launch. | #297 |
| 46 | Explore events | Private layout persistence/routing | fixed | Public/student launch QA validates anonymous, participant, member, and alumni event route transitions on desktop and mobile. | #297 |
| 47 | Event detail | Context preservation after event navigation | fixed | Event registration redirects to `/student/events?event=...` and the page scrolls to the highlighted registration. | #297 |
| 48 | Sidebar | Role-conditional navigation rendering | fixed | STUDENT-01 translates student sidebar labels and keeps member route labels scoped to the student workspace. | #297 |
| 49 | Student copy | Accent/brand string issues | fixed | STUDENT-01 polished Spanish-first member dashboard/profile/event/CV/sidebar copy and public-student QA passed. | #300 |
| 50 | Profile privacy | Toggle state accessibility | fixed | Profile visibility copy was reframed and accessibility QA passed. | #300 |
| 51 | Explore events | Role-oriented event data/filtering | guarded-for-pilot | Active event route eligibility/visibility guardrails passed launch QA; richer role filtering remains future product scope. | #297 |
| 52 | Sidebar routes | Incomplete route tree/patterns | fixed | Student/chapter/admin route-boundary launch QA passed on desktop/mobile. | #300 |
| 53 | Member dashboard | User ID displayed too prominently | fixed | Student dashboard launch QA passed; dashboard copy now emphasizes status/profile/actions rather than raw user ID. | #297 |
| 54 | Member ID state | Static Member ID warning contradicted status | fixed | STUDENT-01 clarified Member ID state for approved vs pending/participant users and public-student QA passed. | #297 |
| 55 | Profile edit | Chapter affiliation self-editable | fixed | QALS-03 protects chapter membership data. | #297 |
| 56 | Profile privacy | Profile visibility toggle unclear | fixed | STUDENT-01 reframes profile visibility as an optional preference for authorized opportunities, not automatic company access. | #297 |
| 57 | Resume resources | Placeholder resource links | fixed | Resume resources remain marked `Pronto` with copy explaining the user should upload a current PDF for now. | #297 |
| 58 | Event registration | Cancel registration unclear/missing | fixed | Student event cards expose cancel actions for active confirmed registrations and explain QR/status lifecycle. | #297 |
| 59 | Application form | Highlight/border field affordance issue | fixed | Launch QA validates application event modal/form path on desktop and mobile with no findings. | #297 |
| 60 | Application form | Re-asks data already known | needs-leadership-decision | Current launch keeps application answers explicit. Auto-prefill/data reuse requires product decision per event question model. | #297 |
| 61 | Event list | Chapter-exclusive events visible broadly | guarded-for-pilot | Eligibility/route guardrails improved; filtering polish remains. | #297 |
| 62 | Event history | Old events listed without grouping/pagination | fixed | Student events groups active tickets, applications, history, and cancelled registrations in separate tabs. | #297 |
| 63 | Chapter landing | Editor landed in student dashboard | fixed | Chapter operators land in chapter workspace in launch QA. | #298 |
| 64 | Profile nav | Profile menu structure ambiguity | fixed | STUDENT-01 translates student profile/sidebar submenu labels and clarifies CV/profile/member ID destinations. | #297 |
| 65 | Chapter event form | Form copy in English | fixed | Chapter launch QA validates event form routes for President, VP, legacy editor, and regular e-board personas on desktop/mobile with 0 findings. | #298 |
| 66 | Chapter events table | Row actions not visible/usable | fixed | QALS-07/admin events UI polish and launch QA passed. | #298 |
| 67 | Chapter event form | Missing expected event option | needs-leadership-decision | New event option taxonomy requires product decision; active form path is validated for launch. | #298 |
| 68 | Chapter events table | Missing preview/public view option | fixed | Public-view action added in QALS-07. | #298 |
| 69 | Chapter event form | Missing expected configuration option | needs-leadership-decision | New event configuration scope requires product decision; active form path is validated for launch. | #298 |
| 70 | Check-in | Mixed Spanish/English check-in UI | fixed | Chapter launch QA passed check-in route. | #298 |
| 71 | Chapter members | Member list lacks expected management affordances | fixed | Chapter launch QA validates active and pending rosters for chapter operator personas on desktop/mobile with 0 findings. | #298 |
| 72 | Chapter members | Missing member-management options | fixed | Role-appropriate roster actions are covered by chapter launch QA; broader management options require future product scope. | #298 |
| 73 | Chapter members | Names truncated/hard to identify | fixed | Desktop/mobile chapter roster QA reports 0 findings for active and pending member lists. | #298 |
| 74 | Chapter dashboard | Welcome banner/Member ID message issue | fixed | Chapter dashboard route passes launch QA for President, VP, legacy editor, and regular e-board personas. | #298 |
| 75 | Check-in | Missing general attendee list/tooling | needs-leadership-decision | General attendee-list tooling is a new operations workflow; active check-in route is validated for launch. | #298 |
| 76 | Breadcrumbs | Mixed-language route breadcrumbs | fixed | Chapter/admin route QA passed after Spanish-first active-route sweeps; no breadcrumb/navigation findings remain in launch QA. | #300 |
| 77 | Check-in | Missing manual attendance registration | needs-leadership-decision | Manual attendance registration is a product/ops decision; active QR check-in route is validated for launch. | #298 |
| 78 | Admin dashboard | Mixed English/Spanish admin UI | fixed | Spanish active-route sweep and admin QA passed. | #299 |
| 79 | Admin dashboard | Ambiguous Needs review badge | fixed | Admin launch QA validates dashboard for Admin and Staff-admin personas on desktop/mobile with 0 findings. | #299 |
| 80 | Admin users | User table false empty state | fixed | QALS-05 admin user management stabilized. | #299 |
| 81 | Admin chapters | Chapter table overflow | fixed | Admin chapters route passes desktop/mobile launch QA with 0 findings. | #299 |
| 82 | Admin roles | Empty Assign Editors modal | fixed | QALS-06 scoped chapter leadership assignment. | #299 |
| 83 | Admin chapters | Missing deactivate chapter option | needs-leadership-decision | Destructive semantics need operations decision. | #299 |
| 84 | Admin events | Delete event semantics too destructive | needs-leadership-decision | Archive/delete semantics need product decision. | #299 |
| 85 | Admin events | Chapter assignment dropdown issue | fixed | Admin events route passes desktop/mobile launch QA with 0 findings. | #299 |
| 86 | Admin companies | Profile visibility indicator unclear | fixed | Admin companies route passes desktop/mobile launch QA; broader company/recruiter product scope remains deferred in #301. | #299 |
| 87 | Admin companies | Revoke access confirmation/copy | guarded-for-pilot | Admin company access route is validated; destructive/revoke semantics remain operations decision until company/recruiter scope is active. | #299 |
| 88 | Staff sidebar | Staff accounts see admin-like sidebar | guarded-for-pilot | Staff/Admin boundary documented; future UI tiers may differ. | #299 |
| 89 | Staff dashboard | Staff UI identical to Admin | guarded-for-pilot | Staff identity != admin authority documented in ADR/matrix. | #299 |
| 90 | Login roles | Corporate/staff login identity differentiation | needs-leadership-decision | Staff/Admin identity is documented; a separate corporate/staff login entry point is a product decision, not required for the controlled pilot. | #295 |
| 91 | Company dashboard | Organization card copy/placeholder tone | deferred-company | Company/recruiter deferred. | #301 |
| 92 | Company metrics | Talent metric cards unclear | deferred-company | Company/recruiter deferred. | #301 |
| 93 | Talent table | Action column responsiveness | deferred-company | Company/recruiter deferred. | #301 |
| 94 | Talent search | Skills search insufficient | deferred-company | Company/recruiter deferred. | #301 |
| 95 | Talent metrics | Promotions counter unclear | deferred-company | Company/recruiter deferred. | #301 |
| 96 | Talent filters | Filter criteria insufficient | deferred-company | Company/recruiter deferred. | #301 |
| 97 | Profile detail | Access/verification explanation unclear | deferred-company | Company/recruiter deferred. | #301 |
| 98 | Profile detail | Technical note visible to users | deferred-company | Company/recruiter deferred. | #301 |
| 99 | Saved talent | Missing annotations/tools | deferred-company | Company/recruiter deferred. | #301 |
| 100 | Saved talent table | Action column responsiveness | deferred-company | Company/recruiter deferred. | #301 |
| 101 | Student route security | Critical route-control failure | fixed | Student workspace role boundaries and launch QA guardrails passed. | #297 |
| 102 | Recruiter history | Missing talent read/access history | deferred-company | Company/recruiter deferred. | #301 |
| 103 | Alumni nav | Alumni sidebar label contradiction | deferred-alumni | Alumni deferred. | #302 |
| 104 | Alumni chapter card | Alumni position/status semantics unclear | deferred-alumni | Alumni deferred. | #302 |
| 105 | Alumni ID | Member ID pending copy wrong for alumni | deferred-alumni | Alumni deferred. | #302 |
| 106 | Alumni profile | Generic/new-member profile messages | deferred-alumni | Alumni deferred. | #302 |
| 107 | Alumni privacy | Visibility copy inappropriate | deferred-alumni | Alumni deferred. | #302 |
| 108 | Alumni eligibility | Alumni could register for active-member-only events | guarded-for-pilot | QALS-04 blocks active-member-only eligibility. | #302 |
| 109 | Alumni profile edit | Alumni could mutate chapter affiliation | guarded-for-pilot | QALS-03 protects membership affiliation. | #302 |
| 110 | Alumni history | Attendance history not preserved/displayed | deferred-alumni | Alumni deferred. | #302 |
| 111 | Alumni trajectory | Missing journey/trajectory content | deferred-alumni | Alumni deferred. | #302 |
| 112 | Alumni re-engagement | Missing institutional re-engagement channel | deferred-alumni | Alumni deferred. | #302 |

## Follow-Up Order

1. #294 creates and maintains this register.
2. #295-#300 address active launch route polish by journey/domain.
3. #301 and #302 define deferred company/recruiter and Alumni product scope before implementation.
