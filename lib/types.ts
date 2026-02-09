export type Role = "admin" | "editor" | "member" | "recruiter";

import type { LucideIcon } from 'lucide-react';

export type NavLink = {
  label: string;
  href: string;
  auth?: "public" | "authenticated";
  roles?: Role[];
};

export const NAV_LINKS: NavLink[] = [
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

import { User, FileText, Users, LayoutDashboard } from 'lucide-react'

// ============================================================================
// DATABASE TYPES - Core schema types matching database exactly
// ============================================================================

export type Database = {
  public: {
    Tables: {
      User: {
        Row: {
          id: string;
          email: string;
          name: string;
          role: Role;
          createdAt: string;
          updatedAt: string;
          phone: string | null;
        };
      };
      Chapter: {
        Row: {
          id: string;
          name: string;
          university: string;
          city: string | null;
          region: string | null;
          createdAt: string | null;
          updatedAt: string;
        };
      };
      StudentProfile: {
        Row: {
          userId: string;
          major: string;
          graduationYear: number;
          linkedinUrl: string;
          skills: string[] | null;
          consentRecruiterVisibility: boolean;
          consentDate: string | null;
          createdAt: string;
          updatedAt: string;
          isRecruiterVisible: boolean;
          approvedById: string | null;
          isFilled: boolean;
          chapterId: string;
        };
      };
      Company: {
        Row: {
          id: string;
          name: string;
          createdat: string;
          createdbyid: string;
        };
      };
      RecruiterAccess: {
        Row: {
          id: string;
          recruiterEmail: string;
          isActive: boolean;
          grantedAt: string;
          grantedById: string;
          inviteToken: string;
          inviteExpiresAt: string | null;
          acceptedAt: string | null;
          acceptedByUserId: string | null;
          companyId: string;
          revokedAt: string | null;
          revokedById: string | null;
        };
      };
      Resume: {
        Row: {
          id: string;
          studentId: string;
          fileUrl: string;
          fileName: string;
          fileSize: number;
          uploadedAt: string;
          parsedData: any | null;
        };
      };
    };
  };
};

// ============================================================================
// EXTRACTED ROW TYPES
// ============================================================================

export type UserRow = Database["public"]["Tables"]["User"]["Row"];
export type ChapterRow = Database["public"]["Tables"]["Chapter"]["Row"];
export type StudentProfileRow = Database["public"]["Tables"]["StudentProfile"]["Row"];
export type CompanyRow = Database["public"]["Tables"]["Company"]["Row"];
export type RecruiterAccessRow = Database["public"]["Tables"]["RecruiterAccess"]["Row"];
export type ResumeRow = Database["public"]["Tables"]["Resume"]["Row"];

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

// ============================================================================
// QUERY RESULT TYPES - Raw types from Supabase queries
// ============================================================================
export type UserWithDetailsRaw = UserRow & {
  StudentProfile: (Pick<StudentProfileRow, "isFilled" | "approvedById" | "isRecruiterVisible" | "chapterId"> & {
    Chapter: Pick<ChapterRow, "name" | "university"> | null; // NOT array
  }) | null;
};

export type UserWithDetails = UserRow & {
  Chapter: Pick<ChapterRow, "name" | "university"> | null;
  StudentProfile: Pick<StudentProfileRow, "isFilled" | "approvedById" | "isRecruiterVisible"> | null;
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
  acceptedByUserId: string;
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
  pending: number;
  approved: number;
  incomplete: number;
  pendingMembers: MemberWithProfile[];
  approvedMembers: MemberWithProfile[];
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