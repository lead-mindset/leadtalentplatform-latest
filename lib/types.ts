export type Role = "admin" | "editor" | "member";

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
          id: string
          email: string
          name: string | null
          role: 'member' | 'editor' | 'admin' | 'recruiter'
          chapterId: string | null
          createdAt: string
          updatedAt: string
          phone: string | null
        }
      }
      Chapter: {
        Row: {
          id: string
          name: string
          university: string
          city: string | null
          region: string | null
          createdAt: string | null
          updatedAt: string
        }
      }
      StudentProfile: {
        Row: {
          userId: string
          major: string | null
          graduationYear: number | null
          linkedinUrl: string | null
          skills: string[] | null
          consentRecruiterVisibility: boolean
          isRecruiterVisible: boolean | null
          approvedById: string | null
          isFilled: boolean | null
          updatedAt: string
          createdAt: string
          consentDate: string | null
        }
      }
    }
  }
}

export type UserRow = Database['public']['Tables']['User']['Row']
export type ChapterRow = Database['public']['Tables']['Chapter']['Row']
export type StudentProfileRow = Database['public']['Tables']['StudentProfile']['Row']

export type MemberWithProfile = UserRow & {
  StudentProfile: StudentProfileRow | null
  Chapter: ChapterRow | null
}

export type ChapterStats = {
  total: number
  pending: number
  approved: number
  incomplete: number
  completeProfiles: number
  visibleToRecruiters?: number
  pendingMembers: MemberWithProfile[]
  approvedMembers: MemberWithProfile[]
}


export type RecentActivityMember = UserRow & {
  StudentProfile: StudentProfileRow
}

export type ChapterData = {
  chapterId: string
  chapterName: string
  university: string
  stats: ChapterStats
  pendingMembers: MemberWithProfile[]
  recentActivity: RecentActivityMember[]
}
