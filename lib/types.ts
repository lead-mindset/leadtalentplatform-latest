export type Role = "admin" | "editor" | "member" | "recruiter";

export type NavLink = {
  label: string;
  href: string;
  auth?: "public" | "authenticated";
  roles?: Role[];
};

export const NAV_LINKS: NavLink[] = [
  { label: "Dashboard", href: "/student", auth: "authenticated", roles: ["member", "editor"] },
  { label: "Dashboard", href: "/company", auth: "authenticated", roles: ["recruiter"] },
  { label: "Manage Chapter", href: "/chapter", auth: "authenticated", roles: ["editor"] },
  { label: "Admin Panel", href: "/admin", auth: "authenticated", roles: ["admin"] },
];

// ============================================================================
// DATABASE TYPES - Core schema types matching database exactly
// ============================================================================

export type Database = {
  public: {
    Tables: {
      User: {
        Row: {
          id: string; // uuid
          email: string;
          name: string | null;
          role: Role;
          chapterId: string | null; // text (references Chapter.id)
          createdAt: string; // timestamp without time zone
          updatedAt: string; // timestamp without time zone
          phone: string | null;
        };
      };
      Chapter: {
        Row: {
          id: string; // text (not uuid)
          name: string;
          university: string;
          city: string | null;
          region: string | null;
          createdAt: string | null; // date (nullable!)
          updatedAt: string; // timestamp without time zone
        };
      };
      StudentProfile: {
        Row: {
          userId: string; // uuid
          major: string | null;
          graduationYear: number | null;
          linkedinUrl: string | null;
          skills: string[] | null;
          consentRecruiterVisibility: boolean;
          consentDate: string | null; // timestamp without time zone
          createdAt: string; // timestamp without time zone
          updatedAt: string; // timestamp without time zone
          isRecruiterVisible: boolean | null;
          approvedById: string | null; // uuid
          isFilled: boolean | null;
        };
      };
      Company: {
        Row: {
          id: string; // uuid
          name: string;
          createdat: string; // timestamp with time zone
          createdbyid: string; // uuid
        };
      };
      RecruiterAccess: {
        Row: {
          id: string; // uuid
          recruiterEmail: string;
          isActive: boolean;
          grantedAt: string; // timestamp with time zone
          grantedById: string; // uuid
          inviteToken: string; // uuid - IMPORTANT: was missing!
          inviteExpiresAt: string | null; // timestamp with time zone
          acceptedAt: string | null; // timestamp with time zone
          acceptedByUserId: string | null; // uuid
          companyId: string; // uuid
          revokedAt: string | null; // timestamp with time zone
          revokedById: string | null; // uuid - IMPORTANT: was missing!
        };
      };
      Resume: {
        Row: {
          id: string; // uuid
          studentId: string; // uuid
          fileUrl: string;
          fileName: string | null;
          fileSize: number | null;
          uploadedAt: string; // timestamp without time zone
          parsedData: any | null; // jsonb
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
  Chapter: Pick<ChapterRow, "name" | "university">[];
  StudentProfile: Pick<StudentProfileRow, "isFilled" | "approvedById" | "isRecruiterVisible">[];
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
  name: string | null;
  phone: string | null;
  chapterId: string | null;
  createdAt: string;
  Chapter: Pick<ChapterRow, "name" | "university" | "city" | "region">[];
  StudentProfile: Pick<StudentProfileRow, "major" | "graduationYear" | "linkedinUrl" | "skills" | "isRecruiterVisible" | "isFilled" | "updatedAt">[];
};

export type StudentForRecruiter = {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  chapterId: string | null;
  createdAt: string;
  Chapter: Pick<ChapterRow, "name" | "university" | "city" | "region"> | null;
  StudentProfile: Pick<StudentProfileRow, "major" | "graduationYear" | "linkedinUrl" | "skills" | "isRecruiterVisible" | "isFilled" | "updatedAt"> | null;
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

export interface NavItemConfig { 
  name: string;
  href: string;
  icon: React.ComponentType<any>;
  showIndicatorKey?: keyof AdminStats;
  showCountKey?: keyof AdminStats;
  description?: string;
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
