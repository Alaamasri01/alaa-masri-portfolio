// Database types for the Pickly schema (supabase/migrations).
// Shape matches `supabase gen types typescript`; regenerate with `npm run db:types` once a
// Supabase project is linked, and keep this file in sync with every migration.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          phone: string | null;
          preferred_locale: Database["public"]["Enums"]["app_locale"];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string;
          phone?: string | null;
          preferred_locale?: Database["public"]["Enums"]["app_locale"];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          phone?: string | null;
          preferred_locale?: Database["public"]["Enums"]["app_locale"];
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
        ];
      };
      platform_owners: {
        Row: {
          profile_id: string;
          created_at: string;
        };
        Insert: {
          profile_id: string;
          created_at?: string;
        };
        Update: {
          profile_id?: string;
          created_at?: string;
        };
        Relationships: [
        ];
      };
      schools: {
        Row: {
          id: string;
          slug: string;
          name_ar: string;
          name_en: string;
          city: string | null;
          country_code: string;
          timezone: string;
          default_locale: Database["public"]["Enums"]["app_locale"];
          is_active: boolean;
          deactivated_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name_ar: string;
          name_en: string;
          city?: string | null;
          country_code?: string;
          timezone?: string;
          default_locale?: Database["public"]["Enums"]["app_locale"];
          is_active?: boolean;
          deactivated_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          name_ar?: string;
          name_en?: string;
          city?: string | null;
          country_code?: string;
          timezone?: string;
          default_locale?: Database["public"]["Enums"]["app_locale"];
          is_active?: boolean;
          deactivated_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
        ];
      };
      school_settings: {
        Row: {
          school_id: string;
          dismissal_start: string;
          dismissal_end: string;
          allow_parent_on_the_way: boolean;
          allow_parent_arrival: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          school_id: string;
          dismissal_start?: string;
          dismissal_end?: string;
          allow_parent_on_the_way?: boolean;
          allow_parent_arrival?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          school_id?: string;
          dismissal_start?: string;
          dismissal_end?: string;
          allow_parent_on_the_way?: boolean;
          allow_parent_arrival?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
        ];
      };
      school_branches: {
        Row: {
          id: string;
          school_id: string;
          name_ar: string;
          name_en: string;
          address: string | null;
          is_main: boolean;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          school_id: string;
          name_ar: string;
          name_en: string;
          address?: string | null;
          is_main?: boolean;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          school_id?: string;
          name_ar?: string;
          name_en?: string;
          address?: string | null;
          is_main?: boolean;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
        ];
      };
      school_members: {
        Row: {
          id: string;
          school_id: string;
          profile_id: string;
          role: Database["public"]["Enums"]["member_role"];
          branch_id: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          school_id: string;
          profile_id: string;
          role: Database["public"]["Enums"]["member_role"];
          branch_id?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          school_id?: string;
          profile_id?: string;
          role?: Database["public"]["Enums"]["member_role"];
          branch_id?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "school_members_school_id_fkey";
            columns: ["school_id"];
            isOneToOne: false;
            referencedRelation: "schools";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "school_members_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      classes: {
        Row: {
          id: string;
          school_id: string;
          branch_id: string;
          name_ar: string;
          name_en: string;
          grade_level: number | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          school_id: string;
          branch_id: string;
          name_ar: string;
          name_en: string;
          grade_level?: number | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          school_id?: string;
          branch_id?: string;
          name_ar?: string;
          name_en?: string;
          grade_level?: number | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "classes_school_id_branch_id_fkey";
            columns: ["school_id", "branch_id"];
            isOneToOne: false;
            referencedRelation: "school_branches";
            referencedColumns: ["school_id", "id"];
          },
        ];
      };
      teacher_classes: {
        Row: {
          id: string;
          school_id: string;
          member_id: string;
          class_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          school_id: string;
          member_id: string;
          class_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          school_id?: string;
          member_id?: string;
          class_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "teacher_classes_school_id_member_id_fkey";
            columns: ["school_id", "member_id"];
            isOneToOne: false;
            referencedRelation: "school_members";
            referencedColumns: ["school_id", "id"];
          },
          {
            foreignKeyName: "teacher_classes_school_id_class_id_fkey";
            columns: ["school_id", "class_id"];
            isOneToOne: false;
            referencedRelation: "classes";
            referencedColumns: ["school_id", "id"];
          },
        ];
      };
      students: {
        Row: {
          id: string;
          school_id: string;
          branch_id: string;
          class_id: string | null;
          student_number: string;
          full_name_ar: string;
          full_name_en: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          school_id: string;
          branch_id: string;
          class_id?: string | null;
          student_number: string;
          full_name_ar: string;
          full_name_en: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          school_id?: string;
          branch_id?: string;
          class_id?: string | null;
          student_number?: string;
          full_name_ar?: string;
          full_name_en?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "students_school_id_class_id_fkey";
            columns: ["school_id", "class_id"];
            isOneToOne: false;
            referencedRelation: "classes";
            referencedColumns: ["school_id", "id"];
          },
          {
            foreignKeyName: "students_school_id_fkey";
            columns: ["school_id"];
            isOneToOne: false;
            referencedRelation: "schools";
            referencedColumns: ["id"];
          },
        ];
      };
      parents: {
        Row: {
          id: string;
          school_id: string;
          profile_id: string | null;
          full_name_ar: string;
          full_name_en: string;
          phone: string | null;
          email: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          school_id: string;
          profile_id?: string | null;
          full_name_ar: string;
          full_name_en: string;
          phone?: string | null;
          email?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          school_id?: string;
          profile_id?: string | null;
          full_name_ar?: string;
          full_name_en?: string;
          phone?: string | null;
          email?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "parents_school_id_fkey";
            columns: ["school_id"];
            isOneToOne: false;
            referencedRelation: "schools";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "parents_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      parent_students: {
        Row: {
          id: string;
          school_id: string;
          parent_id: string;
          student_id: string;
          relationship: Database["public"]["Enums"]["guardian_relationship"];
          can_request_pickup: boolean;
          is_primary: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          school_id: string;
          parent_id: string;
          student_id: string;
          relationship?: Database["public"]["Enums"]["guardian_relationship"];
          can_request_pickup?: boolean;
          is_primary?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          school_id?: string;
          parent_id?: string;
          student_id?: string;
          relationship?: Database["public"]["Enums"]["guardian_relationship"];
          can_request_pickup?: boolean;
          is_primary?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "parent_students_school_id_parent_id_fkey";
            columns: ["school_id", "parent_id"];
            isOneToOne: false;
            referencedRelation: "parents";
            referencedColumns: ["school_id", "id"];
          },
          {
            foreignKeyName: "parent_students_school_id_student_id_fkey";
            columns: ["school_id", "student_id"];
            isOneToOne: false;
            referencedRelation: "students";
            referencedColumns: ["school_id", "id"];
          },
        ];
      };
      pickup_requests: {
        Row: {
          id: string;
          school_id: string;
          branch_id: string;
          student_id: string;
          class_id: string | null;
          requested_by_parent_id: string | null;
          requested_by_profile_id: string | null;
          status: Database["public"]["Enums"]["pickup_status"];
          status_changed_at: string;
          status_changed_by: string | null;
          pickup_date: string;
          note: string | null;
          collected_at: string | null;
          cancelled_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          school_id: string;
          branch_id: string;
          student_id: string;
          class_id?: string | null;
          requested_by_parent_id?: string | null;
          requested_by_profile_id?: string | null;
          status?: Database["public"]["Enums"]["pickup_status"];
          status_changed_at?: string;
          status_changed_by?: string | null;
          pickup_date: string;
          note?: string | null;
          collected_at?: string | null;
          cancelled_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          school_id?: string;
          branch_id?: string;
          student_id?: string;
          class_id?: string | null;
          requested_by_parent_id?: string | null;
          requested_by_profile_id?: string | null;
          status?: Database["public"]["Enums"]["pickup_status"];
          status_changed_at?: string;
          status_changed_by?: string | null;
          pickup_date?: string;
          note?: string | null;
          collected_at?: string | null;
          cancelled_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "pickup_requests_school_id_student_id_fkey";
            columns: ["school_id", "student_id"];
            isOneToOne: false;
            referencedRelation: "students";
            referencedColumns: ["school_id", "id"];
          },
          {
            foreignKeyName: "pickup_requests_school_id_class_id_fkey";
            columns: ["school_id", "class_id"];
            isOneToOne: false;
            referencedRelation: "classes";
            referencedColumns: ["school_id", "id"];
          },
          {
            foreignKeyName: "pickup_requests_school_id_requested_by_parent_id_fkey";
            columns: ["school_id", "requested_by_parent_id"];
            isOneToOne: false;
            referencedRelation: "parents";
            referencedColumns: ["school_id", "id"];
          },
        ];
      };
      pickup_events: {
        Row: {
          id: string;
          seq: number;
          school_id: string;
          pickup_request_id: string;
          student_id: string;
          from_status: Database["public"]["Enums"]["pickup_status"] | null;
          to_status: Database["public"]["Enums"]["pickup_status"];
          actor_profile_id: string | null;
          actor_role: Database["public"]["Enums"]["actor_role"];
          actor_name: string;
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          seq?: number;
          school_id: string;
          pickup_request_id: string;
          student_id: string;
          from_status?: Database["public"]["Enums"]["pickup_status"] | null;
          to_status: Database["public"]["Enums"]["pickup_status"];
          actor_profile_id?: string | null;
          actor_role: Database["public"]["Enums"]["actor_role"];
          actor_name?: string;
          note?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          seq?: number;
          school_id?: string;
          pickup_request_id?: string;
          student_id?: string;
          from_status?: Database["public"]["Enums"]["pickup_status"] | null;
          to_status?: Database["public"]["Enums"]["pickup_status"];
          actor_profile_id?: string | null;
          actor_role?: Database["public"]["Enums"]["actor_role"];
          actor_name?: string;
          note?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "pickup_events_school_id_pickup_request_id_fkey";
            columns: ["school_id", "pickup_request_id"];
            isOneToOne: false;
            referencedRelation: "pickup_requests";
            referencedColumns: ["school_id", "id"];
          },
        ];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      request_pickup: {
        Args: { p_student_id: string; p_note?: string | null };
        Returns: Database["public"]["Tables"]["pickup_requests"]["Row"];
      };
      transition_pickup: {
        Args: {
          p_request_id: string;
          p_to_status: Database["public"]["Enums"]["pickup_status"];
          p_note?: string | null;
        };
        Returns: Database["public"]["Tables"]["pickup_requests"]["Row"];
      };
      platform_school_overview: {
        Args: Record<PropertyKey, never>;
        Returns: {
          school_id: string;
          slug: string;
          name_ar: string;
          name_en: string;
          city: string | null;
          is_active: boolean;
          created_at: string;
          student_count: number;
          staff_count: number;
          parent_count: number;
          pickups_today: number;
        }[];
      };
    };
    Enums: {
      actor_role: "parent" | "teacher" | "gate_staff" | "school_admin" | "system";
      app_locale: "ar" | "en";
      guardian_relationship: "father" | "mother" | "guardian" | "driver" | "relative" | "other";
      member_role: "school_admin" | "teacher" | "gate_staff";
      pickup_status:
        | "REQUESTED"
        | "ON_THE_WAY"
        | "PREPARING"
        | "READY"
        | "PARENT_ARRIVED"
        | "COLLECTED"
        | "CANCELLED";
    };
    CompositeTypes: { [_ in never]: never };
  };
};

type PublicSchema = Database["public"];
export type Tables<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Row"];
export type TablesInsert<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Update"];
export type Enums<T extends keyof PublicSchema["Enums"]> = PublicSchema["Enums"][T];
