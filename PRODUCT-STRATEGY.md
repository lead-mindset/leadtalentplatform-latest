# LEAD Frontier — Product Strategy & UX Architecture

**Version:** 1.0  
**Last Updated:** April 2026  
**Status:** Strategic Foundation

---

## 1. Personas

### Persona 1: Mariana — New Student Member

| Attribute | Details |
|-----------|---------|
| **Demographics** | 20-year-old sophomore at Universidad de los Andes (Bogotá), Computer Science major, first-generation college student |
| **Background** | Recently learned about LEAD through a campus flyer. Wants to build professional skills and connect with tech companies. Has no prior professional network. |
| **Goals** | • Get verified as an official LEAD member<br>• Attend networking events to meet recruiters<br>• Build a profile that attracts internship offers<br>• Learn about leadership opportunities |
| **Pain Points** | • Unclear how to join and get approved<br>• Doesn't know what makes a "good" profile<br>• Worried about being lost in a large community<br>• Unsure which events are worth her time |
| **Key Tasks** | 1. Sign up with Google OAuth<br>2. Complete student profile<br>3. Submit profile for chapter approval<br>4. Receive member ID<br>5. Browse events by location<br>6. Register for first event<br>7. Upload resume<br>8. Toggle profile visibility to recruiters<br>9. Attend event and get checked in via QR |

---

### Persona 2: Carlos — Chapter Editor & E-Board Member

| Attribute | Details |
|-----------|---------|
| **Demographics** | 22-year-old senior at MIT, Economics major, LEAD Boston Chapter President |
| **Background** | Has been with LEAD for 3 years. Now leads a 150-member chapter and co-organizes regional events with other schools. |
| **Goals** | • Streamline member onboarding and approvals<br>• Host impactful multi-chapter events<br>• Track who's actually attending events<br>• Build LEAD's reputation with corporate partners<br>• Get funding for big initiatives |
| **Pain Points** | • Approving 30-50 pending members manually is tedious<br>• Hard to coordinate events with other chapters<br>• Check-in at events is chaotic with paper lists<br>• No visibility into which students are engaged<br>• Funding requests go through email chains |
| **Key Tasks** | 1. Review and batch-approve pending members<br>2. Assign member IDs<br>3. Create new event<br>4. Add collaborating chapters<br>5. Set event capacity and access model<br>6. Review event applications<br>7. Use check-in tab at event<br>8. Search attendee list manually<br>9. View attendance reports<br>10. Submit funding request |

---

### Persona 3: David — Recruiter at TechCorp

| Attribute | Details |
|-----------|---------|
| **Demographics** | 35-year-old Technical Recruiter at mid-size SaaS company in Austin, 8 years experience |
| **Background** | Personally invited by LEAD admin after meeting at LEAD Spark event. Company wants to build pipeline of Latin American tech talent. |
| **Goals** | • Find high-potential students with strong CS fundamentals<br>• Build shortlist of candidates for summer internships<br>• Download resumes for hiring manager review<br>• Understand student engagement<br>• Track which candidates reviewed |
| **Pain Points** | • Hard to verify if students are actually active/vetted<br>• Generic job boards yield too many unqualified applicants<br>• No way to see if students attended LEAD events<br>• Needs to share candidates with hiring managers<br>• Wants to contact promising candidates directly |
| **Key Tasks** | 1. Accept personal invite and onboard<br>2. Set company profile<br>3. Browse students with filters<br>4. View student profiles with attendance history<br>5. Download resumes<br>6. Save students to shortlist with notes<br>7. Review saved candidates list<br>8. *Future: Message candidates directly* |

---

### Persona 4: Ana — LEAD Americas Administrator

