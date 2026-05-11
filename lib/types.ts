export type Role = "admin" | "editor" | "member" | "recruiter";

import type { LucideIcon } from 'lucide-react';
import type {
  Database,
} from '@/lib/database.generated'

export type {
  Database,
  Json,
  Tables,
  TablesInsert,
  TablesUpdate,
  Enums,
  CompositeTypes,
} from '@/lib/database.generated'

export type EventType = 'in_person' | 'online' | 'hybrid'
export type EventAccessModel = 'open' | 'application'
export type RegistrationStatus = 'registered' | 'pending_review' | 'rejected' | 'cancelled' | 'attended'
export type CapacityStatus = 'ok' | 'at_capacity' | 'over_capacity'
export type Translator = (key: string, values?: Record<string, string | number>) => string

export type NavLink = {
  label: string;
  href: string;
  auth?: "public" | "authenticated";
  roles?: Role[];
};

export const NAV_LINKS: NavLink[] = [
  {
    label: "events",
    href: "/events",
    auth: "public",
  },
  {
    label: "dashboard",
    href: "/student",
    auth: "authenticated",
    roles: ["member", "editor"]
  },
  {
    label: "dashboard",
    href: "/company",
    auth: "authenticated",
    roles: ["recruiter"]
  },
  {
    label: "manageChapter",
    href: "/chapter",
    auth: "authenticated",
    roles: ["editor"]
  },
  {
    label: "adminPanel",
    href: "/admin",
    auth: "authenticated",
    roles: ["admin"]
  },
];

export interface User {
  name: string
  email: string
  role: string
}

export type AuthenticatedNavUser = {
  name: string
  email: string
  avatar: string | null
}

export interface NavItem {
  nameKey: string
  href: string
  icon: LucideIcon
  showPingOn?: 'has_pending_approvals'
  badge?: number
}

export const USER_ROLES = {
  EDITOR: 'editor',
  MEMBER: 'member',
} as const

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES]

// ============================================================================
// DATABASE TYPES - Core schema types matching database exactly
// ============================================================================
export type ApprovalStatus = 'pending' | 'approved' | 'rejected'

// Note: Constants should be defined in a separate constants file if needed

// ============================================================================
// EXTRACTED ROW TYPES
// ============================================================================

export type UserRow = Database["public"]["Tables"]["user"]["Row"];
export type ChapterRow = Database["public"]["Tables"]["chapter"]["Row"];

export type PersonProfileRow = Database["public"]["Tables"]["person_profile"]["Row"];
export type ChapterMembershipRow = Database["public"]["Tables"]["chapter_membership"]["Row"];
export type LeadIdentityRow = Database["public"]["Tables"]["lead_identity"]["Row"];
export type IdentityType = Database["public"]["Enums"]["identity_type"];
export type IdentityStatus = Database["public"]["Enums"]["identity_status"];

export type CompanyRow = Database["public"]["Tables"]["company"]["Row"];

export type RecruiterAccessRow = Database["public"]["Tables"]["recruiter_access"]["Row"];

export type ResumeRow = Database["public"]["Tables"]["resume"]["Row"];

export type ResumeDownloadLogRow = Database["public"]["Tables"]["resume_download_log"]["Row"];

export type EventRegistrationRow = Database["public"]["Tables"]["event_registration"]["Row"];
export type EventApplicationQuestionRow = Database["public"]["Tables"]["event_application_question"]["Row"];
export type EventApplicationQuestionInsert = Database["public"]["Tables"]["event_application_question"]["Insert"];
export type EventApplicationQuestionUpdate = Database["public"]["Tables"]["event_application_question"]["Update"];
export type EventApplicationAnswerRow = Database["public"]["Tables"]["event_application_answer"]["Row"];
export type EventApplicationAnswerInsert = Database["public"]["Tables"]["event_application_answer"]["Insert"];
export type EventApplicationAnswerUpdate = Database["public"]["Tables"]["event_application_answer"]["Update"];
export type EventApplicationQuestionType = Database["public"]["Enums"]["question_type"];

export type SavedStudentRow = Database["public"]["Tables"]["saved_student"]["Row"];

export type EventRow = Database["public"]["Tables"]["event"]["Row"];

export type EventChapterRow = Database["public"]["Tables"]["event_chapter"]["Row"];

export type EventChapterInsert = Omit<EventChapterRow, 'id' | 'added_at'>;

export type EventChapterUpdate = Partial<EventChapterInsert>;

