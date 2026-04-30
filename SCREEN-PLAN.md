# LEAD Frontier — Screen Plan & Specifications

**Version:** 1.0  
**Last Updated:** April 2026  
**Status:** Implementation Ready

---

## 1. Screen Inventory Overview

| Role | Phase 1 (MVP) | Phase 2 | Phase 3 | Total |
|------|---------------|---------|---------|-------|
| **Public** | 5 | 2 | 1 | 8 |
| **Student** | 8 | 3 | 2 | 13 |
| **Editor** | 10 | 3 | 2 | 15 |
| **Recruiter** | 6 | 2 | 2 | 10 |
| **Admin** | 8 | 4 | 2 | 14 |
| **Shared/Modal** | 6 | - | - | 6 |
| **TOTAL** | **43** | **14** | **9** | **66** |

---

## 2. Public Screens (Unauthenticated)

### Screen 1.1: Marketing Homepage (`/`)

**Purpose:** First impression, value proposition, conversion to signup

**Content:**
- Hero section with LEAD mission statement
- Animated "constellation" background (fluid paths connecting dots representing chapters)
- Value props: "Connect", "Learn", "Get Hired"
- Featured upcoming events preview (3 cards)
- Testimonials from placed students
- CTA: "Join as Student" / "Partner as Company"
- Footer with social links

