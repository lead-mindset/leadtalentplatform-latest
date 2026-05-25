export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
      chapter: {
        Row: {
          city: string | null
          created_at: string | null
          id: string
          instagram_url: string | null
          latitude: number | null
          location_point: unknown
          longitude: number | null
          name: string
          region: string | null
          university: string
          updated_at: string
        }
        Insert: {
          city?: string | null
          created_at?: string | null
          id: string
          instagram_url?: string | null
          latitude?: number | null
          location_point?: unknown
          longitude?: number | null
          name: string
          region?: string | null
          university: string
          updated_at: string
        }
        Update: {
          city?: string | null
          created_at?: string | null
          id?: string
          instagram_url?: string | null
          latitude?: number | null
          location_point?: unknown
          longitude?: number | null
          name?: string
          region?: string | null
          university?: string
          updated_at?: string
        }
        Relationships: []
      }
      chapter_audit_log: {
        Row: {
          action: string
          actor_user_id: string | null
          chapter_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          metadata: Json
          target_user_id: string | null
        }
        Insert: {
          action: string
          actor_user_id?: string | null
          chapter_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          metadata?: Json
          target_user_id?: string | null
        }
        Update: {
          action?: string
          actor_user_id?: string | null
          chapter_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          metadata?: Json
          target_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chapter_audit_log_actor_user_id_fkey"
            columns: ["actor_user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chapter_audit_log_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapter"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chapter_audit_log_target_user_id_fkey"
            columns: ["target_user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      chapter_membership: {
        Row: {
          approved_by_id: string | null
          chapter_id: string
          created_at: string
          id: string
          joined_at: string | null
          member_id: string | null
          position: string | null
          status: Database["public"]["Enums"]["membership_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          approved_by_id?: string | null
          chapter_id: string
          created_at?: string
          id?: string
          joined_at?: string | null
          member_id?: string | null
          position?: string | null
          status?: Database["public"]["Enums"]["membership_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          approved_by_id?: string | null
          chapter_id?: string
          created_at?: string
          id?: string
          joined_at?: string | null
          member_id?: string | null
          position?: string | null
          status?: Database["public"]["Enums"]["membership_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_chapter_membership_chapter"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapter"
            referencedColumns: ["id"]
          },
        ]
      }
      chapter_permission_grant: {
        Row: {
          chapter_id: string
          created_at: string
          granted_at: string
          granted_by_id: string | null
          id: string
          permission_key: string
          revoke_reason: string | null
          revoked_at: string | null
          revoked_by_id: string | null
          source: string
          source_role_assignment_id: string | null
          user_id: string
        }
        Insert: {
          chapter_id: string
          created_at?: string
          granted_at?: string
          granted_by_id?: string | null
          id?: string
          permission_key: string
          revoke_reason?: string | null
          revoked_at?: string | null
          revoked_by_id?: string | null
          source: string
          source_role_assignment_id?: string | null
          user_id: string
        }
        Update: {
          chapter_id?: string
          created_at?: string
          granted_at?: string
          granted_by_id?: string | null
          id?: string
          permission_key?: string
          revoke_reason?: string | null
          revoked_at?: string | null
          revoked_by_id?: string | null
          source?: string
          source_role_assignment_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chapter_permission_grant_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapter"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chapter_permission_grant_granted_by_id_fkey"
            columns: ["granted_by_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chapter_permission_grant_revoked_by_id_fkey"
            columns: ["revoked_by_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chapter_permission_grant_source_role_assignment_id_fkey"
            columns: ["source_role_assignment_id"]
            isOneToOne: false
            referencedRelation: "chapter_role_assignment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chapter_permission_grant_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      chapter_preapproval: {
        Row: {
          chapter_id: string
          consumed_at: string | null
          consumed_by_user_id: string | null
          created_at: string
          created_by_id: string | null
          display_title: string | null
          email: string
          expires_at: string
          functional_area: string | null
          id: string
          normalized_email: string
          notes: string | null
          preapproval_type: string
          raw_title: string | null
          revoked_at: string | null
          revoked_by_id: string | null
          role_level: string | null
          source: string
          updated_at: string
        }
        Insert: {
          chapter_id: string
          consumed_at?: string | null
          consumed_by_user_id?: string | null
          created_at?: string
          created_by_id?: string | null
          display_title?: string | null
          email: string
          expires_at?: string
          functional_area?: string | null
          id?: string
          normalized_email: string
          notes?: string | null
          preapproval_type: string
          raw_title?: string | null
          revoked_at?: string | null
          revoked_by_id?: string | null
          role_level?: string | null
          source?: string
          updated_at?: string
        }
        Update: {
          chapter_id?: string
          consumed_at?: string | null
          consumed_by_user_id?: string | null
          created_at?: string
          created_by_id?: string | null
          display_title?: string | null
          email?: string
          expires_at?: string
          functional_area?: string | null
          id?: string
          normalized_email?: string
          notes?: string | null
          preapproval_type?: string
          raw_title?: string | null
          revoked_at?: string | null
          revoked_by_id?: string | null
          role_level?: string | null
          source?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chapter_preapproval_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapter"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chapter_preapproval_consumed_by_user_id_fkey"
            columns: ["consumed_by_user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chapter_preapproval_created_by_id_fkey"
            columns: ["created_by_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chapter_preapproval_revoked_by_id_fkey"
            columns: ["revoked_by_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      chapter_role_assignment: {
        Row: {
          assigned_by_id: string | null
          chapter_id: string
          created_at: string
          display_title: string
          ends_at: string | null
          functional_area: string
          id: string
          is_primary: boolean
          raw_title: string | null
          role_level: string
          source: string
          source_preapproval_id: string | null
          starts_at: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_by_id?: string | null
          chapter_id: string
          created_at?: string
          display_title: string
          ends_at?: string | null
          functional_area: string
          id?: string
          is_primary?: boolean
          raw_title?: string | null
          role_level: string
          source?: string
          source_preapproval_id?: string | null
          starts_at?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_by_id?: string | null
          chapter_id?: string
          created_at?: string
          display_title?: string
          ends_at?: string | null
          functional_area?: string
          id?: string
          is_primary?: boolean
          raw_title?: string | null
          role_level?: string
          source?: string
          source_preapproval_id?: string | null
          starts_at?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chapter_role_assignment_assigned_by_id_fkey"
            columns: ["assigned_by_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chapter_role_assignment_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapter"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chapter_role_assignment_source_preapproval_id_fkey"
            columns: ["source_preapproval_id"]
            isOneToOne: false
            referencedRelation: "chapter_preapproval"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chapter_role_assignment_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      company: {
        Row: {
          created_at: string
          created_by_id: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          created_by_id: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          created_by_id?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_created_by_id_fkey"
            columns: ["created_by_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      event: {
        Row: {
          access_model: string
          application_form_url: string | null
          capacity: number | null
          chapter_id: string | null
          cover_image: string | null
          created_at: string
          created_by_id: string
          description: string | null
          end_at: string
          event_type: Database["public"]["Enums"]["EventType"]
          id: string
          is_published: boolean
          location: string | null
          location_address: string | null
          location_city: string | null
          location_latitude: number | null
          location_longitude: number | null
          location_name: string | null
          location_point: unknown
          location_region: string | null
          meeting_url: string | null
          start_at: string
          title: string
          updated_at: string
        }
        Insert: {
          access_model?: string
          application_form_url?: string | null
          capacity?: number | null
          chapter_id?: string | null
          cover_image?: string | null
          created_at?: string
          created_by_id: string
          description?: string | null
          end_at: string
          event_type?: Database["public"]["Enums"]["EventType"]
          id?: string
          is_published?: boolean
          location?: string | null
          location_address?: string | null
          location_city?: string | null
          location_latitude?: number | null
          location_longitude?: number | null
          location_name?: string | null
          location_point?: unknown
          location_region?: string | null
          meeting_url?: string | null
          start_at: string
          title: string
          updated_at?: string
        }
        Update: {
          access_model?: string
          application_form_url?: string | null
          capacity?: number | null
          chapter_id?: string | null
          cover_image?: string | null
          created_at?: string
          created_by_id?: string
          description?: string | null
          end_at?: string
          event_type?: Database["public"]["Enums"]["EventType"]
          id?: string
          is_published?: boolean
          location?: string | null
          location_address?: string | null
          location_city?: string | null
          location_latitude?: number | null
          location_longitude?: number | null
          location_name?: string | null
          location_point?: unknown
          location_region?: string | null
          meeting_url?: string | null
          start_at?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapter"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_created_by_id_fkey"
            columns: ["created_by_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      event_application_answer: {
        Row: {
          answer_json: Json | null
          answer_text: string | null
          created_at: string
          id: string
          question_id: string
          registration_id: string
          updated_at: string
        }
        Insert: {
          answer_json?: Json | null
          answer_text?: string | null
          created_at?: string
          id?: string
          question_id: string
          registration_id: string
          updated_at?: string
        }
        Update: {
          answer_json?: Json | null
          answer_text?: string | null
          created_at?: string
          id?: string
          question_id?: string
          registration_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_event_application_answer_question"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "event_application_question"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_event_application_answer_registration"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "event_registration"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_event_application_answer_registration"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "event_registration_with_event"
            referencedColumns: ["id"]
          },
        ]
      }
      event_application_question: {
        Row: {
          created_at: string
          event_id: string
          id: string
          is_required: boolean
          options: string[] | null
          question_text: string
          question_type: Database["public"]["Enums"]["question_type"]
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          is_required?: boolean
          options?: string[] | null
          question_text: string
          question_type?: Database["public"]["Enums"]["question_type"]
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          is_required?: boolean
          options?: string[] | null
          question_text?: string
          question_type?: Database["public"]["Enums"]["question_type"]
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_event_application_question_event"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_event_application_question_event"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_with_chapter"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_event_application_question_event"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "published_event_listing"
            referencedColumns: ["id"]
          },
        ]
      }
      event_chapter: {
        Row: {
          added_at: string
          added_by_id: string
          chapter_id: string
          event_id: string
          id: string
        }
        Insert: {
          added_at?: string
          added_by_id: string
          chapter_id: string
          event_id: string
          id?: string
        }
        Update: {
          added_at?: string
          added_by_id?: string
          chapter_id?: string
          event_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_chapter_added_by_id_fkey"
            columns: ["added_by_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_chapter_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapter"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_chapter_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_chapter_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_with_chapter"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_chapter_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "published_event_listing"
            referencedColumns: ["id"]
          },
        ]
      }
      event_registration: {
        Row: {
          checked_in_at: string | null
          checked_in_by_id: string | null
          event_id: string
          id: string
          qr_token: string | null
          registered_at: string
          status: string
          user_id: string
        }
        Insert: {
          checked_in_at?: string | null
          checked_in_by_id?: string | null
          event_id: string
          id?: string
          qr_token?: string | null
          registered_at?: string
          status?: string
          user_id: string
        }
        Update: {
          checked_in_at?: string | null
          checked_in_by_id?: string | null
          event_id?: string
          id?: string
          qr_token?: string | null
          registered_at?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_registration_checked_in_by_id_fkey"
            columns: ["checked_in_by_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_registration_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_registration_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_with_chapter"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_registration_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "published_event_listing"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_registration_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      funding_request: {
        Row: {
          accountability_due_at: string | null
          accountability_note: string | null
          accountability_submitted_at: string | null
          actual_spend_amount: number | null
          admin_decision_note: string | null
          approved_amount: number | null
          chapter_id: string
          closed_at: string | null
          closed_by_id: string | null
          closure_note: string | null
          created_at: string
          currency: string
          event_date: string
          event_id: string | null
          expected_attendee_count: number | null
          expected_audience: string
          id: string
          internal_funding_source: string | null
          internal_funding_source_note: string | null
          is_late_request: boolean
          okr_keys: string[]
          partner_details: string | null
          partner_name: string | null
          pillar_keys: string[]
          purpose: string
          requested_amount: number
          requester_user_id: string
          result_summary: string | null
          reviewed_at: string | null
          reviewed_by_id: string | null
          status: string
          submitted_at: string | null
          supporting_notes: string | null
          title: string
          updated_at: string
        }
        Insert: {
          accountability_due_at?: string | null
          accountability_note?: string | null
          accountability_submitted_at?: string | null
          actual_spend_amount?: number | null
          admin_decision_note?: string | null
          approved_amount?: number | null
          chapter_id: string
          closed_at?: string | null
          closed_by_id?: string | null
          closure_note?: string | null
          created_at?: string
          currency?: string
          event_date: string
          event_id?: string | null
          expected_attendee_count?: number | null
          expected_audience: string
          id?: string
          internal_funding_source?: string | null
          internal_funding_source_note?: string | null
          is_late_request?: boolean
          okr_keys?: string[]
          partner_details?: string | null
          partner_name?: string | null
          pillar_keys?: string[]
          purpose: string
          requested_amount: number
          requester_user_id: string
          result_summary?: string | null
          reviewed_at?: string | null
          reviewed_by_id?: string | null
          status?: string
          submitted_at?: string | null
          supporting_notes?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          accountability_due_at?: string | null
          accountability_note?: string | null
          accountability_submitted_at?: string | null
          actual_spend_amount?: number | null
          admin_decision_note?: string | null
          approved_amount?: number | null
          chapter_id?: string
          closed_at?: string | null
          closed_by_id?: string | null
          closure_note?: string | null
          created_at?: string
          currency?: string
          event_date?: string
          event_id?: string | null
          expected_attendee_count?: number | null
          expected_audience?: string
          id?: string
          internal_funding_source?: string | null
          internal_funding_source_note?: string | null
          is_late_request?: boolean
          okr_keys?: string[]
          partner_details?: string | null
          partner_name?: string | null
          pillar_keys?: string[]
          purpose?: string
          requested_amount?: number
          requester_user_id?: string
          result_summary?: string | null
          reviewed_at?: string | null
          reviewed_by_id?: string | null
          status?: string
          submitted_at?: string | null
          supporting_notes?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "funding_request_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapter"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "funding_request_closed_by_id_fkey"
            columns: ["closed_by_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "funding_request_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "funding_request_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_with_chapter"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "funding_request_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "published_event_listing"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "funding_request_requester_user_id_fkey"
            columns: ["requester_user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "funding_request_reviewed_by_id_fkey"
            columns: ["reviewed_by_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      funding_request_budget_item: {
        Row: {
          amount: number
          category: string
          created_at: string
          funding_request_id: string
          id: string
          label: string
          notes: string | null
          sort_order: number
          updated_at: string
        }
        Insert: {
          amount: number
          category?: string
          created_at?: string
          funding_request_id: string
          id?: string
          label: string
          notes?: string | null
          sort_order?: number
          updated_at?: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          funding_request_id?: string
          id?: string
          label?: string
          notes?: string | null
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "funding_request_budget_item_funding_request_id_fkey"
            columns: ["funding_request_id"]
            isOneToOne: false
            referencedRelation: "funding_request"
            referencedColumns: ["id"]
          },
        ]
      }
      funding_request_file: {
        Row: {
          chapter_id: string
          created_at: string
          external_url: string | null
          file_size_bytes: number | null
          file_type: string
          funding_request_id: string
          id: string
          mime_type: string | null
          notes: string | null
          original_name: string | null
          storage_bucket: string
          storage_path: string | null
          uploaded_by_id: string | null
        }
        Insert: {
          chapter_id: string
          created_at?: string
          external_url?: string | null
          file_size_bytes?: number | null
          file_type: string
          funding_request_id: string
          id?: string
          mime_type?: string | null
          notes?: string | null
          original_name?: string | null
          storage_bucket?: string
          storage_path?: string | null
          uploaded_by_id?: string | null
        }
        Update: {
          chapter_id?: string
          created_at?: string
          external_url?: string | null
          file_size_bytes?: number | null
          file_type?: string
          funding_request_id?: string
          id?: string
          mime_type?: string | null
          notes?: string | null
          original_name?: string | null
          storage_bucket?: string
          storage_path?: string | null
          uploaded_by_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "funding_request_file_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapter"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "funding_request_file_funding_request_id_fkey"
            columns: ["funding_request_id"]
            isOneToOne: false
            referencedRelation: "funding_request"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "funding_request_file_uploaded_by_id_fkey"
            columns: ["uploaded_by_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      funding_request_status_event: {
        Row: {
          actor_user_id: string | null
          created_at: string
          from_status: string | null
          funding_request_id: string
          id: string
          metadata: Json
          note: string | null
          to_status: string
        }
        Insert: {
          actor_user_id?: string | null
          created_at?: string
          from_status?: string | null
          funding_request_id: string
          id?: string
          metadata?: Json
          note?: string | null
          to_status: string
        }
        Update: {
          actor_user_id?: string | null
          created_at?: string
          from_status?: string | null
          funding_request_id?: string
          id?: string
          metadata?: Json
          note?: string | null
          to_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "funding_request_status_event_actor_user_id_fkey"
            columns: ["actor_user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "funding_request_status_event_funding_request_id_fkey"
            columns: ["funding_request_id"]
            isOneToOne: false
            referencedRelation: "funding_request"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_identity: {
        Row: {
          chapter_id: string | null
          created_at: string
          id: string
          identity_type: Database["public"]["Enums"]["identity_type"]
          is_primary: boolean
          issued_at: string
          issued_by_id: string | null
          revoked_at: string | null
          status: Database["public"]["Enums"]["identity_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          chapter_id?: string | null
          created_at?: string
          id?: string
          identity_type: Database["public"]["Enums"]["identity_type"]
          is_primary?: boolean
          issued_at?: string
          issued_by_id?: string | null
          revoked_at?: string | null
          status?: Database["public"]["Enums"]["identity_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          chapter_id?: string | null
          created_at?: string
          id?: string
          identity_type?: Database["public"]["Enums"]["identity_type"]
          is_primary?: boolean
          issued_at?: string
          issued_by_id?: string | null
          revoked_at?: string | null
          status?: Database["public"]["Enums"]["identity_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_lead_identity_chapter"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapter"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_subscription: {
        Row: {
          chapter_id: string | null
          created_at: string
          id: string
          scope: Database["public"]["Enums"]["newsletter_scope"]
          source: Database["public"]["Enums"]["subscription_source"]
          status: Database["public"]["Enums"]["newsletter_status"]
          subscribed_at: string
          unsubscribed_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          chapter_id?: string | null
          created_at?: string
          id?: string
          scope?: Database["public"]["Enums"]["newsletter_scope"]
          source?: Database["public"]["Enums"]["subscription_source"]
          status?: Database["public"]["Enums"]["newsletter_status"]
          subscribed_at?: string
          unsubscribed_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          chapter_id?: string | null
          created_at?: string
          id?: string
          scope?: Database["public"]["Enums"]["newsletter_scope"]
          source?: Database["public"]["Enums"]["subscription_source"]
          status?: Database["public"]["Enums"]["newsletter_status"]
          subscribed_at?: string
          unsubscribed_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_newsletter_subscription_chapter"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapter"
            referencedColumns: ["id"]
          },
        ]
      }
      growth_reflection: {
        Row: {
          completed_at: string | null
          created_at: string
          event_id: string | null
          goal_connection: string
          id: string
          learned: string
          next_move: string
          participated_in: string
          recommendation_id: string | null
          skill_or_mindset: string
          status: string
          updated_at: string
          user_id: string
          visibility: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          event_id?: string | null
          goal_connection: string
          id?: string
          learned: string
          next_move: string
          participated_in: string
          recommendation_id?: string | null
          skill_or_mindset: string
          status?: string
          updated_at?: string
          user_id: string
          visibility?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          event_id?: string | null
          goal_connection?: string
          id?: string
          learned?: string
          next_move?: string
          participated_in?: string
          recommendation_id?: string | null
          skill_or_mindset?: string
          status?: string
          updated_at?: string
          user_id?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "growth_reflection_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "growth_reflection_recommendation_id_fkey"
            columns: ["recommendation_id"]
            isOneToOne: false
            referencedRelation: "pathway_recommendation"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "growth_reflection_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      pathway_feature_flag: {
        Row: {
          chapter_id: string | null
          created_at: string
          enable_chapter_insights: boolean
          enable_check_in: boolean
          enable_growth_reflection: boolean
          enable_recommendation_card: boolean
          id: string
          updated_at: string
          updated_by_id: string | null
        }
        Insert: {
          chapter_id?: string | null
          created_at?: string
          enable_chapter_insights?: boolean
          enable_check_in?: boolean
          enable_growth_reflection?: boolean
          enable_recommendation_card?: boolean
          id?: string
          updated_at?: string
          updated_by_id?: string | null
        }
        Update: {
          chapter_id?: string | null
          created_at?: string
          enable_chapter_insights?: boolean
          enable_check_in?: boolean
          enable_growth_reflection?: boolean
          enable_recommendation_card?: boolean
          id?: string
          updated_at?: string
          updated_by_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pathway_feature_flag_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: true
            referencedRelation: "chapter"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pathway_feature_flag_updated_by_id_fkey"
            columns: ["updated_by_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      pathway_check_in: {
        Row: {
          chapter_id: string | null
          confidence_level: number | null
          created_at: string
          current_blocker: string | null
          id: string
          looking_for: string | null
          monthly_time_commitment: string | null
          growth_stage: string | null
          primary_focus: string | null
          status: string
          study_interest: string | null
          submitted_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          chapter_id?: string | null
          confidence_level?: number | null
          created_at?: string
          current_blocker?: string | null
          id?: string
          looking_for?: string | null
          monthly_time_commitment?: string | null
          growth_stage?: string | null
          primary_focus?: string | null
          status?: string
          study_interest?: string | null
          submitted_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          chapter_id?: string | null
          confidence_level?: number | null
          created_at?: string
          current_blocker?: string | null
          id?: string
          looking_for?: string | null
          monthly_time_commitment?: string | null
          growth_stage?: string | null
          primary_focus?: string | null
          status?: string
          study_interest?: string | null
          submitted_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pathway_check_in_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapter"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pathway_check_in_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      pathway_recommendation: {
        Row: {
          body: string
          category: string
          check_in_id: string
          created_at: string
          id: string
          reason: string
          sort_order: number
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          body: string
          category: string
          check_in_id: string
          created_at?: string
          id?: string
          reason: string
          sort_order: number
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string
          category?: string
          check_in_id?: string
          created_at?: string
          id?: string
          reason?: string
          sort_order?: number
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pathway_recommendation_check_in_id_fkey"
            columns: ["check_in_id"]
            isOneToOne: false
            referencedRelation: "pathway_check_in"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pathway_recommendation_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      person_profile: {
        Row: {
          created_at: string
          gender: string | null
          graduation_year: number | null
          id: string
          is_recruiter_visible: boolean | null
          linkedin_url: string | null
          major_or_interest: string | null
          portfolio_url: string | null
          skills: string[] | null
          university: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          gender?: string | null
          graduation_year?: number | null
          id?: string
          is_recruiter_visible?: boolean | null
          linkedin_url?: string | null
          major_or_interest?: string | null
          portfolio_url?: string | null
          skills?: string[] | null
          university?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          gender?: string | null
          graduation_year?: number | null
          id?: string
          is_recruiter_visible?: boolean | null
          linkedin_url?: string | null
          major_or_interest?: string | null
          portfolio_url?: string | null
          skills?: string[] | null
          university?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      recruiter_access: {
        Row: {
          accepted_at: string | null
          accepted_by_user_id: string | null
          company_id: string
          granted_at: string
          granted_by_id: string
          id: string
          invite_expires_at: string | null
          invite_token: string
          is_active: boolean
          recruiter_email: string
          revoked_at: string | null
          revoked_by_id: string | null
        }
        Insert: {
          accepted_at?: string | null
          accepted_by_user_id?: string | null
          company_id: string
          granted_at?: string
          granted_by_id: string
          id?: string
          invite_expires_at?: string | null
          invite_token: string
          is_active?: boolean
          recruiter_email: string
          revoked_at?: string | null
          revoked_by_id?: string | null
        }
        Update: {
          accepted_at?: string | null
          accepted_by_user_id?: string | null
          company_id?: string
          granted_at?: string
          granted_by_id?: string
          id?: string
          invite_expires_at?: string | null
          invite_token?: string
          is_active?: boolean
          recruiter_email?: string
          revoked_at?: string | null
          revoked_by_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recruiter_access_accepted_by_user_id_fkey"
            columns: ["accepted_by_user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recruiter_access_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recruiter_access_granted_by_id_fkey"
            columns: ["granted_by_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recruiter_access_revoked_by_id_fkey"
            columns: ["revoked_by_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      resume: {
        Row: {
          file_name: string
          file_size: number
          file_url: string
          id: string
          parsed_data: Json | null
          student_id: string
          uploaded_at: string
        }
        Insert: {
          file_name: string
          file_size: number
          file_url: string
          id?: string
          parsed_data?: Json | null
          student_id: string
          uploaded_at: string
        }
        Update: {
          file_name?: string
          file_size?: number
          file_url?: string
          id?: string
          parsed_data?: Json | null
          student_id?: string
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "resume_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: true
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      resume_download_log: {
        Row: {
          downloaded_at: string
          id: string
          recruiter_id: string
          student_id: string
        }
        Insert: {
          downloaded_at?: string
          id?: string
          recruiter_id: string
          student_id: string
        }
        Update: {
          downloaded_at?: string
          id?: string
          recruiter_id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "resume_download_log_recruiter_id_fkey"
            columns: ["recruiter_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resume_download_log_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_student: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          recruiter_id: string
          saved_at: string
          student_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          recruiter_id: string
          saved_at?: string
          student_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          recruiter_id?: string
          saved_at?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_student_recruiter_id_fkey"
            columns: ["recruiter_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_student_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      spatial_ref_sys: {
        Row: {
          auth_name: string | null
          auth_srid: number | null
          proj4text: string | null
          srid: number
          srtext: string | null
        }
        Insert: {
          auth_name?: string | null
          auth_srid?: number | null
          proj4text?: string | null
          srid: number
          srtext?: string | null
        }
        Update: {
          auth_name?: string | null
          auth_srid?: number | null
          proj4text?: string | null
          srid?: number
          srtext?: string | null
        }
        Relationships: []
      }
      student_profile: {
        Row: {
          approval_status: Database["public"]["Enums"]["approval_status"] | null
          approved_by_id: string | null
          chapter_id: string
          consent_date: string | null
          consent_recruiter_visibility: boolean
          created_at: string
          email_notifications_enabled: boolean
          gender: string | null
          graduation_year: number
          is_filled: boolean
          is_recruiter_visible: boolean
          linkedin_url: string | null
          major: string
          member_id: string | null
          skills: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          approval_status?:
            | Database["public"]["Enums"]["approval_status"]
            | null
          approved_by_id?: string | null
          chapter_id: string
          consent_date?: string | null
          consent_recruiter_visibility?: boolean
          created_at?: string
          email_notifications_enabled?: boolean
          gender?: string | null
          graduation_year: number
          is_filled?: boolean
          is_recruiter_visible?: boolean
          linkedin_url?: string | null
          major: string
          member_id?: string | null
          skills?: string[] | null
          updated_at: string
          user_id: string
        }
        Update: {
          approval_status?:
            | Database["public"]["Enums"]["approval_status"]
            | null
          approved_by_id?: string | null
          chapter_id?: string
          consent_date?: string | null
          consent_recruiter_visibility?: boolean
          created_at?: string
          email_notifications_enabled?: boolean
          gender?: string | null
          graduation_year?: number
          is_filled?: boolean
          is_recruiter_visible?: boolean
          linkedin_url?: string | null
          major?: string
          member_id?: string | null
          skills?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_profile_approved_by_id_fkey"
            columns: ["approved_by_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_profile_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapter"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_profile_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      user: {
        Row: {
          created_at: string
          deactivated_at: string | null
          email: string
          id: string
          name: string | null
          phone: string | null
          role: Database["public"]["Enums"]["Role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          deactivated_at?: string | null
          email: string
          id: string
          name?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["Role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          deactivated_at?: string | null
          email?: string
          id?: string
          name?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["Role"]
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      event_registration_with_event: {
        Row: {
          checked_in_at: string | null
          checked_in_by_id: string | null
          event_access_model: string | null
          event_capacity: number | null
          event_chapter_id: string | null
          event_description: string | null
          event_end_at: string | null
          event_id: string | null
          event_is_published: boolean | null
          event_location: string | null
          event_meeting_url: string | null
          event_start_at: string | null
          event_title: string | null
          event_type: Database["public"]["Enums"]["EventType"] | null
          id: string | null
          qr_token: string | null
          registered_at: string | null
          status: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_chapter_id_fkey"
            columns: ["event_chapter_id"]
            isOneToOne: false
            referencedRelation: "chapter"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_registration_checked_in_by_id_fkey"
            columns: ["checked_in_by_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_registration_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_registration_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_with_chapter"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_registration_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "published_event_listing"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_registration_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      event_with_chapter: {
        Row: {
          access_model: string | null
          application_form_url: string | null
          capacity: number | null
          chapter_city: string | null
          chapter_id: string | null
          chapter_name: string | null
          chapter_region: string | null
          chapter_university: string | null
          cover_image: string | null
          created_at: string | null
          created_by_id: string | null
          description: string | null
          end_at: string | null
          event_type: Database["public"]["Enums"]["EventType"] | null
          id: string | null
          is_published: boolean | null
          location: string | null
          meeting_url: string | null
          start_at: string | null
          title: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapter"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_created_by_id_fkey"
            columns: ["created_by_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      geography_columns: {
        Row: {
          coord_dimension: number | null
          f_geography_column: unknown
          f_table_catalog: unknown
          f_table_name: unknown
          f_table_schema: unknown
          srid: number | null
          type: string | null
        }
        Relationships: []
      }
      geometry_columns: {
        Row: {
          coord_dimension: number | null
          f_geometry_column: unknown
          f_table_catalog: string | null
          f_table_name: unknown
          f_table_schema: unknown
          srid: number | null
          type: string | null
        }
        Insert: {
          coord_dimension?: number | null
          f_geometry_column?: unknown
          f_table_catalog?: string | null
          f_table_name?: unknown
          f_table_schema?: unknown
          srid?: number | null
          type?: string | null
        }
        Update: {
          coord_dimension?: number | null
          f_geometry_column?: unknown
          f_table_catalog?: string | null
          f_table_name?: unknown
          f_table_schema?: unknown
          srid?: number | null
          type?: string | null
        }
        Relationships: []
      }
      published_event_listing: {
        Row: {
          access_model: string | null
          application_form_url: string | null
          capacity: number | null
          chapter_city: string | null
          chapter_id: string | null
          chapter_name: string | null
          chapter_region: string | null
          chapter_university: string | null
          cover_image: string | null
          created_at: string | null
          created_by_id: string | null
          description: string | null
          end_at: string | null
          event_type: Database["public"]["Enums"]["EventType"] | null
          id: string | null
          is_published: boolean | null
          location: string | null
          location_address: string | null
          location_city: string | null
          location_latitude: number | null
          location_longitude: number | null
          location_name: string | null
          location_region: string | null
          meeting_url: string | null
          registrations_count: number | null
          start_at: string | null
          title: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapter"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_created_by_id_fkey"
            columns: ["created_by_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      _postgis_deprecate: {
        Args: { newname: string; oldname: string; version: string }
        Returns: undefined
      }
      _postgis_index_extent: {
        Args: { col: string; tbl: unknown }
        Returns: unknown
      }
      _postgis_pgsql_version: { Args: never; Returns: string }
      _postgis_scripts_pgsql_version: { Args: never; Returns: string }
      _postgis_selectivity: {
        Args: { att_name: string; geom: unknown; mode?: string; tbl: unknown }
        Returns: number
      }
      _postgis_stats: {
        Args: { ""?: string; att_name: string; tbl: unknown }
        Returns: string
      }
      _st_3dintersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_containsproperly: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_coveredby:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_covers:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_crosses: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_dwithin: {
        Args: {
          geog1: unknown
          geog2: unknown
          tolerance: number
          use_spheroid?: boolean
        }
        Returns: boolean
      }
      _st_equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_intersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_linecrossingdirection: {
        Args: { line1: unknown; line2: unknown }
        Returns: number
      }
      _st_longestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      _st_maxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      _st_orderingequals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_sortablehash: { Args: { geom: unknown }; Returns: number }
      _st_touches: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_voronoi: {
        Args: {
          clip?: unknown
          g1: unknown
          return_polygons?: boolean
          tolerance?: number
        }
        Returns: unknown
      }
      _st_within: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      addauth: { Args: { "": string }; Returns: boolean }
      addgeometrycolumn:
        | {
            Args: {
              catalog_name: string
              column_name: string
              new_dim: number
              new_srid_in: number
              new_type: string
              schema_name: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              new_dim: number
              new_srid: number
              new_type: string
              schema_name: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              new_dim: number
              new_srid: number
              new_type: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
      bulk_approve_applications: {
        Args: {
          p_application_ids: string[]
          p_approved_by: string
          p_event_id: string
        }
        Returns: Json
      }
      can_access_event_with_permission: {
        Args: { check_event_id: string; check_permission_key: string }
        Returns: boolean
      }
      can_access_funding_file_object: {
        Args: { check_permission_key: string; object_name: string }
        Returns: boolean
      }
      can_access_funding_request: {
        Args: { check_permission_key: string; check_request_id: string }
        Returns: boolean
      }
      can_access_resume_object: {
        Args: { object_name: string }
        Returns: boolean
      }
      can_upload_event_cover: { Args: never; Returns: boolean }
      check_is_admin: { Args: never; Returns: boolean }
      current_user_role: { Args: never; Returns: string }
      disablelongtransactions: { Args: never; Returns: string }
      dropgeometrycolumn:
        | {
            Args: {
              catalog_name: string
              column_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | { Args: { column_name: string; table_name: string }; Returns: string }
      dropgeometrytable:
        | {
            Args: {
              catalog_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | { Args: { schema_name: string; table_name: string }; Returns: string }
        | { Args: { table_name: string }; Returns: string }
      enablelongtransactions: { Args: never; Returns: string }
      equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      geometry: { Args: { "": string }; Returns: unknown }
      geometry_above: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_below: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_cmp: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_contained_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_contains_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_distance_box: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_distance_centroid: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_eq: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_ge: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_gt: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_le: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_left: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_lt: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overabove: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overbelow: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overlaps_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overleft: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overright: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_right: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_same: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_same_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_within: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geomfromewkt: { Args: { "": string }; Returns: unknown }
      get_auth_uid: { Args: never; Returns: string }
      get_event_chapter_id: {
        Args: { check_event_id: string }
        Returns: string
      }
      get_my_chapter_id: { Args: never; Returns: string }
      get_question_chapter_id: {
        Args: { check_question_id: string }
        Returns: string
      }
      get_user_role: { Args: { user_id: string }; Returns: string }
      gettransactionid: { Args: never; Returns: unknown }
      has_chapter_permission: {
        Args: { check_chapter_id: string; check_permission_key: string }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      is_chapter_editor: {
        Args: { check_chapter_id: string }
        Returns: boolean
      }
      is_event_editor:
        | { Args: { event_uuid: string }; Returns: boolean }
        | { Args: { p_event_id: string; p_user_id: string }; Returns: boolean }
      is_recruiter: { Args: never; Returns: boolean }
      longtransactionsenabled: { Args: never; Returns: boolean }
      populate_geometry_columns:
        | { Args: { tbl_oid: unknown; use_typmod?: boolean }; Returns: number }
        | { Args: { use_typmod?: boolean }; Returns: string }
      postgis_constraint_dims: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: number
      }
      postgis_constraint_srid: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: number
      }
      postgis_constraint_type: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: string
      }
      postgis_extensions_upgrade: { Args: never; Returns: string }
      postgis_full_version: { Args: never; Returns: string }
      postgis_geos_version: { Args: never; Returns: string }
      postgis_lib_build_date: { Args: never; Returns: string }
      postgis_lib_revision: { Args: never; Returns: string }
      postgis_lib_version: { Args: never; Returns: string }
      postgis_libjson_version: { Args: never; Returns: string }
      postgis_liblwgeom_version: { Args: never; Returns: string }
      postgis_libprotobuf_version: { Args: never; Returns: string }
      postgis_libxml_version: { Args: never; Returns: string }
      postgis_proj_version: { Args: never; Returns: string }
      postgis_scripts_build_date: { Args: never; Returns: string }
      postgis_scripts_installed: { Args: never; Returns: string }
      postgis_scripts_released: { Args: never; Returns: string }
      postgis_svn_version: { Args: never; Returns: string }
      postgis_type_name: {
        Args: {
          coord_dimension: number
          geomname: string
          use_new_name?: boolean
        }
        Returns: string
      }
      postgis_version: { Args: never; Returns: string }
      postgis_wagyu_version: { Args: never; Returns: string }
      st_3dclosestpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3ddistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_3dintersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_3dlongestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3dmakebox: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3dmaxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_3dshortestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_addpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_angle:
        | { Args: { line1: unknown; line2: unknown }; Returns: number }
        | {
            Args: { pt1: unknown; pt2: unknown; pt3: unknown; pt4?: unknown }
            Returns: number
          }
      st_area:
        | { Args: { geog: unknown; use_spheroid?: boolean }; Returns: number }
        | { Args: { "": string }; Returns: number }
      st_asencodedpolyline: {
        Args: { geom: unknown; nprecision?: number }
        Returns: string
      }
      st_asewkt: { Args: { "": string }; Returns: string }
      st_asgeojson:
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | {
            Args: {
              geom_column?: string
              maxdecimaldigits?: number
              pretty_bool?: boolean
              r: Record<string, unknown>
            }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_asgml:
        | {
            Args: {
              geog: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
            }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
        | {
            Args: {
              geog: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
              version: number
            }
            Returns: string
          }
        | {
            Args: {
              geom: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
              version: number
            }
            Returns: string
          }
      st_askml:
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; nprefix?: string }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; nprefix?: string }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_aslatlontext: {
        Args: { geom: unknown; tmpl?: string }
        Returns: string
      }
      st_asmarc21: { Args: { format?: string; geom: unknown }; Returns: string }
      st_asmvtgeom: {
        Args: {
          bounds: unknown
          buffer?: number
          clip_geom?: boolean
          extent?: number
          geom: unknown
        }
        Returns: unknown
      }
      st_assvg:
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; rel?: number }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; rel?: number }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_astext: { Args: { "": string }; Returns: string }
      st_astwkb:
        | {
            Args: {
              geom: unknown
              prec?: number
              prec_m?: number
              prec_z?: number
              with_boxes?: boolean
              with_sizes?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              geom: unknown[]
              ids: number[]
              prec?: number
              prec_m?: number
              prec_z?: number
              with_boxes?: boolean
              with_sizes?: boolean
            }
            Returns: string
          }
      st_asx3d: {
        Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
        Returns: string
      }
      st_azimuth:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: number }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
      st_boundingdiagonal: {
        Args: { fits?: boolean; geom: unknown }
        Returns: unknown
      }
      st_buffer:
        | {
            Args: { geom: unknown; options?: string; radius: number }
            Returns: unknown
          }
        | {
            Args: { geom: unknown; quadsegs: number; radius: number }
            Returns: unknown
          }
      st_centroid: { Args: { "": string }; Returns: unknown }
      st_clipbybox2d: {
        Args: { box: unknown; geom: unknown }
        Returns: unknown
      }
      st_closestpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_collect: { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
      st_concavehull: {
        Args: {
          param_allow_holes?: boolean
          param_geom: unknown
          param_pctconvex: number
        }
        Returns: unknown
      }
      st_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_containsproperly: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_coorddim: { Args: { geometry: unknown }; Returns: number }
      st_coveredby:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_covers:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_crosses: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_curvetoline: {
        Args: { flags?: number; geom: unknown; tol?: number; toltype?: number }
        Returns: unknown
      }
      st_delaunaytriangles: {
        Args: { flags?: number; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_difference: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_disjoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_distance:
        | {
            Args: { geog1: unknown; geog2: unknown; use_spheroid?: boolean }
            Returns: number
          }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
      st_distancesphere:
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
        | {
            Args: { geom1: unknown; geom2: unknown; radius: number }
            Returns: number
          }
      st_distancespheroid: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_dwithin: {
        Args: {
          geog1: unknown
          geog2: unknown
          tolerance: number
          use_spheroid?: boolean
        }
        Returns: boolean
      }
      st_equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_expand:
        | { Args: { box: unknown; dx: number; dy: number }; Returns: unknown }
        | {
            Args: { box: unknown; dx: number; dy: number; dz?: number }
            Returns: unknown
          }
        | {
            Args: {
              dm?: number
              dx: number
              dy: number
              dz?: number
              geom: unknown
            }
            Returns: unknown
          }
      st_force3d: { Args: { geom: unknown; zvalue?: number }; Returns: unknown }
      st_force3dm: {
        Args: { geom: unknown; mvalue?: number }
        Returns: unknown
      }
      st_force3dz: {
        Args: { geom: unknown; zvalue?: number }
        Returns: unknown
      }
      st_force4d: {
        Args: { geom: unknown; mvalue?: number; zvalue?: number }
        Returns: unknown
      }
      st_generatepoints:
        | { Args: { area: unknown; npoints: number }; Returns: unknown }
        | {
            Args: { area: unknown; npoints: number; seed: number }
            Returns: unknown
          }
      st_geogfromtext: { Args: { "": string }; Returns: unknown }
      st_geographyfromtext: { Args: { "": string }; Returns: unknown }
      st_geohash:
        | { Args: { geog: unknown; maxchars?: number }; Returns: string }
        | { Args: { geom: unknown; maxchars?: number }; Returns: string }
      st_geomcollfromtext: { Args: { "": string }; Returns: unknown }
      st_geometricmedian: {
        Args: {
          fail_if_not_converged?: boolean
          g: unknown
          max_iter?: number
          tolerance?: number
        }
        Returns: unknown
      }
      st_geometryfromtext: { Args: { "": string }; Returns: unknown }
      st_geomfromewkt: { Args: { "": string }; Returns: unknown }
      st_geomfromgeojson:
        | { Args: { "": Json }; Returns: unknown }
        | { Args: { "": Json }; Returns: unknown }
        | { Args: { "": string }; Returns: unknown }
      st_geomfromgml: { Args: { "": string }; Returns: unknown }
      st_geomfromkml: { Args: { "": string }; Returns: unknown }
      st_geomfrommarc21: { Args: { marc21xml: string }; Returns: unknown }
      st_geomfromtext: { Args: { "": string }; Returns: unknown }
      st_gmltosql: { Args: { "": string }; Returns: unknown }
      st_hasarc: { Args: { geometry: unknown }; Returns: boolean }
      st_hausdorffdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_hexagon: {
        Args: { cell_i: number; cell_j: number; origin?: unknown; size: number }
        Returns: unknown
      }
      st_hexagongrid: {
        Args: { bounds: unknown; size: number }
        Returns: Record<string, unknown>[]
      }
      st_interpolatepoint: {
        Args: { line: unknown; point: unknown }
        Returns: number
      }
      st_intersection: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_intersects:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_isvaliddetail: {
        Args: { flags?: number; geom: unknown }
        Returns: Database["public"]["CompositeTypes"]["valid_detail"]
        SetofOptions: {
          from: "*"
          to: "valid_detail"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      st_length:
        | { Args: { geog: unknown; use_spheroid?: boolean }; Returns: number }
        | { Args: { "": string }; Returns: number }
      st_letters: { Args: { font?: Json; letters: string }; Returns: unknown }
      st_linecrossingdirection: {
        Args: { line1: unknown; line2: unknown }
        Returns: number
      }
      st_linefromencodedpolyline: {
        Args: { nprecision?: number; txtin: string }
        Returns: unknown
      }
      st_linefromtext: { Args: { "": string }; Returns: unknown }
      st_linelocatepoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_linetocurve: { Args: { geometry: unknown }; Returns: unknown }
      st_locatealong: {
        Args: { geometry: unknown; leftrightoffset?: number; measure: number }
        Returns: unknown
      }
      st_locatebetween: {
        Args: {
          frommeasure: number
          geometry: unknown
          leftrightoffset?: number
          tomeasure: number
        }
        Returns: unknown
      }
      st_locatebetweenelevations: {
        Args: { fromelevation: number; geometry: unknown; toelevation: number }
        Returns: unknown
      }
      st_longestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makebox2d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makeline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makevalid: {
        Args: { geom: unknown; params: string }
        Returns: unknown
      }
      st_maxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_minimumboundingcircle: {
        Args: { inputgeom: unknown; segs_per_quarter?: number }
        Returns: unknown
      }
      st_mlinefromtext: { Args: { "": string }; Returns: unknown }
      st_mpointfromtext: { Args: { "": string }; Returns: unknown }
      st_mpolyfromtext: { Args: { "": string }; Returns: unknown }
      st_multilinestringfromtext: { Args: { "": string }; Returns: unknown }
      st_multipointfromtext: { Args: { "": string }; Returns: unknown }
      st_multipolygonfromtext: { Args: { "": string }; Returns: unknown }
      st_node: { Args: { g: unknown }; Returns: unknown }
      st_normalize: { Args: { geom: unknown }; Returns: unknown }
      st_offsetcurve: {
        Args: { distance: number; line: unknown; params?: string }
        Returns: unknown
      }
      st_orderingequals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_perimeter: {
        Args: { geog: unknown; use_spheroid?: boolean }
        Returns: number
      }
      st_pointfromtext: { Args: { "": string }; Returns: unknown }
      st_pointm: {
        Args: {
          mcoordinate: number
          srid?: number
          xcoordinate: number
          ycoordinate: number
        }
        Returns: unknown
      }
      st_pointz: {
        Args: {
          srid?: number
          xcoordinate: number
          ycoordinate: number
          zcoordinate: number
        }
        Returns: unknown
      }
      st_pointzm: {
        Args: {
          mcoordinate: number
          srid?: number
          xcoordinate: number
          ycoordinate: number
          zcoordinate: number
        }
        Returns: unknown
      }
      st_polyfromtext: { Args: { "": string }; Returns: unknown }
      st_polygonfromtext: { Args: { "": string }; Returns: unknown }
      st_project: {
        Args: { azimuth: number; distance: number; geog: unknown }
        Returns: unknown
      }
      st_quantizecoordinates: {
        Args: {
          g: unknown
          prec_m?: number
          prec_x: number
          prec_y?: number
          prec_z?: number
        }
        Returns: unknown
      }
      st_reduceprecision: {
        Args: { geom: unknown; gridsize: number }
        Returns: unknown
      }
      st_relate: { Args: { geom1: unknown; geom2: unknown }; Returns: string }
      st_removerepeatedpoints: {
        Args: { geom: unknown; tolerance?: number }
        Returns: unknown
      }
      st_segmentize: {
        Args: { geog: unknown; max_segment_length: number }
        Returns: unknown
      }
      st_setsrid:
        | { Args: { geog: unknown; srid: number }; Returns: unknown }
        | { Args: { geom: unknown; srid: number }; Returns: unknown }
      st_sharedpaths: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_shortestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_simplifypolygonhull: {
        Args: { geom: unknown; is_outer?: boolean; vertex_fraction: number }
        Returns: unknown
      }
      st_split: { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
      st_square: {
        Args: { cell_i: number; cell_j: number; origin?: unknown; size: number }
        Returns: unknown
      }
      st_squaregrid: {
        Args: { bounds: unknown; size: number }
        Returns: Record<string, unknown>[]
      }
      st_srid:
        | { Args: { geog: unknown }; Returns: number }
        | { Args: { geom: unknown }; Returns: number }
      st_subdivide: {
        Args: { geom: unknown; gridsize?: number; maxvertices?: number }
        Returns: unknown[]
      }
      st_swapordinates: {
        Args: { geom: unknown; ords: unknown }
        Returns: unknown
      }
      st_symdifference: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_symmetricdifference: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_tileenvelope: {
        Args: {
          bounds?: unknown
          margin?: number
          x: number
          y: number
          zoom: number
        }
        Returns: unknown
      }
      st_touches: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_transform:
        | {
            Args: { from_proj: string; geom: unknown; to_proj: string }
            Returns: unknown
          }
        | {
            Args: { from_proj: string; geom: unknown; to_srid: number }
            Returns: unknown
          }
        | { Args: { geom: unknown; to_proj: string }; Returns: unknown }
      st_triangulatepolygon: { Args: { g1: unknown }; Returns: unknown }
      st_union:
        | { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
        | {
            Args: { geom1: unknown; geom2: unknown; gridsize: number }
            Returns: unknown
          }
      st_voronoilines: {
        Args: { extend_to?: unknown; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_voronoipolygons: {
        Args: { extend_to?: unknown; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_within: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_wkbtosql: { Args: { wkb: string }; Returns: unknown }
      st_wkttosql: { Args: { "": string }; Returns: unknown }
      st_wrapx: {
        Args: { geom: unknown; move: number; wrap: number }
        Returns: unknown
      }
      unlockrows: { Args: { "": string }; Returns: number }
      updategeometrysrid: {
        Args: {
          catalogn_name: string
          column_name: string
          new_srid_in: number
          schema_name: string
          table_name: string
        }
        Returns: string
      }
    }
    Enums: {
      approval_status: "pending" | "approved" | "rejected"
      EventType: "in_person" | "online" | "hybrid"
      identity_status: "active" | "revoked"
      identity_type:
        | "founder"
        | "staff"
        | "chapter_editor"
        | "chapter_member"
        | "alumni"
      membership_status:
        | "pending"
        | "approved"
        | "rejected"
        | "inactive"
        | "alumni"
      newsletter_scope: "global" | "chapter"
      newsletter_status: "active" | "inactive" | "unsubscribed"
      OKRCategory: "inspire" | "unite" | "empower" | "elevate"
      question_type:
        | "short_text"
        | "long_text"
        | "single_select"
        | "checkbox"
        | "url"
      Role: "member" | "editor" | "admin" | "recruiter"
      subscription_source: "onboarding" | "event_registration" | "manual"
    }
    CompositeTypes: {
      geometry_dump: {
        path: number[] | null
        geom: unknown
      }
      valid_detail: {
        valid: boolean | null
        reason: string | null
        location: unknown
      }
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

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
      EventType: ["in_person", "online", "hybrid"],
      identity_status: ["active", "revoked"],
      identity_type: [
        "founder",
        "staff",
        "chapter_editor",
        "chapter_member",
        "alumni",
      ],
      membership_status: [
        "pending",
        "approved",
        "rejected",
        "inactive",
        "alumni",
      ],
      newsletter_scope: ["global", "chapter"],
      newsletter_status: ["active", "inactive", "unsubscribed"],
      OKRCategory: ["inspire", "unite", "empower", "elevate"],
      question_type: [
        "short_text",
        "long_text",
        "single_select",
        "checkbox",
        "url",
      ],
      Role: ["member", "editor", "admin", "recruiter"],
      subscription_source: ["onboarding", "event_registration", "manual"],
    },
  },
} as const

