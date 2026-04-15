export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      Chapter: {
        Row: {
          city: string | null
          createdAt: string | null
          id: string
          name: string
          region: string | null
          university: string
          updatedAt: string
        }
        Insert: {
          city?: string | null
          createdAt?: string | null
          id: string
          name: string
          region?: string | null
          university: string
          updatedAt: string
        }
        Update: {
          city?: string | null
          createdAt?: string | null
          id?: string
          name?: string
          region?: string | null
          university?: string
          updatedAt?: string
        }
        Relationships: []
      }
      Company: {
        Row: {
          createdat: string
          createdbyid: string
          id: string
          name: string
        }
        Insert: {
          createdat?: string
          createdbyid: string
          id?: string
          name: string
        }
        Update: {
          createdat?: string
          createdbyid?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "Company_createdbyid_fkey"
            columns: ["createdbyid"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      Event: {
        Row: {
          accessModel: "open" | "application"
          applicationFormUrl: string | null
          capacity: number | null
          chapterId: string | null
          coverImage: string | null
          createdAt: string
          createdById: string
          description: string | null
          endAt: string
          eventType: string
          id: string
          isPublished: boolean
          location: string | null
          meetingUrl: string | null
          startAt: string
          title: string
          updatedAt: string
        }
        Insert: {
          accessModel?: string
          applicationFormUrl?: string | null
          capacity?: number | null
          chapterId?: string | null
          coverImage?: string | null
          createdAt?: string
          createdById: string
          description?: string | null
          endAt: string
          eventType?: string
          id?: string
          isPublished?: boolean
          location?: string | null
          meetingUrl?: string | null
          startAt: string
          title: string
          updatedAt?: string
        }
        Update: {
          accessModel?: string
          applicationFormUrl?: string | null
          capacity?: number | null
          chapterId?: string | null
          coverImage?: string | null
          createdAt?: string
          createdById?: string
          description?: string | null
          endAt?: string
          eventType?: string
          id?: string
          isPublished?: boolean
          location?: string | null
          meetingUrl?: string | null
          startAt?: string
          title?: string
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "Event_chapterId_fkey"
            columns: ["chapterId"]
            isOneToOne: false
            referencedRelation: "Chapter"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Event_createdById_fkey"
            columns: ["createdById"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      EventRegistration: {
        Row: {
          checkedInAt: string | null
          checkedInById: string | null
          eventId: string
          id: string
          qrToken: string
          registeredAt: string
          status: string
          userId: string
        }
        Insert: {
          checkedInAt?: string | null
          checkedInById?: string | null
          eventId: string
          id?: string
          qrToken?: string | null
          registeredAt?: string
          status?: string
          userId: string
        }
        Update: {
          checkedInAt?: string | null
          checkedInById?: string | null
          eventId?: string
          id?: string
          qrToken?: string
          registeredAt?: string
          status?: string
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "eventregistration_checkedinbyid_fkey"
            columns: ["checkedInById"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "EventRegistration_eventId_fkey"
            columns: ["eventId"]
            isOneToOne: false
            referencedRelation: "Event"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eventregistration_userid_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      RecruiterAccess: {
        Row: {
          acceptedAt: string | null
          acceptedByUserId: string | null
          companyId: string
          grantedAt: string
          grantedById: string
          id: string
          inviteExpiresAt: string | null
          inviteToken: string
          isActive: boolean
          recruiterEmail: string
          revokedAt: string | null
          revokedById: string | null
        }
        Insert: {
          acceptedAt?: string | null
          acceptedByUserId?: string | null
          companyId: string
          grantedAt?: string
          grantedById: string
          id?: string
          inviteExpiresAt?: string | null
          inviteToken: string
          isActive?: boolean
          recruiterEmail: string
          revokedAt?: string | null
          revokedById?: string | null
        }
        Update: {
          acceptedAt?: string | null
          acceptedByUserId?: string | null
          companyId?: string
          grantedAt?: string
          grantedById?: string
          id?: string
          inviteExpiresAt?: string | null
          inviteToken?: string
          isActive?: boolean
          recruiterEmail?: string
          revokedAt?: string | null
          revokedById?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "RecruiterAccess_acceptedByUserId_fkey"
            columns: ["acceptedByUserId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "RecruiterAccess_companyId_fkey"
            columns: ["companyId"]
            isOneToOne: false
            referencedRelation: "Company"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "RecruiterAccess_grantedById_fkey"
            columns: ["grantedById"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "RecruiterAccess_revokedById_fkey"
            columns: ["revokedById"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      Resume: {
        Row: {
          fileName: string
          fileSize: number
          fileUrl: string
          id: string
          parsedData: Json | null
          studentId: string
          uploadedAt: string
        }
        Insert: {
          fileName: string
          fileSize: number
          fileUrl: string
          id?: string
          parsedData?: Json | null
          studentId: string
          uploadedAt: string
        }
        Update: {
          fileName?: string
          fileSize?: number
          fileUrl?: string
          id?: string
          parsedData?: Json | null
          studentId?: string
          uploadedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "Resume_studentId_fkey"
            columns: ["studentId"]
            isOneToOne: true
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      ResumeDownloadLog: {
        Row: {
          downloadedAt: string
          id: string
          recruiterId: string
          studentId: string
        }
        Insert: {
          downloadedAt?: string
          id?: string
          recruiterId: string
          studentId: string
        }
        Update: {
          downloadedAt?: string
          id?: string
          recruiterId?: string
          studentId?: string
        }
        Relationships: [
          {
            foreignKeyName: "ResumeDownloadLog_recruiterId_fkey"
            columns: ["recruiterId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ResumeDownloadLog_studentId_fkey"
            columns: ["studentId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      SavedStudent: {
        Row: {
          createdAt: string
          id: string
          notes: string | null
          recruiterId: string
          savedAt: string
          studentId: string
          updatedAt: string
        }
        Insert: {
          createdAt?: string
          id?: string
          notes?: string | null
          recruiterId: string
          savedAt?: string
          studentId: string
          updatedAt?: string
        }
        Update: {
          createdAt?: string
          id?: string
          notes?: string | null
          recruiterId?: string
          savedAt?: string
          studentId?: string
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "SavedStudent_recruiterId_fkey"
            columns: ["recruiterId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "SavedStudent_studentId_fkey"
            columns: ["studentId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      StudentProfile: {
        Row: {
          approvalStatus: Database["public"]["Enums"]["approval_status"] | null
          approvedById: string | null
          chapterId: string
          consentDate: string | null
          consentRecruiterVisibility: boolean
          createdAt: string
          emailNotificationsEnabled: boolean
          gender: string | null
          graduationYear: number
          isFilled: boolean
          isRecruiterVisible: boolean
          linkedinUrl: string | null
          major: string
          memberId: string | null
          skills: string[] | null
          updatedAt: string
          userId: string
        }
        Insert: {
          approvalStatus?: Database["public"]["Enums"]["approval_status"] | null
          approvedById?: string | null
          chapterId: string
          consentDate?: string | null
          consentRecruiterVisibility?: boolean
          createdAt?: string
          emailNotificationsEnabled?: boolean
          gender?: string | null
          graduationYear: number
          isFilled?: boolean
          isRecruiterVisible?: boolean
          linkedinUrl?: string | null
          major: string
          memberId?: string | null
          skills?: string[] | null
          updatedAt: string
          userId: string
        }
        Update: {
          approvalStatus?: Database["public"]["Enums"]["approval_status"] | null
          approvedById?: string | null
          chapterId?: string
          consentDate?: string | null
          consentRecruiterVisibility?: boolean
          createdAt?: string
          emailNotificationsEnabled?: boolean
          gender?: string | null
          graduationYear?: number
          isFilled?: boolean
          isRecruiterVisible?: boolean
          linkedinUrl?: string | null
          major?: string
          memberId?: string | null
          skills?: string[] | null
          updatedAt?: string
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "StudentProfile_approvedById_fkey"
            columns: ["approvedById"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "StudentProfile_chapterId_fkey"
            columns: ["chapterId"]
            isOneToOne: false
            referencedRelation: "Chapter"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "StudentProfile_userId_fkey"
            columns: ["userId"]
            isOneToOne: true
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      User: {
        Row: {
          createdAt: string
          deactivatedAt: string | null
          email: string
          id: string
          name: string
          phone: string | null
          role: Database["public"]["Enums"]["Role"]
          updatedAt: string
        }
        Insert: {
          createdAt?: string
          deactivatedAt?: string | null
          email: string
          id: string
          name: string
          phone?: string | null
          role?: Database["public"]["Enums"]["Role"]
          updatedAt?: string
        }
        Update: {
          createdAt?: string
          deactivatedAt?: string | null
          email?: string
          id?: string
          name?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["Role"]
          updatedAt?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      bulk_approve_applications: {
        Args: {
          p_application_ids: string[]
          p_approved_by: string
          p_event_id: string
        }
        Returns: Json
      }
      check_is_admin: { Args: never; Returns: boolean }
      current_user_role: { Args: never; Returns: string }
      get_auth_uid: { Args: never; Returns: string }
      get_editor_chapter_id: { Args: { editor_id: string }; Returns: string }
      get_user_role: { Args: { user_id: string }; Returns: string }
    }
    Enums: {
      approval_status: "pending" | "approved" | "rejected"
      EventType: "workshop" | "conference" | "social" | "competition" | "other"
      OKRCategory: "inspire" | "unite" | "empower" | "elevate"
      Role: "member" | "editor" | "admin" | "recruiter"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof DatabaseWithoutInternals, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      approval_status: ["pending", "approved", "rejected"],
      EventType: ["workshop", "conference", "social", "competition", "other"],
      OKRCategory: ["inspire", "unite", "empower", "elevate"],
      Role: ["member", "editor", "admin", "recruiter"],
    },
  },
} as const
