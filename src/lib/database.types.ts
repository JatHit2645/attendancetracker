export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          college_name: string | null
          default_target_threshold: number
          avatar_url: string | null
          created_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          college_name?: string | null
          default_target_threshold?: number
          avatar_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          college_name?: string | null
          default_target_threshold?: number
          avatar_url?: string | null
          created_at?: string
        }
        Relationships: []
      }
      academic_semesters: {
        Row: {
          id: string
          user_id: string
          name: string
          start_date: string
          end_date: string | null
          is_active: boolean | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string
          name: string
          start_date: string
          end_date?: string | null
          is_active?: boolean | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          start_date?: string
          end_date?: string | null
          is_active?: boolean | null
          created_at?: string
        }
        Relationships: []
      }
      subjects: {
        Row: {
          id: string
          user_id: string
          semester_id: string
          name: string
          short_name: string
          color: string
          target_threshold: number
          credits: number | null
          teachers: string[]
          created_at: string
        }

        Insert: {
          id?: string
          user_id?: string
          semester_id: string
          name: string
          short_name: string
          color: string
          target_threshold?: number
          credits?: number | null
          teachers?: string[]
          teacher_details?: { name: string; shortName: string }[] | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          semester_id?: string
          name?: string
          short_name?: string
          color?: string
          target_threshold?: number
          credits?: number | null
          teachers?: string[]
          created_at?: string
        }
        Relationships: []
      }
      timetable_versions: {
        Row: {
          id: string
          user_id: string
          semester_id: string
          name: string
          is_active: boolean | null
          start_date: string | null
          end_date: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string
          semester_id: string
          name?: string
          is_active?: boolean | null
          start_date?: string | null
          end_date?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          semester_id?: string
          name?: string
          is_active?: boolean | null
          start_date?: string | null
          end_date?: string | null
          created_at?: string
        }
        Relationships: []
      }
      academic_tasks: {
        Row: {
          id: string
          user_id: string
          subject_id: string | null
          semester_id: string | null
          title: string
          description: string | null
          task_type: "assignment" | "exam" | "quiz" | "lab_report" | "project"
          priority: "low" | "medium" | "high" | "critical"
          due_date: string
          reminder_at: string | null
          is_completed: boolean | null
          grade_weight: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string
          subject_id?: string | null
          semester_id?: string | null
          title: string
          description?: string | null
          task_type?: "assignment" | "exam" | "quiz" | "lab_report" | "project"
          priority?: "low" | "medium" | "high" | "critical"
          due_date: string
          reminder_at?: string | null
          is_completed?: boolean | null
          grade_weight?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          subject_id?: string | null
          semester_id?: string | null
          title?: string
          description?: string | null
          task_type?: "assignment" | "exam" | "quiz" | "lab_report" | "project"
          priority?: "low" | "medium" | "high" | "critical"
          due_date?: string
          reminder_at?: string | null
          is_completed?: boolean | null
          grade_weight?: number | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      campus_buildings: {
        Row: { id: string; name: string; total_floors: number; created_at: string }
        Insert: { id?: string; name: string; total_floors?: number; created_at?: string }
        Update: { id?: string; name?: string; total_floors?: number; created_at?: string }
        Relationships: []
      }
      campus_floors: {
        Row: { id: string; building_id: string; floor_number: number; floor_name: string; blueprint_svg_url: string | null; created_at: string }
        Insert: { id?: string; building_id: string; floor_number: number; floor_name: string; blueprint_svg_url?: string | null; created_at?: string }
        Update: { id?: string; building_id?: string; floor_number?: number; floor_name?: string; blueprint_svg_url?: string | null; created_at?: string }
        Relationships: []
      }
      campus_nodes: {
        Row: { id: string; building_id: string | null; floor_id: string | null; floor_number: number; node_name: string; node_type: string; room_number: string | null; x_coord: number; y_coord: number; is_accessible: boolean | null; created_at: string }
        Insert: { id?: string; building_id?: string | null; floor_id?: string | null; floor_number: number; node_name: string; node_type: string; room_number?: string | null; x_coord: number; y_coord: number; is_accessible?: boolean | null; created_at?: string }
        Update: { id?: string; building_id?: string | null; floor_id?: string | null; floor_number?: number; node_name?: string; node_type?: string; room_number?: string | null; x_coord?: number; y_coord?: number; is_accessible?: boolean | null; created_at?: string }
        Relationships: []
      }
      campus_edges: {
        Row: { id: string; building_id: string | null; from_node_id: string; to_node_id: string; weight_meters: number; is_stair_connection: boolean | null; is_bidirectional: boolean | null; created_at: string }
        Insert: { id?: string; building_id?: string | null; from_node_id: string; to_node_id: string; weight_meters: number; is_stair_connection?: boolean | null; is_bidirectional?: boolean | null; created_at?: string }
        Update: { id?: string; building_id?: string | null; from_node_id?: string; to_node_id?: string; weight_meters?: number; is_stair_connection?: boolean | null; is_bidirectional?: boolean | null; created_at?: string }
        Relationships: []
      }
      timetable_slots: {
        Row: {
          id: string
          user_id: string
          semester_id: string
          version_id: string | null
          subject_id: string
          day_of_week: number
          start_time: string
          end_time: string
          room_number: string | null
          class_type: 'theory' | 'lab' | 'tutorial' | null
          default_teacher: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string
          semester_id: string
          version_id?: string | null
          subject_id: string
          day_of_week: number
          start_time: string
          end_time: string
          room_number?: string | null
          class_type?: 'theory' | 'lab' | 'tutorial' | null
          default_teacher?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          semester_id?: string
          version_id?: string | null
          subject_id?: string
          day_of_week?: number
          start_time?: string
          end_time?: string
          room_number?: string | null
          class_type?: 'theory' | 'lab' | 'tutorial' | null
          default_teacher?: string | null
          created_at?: string
        }
        Relationships: []
      }
      attendance_records: {
        Row: {
          id: string
          user_id: string
          subject_id: string
          date: string
          status: 'present' | 'absent' | 'cancelled' | 'holiday'
          ist_start_time: string | null
          ist_end_time: string | null
          duration_minutes: number | null
          notes: string | null
          teacher_name: string | null
          class_type: 'theory' | 'lab' | 'tutorial' | null
          rating: number | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string
          subject_id: string
          date: string
          status: 'present' | 'absent' | 'cancelled' | 'holiday'
          ist_start_time?: string | null
          ist_end_time?: string | null
          duration_minutes?: number | null
          notes?: string | null
          teacher_name?: string | null
          class_type?: 'theory' | 'lab' | 'tutorial' | null
          rating?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          subject_id?: string
          date?: string
          status?: 'present' | 'absent' | 'cancelled' | 'holiday'
          ist_start_time?: string | null
          ist_end_time?: string | null
          duration_minutes?: number | null
          notes?: string | null
          teacher_name?: string | null
          class_type?: 'theory' | 'lab' | 'tutorial' | null
          rating?: number | null
          created_at?: string
        }
        Relationships: []
      }
      holidays: {
        Row: {
          id: string
          user_id: string
          semester_id: string
          date: string
          title: string
          type: 'holiday' | 'exam' | 'cancelled'
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string
          semester_id: string
          date: string
          title: string
          type: 'holiday' | 'exam' | 'cancelled'
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          semester_id?: string
          date?: string
          title?: string
          type?: 'holiday' | 'exam' | 'cancelled'
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in string]: never
    }
    Functions: {
      delete_user: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      [_ in string]: never
    }
  }
}