| Attribute | Details |
|-----------|---------|
| **Demographics** | 29-year-old Operations Director at LEAD Americas HQ, manages platform and partnerships |
| **Background** | Runs the tech infrastructure and corporate relationships. Manages 12 chapters across US and Latin America. Currently the sole person handling admin tasks directly. |
| **Goals** | • Ensure platform runs smoothly across all chapters<br>• Vet and onboard corporate partners safely<br>• Review funding requests fairly and quickly<br>• Give chapters autonomy while maintaining quality<br>• Track platform growth and engagement metrics |
| **Pain Points** | • Currently doing everything manually<br>• Must personally invite every recruiter<br>• No visibility into chapter activity across regions<br>• DNS and technical issues require her direct involvement<br>• Funding requests come through scattered channels |
| **Key Tasks** | 1. Create new chapter<br>2. Assign chapter editors<br>3. Create company and invite recruiters<br>4. Review funding requests<br>5. View platform-wide activity logs<br>6. Manage user roles<br>7. View aggregate event attendance<br>8. Configure platform settings<br>9. *Future: Self-service admin dashboard* |

---

### Persona 5: Luis — Cross-Chapter Event Organizer

| Attribute | Details |
|-----------|---------|
| **Demographics** | 21-year-old junior at Georgia Tech, Industrial Engineering, LEAD Atlanta Events Coordinator |
| **Background** | Passionate about collaboration. Wants to host a regional case competition with LEAD Miami and LEAD Austin. |
| **Goals** | • Create event that multiple chapters can promote<br>• Ensure students from all collaborating chapters can register<br>• Track attendance across chapters for reporting<br>• Build relationships with other chapter leaders |
| **Pain Points** | • Unclear if he can edit an event that another chapter created<br>• Worried about capacity limits across multiple chapters<br>• Needs to see which chapters have joined as collaborators<br>• Check-in needs to work for students from any chapter |
| **Key Tasks** | 1. Create multi-chapter case competition<br>2. Invite LEAD Miami and LEAD Austin as collaborators<br>3. Verify editors from those chapters can edit<br>4. Monitor registrations from different chapters<br>5. Check in attendees from 3+ chapters<br>6. View post-event attendance report by chapter |

---

## 2. End-to-End User Journeys

### Journey 1: Join a Chapter and Get Verified
**Actor:** New student member (Mariana)

| Step | Action | Touchpoint |
|------|--------|------------|
| 1 | Sign up with Google OAuth | Auth page |
| 2 | Complete student profile | Onboarding flow |
| 3 | Profile status: "Pending Approval" | Dashboard |
| 4 | Chapter editor reviews and approves | Editor dashboard |
| 5 | Student receives "Member Approved" email | Email |
| 6 | Member ID assigned and visible in profile | Profile page |
| 7 | Student can now register for events | Event discovery |

**Success metric:** Time from signup to approval < 48 hours

---

### Journey 2: Create and Manage a Multi-Chapter Event
**Actor:** Chapter editor (Luis/Carlos)

| Step | Action | Touchpoint |
|------|--------|------------|
| 1 | Navigate to Chapter → Events → Create | Sidebar navigation |
| 2 | Fill event details: title, description, type, dates | Event creation form |
| 3 | Set access model: open vs. application-based | Form settings |
| 4 | Set capacity and upload cover image | Form settings |
| 5 | Add location or meeting URL | Location field |
| 6 | Add collaborating chapters | Collaboration selector |
| 7 | Publish event → Notification to collaborators | Publish action |
| 8 | Monitor registrations from all chapters | Event analytics |
| 9 | Review applications → Approve/Reject | Applications tab |
| 10 | Day of event: Open Check-in tab | Check-in screen |
| 11 | Scan QR codes or search by name | Check-in actions |
| 12 | Post-event: View attendance report | Reports section |

**Success metric:** Event created with 3+ collaborating chapters, 50+ registrations, 80%+ check-in rate

---

### Journey 3: Build and Optimize My Talent Profile
**Actor:** Student member (Mariana, established)

| Step | Action | Touchpoint |
|------|--------|------------|
| 1 | Navigate to Student → Profile | Sidebar |
| 2 | Edit academic info, professional links | Profile edit form |
| 3 | Upload resume (PDF, max 5MB) | Resume upload |
| 4 | Set profile visibility: public vs. private | Privacy toggle |
| 5 | View profile completeness indicator | Progress bar |
| 6 | *Future: Complete leadership style quiz* | Assessment flow |
| 7 | Check resume download analytics | Analytics view |
| 8 | Receive notifications when recruiters save profile | Notifications |

**Success metric:** Profile 100% complete, resume uploaded, visibility set to public

---

