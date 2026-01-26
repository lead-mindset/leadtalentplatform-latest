export type Role = "admin" | "editor" | "member" | "recruiter";

export type NavLink = {
  label: string;
  href: string;
  auth?: "public" | "authenticated";
  roles?: Role[];
};

export const NAV_LINKS: NavLink[] = [
  { label: "About", href: "/about-us", auth: "public" },
  { label: "Dashboard", href: "/student", auth: "authenticated", roles: ["member", "editor"] },
  { label: "Manage Chapter", href: "/chapter", auth: "authenticated", roles: ["editor"] },
  { label: "Admin Panel", href: "/admin", auth: "authenticated", roles: ["admin"] },
];

export type Database = {
  public: {
    Tables: {
      User: {
        Row: {
          id: string;
          email: string;
          name: string;
          role: Role;
          chapterId: string | null;
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
          major: string | null;
          graduationYear: number | null;
          linkedinUrl: string | null;
          skills: string[] | null;
          consentRecruiterVisibility: boolean;
          isRecruiterVisible: boolean | null;
          approvedById: string | null;
          isFilled: boolean | null;
          createdAt: string;
          updatedAt: string;
          consentDate: string | null;
        };
      };
    };
  };
};

export type UserRow = Database["public"]["Tables"]["User"]["Row"];
export type ChapterRow = Database["public"]["Tables"]["Chapter"]["Row"];
export type StudentProfileRow = Database["public"]["Tables"]["StudentProfile"]["Row"];

export type UserWithChapter = UserRow & { Chapter?: ChapterRow | null };
export type MemberWithProfile = UserRow & { StudentProfile: StudentProfileRow | null; Chapter: ChapterRow | null };
export type RecentActivityMember = Omit<MemberWithProfile, "StudentProfile"> & { StudentProfile: StudentProfileRow };

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

export type EditorSidebarStats = { hasPendingApprovals: boolean };
export interface AdminStats { pendingInvites: number; pendingApprovals: number; totalUsers: number; totalChapters: number; totalCompanies: number }
export interface AdminSidebarProps { user: UserRow; stats: AdminStats }
export interface NavItemConfig { name: string; href: string; icon: React.ComponentType<any>; showIndicatorKey?: keyof AdminStats; showCountKey?: keyof AdminStats; description?: string }

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

export type RecruiterUser = UserRow & {
  RecruiterAccess: RecruiterAccessRow[];
  Company: CompanyRow | null;
};

export type RecruiterAccessRow = {
  id: string;
  companyId: string;
  isActive: boolean;
  grantedById: string;
  acceptedByUserId: string | null;
  grantedAt: string;
  acceptedAt: string | null;
  revokedAt: string | null;
  inviteExpiresAt: string | null;
  recruiterEmail: string;
};

export type CompanyRow = {
  id: string;
  name: string;
  createdat: string;
  createdbyid: string;
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

export type CompanyStats = {
  totalStudents: number;
  savedStudents: number;
  recentViews: number;
};