export type NewsletterSubscriptionRow = Database["public"]["Tables"]["newsletter_subscription"]["Row"];
export type NewsletterSubscriptionInsert = Database["public"]["Tables"]["newsletter_subscription"]["Insert"];
export type NewsletterSubscriptionUpdate = Database["public"]["Tables"]["newsletter_subscription"]["Update"];
export type PathwayFeatureFlagRow = Database["public"]["Tables"]["pathway_feature_flag"]["Row"];
export type PathwayFeatureFlagInsert = Database["public"]["Tables"]["pathway_feature_flag"]["Insert"];
export type PathwayFeatureFlagUpdate = Database["public"]["Tables"]["pathway_feature_flag"]["Update"];
export type PathwayCheckInRow = Database["public"]["Tables"]["pathway_check_in"]["Row"];
export type PathwayCheckInInsert = Database["public"]["Tables"]["pathway_check_in"]["Insert"];
export type PathwayCheckInUpdate = Database["public"]["Tables"]["pathway_check_in"]["Update"];
export type PathwayRecommendationRow = Database["public"]["Tables"]["pathway_recommendation"]["Row"];
export type PathwayRecommendationInsert = Database["public"]["Tables"]["pathway_recommendation"]["Insert"];
export type PathwayRecommendationUpdate = Database["public"]["Tables"]["pathway_recommendation"]["Update"];

// ============================================================================
// COMPOSITE TYPES - Used in queries with joins
// ============================================================================

export type UserWithChapter = UserRow & {
  chapter: ChapterRow | null
};

export type MemberWithProfile = UserRow & {
  person_profile: PersonProfileRow | null;
  chapter_membership: Pick<
    ChapterMembershipRow,
    'chapter_id' | 'status' | 'position' | 'member_id' | 'joined_at'
  > | null;
  chapter: ChapterRow | null;
};

export type RecentActivityMember = Omit<MemberWithProfile, "person_profile"> & {
  person_profile: PersonProfileRow // Non-nullable for recent activity
};

export type RecruiterUser = UserRow & {
  recruiter_access: RecruiterAccessRow[];
  company: CompanyRow | null;
};

export type EventWithDetailsRaw = EventRow & {
  owner_chapter: Pick<ChapterRow, 'id' | 'name' | 'university'>[]
  collaborators: (EventChapterRow & {
    chapter: Pick<ChapterRow, 'id' | 'name' | 'university' | 'city' | 'region'>[]
  })[] | null
  created_by: Pick<UserRow, 'id' | 'name' | 'email'>[]
  event_registration: { id: string; status: RegistrationStatus }[]
}

export type UserWithDetailsRaw = UserRow & {
  person_profile: {
    is_recruiter_visible: boolean
  } | null
  chapter_membership: {
    status: ChapterMembershipRow['status']
    chapter_id: string
    chapter: Pick<ChapterRow, 'name' | 'university'> | Pick<ChapterRow, 'name' | 'university'>[] | null
  } | null
}

export type UserWithDetails = UserRow & {
  chapter: Pick<ChapterRow, 'name' | 'university'> | null
  person_profile: {
    is_filled: boolean
    is_recruiter_visible: boolean
  } | null
  chapter_membership: {
    status: ChapterMembershipRow['status']
  } | null
}

export type EventWithDetails = EventRow & {
  event_chapter: (EventChapterRow & {
    chapter: Pick<ChapterRow, 'id' | 'name' | 'university'>
  })[]
  chapter: Pick<ChapterRow, 'id' | 'name' | 'university'> | null
  owner_chapter: Pick<ChapterRow, 'id' | 'name' | 'university'> | null
  collaborators: (EventChapterRow & {
    chapter: Pick<ChapterRow, 'id' | 'name' | 'university'>
    name: string
  })[]
  created_by: Pick<UserRow, 'id' | 'name' | 'email'> | null
  _count: { 
    registrations: number; 
    pending_applications?: number;
    chapters?: number;
  }
  is_owned_by_chapter?: boolean // For editor dashboard to distinguish owned vs collaborative events
}

export type RegistrationWithUserRaw = EventRegistrationRow & {
  user: Pick<UserRow, 'id' | 'name' | 'email' | 'phone'>[]
  person_profile: Pick<PersonProfileRow, 'major_or_interest' | 'graduation_year' | 'linkedin_url' | 'portfolio_url'>[]
}

export type RegistrationWithUser = EventRegistrationRow & {
  user: Pick<UserRow, 'id' | 'name' | 'email' | 'phone'> | null
  person_profile: Pick<PersonProfileRow, 'major_or_interest' | 'graduation_year' | 'linkedin_url' | 'portfolio_url'> | null
  application_answers?: Array<
    EventApplicationAnswerRow & {
      event_application_question: Pick<
        EventApplicationQuestionRow,
        'id' | 'question_text' | 'question_type' | 'options' | 'sort_order'
      > | null
    }
  >
}

// ============================================================================
// QUERY RESULT TYPES - Raw types from Supabase queries
// ============================================================================

export type RecruiterInviteRaw = {
  id: string;
  recruiter_email: string;
  is_active: boolean;
  granted_at: string;
  invite_expires_at: string | null;
  accepted_at: string | null;
  revoked_at: string | null;
  company_id: string;
  company: { name: string }[];
  granted_by: { name: string; email: string }[];
  accepted_by: { name: string; email: string }[];
};

export type RecruiterInvite = {
  id: string;
  recruiter_email: string;
  is_active: boolean;
  granted_at: string;
  invite_expires_at: string | null;
  accepted_at: string | null;
  revoked_at: string | null;
  company_id: string;
  company: { name: string } | null;
  granted_by: { name: string; email: string } | null;
  accepted_by: { name: string; email: string } | null;
};

