# Chapter Leader Training Dry Run

This dry run validates whether a president or vice president can use LEAD Talent Platform for real chapter operations after a short training session.

Use this with:

- `docs/runbooks/chapter-activation-runbook.md`
- `docs/runbooks/production-readiness-validation.md`
- `.github/reports/chapter-leader-training-dry-run-notes.md`

## Required Participants

| Role | Required | Notes |
| --- | --- | --- |
| Abigail / platform owner | Yes | Facilitates, records blockers, explains support path. |
| Christopher or chapter operations owner | Yes | Confirms chapter context, roster source, and operational expectations. |
| Pilot chapter president or vice president | Yes | Must complete the product tasks. |
| Founder/central observer | Optional | Useful if launch decision needs firsthand context. |

## Pre-Work

- Confirm the pilot chapter.
- Confirm the leader will use the exact preapproved email.
- Confirm the environment: local seeded demo, staging, preview, or production.
- Confirm no real member list, private screenshot, or personal email evidence will be committed.
- Prepare one test applicant/member account.
- Prepare one test participant account.
- Prepare one test event title and description.
- Keep real roster files outside the repo.

## Success Criteria

The dry run is successful only if the chapter leader can complete the core workflow with minimal facilitator intervention:

- Sign in with the expected account.
- Land on the chapter dashboard.
- Understand the difference between membership, official role, and dashboard permissions.
- Review members and applicants.
- Approve and reject test applicants.
- Create, publish, and share an event.
- Register for the event as a participant from a separate account.
- Review registrations or applications.
- Understand who can assign regular e-board roles.
- Explain the support path for wrong email, wrong chapter, wrong role, missing member, or extra access.

## Stop Conditions

Pause the dry run and mark the gate blocked if any of these happen:

- The leader cannot sign in or lands in the wrong workspace.
- The leader cannot create or publish an event.
- Member approval/rejection controls are missing for a president/VP.
- Regular e-board assignment is unclear or unsafe.
- Real member data appears in a screenshot that would be committed.
- The leader does not understand who to contact for launch data corrections.

## Agenda

| Time | Segment | Goal |
| --- | --- | --- |
| 0-5 min | Context | Explain that the platform is the chapter operating layer, not only an event form. |
| 5-10 min | Account access | Leader signs in and confirms dashboard landing. |
| 10-20 min | Membership workflow | Review members, applicants, approve/reject test entries. |
| 20-35 min | Event workflow | Create, publish, share, and register for a test event. |
| 35-45 min | E-board workflow | Explain regular e-board assignment and central president/VP control. |
| 45-55 min | Support cases | Walk through wrong email/chapter/role/member/access scenarios. |
| 55-60 min | Feedback | Capture questions, blockers, and confidence level. |

## Product Task Script

### 1. Sign In

Leader task:

1. Open the platform URL.
2. Sign in with the preapproved email.
3. Confirm the first dashboard they see.

Facilitator checks:

- Did they land on `/chapter`?
- Did any onboarding or student route confuse them?
- Did they understand why this is chapter access, not admin access?

### 2. Membership

Leader task:

1. Open chapter members.
2. Identify approved members, alumni, and applicants.
3. Approve one test applicant.
4. Reject one test applicant, if available.

Facilitator checks:

- Were the tabs understandable?
- Were action buttons clearly safe/destructive?
- Did the leader understand that official e-board can view approved member information, but not everyone can approve/reject?

### 3. Event Creation

Leader task:

1. Open chapter events.
2. Create a new test event.
3. Add title, date, location, description, and registration settings.
4. Publish the event.
5. Open or copy the public event link.

Facilitator checks:

- Did the form feel too long or unclear?
- Did Spanish-first copy match the user's expectation?
- Did image upload or cover URL behavior work?
- Did publish/share behavior feel obvious?

### 4. Participant Registration

Leader or facilitator task:

1. Open the public event link in a separate account/session.
2. Register as a participant.
3. Confirm registration state or QR/check-in readiness.

Facilitator checks:

- Did the participant know whether they were registered?
- Did duplicate registration behave safely?
- Did the leader know where to review registrations?

### 5. E-Board Assignment

Leader task:

1. Identify an approved test member.
2. Assign or discuss assigning a regular e-board role.
3. Confirm president/VP status remains centrally controlled.

Facilitator checks:

- Did the leader understand the rule?
- Did the UI make regular e-board vs president/VP boundaries clear?
- Did the leader know when to escalate to Abigail/admin?

## Spanish Facilitator Framing

Use this short explanation at the beginning:

```text
La plataforma separa tres cosas: membresia, rol y permisos.
Ser miembro significa pertenecer al chapter.
Tener un rol e-board significa tener una responsabilidad oficial.
Tener permisos significa poder operar ciertas partes del dashboard.
```

Use this expectation before event creation:

```text
La idea es que el chapter pueda operar sus propios eventos aqui:
crear el evento, compartirlo, recibir registros, revisar participantes y dejar evidencia del trabajo.
LEAD Spark puede ser el catalizador mas grande, pero la plataforma tambien debe servir para eventos normales de cada chapter.
```

Use this closing question:

```text
Despues de usarlo, que parte te parecio clara, que parte te confundio y que necesitarias para sentirte listo/a para usarlo con tu chapter?
```

## Evidence Rules

Record:

- Environment.
- Date and attendees.
- Chapter.
- Tasks completed.
- Time-to-task.
- Questions asked.
- Confusing moments.
- Launch blockers.
- Non-blocking training improvements.
- Screenshots only after redacting emails, real member data, tokens, and resumes.

Do not commit:

- Real rosters.
- Real chapter leader email lists.
- Private member screenshots.
- Provider screenshots with tokens or personal data.
- Resume files.

## Output

Fill out:

```text
.github/reports/chapter-leader-training-dry-run-notes.md
```

Then update:

```text
.github/reports/production-readiness-validation-report.md
```

The final dry-run verdict should be one of:

- `pass`
- `pass with issues`
- `blocked`
- `not testable`

