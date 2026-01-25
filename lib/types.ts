
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
          chapterId: string;
          createdAt: string;
          updatedAt: string;
          phone: string;
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

export type MemberWithProfile = UserRow & {
  StudentProfile: StudentProfileRow | null;
  Chapter: ChapterRow | null;
};

export type RecentActivityMember = Omit<MemberWithProfile, "StudentProfile"> & {
  StudentProfile: StudentProfileRow;
};

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
  hasPendingApprovals: boolean;
};

export interface AdminStats {
  pendingInvites: number
  pendingApprovals: number
  totalUsers: number
  totalChapters: number
  totalCompanies: number
}

export interface AdminSidebarProps {
  user: UserRow
  stats: AdminStats
}

export interface NavItemConfig {
  name: string
  href: string
  icon: React.ComponentType<any>
  showIndicatorKey?: keyof AdminStats
  showCountKey?: keyof AdminStats
  description?: string
}



export type UserWithDetailsRaw =
  UserRow & {
    Chapter: Pick<ChapterRow, "name" | "university">[]
    StudentProfile: Pick<
      StudentProfileRow,
      "isFilled" | "approvedById" | "isRecruiterVisible"
    >[]
  }


  export type UserWithDetails =
  UserRow & {
    Chapter: Pick<ChapterRow, "name" | "university"> | null
    StudentProfile: Pick<
      StudentProfileRow,
      "isFilled" | "approvedById" | "isRecruiterVisible"
    > | null
  }