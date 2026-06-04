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
| 1 | Global UI | Missing Spanish accents in visible labels | future-design-system | Active routes received Spanish-first sweep, but full accent/copy audit remains broader work. | #300 |
| 2 | Auth metadata | Auth page metadata remained in English | future-design-system | Metadata/copy should be handled in active-route visual/i18n sweep. | #300 |
| 3 | Public media | Video asset path appeared as visible text | future-design-system | Landing media experiment was removed; active-route visual contract still tracks this class. | #300 |
| 4 | Partners | Logo alt text/accessibility weakness | future-design-system | Needs active public-page accessibility pass. | #300 |
| 5 | Footer | Duplicate/confusing footer navigation links | future-design-system | Footer belongs to active public route polish. | #300 |
| 6 | Footer accessibility | Duplicate link elements / DOM accessibility | future-design-system | Needs active public-page accessibility pass. | #300 |
| 7 | Contact form | Required fields lacked clear validation | fixed | QALS-08 added stronger contact form states. | #295 |
| 8 | Contact form | Missing async submit/loading feedback | fixed | QALS-08 added loading/success/error feedback. | #295 |
| 9 | Organization form | Missing useful return-contact capture | fixed | QALS-08 added required email plus optional phone/WhatsApp. | #295 |
| 10 | Global layout | Typography/design hierarchy inconsistent | future-design-system | Launch UI contract exists; broader active-route hardening remains. | #300 |
| 11 | Hero/CTA | Hero and footer CTA copy mismatch | future-design-system | Public landing active-route polish remains. | #300 |
| 12 | Hero buttons | Primary/secondary CTA hierarchy unclear | future-design-system | Button contract exists; public route visual pass remains. | #300 |
| 13 | Partners copy | Mixed-language partner copy | future-design-system | Active Spanish copy pass should finish public surfaces. | #300 |
| 14 | Public layout | Qualitative reach/stat copy needs governance | future-design-system | Needs public-page content decision and visual pass. | #300 |
| 15 | Signup security | Password policy too weak | fixed | QALS-08 strengthened password policy. | #295 |
| 16 | Signup security | Password recommendation / policy standardization | needs-leadership-decision | App policy improved; final org/security policy still requires decision. | #295 |
| 17 | Transactional email | Email branding/identity consistency | needs-leadership-decision | Email provider/branding scope is outside PR #293. | #295 |
| 18 | Login layout | Login navigation/layout consistency | future-active-route-polish | Active auth polish remains after pilot blockers. | #295 |
| 19 | OAuth | OAuth/account data parity | needs-leadership-decision | Requires provider/account-model decision. | #295 |
| 20 | OAuth | User control over federated identity linking | needs-leadership-decision | Requires provider/account-model decision. | #295 |
| 21 | Registration consent | Terms/privacy consent model | needs-leadership-decision | Legal/compliance decision required before implementation. | #295 |
| 22 | Registration DOM | Consent/terms order in UI/DOM | future-active-route-polish | Auth UI polish can fix after consent decision. | #295 |
| 23 | Frontend architecture | Need design governance/system discipline | future-design-system | Launch UI contract exists; full design-system work remains. | #300 |
| 24 | Auth layout | Auth suite symmetry/heading consistency | future-design-system | Active auth visual polish remains. | #300 |
| 25 | Login errors | Invalid login error appeared in English | fixed | Spanish auth states validated in launch QA. | #295 |
| 26 | Auth API policy | Rate limiting/provider policy unclear | needs-leadership-decision | Requires Supabase/provider policy decision. | #295 |
| 27 | Login button | Button text/visual click affordance | future-design-system | Active auth visual polish remains. | #300 |
| 28 | Login guidance | Missing guided path after login issue | future-active-route-polish | Auth recovery/feedback slice should refine. | #295 |
| 29 | Login/register validation | Native/format validation language inconsistency | future-active-route-polish | App-controlled messages improved; browser/native cases need pass. | #295 |
| 30 | Auth submit states | Post-submit loading/success/error states | future-active-route-polish | Launch QA passed; deeper auth state polish remains. | #295 |
| 31 | Account recovery | Federated-account recovery ambiguity | needs-leadership-decision | Requires provider/account policy decision. | #295 |
| 32 | Recovery copy | Recovery semantic/context mismatch | future-active-route-polish | Active auth recovery polish remains. | #295 |
| 33 | Auth email expectations | Transactional email expectation copy | needs-leadership-decision | Email/provider behavior should be defined. | #295 |
| 34 | Onboarding data | Phone normalization / E.164 | future-active-route-polish | Needs onboarding validation slice. | #296 |
| 35 | Onboarding validation | Form restriction/profile integrity | future-active-route-polish | Needs onboarding validation slice. | #296 |
| 36 | Onboarding flow | Capture efficiency / form UX | future-active-route-polish | Needs onboarding UX slice. | #296 |
| 37 | Onboarding logic | Conditional business validation | needs-leadership-decision | Chapter-intent rules may need product decision. | #296 |
| 38 | Onboarding completion | Closing copy / user clarity | future-active-route-polish | Needs onboarding Spanish copy polish. | #296 |
| 39 | Student routing | Dashboard route separation | guarded-for-pilot | Launch QA validates student/member route boundaries. | #297 |
| 40 | Student dashboard | Responsive layout robustness | future-active-route-polish | Needs member route visual pass. | #297 |
| 41 | Student copy | Mixed terminology/user metadata language | future-active-route-polish | Needs member route copy pass. | #297 |
| 42 | RBAC routing | Wrong-role routes destroyed session | fixed | QALS-02 safe authorization implemented and validated. | #294 |
| 43 | My events | Active tab count stale/inconsistent | future-active-route-polish | Needs member event state polish. | #297 |
| 44 | QR ticket | Date/time timezone presentation | future-active-route-polish | Needs QR/date formatting slice. | #297 |
| 45 | CV/resume | English copy in resume/ticket surfaces | future-active-route-polish | Needs member route Spanish pass. | #297 |
| 46 | Explore events | Private layout persistence/routing | future-active-route-polish | Needs member event route polish. | #297 |
| 47 | Event detail | Context preservation after event navigation | future-active-route-polish | Needs member event UX polish. | #297 |
| 48 | Sidebar | Role-conditional navigation rendering | future-active-route-polish | Needs member/sidebar route polish. | #297 |
| 49 | Student copy | Accent/brand string issues | future-design-system | Active-route copy audit remains. | #300 |
| 50 | Profile privacy | Toggle state accessibility | future-design-system | Active profile accessibility pass remains. | #300 |
| 51 | Explore events | Role-oriented event data/filtering | future-active-route-polish | Needs member event discovery polish. | #297 |
| 52 | Sidebar routes | Incomplete route tree/patterns | future-design-system | Navigation contract polish remains. | #300 |
| 53 | Member dashboard | User ID displayed too prominently | future-active-route-polish | Needs dashboard information-density polish. | #297 |
| 54 | Member ID state | Static Member ID warning contradicted status | future-active-route-polish | Needs member dashboard state polish. | #297 |
| 55 | Profile edit | Chapter affiliation self-editable | fixed | QALS-03 protects chapter membership data. | #297 |
| 56 | Profile privacy | Profile visibility toggle unclear | future-active-route-polish | Needs profile privacy UX polish. | #297 |
| 57 | Resume resources | Placeholder resource links | future-active-route-polish | Needs resume route content decision/polish. | #297 |
| 58 | Event registration | Cancel registration unclear/missing | future-active-route-polish | Registration lifecycle improved; route polish remains. | #297 |
| 59 | Application form | Highlight/border field affordance issue | future-active-route-polish | Needs application form visual polish. | #297 |
| 60 | Application form | Re-asks data already known | future-active-route-polish | Needs application form data reuse decision. | #297 |
| 61 | Event list | Chapter-exclusive events visible broadly | guarded-for-pilot | Eligibility/route guardrails improved; filtering polish remains. | #297 |
| 62 | Event history | Old events listed without grouping/pagination | future-active-route-polish | Needs event history UX slice. | #297 |
| 63 | Chapter landing | Editor landed in student dashboard | fixed | Chapter operators land in chapter workspace in launch QA. | #298 |
| 64 | Profile nav | Profile menu structure ambiguity | future-active-route-polish | Needs navigation polish. | #297 |
| 65 | Chapter event form | Form copy in English | future-active-route-polish | Chapter route polish remains. | #298 |
| 66 | Chapter events table | Row actions not visible/usable | fixed | QALS-07/admin events UI polish and launch QA passed. | #298 |
| 67 | Chapter event form | Missing expected event option | future-active-route-polish | Needs event form product/UX slice. | #298 |
| 68 | Chapter events table | Missing preview/public view option | fixed | Public-view action added in QALS-07. | #298 |
| 69 | Chapter event form | Missing expected configuration option | future-active-route-polish | Needs event form product/UX slice. | #298 |
| 70 | Check-in | Mixed Spanish/English check-in UI | fixed | Chapter launch QA passed check-in route. | #298 |
| 71 | Chapter members | Member list lacks expected management affordances | future-active-route-polish | Needs member-management polish. | #298 |
| 72 | Chapter members | Missing member-management options | future-active-route-polish | Needs member-management polish. | #298 |
| 73 | Chapter members | Names truncated/hard to identify | future-active-route-polish | Needs member list density/responsive polish. | #298 |
| 74 | Chapter dashboard | Welcome banner/Member ID message issue | future-active-route-polish | Needs chapter dashboard state polish. | #298 |
| 75 | Check-in | Missing general attendee list/tooling | future-active-route-polish | Needs check-in operations polish. | #298 |
| 76 | Breadcrumbs | Mixed-language route breadcrumbs | future-design-system | Needs navigation/i18n polish. | #300 |
| 77 | Check-in | Missing manual attendance registration | future-active-route-polish | Needs check-in product slice. | #298 |
| 78 | Admin dashboard | Mixed English/Spanish admin UI | fixed | Spanish active-route sweep and admin QA passed. | #299 |
| 79 | Admin dashboard | Ambiguous Needs review badge | future-design-system | Needs admin copy/design polish. | #300 |
| 80 | Admin users | User table false empty state | fixed | QALS-05 admin user management stabilized. | #299 |
| 81 | Admin chapters | Chapter table overflow | future-active-route-polish | Needs admin table responsive polish. | #299 |
| 82 | Admin roles | Empty Assign Editors modal | fixed | QALS-06 scoped chapter leadership assignment. | #299 |
| 83 | Admin chapters | Missing deactivate chapter option | needs-leadership-decision | Destructive semantics need operations decision. | #299 |
| 84 | Admin events | Delete event semantics too destructive | needs-leadership-decision | Archive/delete semantics need product decision. | #299 |
| 85 | Admin events | Chapter assignment dropdown issue | future-active-route-polish | Needs admin event-form polish. | #299 |
| 86 | Admin companies | Profile visibility indicator unclear | future-active-route-polish | Active admin/company ops polish remains. | #299 |
| 87 | Admin companies | Revoke access confirmation/copy | future-active-route-polish | Needs admin company access polish. | #299 |
| 88 | Staff sidebar | Staff accounts see admin-like sidebar | guarded-for-pilot | Staff/Admin boundary documented; future UI tiers may differ. | #299 |
| 89 | Staff dashboard | Staff UI identical to Admin | guarded-for-pilot | Staff identity != admin authority documented in ADR/matrix. | #299 |
| 90 | Login roles | Corporate/staff login identity differentiation | future-active-route-polish | Active auth identity copy can be improved later. | #295 |
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