**Design System Application:**
- Background: `background` (#000820) with subtle animated gradient mesh
- Hero headline: `display-lg` (Epilogue 56px, tight tracking)
- CTA buttons: Primary gradient (Coral→Violet), full-rounded
- Cards: `surface-container` with 24px radius, hover glow effect

**Key Actions:**
- Sign up (redirect to `/auth/signup`)
- Browse events (public preview)
- Login (for existing users)

---

### Screen 1.2: About LEAD (`/about`)

**Purpose:** Mission, history, impact metrics

**Content:**
- LEAD Americas origin story
- Stats: Chapters, Members, Companies, Events hosted
- Team/Leadership section
- Vision for Latin America
- Partner company logos

**Design System Application:**
- Timeline layout for history (vertical with dots)
- Stats: Large numbers in `display-md` with gradient text
- Partner logos: Grayscale, hover to full color

---

### Screen 1.3: Public Event Discovery (`/events`)

**Purpose:** Allow visitors to browse events before signing up

**Content:**
- Search bar (location-based)
- Filter: Date range, Event type, Chapter
- Event grid (limited info: title, date, chapter, "Sign up to register" CTA)
- Map view toggle (Google Maps integration)
- "Sign up to see more" gate after 3 events viewed

**Design System Application:**
- Event cards: `surface-container`, 24px radius
- Map view: Glassmorphism overlay for filter panel
- Locked events: Blur overlay with "Join LEAD" CTA

---

### Screen 1.4: Event Detail - Public (`/events/[id]`)

**Purpose:** Event information, teaser for registration

**Content:**
- Event cover image (full-width, 16:9)
- Event title, date, time
- Location with map preview
- Host chapter info
- Description with rich text
- "Register" button → redirects to login/signup
- "Share" button (copy link)

**Design System Application:**
- Cover image: Full-width, gradient overlay at bottom
- Title: `display-md` (Epilogue)
- Location chip: Icon + address, `surface-container-high` background
- CTA: Large primary button, sticky at bottom on mobile

---

### Screen 1.5: Authentication (`/auth/*`)

**Screens:**
- `/auth/login` — Google OAuth primary, email fallback
- `/auth/signup` — Role selection (Student initially), Google OAuth
- `/auth/callback` — OAuth handling, chapter assignment flow
- `/auth/reset-password` — Email input, confirmation

**Content:**
- LEAD logo centered
- Google "Continue with Google" button (branded)
- Email/password form (secondary)
- Link to switch login/signup
- Privacy/terms links

**Design System Application:**
- Background: Full `background` with subtle particle animation
- Card: Centered, `surface-container-high`, 32px radius, max-width 420px
- Inputs: 16px radius, `surface-container-highest` background
- Google button: White background, maintain Google branding
- Primary CTA: Full gradient, 48px height

---

## 3. Student Portal Screens

### Screen 2.1: Student Dashboard (`/student`)

**Purpose:** Home base, next actions, quick stats

**Content:**
- Welcome greeting ("Good morning, Mariana")
- Next upcoming event card (if registered) with countdown
- Quick stats row: Events attended, Profile completion %, Member ID status
- "Discover Events" prominent CTA card
- Recent activity: Last check-in, Resume downloads (if any)
- "Complete your profile" nudge (if < 80%)

**Design System Application:**
- Layout: Single column mobile, 2-column desktop (stats | events)
- Welcome: `headline-lg` with wave emoji alternative (use Phosphor icon)
- Next event card: `surface-container`, left border accent in `primary`
- Stats: 3-column grid, numbers in `display-md` with `tertiary` color
- CTA card: Gradient background, 32px radius

**Key Actions:**
- Browse events
- View next event details
- Edit profile
- View member ID

---

### Screen 2.2: My Events (`/student/events`)

**Purpose:** View all registered events, access QR codes

**Content:**
- Tabs: Upcoming | Past
- Upcoming list: Event cards with QR preview, check-in status
- Empty state: "You haven't registered for any events yet" + CTA to discover
- Past list: Attended events with "Attended" badge, no QR

**Event Card Content:**
- Cover thumbnail
- Title, date, time
- Location (city only)
- QR code thumbnail (click to expand)
- Status: "Registered" | "Checked In" | "Attended"

**Design System Application:**
- Tabs: Pill-style, active tab has `surface-container-high` background
- Event cards: Horizontal layout (image left, content right)
- QR thumbnail: 60x60px with `surface-container-highest` background
- Status badges: Full pill style per status colors

**Key Actions:**
- View event details
- Expand QR code (full-screen modal)
- Download/calendar add
- Cancel registration (if before deadline)

---

### Screen 2.3: Event Detail - Student View (`/student/events/[id]`)

**Purpose:** Full event info, registration status, QR code

**Content:**
- Event cover (full-width)
- Title, full date/time
- Location with full address + map
- Host chapter(s) with logos
- Description (rich text)
- Registration status section:
  - If registered: Large QR code, "Present this at check-in"
  - If pending approval: "Application under review" message
  - If not registered: "Register" or "Apply" button
- "Add to Calendar" button
- "Share" button

**Design System Application:**
- QR code: 280x280px, centered, `surface-container-highest` container with 24px radius
- Status section: Full-width banner with status color top border
- Map: Embedded Google Map with `surface-container` styling

---

### Screen 2.4: Discover Events (`/student/discover`)

**Purpose:** Browse and filter all available events

**Content:**
- View toggle: List | Map
- Search bar (event name, chapter)
- Filter panel: Date, Chapter, Event Type, Access Model
- Sort: Date (default), Distance, Popularity
- Event grid: 3 columns desktop, 1 column mobile
- Infinite scroll

**Event Card Content:**
- Cover image
- Title
- Date (formatted: "APR 24" with month in `primary`)
- Chapter badge
- Access model: "Open" or "Application Required"
- Capacity indicator: "45/100 registered"

**Design System Application:**
- Filter panel: Glassmorphism slide-out on mobile, sidebar on desktop
- Event cards: Vertical card layout, 24px radius
- Date badge: `surface-container-highest`, month in `primary`
- Capacity bar: Thin progress bar, `primary` fill
- Map pins: `tertiary` color with pulse animation

**Key Actions:**
- Apply filters
- Toggle view
- Click event → detail
- Register/Apply

---

### Screen 2.5: Profile Edit (`/student/profile`)

**Purpose:** Manage personal information

**Content:**
- Progress indicator (profile completion %)
- Avatar upload (with preview)
- Form sections:
  - Personal: Name, Email, Phone
  - Academic: University, Major, Graduation Year
  - Links: LinkedIn, Portfolio, GitHub
  - Bio: Textarea (optional)
- "Save Changes" primary button
- "Preview as Recruiter Sees It" link

**Design System Application:**
- Form card: `surface-container`, 24px radius
- Inputs: 16px radius, `surface-container-high` background
- Progress: Circular or linear with `primary` fill
- Avatar: 120px circle with upload overlay on hover

---

### Screen 2.6: Resume Management (`/student/resume`)

**Purpose:** Upload, manage, view resume versions

**Content:**
- Current resume preview (if uploaded)
- Upload area: Drag & drop or click to select
- File requirements: PDF, max 5MB
- Version history list (if multiple uploads)
- Download count: "Viewed by 3 recruiters"
- "Delete" action

**Design System Application:**
- Upload area: Dashed border (2px, `outline-variant`), 24px radius, `surface-container-low` background
- Active drag: `primary` border, glow effect
- Resume preview: PDF thumbnail or icon
- History: List with timestamps, previous versions downloadable

---

### Screen 2.7: Profile Visibility (`/student/profile/visibility`)

**Purpose:** Control recruiter access to profile

**Content:**
- Toggle: "Make my profile visible to recruiters"
- Explanation text about what recruiters can see
- "Preview Profile" button
- Data privacy notice

**Design System Application:**
- Toggle: Large iOS-style switch, `primary` when on
- Card: `surface-container`, warning icon if off
- Preview: Opens modal showing recruiter view

---

### Screen 2.8: Member ID Card (`/student/member-id`)

**Purpose:** Digital member ID display

**Content:**
- Digital ID card (credit card proportions)
- LEAD logo
- Member name
- Member ID number (large, monospace)
- Chapter name
- Issue date
- "Download" button (for printing)

**Design System Application:**
- ID card: Gradient subtle background, 16px radius, aspect ratio 1.586:1
- Member ID: JetBrains Mono, 32px, `tertiary` color
- Background pattern: Subtle LEAD logo watermark
- Download button: Secondary style

---

## 4. Editor Portal Screens

### Screen 3.1: Chapter Dashboard (`/chapter`)

**Purpose:** Overview, quick actions, urgent items

**Content:**
- Quick Actions row (3 cards):
  - Create Event
  - Approve Members (with pending count badge)
  - Open Check-in (if event within 24h)
- Stats row: Pending approvals, Upcoming events, Total members, Recent attendance
- Recent activity feed (last 10 actions)
- "Event starting soon" alert banner (if applicable)
- "Needs attention" section (stuck items)

**Design System Application:**
- Quick action cards: `surface-container-high`, icon top, 24px radius
- Badges: Amber for pending, positioned top-right of card
- Stats: 4-column grid, numbers in `display-sm`
- Alert banner: `surface-container` with left border `primary`
- Activity feed: Timeline style with dot indicators

**Key Actions:**
- Create event
- Review pending members
- Open check-in scanner
- View all stats

---

### Screen 3.2: Event Creation (`/chapter/events/create`)

**Purpose:** Create new event (multi-step wizard)

**Content:**
- Step indicator: 4 steps (Details → Location → Access → Review)
- **Step 1 - Details:**
  - Event title
  - Description (rich text)
  - Event type (in-person/online/hybrid)
  - Cover image upload
  - Date/time picker
- **Step 2 - Location:**
  - Location search (Google Places)
  - Address display
  - Meeting URL (if online/hybrid)
- **Step 3 - Access:**
  - Access model: Open | Application-based
  - Capacity limit
  - Collaborating chapters (multi-select)
  - External form URL (optional, for applications)
- **Step 4 - Review:**
  - Preview card
  - Publish button

**Design System Application:**
- Step indicator: Horizontal with connectors, active step in `primary` pill
- Form: Single column, max-width 640px
- Image upload: Preview with crop/position
- Location: Autocomplete dropdown with place details
- Collaborating chapters: Chip-based multi-select
- Preview: Live-updating event card

---

### Screen 3.3: Event Management List (`/chapter/events`)

**Purpose:** View and manage all chapter events

**Content:**
- Tabs: Drafts | Live | Completed | Collaborating
- "Create Event" primary button (top-right)
- Event list/table:
  - Cover thumbnail
  - Title
  - Date
  - Registrations/Capacity
  - Status badge
  - Actions: Edit | Duplicate | Delete
- Batch selection mode (checkboxes)

**Design System Application:**
- Tabs: Pill-style with counts
- Table: Alternating row backgrounds (`surface` / `surface-container-low`)
- Status: Draft (Violet), Live (Primary), Completed (Muted)
- Actions: Icon buttons with tooltips
- Empty states: Illustrated per tab

**Key Actions:**
- Create new event
- Edit event
- Duplicate event
- Delete/archive
- View registrations
- Manage applications (if application-based)

---

### Screen 3.4: Event Detail - Editor View (`/chapter/events/[id]`)

**Purpose:** Event overview, edit, view registrations

**Content:**
- Event header: Cover, title, status badge
- Quick stats: Registrations, Check-ins, Capacity
- Action bar: Edit | Duplicate | Archive | Applications | Check-in
- Tabs: Overview | Registrations | Applications | Attendance
- **Overview tab:** Event details, collaborating chapters, QR code preview
- **Registrations tab:** List of all registered students
- **Applications tab:** (if application-based) Review queue with approve/reject
- **Attendance tab:** Checked-in list, check-in rate

**Design System Application:**
- Header: Full-width cover with gradient overlay
- Stats: 3-column card layout
- Action bar: Sticky on scroll
- Applications list: Student row with avatar, name, application answers, action buttons
- QR preview: Click to open full check-in interface

---

### Screen 3.5: Application Review (`/chapter/events/[id]/applications`)

**Purpose:** Review and decide on event applications

**Content:**
- Stats: Pending, Approved, Rejected, Total
- Filter: All | Pending | Approved | Rejected
- Application list:
  - Student info (avatar, name, university)
  - Application answers (expandable)
  - Status badge
  - Action buttons: Approve | Reject
- Batch mode toggle
- "Approve All" (with confirmation)

**Design System Application:**
- Application card: `surface-container`, 24px radius
- Answers: Collapsible section
- Actions: Primary (Approve) + Danger (Reject) buttons
- Batch mode: Checkboxes + floating action bar

---

### Screen 3.6: Check-in Interface (`/chapter/events/[id]/checkin`)

**Purpose:** QR code scanning and manual check-in

**Content:**
- Scanner view: Camera viewport with QR frame overlay
- "Manual Search" fallback button
- Recently checked-in list (last 5)
- Stats: Checked in / Total registered
- Search fallback view: Name search + member list with "Check In" buttons

**Design System Application:**
- Scanner: Full viewport, dark overlay with cutout frame
- Frame: Corner brackets (2px, `primary`)
- Success: Green flash + checkmark overlay + haptic feedback
- Recent list: Bottom sheet (swipe up)
- Search: Top bar, results list with quick-action buttons

**Key Actions:**
- Scan QR (auto-check-in)
- Search by name
- Manual check-in
- View recently checked in

---

### Screen 3.7: Member Management (`/chapter/members`)

**Purpose:** View, approve, manage chapter members

**Content:**
- Tabs: Pending | Approved | Inactive
- Stats: Total members, Pending approvals, New this month
- **Pending tab:**
  - List of pending approvals
  - Student info: Avatar, name, email, university, profile completion %
  - "Approve" / "Reject" actions
  - "View Full Profile" link
  - Batch selection mode
- **Approved tab:**
  - Member list
  - Member ID status (assigned or not)
  - "Assign Member ID" action
  - Search/filter

**Design System Application:**
- Tabs: Count badges on Pending tab
- Member row: Avatar (40px), primary info, secondary meta, actions
- Batch mode: Floating action bar with "Approve (N)" primary button
- Empty state: Confetti illustration, "All caught up!"

---

### Screen 3.8: Member Detail (`/chapter/members/[id]`)

**Purpose:** View full member profile, assign ID, manage status

**Content:**
- Member profile card (all details)
- Status history: Applied → Approved → Member ID assigned
- Actions: Approve/Reject (if pending), Assign Member ID, Deactivate
- Event attendance history
- Resume download (if available)

**Design System Application:**
- Profile: Avatar (80px), details grid
- History: Timeline vertical
- Actions: Button group at top

---

### Screen 3.9: Cross-Chapter Collaboration (`/chapter/collaborate`)

**Purpose:** Manage events shared with other chapters

**Content:**
- Two sections:
  - "Events We Host" — Events created by this chapter
  - "Events We Collaborate On" — Events where this chapter is collaborator
- Event cards show collaboration status
- "Add Collaborator" quick action

**Design System Application:**
- Section headers: `headline-md` with count badges
- Event cards: Same as event management, with collaborator chips
- Collaborator chip: Chapter avatar + name

---

### Screen 3.10: Chapter Settings (`/chapter/settings`)

**Purpose:** Manage chapter profile, preferences

**Content:**
- Chapter profile: Name, University, Location, Description
- Social links: Instagram, LinkedIn, Website
- Branding: Chapter logo upload
- Members: Default editor assignment
- *Future: Funding request settings*

**Design System Application:**
- Form layout: 2-column on desktop
- Logo upload: Square preview with replace action

---

## 5. Recruiter Portal Screens

### Screen 4.1: Recruiter Dashboard (`/company`)

**Purpose:** Overview, quick access to browse, saved candidates

**Content:**
- "Browse Talent" hero CTA (large, prominent)
- Quick stats: Saved candidates, Resumes downloaded, Profile views
- Recent activity: "You saved 3 candidates this week"
- "New students joined" feed (optional)
- Shortlist preview: Last 3 saved candidates

**Design System Application:**
- Hero CTA: Full-width gradient card, 32px radius
- Stats: 3-column with icons
- Shortlist preview: Horizontal scroll or mini cards

---

### Screen 4.2: Talent Browser (`/company/browse`)

**Purpose:** Discover and filter student talent

**Content:**
- Search bar (name, university, major)
- Filter panel (slide-out): University, Major, Grad Year, Skills, Attendance count
- View toggle: Grid | List
- Student grid:
  - Avatar (80px)
  - Name
  - University + Major
  - Attendance badge ("12 events")
  - Save star icon
  - Click → Profile detail
- "Load More" pagination
- Empty state: "No students match your filters"

**Design System Application:**
- Filter panel: Glassmorphism, slides from right
- Student cards: `surface-container`, 24px radius
- Avatar ring: `surface-container-highest` when not saved, `tertiary` glow when saved
- Save icon: Star, filled when saved, outline when not
- Grid: 4 columns desktop, 2 tablet, 1 mobile

---

### Screen 4.3: Student Profile Detail - Recruiter View (`/company/students/[id]`)

**Purpose:** Full student profile, save, download resume

**Content:**
- Header: Large avatar, name, university, actions (Save, Download Resume, Close)
- Tabs: Overview | Resume | Attendance History
- **Overview tab:**
  - Academic info
  - Skills chips
  - Professional links
  - Bio
  - Profile visibility status
- **Resume tab:** PDF viewer or download button
- **Attendance tab:** List of events attended with dates
- "Contact LEAD to connect" info (explains messaging not available)

**Design System Application:**
- Modal: 640px max-width, `surface-container`, 32px radius
- Avatar: 120px with ring
- Tabs: Underline style, `primary` for active
- Skills: Chips with `tertiary` color
- Attendance list: Timeline or table

---

### Screen 4.4: Saved Candidates (`/company/saved`)

**Purpose:** Manage shortlist, add notes, download resumes

**Content:**
- Sortable list (drag to reorder)
- Candidate cards:
  - Avatar, name, university
  - Date saved
  - Notes (editable inline)
  - Actions: View profile, Download resume, Remove
- "Download All Resumes" batch action
- "Share with team" (future placeholder)
- Empty state: "No saved candidates yet"

**Design System Application:**
- List: Card-based with drag handles
- Notes: Click to edit, blur to save
- Batch bar: Appears when items selected

---

### Screen 4.5: Downloads (`/company/downloads`)

**Purpose:** Track resume downloads, re-download

**Content:**
- Download history list: Student name, date downloaded, file size
- "Re-download" action
- "Clear history" action

**Design System Application:**
- Table or list with timestamps
- Actions: Icon buttons

---

### Screen 4.6: Company Profile (`/company/profile`)

**Purpose:** Manage company info and team

**Content:**
- Company details: Name, Industry, Size, Website, Description
- Logo upload
- Team section: List of recruiters with access
- "Invite Team Member" (future)

**Design System Application:**
- Form card: `surface-container`, 24px radius
- Team list: Avatars + names + roles

---

## 6. Admin Portal Screens

### Screen 5.1: Admin Dashboard (`/admin`)

**Purpose:** Platform overview, metrics, urgent items

**Content:**
- Platform metrics cards (4):
  - Total users (with growth %)
  - Active chapters
  - Events this month
  - Pending approvals across all chapters
- Quick Actions: New Chapter | New Company | Invite Recruiter
- "Needs Attention" alerts:
  - Funding requests pending review
  - Chapters without editors
  - Recruiters pending approval
- Recent activity log (last 10 platform actions)
- Chart: Events per month (last 6 months)

**Design System Application:**
- Metrics: Large numbers in `display-md`, trend indicators
- Alerts: Warning-colored banners
- Chart: Line or bar, `primary` color
- Activity log: Condensed timeline

---

### Screen 5.2: User Management (`/admin/users`)

**Purpose:** View and manage all platform users

**Content:**
- Tabs: All | Students | Editors | Recruiters | Admins
- Search: Name, email, university
- Filter: Chapter, Role, Status, Date joined
- User table:
  - Avatar + Name
  - Email
  - Role badge
  - Chapter
  - Status
  - Joined date
  - Actions: Edit role, Deactivate, Impersonate (admin only)
- Bulk actions: Export CSV

**Design System Application:**
- Table: Full-width, alternating rows
- Role badges: Color-coded per role
- Status: Active (Green), Pending (Amber), Inactive (Gray)
- Actions: Dropdown menu to save space

---

### Screen 5.3: Chapter Management (`/admin/chapters`)

**Purpose:** Create and manage chapters

**Content:**
- "Create Chapter" primary button
- Chapter grid/list:
  - Chapter name
  - University
  - Member count
  - Editor count
  - Status
  - Actions: View, Edit, Delete
- Chapter detail view (modal or page)
  - Profile info
  - Member list
  - Events hosted
  - Editors assigned

**Design System Application:**
- Grid cards: `surface-container`, chapter logo/initials
- Detail modal: 800px width, tabbed interface

---

### Screen 5.4: Company Management (`/admin/companies`)

**Purpose:** Manage corporate partners and recruiters

**Content:**
- "Create Company" primary button
- Company list:
  - Company name
  - Industry
  - Recruiter count
  - Status
  - Actions: View, Invite recruiter, Deactivate
- Company detail:
  - Profile info
  - Recruiter list with access status
  - "Invite Recruiter" form (email, name)
  - Activity: Last login, candidates saved

**Design System Application:**
- Company cards: Logo + info
- Recruiter status: Active (Green), Pending invite (Amber), Revoked (Red)
- Invite form: Inline or modal

---

### Screen 5.5: Event Oversight (`/admin/events`)

**Purpose:** View all events across chapters, analytics

**Content:**
- Filter: Chapter, Date range, Status
- Aggregate stats:
  - Total events
  - Total registrations
  - Total check-ins
  - Average attendance rate
- Event list (cross-chapter)
- Chart: Events by chapter (bar chart)
- Chart: Registration trends (line chart)

**Design System Application:**
- Stats: 4-column layout
- Charts: Recharts or similar, `primary` and `tertiary` colors
- Event list: Same as editor view but with chapter column

---

### Screen 5.6: Funding Requests (`/admin/funding`)

**Purpose:** Review and decide on chapter funding requests

**Content:**
- Tabs: Pending | Approved | Rejected | All
- Request list:
  - Chapter name
  - Amount requested
  - Event/purpose
  - Date submitted
  - Status badge
  - Actions: Review
- Review modal:
  - Full request details
  - Amount, description, event rationale
  - Approve/Reject buttons
  - Note field

**Design System Application:**
- List: Priority to pending items
- Status: Amber (Pending), Green (Approved), Red (Rejected)
- Review modal: Clear action buttons

---

### Screen 5.7: Activity Logs (`/admin/activity`)

**Purpose:** Audit trail of platform actions

**Content:**
- Filter: Date range, User, Action type, Entity
- Log table:
  - Timestamp
  - User (with avatar)
  - Action (Created event, Approved member, etc.)
  - Entity
  - Details
- Export to CSV

**Design System Application:**
- Table: Time-ordered, most recent first
- User: Avatar + name link
- Action: Badge or colored text

---

### Screen 5.8: Platform Settings (`/admin/settings`)

**Purpose:** Global configuration

**Content:**
- General settings: Platform name, support email
- Email templates: Edit email content
- Feature flags: Enable/disable features
- Security: Password policy, session settings
- Integrations: Google OAuth, Resend, Google Maps
- Maintenance mode toggle

**Design System Application:**
- Form sections: Collapsible cards
- Toggle switches: iOS style
- Danger zone: Red bordered section for destructive actions

---

## 7. Shared Screens & Modals

### Screen 6.1: QR Code Modal

**Purpose:** Full-screen QR display for check-in

**Content:**
- Large QR code (280x280px min)
- Member name
- Event name
- "Present this at check-in" instruction
- Download button (save to photos)

**Design System Application:**
- Modal: Centered, max-width 400px
- QR container: `surface-container-highest`, 24px radius
- Background: Backdrop blur

---

### Screen 6.2: Event Preview Modal

**Purpose:** Preview event before publishing

**Content:**
- Full event card preview
- "This is how students will see your event"
- Edit | Publish buttons

**Design System Application:**
- Preview: Exact event card replica
- Actions: Sticky bottom bar

---

### Screen 6.3: Member Profile Modal

**Purpose:** Quick view of member profile

**Content:**
- Avatar, name, university, major
- Contact info
- Event attendance count
- Resume download (if available)
- Actions: Approve (if pending), Assign ID, View full profile

**Design System Application:**
- Compact modal: 480px width
- Actions: Button row at bottom

---

### Screen 6.4: Confirmation Dialogs

**Purpose:** Confirm destructive or important actions

**Variants:**
- Delete event
- Reject member
- Cancel registration
- Revoke recruiter access

**Content:**
- Title: "Are you sure?"
- Description of action consequences
- Confirm | Cancel buttons

**Design System Application:**
- Modal: Compact, centered
- Confirm button: Danger style (red) for destructive actions

---

### Screen 6.5: Toast Notifications

**Purpose:** Feedback on actions

**Variants:**
- Success: "Member approved!", "Event created!"
- Error: "Something went wrong"
- Info: "Check your email"

**Design System Application:**
- Position: Top-right desktop, bottom-center mobile
- Background: `surface-container-high` with left border accent
- Icon: Checkmark, X, or Info
- Auto-dismiss: 3-5 seconds

---

### Screen 6.6: Loading/Skeleton States

**Purpose:** Indicate loading for all screens

**Content:**
- Skeleton cards matching layout
- Pulse animation
- Loading spinner for actions

**Design System Application:**
- Skeleton: `surface-container` background, shimmer animation
- Spinner: `primary` color, circular

---

## 8. Screen Priority & Implementation Phases

### Phase 1: MVP (Core Flows)

**Must Have (Weeks 1-4):**

| Priority | Screen | Justification |
|----------|--------|---------------|
| P0 | Marketing Homepage | Conversion entry point |
| P0 | Auth (Login/Signup) | Required for all access |
| P0 | Student Dashboard | Primary student destination |
| P0 | Discover Events | Core value proposition |
| P0 | Event Detail (Student) | Registration flow |
| P0 | Profile Edit | Profile completion requirement |
| P0 | Chapter Dashboard | Editor primary destination |
| P0 | Event Creation | Critical editor workflow |
| P0 | Event Management | Editor content management |
| P0 | Check-in Interface | Event-day critical |
| P0 | Member Management | Core editor responsibility |
| P0 | Recruiter Dashboard | Recruiter entry point |
| P0 | Talent Browser | Core recruiter value |
| P0 | Student Profile (Recruiter) | Recruiter decision point |
| P0 | Admin Dashboard | Platform oversight |

**Total Phase 1: 20 screens**

---

### Phase 2: Enhanced Experience

**Should Have (Weeks 5-8):**

| Priority | Screen | Justification |
|----------|--------|---------------|
| P1 | My Events (Student) | Better event management |
| P1 | Resume Management | Student profile completeness |
| P1 | Member ID Card | Professional identity |
| P1 | Profile Visibility | Privacy control |
| P1 | Application Review | Application-based events |
| P1 | Event Detail (Editor) | Rich event management |
| P1 | Cross-Chapter Collaboration | Multi-chapter support |
| P1 | Saved Candidates | Recruiter workflow completion |
| P1 | Company Profile | Recruiter identity |
| P1 | User Management (Admin) | User oversight |
| P1 | Chapter Management | Chapter oversight |
| P1 | Company Management | Recruiter management |

**Total Phase 2: 12 screens**

---

### Phase 3: Advanced Features

**Nice to Have (Weeks 9-12):**

| Priority | Screen | Justification |
|----------|--------|---------------|
| P2 | Event Oversight (Admin) | Cross-chapter analytics |
| P2 | Funding Requests | Financial workflow |
| P2 | Activity Logs | Audit compliance |
| P2 | Platform Settings | Self-service admin |
| P2 | Downloads (Recruiter) | Download tracking |
| P2 | Chapter Settings | Chapter customization |
| P2 | About LEAD | Marketing content |
| P2 | Public Event Discovery | SEO/visitor conversion |

**Total Phase 3: 8 screens**

---

## 9. Navigation Mapping Summary

### Student Navigation Flow
```
Dashboard → Discover Events → Event Detail → Register/Apply
   ↓
Profile Edit → Resume Upload → Visibility Settings
   ↓
My Events → Event Detail → QR Code Modal
```

### Editor Navigation Flow
```
Dashboard → Create Event → Event Management
   ↓              ↓
   ↓         Event Detail → Applications → Check-in
   ↓
Member Management → Approve Members → Assign Member IDs
```

### Recruiter Navigation Flow
```
Dashboard → Browse Talent → Student Profile → Save Candidate
                           ↓
                     Saved List → Download Resumes
```

### Admin Navigation Flow
```
Dashboard → User Management | Chapter Management | Company Management
   ↓
Event Oversight | Funding Requests | Activity Logs | Settings
```

---

## 10. Design System Quick Reference by Screen Type

### Dashboard Screens
- Hero CTA: Gradient background, 32px radius
- Stats: 3-4 column grid, `display-sm` numbers
- Quick actions: Icon-top cards, 24px radius
- Activity: Timeline with dot indicators

### List/Table Screens
- Filters: Glassmorphism panel
- Bulk actions: Floating bar when items selected
- Empty states: Illustrated with CTA
- Pagination: "Load More" or numbered

### Form Screens
- Max-width: 640px centered
- Step indicators: Horizontal with connectors
- Input groups: 16px radius, `surface-container-high` bg
- Actions: Sticky bottom bar on mobile

### Detail Screens
- Header: Full-width cover with gradient overlay
- Tabs: Underline or pill style
- Action bar: Sticky on scroll
- Stats: Card row below header

### Modal Screens
- Max-widths: Compact (400px), Standard (640px), Large (800px)
- Background: Backdrop blur
- Border radius: 24px-32px
- Close: Top-right X button

---

## 11. Responsive Breakpoints Summary

| Breakpoint | Layout Changes |
|------------|----------------|
| **Mobile (<640px)** | Single column, bottom tabs, full-width cards, stacked forms |
| **Tablet (640-1024px)** | 2-column grids, collapsible sidebar, side-by-side preview |
| **Desktop (>1024px)** | 3-4 column grids, persistent sidebar, floating panels |

---

## 12. Accessibility Checklist per Screen

- [ ] Color contrast 4.5:1 minimum for all text
- [ ] Focus indicators visible on all interactive elements
- [ ] Empty states have clear next actions
- [ ] Loading states announced to screen readers
- [ ] Error messages specific and actionable
- [ ] Tab order logical (top-to-bottom, left-to-right)
- [ ] Images have alt text
- [ ] Form labels associated with inputs
- [ ] Status changes announced (toasts)
- [ ] QR codes have text alternative

---

*This screen plan provides the complete blueprint for implementing LEAD Frontier's UI, aligned with both the design system and product strategy.*