### Journey 4: Recruiter Discovers and Saves Talent
**Actor:** Recruiter (David)

| Step | Action | Touchpoint |
|------|--------|------------|
| 1 | Receive personal invite email | Email inbox |
| 2 | Accept invite → Set password → Onboard | Invitation flow |
| 3 | Navigate to Browse Students | Sidebar |
| 4 | Apply filters: University, Major, Grad Year, Skills | Filter panel |
| 5 | View student profile cards | Browse grid |
| 6 | Click into detailed profile | Profile detail |
| 7 | Download resume | Download action |
| 8 | Save student to shortlist with notes | Save action |
| 9 | View saved candidates list | Saved section |
| 10 | *Future: Send message to student* | Messaging feature |

**Success metric:** 10+ students reviewed, 5+ saved to shortlist, 3+ resumes downloaded

---

### Journey 5: Apply to and Attend an Exclusive Event
**Actor:** Student member (Mariana)

| Step | Action | Touchpoint |
|------|--------|------------|
| 1 | Browse events → See multi-chapter workshop | Event listing |
| 2 | Event shows "Application Required" | Event card |
| 3 | Click Apply → Fill application | Application form |
| 4 | Status: "Application Pending" | Status badge |
| 5 | Receive "Application Received" email | Email confirmation |
| 6 | Editor reviews application → Approves | Editor dashboard |
| 7 | Receive "Application Approved" email with QR code | Email with QR |
| 8 | Add event to calendar | Calendar integration |
| 9 | Day of event: Present QR code at check-in | Check-in station |
| 10 | *Future: Member ID QR code also accepted* | Alternative check-in |

**Success metric:** Application submitted → Approved → Checked in within 2 weeks

---

### Journey 6: Chapter Editor Manages Member Pipeline
**Actor:** Chapter editor (Carlos)

| Step | Action | Touchpoint |
|------|--------|------------|
| 1 | Open Chapter dashboard → See "15 pending approvals" | Dashboard badge |
| 2 | Navigate to Members tab → Filter by "Pending Approval" | Members list |
| 3 | Review each profile: completeness, university match | Profile review |
| 4 | Batch select 10 approved-looking members | Batch selection |
| 5 | Click "Approve" → Members receive approval emails | Approval action |
| 6 | Filter by "Approved, No Member ID" → Assign IDs in batch | ID assignment |
| 7 | View member engagement: event attendance, resumes | Member analytics |
| 8 | Identify inactive members for re-engagement | Engagement reports |

**Success metric:** 20 members approved/week, 90% approved members have member IDs

---

### Journey 7: Admin Onboards Corporate Partner
**Actor:** Administrator (Ana)

| Step | Action | Touchpoint |
|------|--------|------------|
| 1 | Meet recruiter at LEAD Spark → Verify company | In-person verification |
| 2 | Navigate to Admin → Companies → Create Company | Admin dashboard |
| 3 | Fill company profile: name, industry, size, website | Company form |
| 4 | Create recruiter invite: enter email, select company | Invite creation |
| 5 | Recruiter receives personal invite email with unique link | Invitation email |
| 6 | Recruiter accepts, creates account, gains access | Onboarding flow |
| 7 | Admin monitors recruiter activity in activity logs | Audit logs |
| 8 | *Future: Admin revokes access if needed* | Access management |

**Success metric:** Company created, recruiter invited and onboarded within 24 hours

---

### Journey 8: Submit and Review Funding Request
**Actor:** Chapter editor (Carlos) → Administrator (Ana)

| Step | Action | Touchpoint |
|------|--------|------------|
| 1 | Editor navigates to Chapter → Funding | Sidebar |
| 2 | Create new funding request: amount, event, rationale | Funding form |
| 3 | Submit request → Status: "Under Review" | Status badge |
| 4 | Admin receives notification | Email/notification |
| 5 | Admin reviews request details | Funding dashboard |
| 6 | Admin approves → Notification sent to editor | Decision action |
| 7 | *Note: No payment transfer in platform* | Offline process |
| 8 | Funds transferred offline via LEAD finance | Finance workflow |

**Success metric:** Funding request submitted → Decision in 5 business days

---