export type CompanyRaw = {
  id: string;
  name: string;
  created_at: string;
  created_by_id: string;
  created_by: { name: string | null; email: string }[];
};

export type Company = {
  id: string;
  name: string;
  created_at: string;
  created_by_id: string;
  created_by: { name: string | null; email: string } | null;
  _count?: { active_recruiters: number; pending_invites: number };
};

export type RecruiterVisibleProfile = Pick<
  PersonProfileRow,
  | 'major_or_interest'
  | 'graduation_year'
  | 'linkedin_url'
  | 'portfolio_url'
  | 'skills'
  | 'is_recruiter_visible'
  | 'updated_at'
> & {
  chapter_id: string | null
}

export type StudentForRecruiterRaw = {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  created_at: string;
  chapter: Pick<ChapterRow, "id" | "name" | "university" | "city" | "region">[];
  person_profile: RecruiterVisibleProfile[];
};

export type StudentForRecruiter = {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  created_at: string;
  chapter: Pick<ChapterRow, "id" | "name" | "university" | "city" | "region"> | null;
  person_profile: RecruiterVisibleProfile | null;
};

export type SavedStudent = {
  id: string;
  recruiter_id: string;
  student_id: string;
  saved_at: string;
  notes: string | null;
  student: StudentForRecruiter;
};

// ============================================================================
// STATS & DASHBOARD TYPES
// ============================================================================

export type UserWithFullProfile = UserRow & {
  person_profile: PersonProfileRow | null
  chapter_membership: (Pick<
    ChapterMembershipRow,
    'chapter_id' | 'status' | 'position' | 'member_id' | 'joined_at'
  > & {
    chapter: ChapterRow | null
  }) | null
}

export type EventChapterWithChapter = EventChapterRow & {
  chapter: Pick<ChapterRow, 'id' | 'name' | 'university' | 'city' | 'region'>
  added_by: Pick<UserRow, 'id' | 'name' | 'email'>
}

export type EventWithAllChapters = EventRow & {
  event_chapter: EventChapterWithChapter[]
  created_by: Pick<UserRow, 'id' | 'name' | 'email'> | null
  _count: {
    registrations: number
    chapters: number
    pending_applications?: number
  }
}

export type ChapterStats = {
  total: number;
  incomplete: number;
  pending: number;
  approved: number;
  rejected: number;
  pending_members: MemberWithProfile[];
  approved_members: MemberWithProfile[];
  rejected_members: MemberWithProfile[];
  complete_profiles: number;
  visible_to_recruiters: number;
};

export type ChapterData = {
  chapter_name: string;
  university: string;
  stats: ChapterStats;
  recentActivity: RecentActivityMember[];
};

export type EditorSidebarStats = {
  has_pending_approvals: boolean
};

export interface AdminStats {
  pending_invites: number;
  pending_approvals: number;
  total_users: number;
  total_chapters: number;
  total_companies: number;
}

export interface AdminSidebarProps {
  user: UserRow;
  stats: AdminStats;
}

export type CompanyStats = {
  total_students: number;
  saved_students: number;
  recent_views: number;
};

export type ActivityItem = {
  id: string
  type: 'approval' | 'invite_sent' | 'invite_accepted' | 'invite_revoked'
  timestamp: string
  actor: {
    name: string | null
    email: string
  } | null
  target: {
    name: string | null
    email: string
  } | null
  company?: {
    name: string
  } | null
  chapter?: {
    name: string
  } | null
}

export type SidebarLayoutProps = {
  Sidebar: React.ComponentType
  children: React.ReactNode
  sidebarFallback?: React.ReactNode
  contentFallback?: React.ReactNode
}

export type ChapterMember = UserRow & {
  person_profile: Pick<PersonProfileRow, 'user_id' | 'is_recruiter_visible' | 'updated_at'> | null
  chapter_membership: Pick<ChapterMembershipRow, 'chapter_id' | 'status' | 'member_id' | 'approved_by_id'> | null
  chapter: Pick<ChapterRow, 'name' | 'university'> | null
}

// ============================================================================
// OPTIONS CONSTANTS
// ============================================================================

export const EVENT_ACCESS_MODEL_OPTIONS = [
  { value: 'open', label: 'Open' },
  { value: 'application', label: 'Application Required' }
] as const

export const REGISTRATION_STATUS_OPTIONS = [
  { value: 'registered', label: 'Registered', color: 'green' },
  { value: 'pending_review', label: 'Pending Review', color: 'amber' },
  { value: 'rejected', label: 'Rejected', color: 'neutral' },
  { value: 'cancelled', label: 'Cancelled', color: 'neutral' },
  { value: 'attended', label: 'Attended', color: 'blue' }
] as const

export const CAPACITY_WARNING_MESSAGE = 'This event has reached capacity. You can still register, but you may be placed on a waitlist.'

export const BULK_APPROVE_FAILURE_MESSAGE = 'Failed to approve some registrations. Please try again or contact support if the issue persists.'

