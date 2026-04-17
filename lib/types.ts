export type Role = "admin" | "editor" | "member" | "recruiter";

import type { LucideIcon } from 'lucide-react';
import type {
  Database,
  Tables,
  TablesInsert,
  TablesUpdate,
  Enums,
  CompositeTypes,
  Json,
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
  showPingOn?: 'hasPendingApprovals'
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

export type { Json, Database, Tables, TablesInsert, TablesUpdate, Enums, CompositeTypes } from '@/lib/database.generated'

export { Constants } from '@/lib/database.generated'

// ============================================================================
// EXTRACTED ROW TYPES
// ============================================================================

export type UserRow = Database["public"]["Tables"]["User"]["Row"];
export type ChapterRow = Database["public"]["Tables"]["Chapter"]["Row"];
export type StudentProfileRow = Database["public"]["Tables"]["StudentProfile"]["Row"];
export type CompanyRow = Database["public"]["Tables"]["Company"]["Row"];
export type RecruiterAccessRow = Database["public"]["Tables"]["RecruiterAccess"]["Row"];
export type ResumeRow = Database["public"]["Tables"]["Resume"]["Row"];
export type ResumeDownloadLogRow = Database["public"]["Tables"]["ResumeDownloadLog"]["Row"];
export type EventRow = Database["public"]["Tables"]["Event"]["Row"]
export type EventRegistrationRow = Database["public"]["Tables"]["EventRegistration"]["Row"]
export type SavedStudentRow = Database["public"]["Tables"]["SavedStudent"]["Row"]

export type EventChapterRow = {
  id: string // uuid
  event_id: string // uuid
  chapter_id: string // text
  added_at: string // timestamptz
  added_by_id: string // uuid
}

export type EventChapterInsert = Omit<EventChapterRow, 'id' | 'added_at'>
export type EventChapterUpdate = Partial<EventChapterInsert>

// ============================================================================
// COMPOSITE TYPES - Used in queries with joins
// ============================================================================

export type UserWithChapter = UserRow & {
  Chapter: ChapterRow | null
};

export type MemberWithProfile = UserRow & {
  StudentProfile: StudentProfileRow | null;
  Chapter: ChapterRow | null;
};

export type RecentActivityMember = Omit<MemberWithProfile, "StudentProfile"> & {
  StudentProfile: StudentProfileRow // Non-nullable for recent activity
};

export type RecruiterUser = UserRow & {
  RecruiterAccess: RecruiterAccessRow[];
  Company: CompanyRow | null;
};

export type EventWithDetailsRaw = EventRow & {
  ownerChapter: Pick<ChapterRow, 'id' | 'name' | 'university'>[]
  collaborators: (EventChapterRow & {
    chapter: Pick<ChapterRow, 'id' | 'name' | 'university' | 'city' | 'region'>[]
  })[] | null
  CreatedBy: Pick<UserRow, 'id' | 'name' | 'email'>[]
  EventRegistration: { id: string; status: RegistrationStatus }[]
}

export type EventWithDetails = EventRow & {
  EventChapter: (EventChapterRow & {
    Chapter: Pick<ChapterRow, 'id' | 'name' | 'university'>
  })[]
  Chapter: Pick<ChapterRow, 'id' | 'name' | 'university'> | null
  ownerChapter: Pick<ChapterRow, 'id' | 'name' | 'university'> | null
  collaborators: (EventChapterRow & {
    Chapter: Pick<ChapterRow, 'id' | 'name' | 'university'>
    name: string
  })[]
  CreatedBy: Pick<UserRow, 'id' | 'name' | 'email'> | null
  _count: { 
    registrations: number; 
    pendingApplications?: number;
    chapters?: number;
  }
  isOwnedByChapter?: boolean // For editor dashboard to distinguish owned vs collaborative events
}

export type RegistrationWithUserRaw = EventRegistrationRow & {
  User: Pick<UserRow, 'id' | 'name' | 'email' | 'phone'>[]
  StudentProfile: Pick<StudentProfileRow, 'major' | 'graduation_year' | 'linkedin_url'>[]
}

export type RegistrationWithUser = EventRegistrationRow & {
  User: Pick<UserRow, 'id' | 'name' | 'email' | 'phone'> | null
  StudentProfile: Pick<StudentProfileRow, 'major' | 'graduation_year' | 'linkedin_url'> | null
}

// ============================================================================
// QUERY RESULT TYPES - Raw types from Supabase queries
// ============================================================================
export type UserWithDetailsRaw = UserRow & {
  StudentProfile: (Pick<StudentProfileRow, "is_filled" | "approved_by_id" | "is_recruiter_visible" | "approval_status" | "chapter_id"> & {
    Chapter: Pick<ChapterRow, "name" | "university"> | null;
  }) | null;
};

export type UserWithDetails = UserRow & {
  Chapter: Pick<ChapterRow, "name" | "university"> | null;
  StudentProfile: Pick<StudentProfileRow, "is_filled" | "approved_by_id" | "is_recruiter_visible" | 'approval_status'> | null;
};

export type RecruiterInviteRaw = {
  id: string;
  recruiterEmail: string;
  isActive: boolean;
  granted_at: string;
  invite_expires_at: string | null;
  accepted_at: string | null;
  revoked_at: string | null;
  companyId: string;
  Company: { name: string }[];
  GrantedBy: { name: string; email: string }[];
  AcceptedBy: { name: string; email: string }[];
};

export type RecruiterInvite = {
  id: string;
  recruiterEmail: string;
  isActive: boolean;
  granted_at: string;
  invite_expires_at: string | null;
  accepted_at: string | null;
  revoked_at: string | null;
  companyId: string;
  Company: { name: string } | null;
  GrantedBy: { name: string; email: string } | null;
  AcceptedBy: { name: string; email: string } | null;
};

export type CompanyRaw = {
  id: string;
  name: string;
  createdat: string;
  createdbyid: string;
  CreatedBy: { name: string | null; email: string }[];
};

export type Company = {
  id: string;
  name: string;
  createdat: string;
  createdbyid: string;
  CreatedBy: { name: string | null; email: string } | null;
  _count?: { activeRecruiters: number; pendingInvites: number };
};

export type StudentForRecruiterRaw = {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  created_at: string;
  Chapter: Pick<ChapterRow, "name" | "university" | "city" | "region">[];
  StudentProfile: Pick<StudentProfileRow, "major" | "graduation_year" | "linkedin_url" | "skills" | "is_recruiter_visible" | "is_filled" | "updated_at" | "chapter_id">[];
};

export type StudentForRecruiter = {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  created_at: string;
  Chapter: Pick<ChapterRow, "name" | "university" | "city" | "region"> | null;
  StudentProfile: Pick<StudentProfileRow, "major" | "graduation_year" | "linkedin_url" | "skills" | "is_recruiter_visible" | "is_filled" | "updated_at" | "chapter_id"> | null;
};

export type SavedStudent = {
  id: string;
  recruiter_id: string;
  student_id: string;
  saved_at: string;
  notes: string | null;
  Student: StudentForRecruiter;
};

// ============================================================================
// STATS & DASHBOARD TYPES
// ============================================================================

export type UserWithFullProfile = UserRow & {
  StudentProfile: (StudentProfileRow & {
    Chapter: ChapterRow | null
  }) | null
}

export type EventChapterWithChapter = EventChapterRow & {
  Chapter: Pick<ChapterRow, 'id' | 'name' | 'university' | 'city' | 'region'>
  AddedBy: Pick<UserRow, 'id' | 'name' | 'email'>
}

export type EventWithAllChapters = EventRow & {
  EventChapter: EventChapterWithChapter[]
  CreatedBy: Pick<UserRow, 'id' | 'name' | 'email'> | null
  _count: {
    registrations: number
    chapters: number
    pendingApplications?: number
  }
}

export type ChapterStats = {
  total: number;
  incomplete: number;
  pending: number;
  approved: number;
  rejected: number;
  pendingMembers: MemberWithProfile[];
  approvedMembers: MemberWithProfile[];
  rejectedMembers: MemberWithProfile[];
  completeProfiles: number;
  visibleToRecruiters: number;
};

export type ChapterData = {
  chapterName: string;
  university: string;
  stats: ChapterStats;
  recentActivity: RecentActivityMember[];
};

export type EditorSidebarStats = {
  hasPendingApprovals: boolean
};

export interface AdminStats {
  pendingInvites: number;
  pendingApprovals: number;
  totalUsers: number;
  totalChapters: number;
  totalCompanies: number;
}

export interface AdminSidebarProps {
  user: UserRow;
  stats: AdminStats;
}

export type CompanyStats = {
  totalStudents: number;
  savedStudents: number;
  recentViews: number;
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
  StudentProfile: Pick<StudentProfileRow, 'user_id' | 'is_filled' | 'approved_by_id' | 'is_recruiter_visible' | 'chapter_id' | 'updated_at'> | null
  Chapter: Pick<ChapterRow, 'name' | 'university'> | null
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