### Journey 9: Cross-Chapter Event Collaboration
**Actor:** Two chapter editors (Luis + Miami editor)

| Step | Action | Touchpoint |
|------|--------|------------|
| 1 | Luis (Atlanta) creates "Southeast Case Competition" | Event creation |
| 2 | Luis adds LEAD Miami as collaborator | Collaboration selector |
| 3 | Miami editor receives notification | Notification |
| 4 | Miami editor can now edit event details | Shared editing |
| 5 | Both editors promote event to their chapters | Promotion channels |
| 6 | Students from both chapters register | Registration flow |
| 7 | Luis sees registration count by chapter | Analytics dashboard |
| 8 | Event day: Check-in works seamlessly for all | Check-in system |
| 9 | Post-event: Attendance report shows breakdown by chapter | Reports section |

**Success metric:** 2+ chapters collaborating, 50+ cross-chapter registrations

---

### Journey 10: From Event Attendee to Hired Intern
**Actor:** Student (Mariana) → Recruiter (David)

| Step | Action | Touchpoint |
|------|--------|------------|
| 1 | Mariana attends 3 LEAD events (checked in each time) | Event attendance |
| 2 | Mariana completes profile, uploads resume, sets public | Profile management |
| 3 | David filters for students with 3+ event attendances | Browse filters |
| 4 | David discovers Mariana's profile, sees engagement | Profile card |
| 5 | David saves Mariana to shortlist with note | Save action |
| 6 | David downloads Mariana's resume | Download action |
| 7 | *Future: David messages Mariana via platform* | Messaging |
| 8 | *Offline: Interview process → Internship offer* | Recruitment process |

**Success metric:** Student with 3+ check-ins gets saved by recruiter and receives opportunity

---

## 3. Information Architecture & Sitemap

### 3.1 Hierarchical Sitemap

#### PUBLIC (Unauthenticated)
```
/
├── /about                    # LEAD Americas mission, team, impact
├── /events                   # Public event discovery (location-based)
│   └── /[id]                 # Event detail with registration CTA
├── /faq                      # Help center
├── /auth/
│   ├── /login                # Google OAuth primary
│   ├── /signup               # Onboarding flow
│   └── /callback             # OAuth callback
└── /legal/
    ├── /privacy
    └── /terms
```

#### STUDENT PORTAL (Member Role)
```
/student/                     # Dashboard (Home)
├── /events                   # MY EVENTS (primary action)
│   ├── /upcoming             # Registered/pending
│   ├── /past                 # Attended history
│   └── /[id]/                # Event detail with QR code
├── /discover                 # BROWSE ALL EVENTS (discovery)
│   ├── /map                  # Location-based view
│   └── /list                 # Filterable list
├── /profile                  # MY PROFILE
│   ├── /edit                 # Personal info, academic, links
│   ├── /visibility           # Public/private toggle
│   └── /leadership           # *Future: Color assessment*
└── /resume                   # RESUME MANAGEMENT
    ├── /upload
    └── /history              # Version history
```

#### CHAPTER PORTAL (Editor Role)
```
/chapter/                     # Dashboard (Chapter overview)
├── /events                   # EVENT MANAGEMENT
│   ├── /create               # Primary CTA
│   ├── /drafts               # Unpublished
│   ├── /upcoming             # Published, registration open
│   ├── /past                 # Completed
│   └── /[id]/                # Event detail
│       ├── /edit             # Settings, collaboration
│       ├── /applications     # Review pending (if application-based)
│       └── /checkin          # QR scanner + manual search
├── /members                  # MEMBER MANAGEMENT
│   ├── /pending              # Approval queue (high priority)
│   ├── /active               # Approved with member IDs
│   ├── /inactive             # Rejected/inactive
│   └── /bulk-approve         # Batch workflow
└── /collaborate              # CROSS-CHAPTER
    ├── /my-events            # Events we own
    └── /shared-events        # Events we're collaborating on
```

#### RECRUITER PORTAL (Recruiter Role)
```
/company/                     # Dashboard
├── /browse                   # TALENT DISCOVERY (primary)
│   ├── /students             # Grid/list view with filters
│   │   └── /[id]             # Student profile detail
│   └── /filters              # University, major, skills, attendance
├── /saved                    # SHORTLIST (my candidates)
│   └── /[id]                 # Saved student with notes
├── /downloads                # Resume downloads
└── /profile                  # COMPANY PROFILE
    └── /team                 # Company recruiters
```

