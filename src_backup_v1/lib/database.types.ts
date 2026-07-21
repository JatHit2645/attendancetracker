export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
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
          created_at?: string
        }
      }
      timetable_slots: {
        Row: {
          id: string
          user_id: string
          semester_id: string
          subject_id: string
          day_of_week: number
          start_time: string
          end_time: string
          room_number: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string
          semester_id: string
          subject_id: string
          day_of_week: number
          start_time: string
          end_time: string
          room_number?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          semester_id?: string
          subject_id?: string
          day_of_week?: number
          start_time?: string
          end_time?: string
          room_number?: string | null
          created_at?: string
        }
      }
      attendance_records: {
        Row: {
          id: string
          user_id: string
          subject_id: string
          date: string
          status: string
          ist_start_time: string | null
          ist_end_time: string | null
          duration_minutes: number | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string
          subject_id: string
          date: string
          status: 'present' | 'absent' | 'cancelled'
          ist_start_time: string
          ist_end_time: string
          duration_minutes: number
          created_at?: string
          synced_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          subject_id?: string
          date?: string
          status?: 'present' | 'absent' | 'cancelled'
          ist_start_time?: string
          ist_end_time?: string
          duration_minutes?: number
          created_at?: string
          synced_at?: string
        }
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
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
