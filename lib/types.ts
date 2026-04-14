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
  Chapter: Pick<ChapterRow, 'id' | 'name' | 'university'>[]
  CreatedBy: Pick<UserRow, 'id' | 'name' | 'email'>[]
  EventRegistration: { id: string; status: RegistrationStatus }[]
}

export type EventWithDetails = EventRow & {
  Chapter: Pick<ChapterRow, 'id' | 'name' | 'university'> | null
  CreatedBy: Pick<UserRow, 'id' | 'name' | 'email'> | null
  _count: { 
    registrations: number; 
    pendingApplications?: number; 
  }
}

export type RegistrationWithUserRaw = EventRegistrationRow & {
  User: Pick<UserRow, 'id' | 'name' | 'email' | 'phone'>[]
  StudentProfile: Pick<StudentProfileRow, 'major' | 'graduationYear' | 'linkedinUrl'>[]
}

export type RegistrationWithUser = EventRegistrationRow & {
  User: Pick<UserRow, 'id' | 'name' | 'email' | 'phone'> | null
  StudentProfile: Pick<StudentProfileRow, 'major' | 'graduationYear' | 'linkedinUrl'> | null
}

// ============================================================================
// QUERY RESULT TYPES - Raw types from Supabase queries
// ============================================================================
export type UserWithDetailsRaw = UserRow & {
  StudentProfile: (Pick<StudentProfileRow, "isFilled" | "approvedById" | "isRecruiterVisible" | "approvalStatus" | "chapterId"> & {
    Chapter: Pick<ChapterRow, "name" | "university"> | null;
  }) | null;
};

export type UserWithDetails = UserRow & {
  Chapter: Pick<ChapterRow, "name" | "university"> | null;
  StudentProfile: Pick<StudentProfileRow, "isFilled" | "approvedById" | "isRecruiterVisible" | 'approvalStatus'> | null;
};

export type RecruiterInviteRaw = {
  id: string;
  recruiterEmail: string;
  isActive: boolean;
  grantedAt: string;
  inviteExpiresAt: string | null;
  acceptedAt: string | null;
  revokedAt: string | null;
  companyId: string;
  Company: { name: string }[];
  GrantedBy: { name: string; email: string }[];
  AcceptedBy: { name: string; email: string }[];
};

export type RecruiterInvite = {
  id: string;
  recruiterEmail: string;
  isActive: boolean;
  grantedAt: string;
  inviteExpiresAt: string | null;
  acceptedAt: string | null;
  revokedAt: string | null;
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
  createdAt: string;
  Chapter: Pick<ChapterRow, "name" | "university" | "city" | "region">[];
  StudentProfile: Pick<StudentProfileRow, "major" | "graduationYear" | "linkedinUrl" | "skills" | "isRecruiterVisible" | "isFilled" | "updatedAt" | "chapterId">[];
};

export type StudentForRecruiter = {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  createdAt: string;
  Chapter: Pick<ChapterRow, "name" | "university" | "city" | "region"> | null;
  StudentProfile: Pick<StudentProfileRow, "major" | "graduationYear" | "linkedinUrl" | "skills" | "isRecruiterVisible" | "isFilled" | "updatedAt" | "chapterId"> | null;
};

export type SavedStudent = {
  id: string;
  recruiterId: string;
  studentId: string;
  savedAt: string;
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
  StudentProfile: Pick<StudentProfileRow, 'userId' | 'isFilled' | 'approvedById' | 'isRecruiterVisible' | 'chapterId' | 'updatedAt'> | null
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