#### ADMIN PORTAL (Admin Role)
```
/admin/                       # Dashboard (platform metrics)
├── /users                    # USER MANAGEMENT
│   ├── /students             # All members
│   ├── /editors              # Chapter leaders
│   ├── /recruiters           # All recruiter accounts
│   └── /admins               # Admin list
├── /chapters                 # CHAPTER MANAGEMENT
│   ├── /list                 # All chapters
│   ├── /create               # New chapter
│   └── /[id]/members         # Chapter-specific members
├── /companies                # COMPANY MANAGEMENT
│   ├── /list                 # All companies
│   ├── /create               # New company
│   └── /[id]/invite          # Invite recruiters
├── /events                   # EVENT OVERSIGHT
│   └── /analytics            # Cross-chapter metrics
├── /funding                  # FUNDING REQUESTS *Future*
│   ├── /pending              # Review queue
│   └── /history              # Past decisions
└── /settings                 # PLATFORM SETTINGS
    ├── /activity-logs        # Audit trail
    └── /configuration        # Global settings
```

---

### 3.2 Grouping Rationale

| Section | Grouping Logic | Priority |
|---------|---------------|----------|
| **Events** | Central to all roles; separated by ownership (My Events vs Browse) | P1 — Most used |
| **Member Verification** | Critical workflow for editors; needs quick access to "Pending" queue | P1 — High frequency |
| **Profile/Resume** | Personal hub for students; grouped by action type | P2 — Medium frequency |
| **Talent Discovery** | Primary recruiter workflow; browse → detail → save pattern | P1 — Core recruiter value |
| **Check-in** | Event-day critical; accessible from event detail or sidebar shortcut | P1 — Time-sensitive |
| **Chapter/Collaborate** | Separates owned vs. collaborative events for clarity | P2 — Editor-specific |
| **Admin Oversight** | Organized by entity type (users → chapters → companies) | P3 — Low frequency, high impact |

---

## 4. Optimized Navigation System

### 4.1 Global Top Nav (Persistent Across All Roles)

```
┌─────────────────────────────────────────────────────────────┐
│ 🟣 LEAD Frontier    [Global Search 🔍]    [🌐 EN]  [🌙]  [👤]  │
└─────────────────────────────────────────────────────────────┘
```

| Element | What It Contains | Why It's Here |
|---------|-----------------|---------------|
| **Brand** | Logo + "Frontier" tagline | Immediate brand recognition, trust anchor |
| **Global Search** | Cross-platform search (events, people, help) | Power users can jump anywhere |
| **Language** | EN/ES toggle | i18n requirement; non-intrusive |
| **Theme** | Dark/light toggle | Accessibility, user preference |
| **Profile Menu** | Dropdown: My Profile / Settings / Logout | Universal account access |

**Rationale:** Top nav stays minimal (5 items max) to avoid competing with role-specific navigation.

---

### 4.2 Role-Based Sidebar (Desktop Primary Navigation)

#### STUDENT SIDEBAR
```
📊 DASHBOARD (Home)
─────────────────
🎯 EVENTS                    ← EXPANDABLE
  ├─ 📅 Upcoming (My events) ← DEFAULT
  ├─ 🔍 Discover (Browse all)
  ├─ 📜 Past Events
  └─ 🎟️ My Tickets (QR codes)
─────────────────
👤 PROFILE                   ← EXPANDABLE
  ├─ ✏️ Edit Profile
  ├─ 📄 Resume
  └─ 🔒 Privacy Settings
─────────────────
❓ HELP
```

#### EDITOR SIDEBAR
```
📊 CHAPTER DASHBOARD
─────────────────
⚡ QUICK ACTIONS             ← HIGH VISIBILITY
  ├─ ➕ Create Event
  ├─ 👥 Approve Members (3)  ← BADGE
  └─ 📷 Open Check-in
─────────────────
📅 MANAGE EVENTS
  ├─ 📝 Drafts
  ├─ 🟢 Live (Published)
  ├─ ✅ Completed
  └─ 🤝 Collaborating
─────────────────
👥 MEMBERS
  ├─ ⏳ Pending (3)          ← BADGE
  ├─ ✅ Approved
  └─ ❌ Inactive
─────────────────
⚙️ CHAPTER SETTINGS
```

#### RECRUITER SIDEBAR
```
📊 TALENT DASHBOARD
─────────────────
🔍 BROWSE TALENT            ← PRIMARY CTA
  ├─ 🎯 All Students
  ├─ ⭐ Saved (12)
  └─ 📥 Downloads
─────────────────
🏢 COMPANY
  ├─ 👤 Company Profile
  └─ 👥 Team Management
─────────────────
📈 ANALYTICS (Future)
```

#### ADMIN SIDEBAR
```
📊 PLATFORM DASHBOARD
─────────────────
⚡ QUICK ACTIONS
  ├─ ➕ New Chapter
  ├─ 🏢 New Company
  └─ 👤 Invite Recruiter
─────────────────
👥 USERS & CHAPTERS
  ├─ 🎓 Students
  ├─ ✏️ Editors
  ├─ 💼 Recruiters
  └─ 🏫 Chapters
─────────────────
📊 OVERSIGHT
  ├─ 📅 All Events
  ├─ 💰 Funding Requests
  └─ 📋 Activity Logs
─────────────────
⚙️ SETTINGS
```

**Key Optimizations:**

| Decision | Justification |
|----------|--------------|
| **Quick Actions section** | 1-click access to 3 most common tasks |
| **Badge counts** | Pending approvals visible without navigation |
| **Expandable sections** | Keeps sidebar compact; users control visibility |
| **Role-first labeling** | "Chapter Dashboard" sets context immediately |
| **Scalable categories** | "Oversight" can absorb new reporting features |

---

### 4.3 Mobile Bottom Tab Navigation

#### STUDENT MOBILE NAV
```
┌───────────────────────────────────────┐
│  🏠    🔍    📅    👤                │
│ Home  Discover Events  Profile        │
└───────────────────────────────────────┘
```

| Tab | Primary Action | Rationale |
|-----|---------------|-------------|
| **Home** | Dashboard + My upcoming events | Starting point |
| **Discover** | Browse all events (map/list toggle) | Core value proposition |
| **Events** | My registered events + QR codes | Quick access at event day |
| **Profile** | View/edit profile, resume | Personal hub |

#### EDITOR MOBILE NAV
```
┌───────────────────────────────────────┐
│  📊    ➕    📅    👥    ⚡            │
│ Dash  Create Events Members Check-in  │
└───────────────────────────────────────┘
```

| Tab | Primary Action | Rationale |
|-----|---------------|-------------|
| **Dashboard** | Chapter stats + recent activity | Context setting |
| **Create** | FAB-style prominent button | Primary job is creating events |
| **Events** | Manage all events | Content management hub |
| **Members** | Pending approvals + member list | Critical workflow |
| **Check-in** | QR scanner mode | Event-day critical |

#### RECRUITER MOBILE NAV
```
┌───────────────────────────────────────┐
│  📊    🔍    ⭐    🏢                │
│ Dash  Browse Saved Company            │
└───────────────────────────────────────┘
```

#### ADMIN MOBILE NAV
```
┌───────────────────────────────────────┐
│  📊    ➕    👥    ⚙️                │
│ Dash Create Users Settings            │
└───────────────────────────────────────┘
```

---

### 4.4 Navigation Design Decisions

| Decision | Justification |
|----------|--------------|
| **Split "Events" by Ownership vs. Discovery** | Reduces cognitive load; "Discover" is searchable, "My Events" is chronological |
| **Quick Actions Bucket** | These are highest-frequency tasks; creates muscle memory |
| **Global Search in Top Nav** | Power users can bypass navigation entirely |
| **Role-Specific Sidebars** | Student has 4 items; Editor has 7; prevents clutter |
| **Mobile Tab Count by Role** | 4-5 tabs based on complexity; thumb-reachable |
| **Check-in as Persistent Access** | Time-sensitive; needs immediate availability |
| **Expandable Sections with Memory** | Reduces visual noise without hiding features |

---

### 4.5 Click Reduction Audit

| Task | Before (Clicks) | After (Clicks) | Savings |
|------|----------------|--------------|---------|
| Student: Register for event | 4 | 2 | 50% |
| Student: View my QR code | 3 | 2 | 33% |
| Editor: Create event | 3 | 2 | 33% |
| Editor: Approve members | 3 | 1 | 67% |
| Editor: Check-in attendee | 4 | 1 | 75% |
| Recruiter: Save student | 3 | 2 | 33% |
| Admin: Invite recruiter | 4 | 2 | 50% |

**Average reduction: 45% fewer clicks for high-frequency tasks**

---

### 4.6 Wayfinding & Location Awareness

#### Breadcrumb Strategy
```
Home > Events > Manage > "Spring Networking Night" > Applications
^     ^      ^      ^                      ^
│     │      │      │                      └─ Current action
│     │      │      └─ Event name
│     │      └─ Category
│     └─ Section
└─ Always clickable root
```

#### Active State Indicators
- **Sidebar**: Active item has left border accent + background highlight
- **Top Nav**: Active dropdown shows current selection
- **Mobile**: Active tab has icon fill + label bold
- **Breadcrumbs**: Current page not clickable

---

## 5. UX Risks & Considerations

### High Risk

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Check-in access confusion** | Editors may not find scanner during busy events | Persistent "Check-in" button in sidebar + event detail + mobile FAB |
| **Event ownership vs. collaboration** | Editors may not realize they can edit collaborating events | Clear "Co-hosted with [Chapter]" badge + edit button always visible |
| **Student vs. Member vs. Approved Member** | Status confusion | Clear badges: "Pending Approval" → "Member (ID: #1234)" |
| **Recruiter invite flow** | Personal invite creates bottlenecks | Admin dashboard shows "Pending Invites" + one-click resend |

### Medium Risk

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Application vs. Open events** | Students confused by different flows | Clear cards with "Apply Now" vs "Register" CTAs |
| **Profile visibility anxiety** | Students unsure what recruiters see | Preview mode: "See how your profile appears" |
| **QR code overload** | Event QR vs. Member ID QR confusion | Clear labeling: "Event Check-in Code" vs "Your Member ID" |
| **Cross-chapter event discovery** | Students miss collaborating chapter events | Unified "Discover" feed with chapter filter |

### Low Risk (Future)

| Risk | Context | Mitigation |
|------|---------|------------|
| **Funding request status** | Editors unaware of review timeline | Status timeline: Submitted → Under Review → Decision |
| **Leadership color meaning** | Self-reported colors lack context | Hover tooltips explaining significance |

---

## 6. Scalability Roadmap

| Future Feature | Where It Fits | No Restructure Needed? |
|---------------|-------------|------------------------|
| **Funding Requests** | Editor: Sidebar → Chapter Settings | ✅ Expand existing section |
| **Leadership Colors** | Student: Profile → Leadership | ✅ Add sub-item |
| **Messaging** | Recruiter: New sidebar section "Messages" | ✅ Add new expandable section |
| **Advanced Analytics** | All roles: New "Analytics" section | ✅ New expandable section |
| **Mobile Check-in** | Editor: Keep as tab | ✅ Already designed |
| **Notifications Center** | Global: Top nav icon + dropdown | ✅ Already in top nav |
| **Help Center** | Global: Top nav or sidebar footer | ✅ Non-intrusive addition |

---

## Summary Table: IA at a Glance

| Role | Primary Nav | Key Workflows | Max Depth |
|------|-------------|---------------|-----------|
| **Student** | Discover → My Events → Profile | Join → Apply → Attend | 3 levels |
| **Editor** | Create → Manage → Members → Check-in | Create → Collaborate → Approve → Check-in | 3 levels |
| **Recruiter** | Browse → Save → Download | Filter → View → Save → Contact | 2 levels |
| **Admin** | Create → Manage → Review | Invite → Monitor → Configure | 3 levels |

---

*This architecture prioritizes **Events** as the core hub, separates **ownership** from **collaboration**, and keeps **verification workflows** (approvals, check-ins) within 2 clicks for time-sensitive actions.*
