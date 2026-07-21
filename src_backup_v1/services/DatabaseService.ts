import { supabase } from '../lib/supabase';
import { Database } from '../lib/database.types';

type Semester = Database['public']['Tables']['academic_semesters']['Row'];
type Subject = Database['public']['Tables']['subjects']['Row'];
type TimetableSlot = Database['public']['Tables']['timetable_slots']['Row'];
type AttendanceRecord = Database['public']['Tables']['attendance_records']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];
type Holiday = Database['public']['Tables']['holidays']['Row'];

export const DatabaseService = {
  // --- Profiles ---
  async fetchProfile(): Promise<Profile | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    if (error) throw error;
    return data;
  },

  async updateProfile(updates: Partial<Database['public']['Tables']['profiles']['Update']>): Promise<Profile> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("No user logged in");
    const { data, error } = await supabase.from('profiles').update(updates).eq('id', user.id).select().single();
    if (error) throw error;
    return data;
  },

  // --- Semesters ---
  async fetchSemesters(): Promise<Semester[]> {
    const { data, error } = await supabase.from('academic_semesters').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async fetchActiveSemester(): Promise<Semester | null> {
    const { data, error } = await supabase.from('academic_semesters').select('*').eq('is_active', true).order('created_at', { ascending: false }).limit(1).single();
    if (error && error.code !== 'PGRST116') throw error; // Ignore "no rows returned"
    return data || null;
  },

  async initializeNewUser(): Promise<Semester> {
    // Automatically creates Semester 1 for a new user
    const now = new Date();
    const end = new Date();
    end.setMonth(end.getMonth() + 6);
    
    const { data, error } = await supabase.from('academic_semesters').insert([{ 
      name: 'Semester 1', 
      start_date: now.toISOString().split('T')[0], 
      end_date: end.toISOString().split('T')[0], 
      is_active: true 
    }]).select().single();
    
    if (error) throw error;
    return data;
  },

  async createSemester(name: string, startDate: string, endDate?: string): Promise<Semester> {
    const { data, error } = await supabase.from('academic_semesters').insert([{ name, start_date: startDate, end_date: endDate, is_active: true }]).select().single();
    if (error) throw error;
    return data;
  },

  // --- Subjects ---
  async fetchSubjects(semesterId: string): Promise<Subject[]> {
    const { data, error } = await supabase.from('subjects').select('*').eq('semester_id', semesterId).order('created_at', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async createSubject(subject: Omit<Database['public']['Tables']['subjects']['Insert'], 'id' | 'created_at'>): Promise<Subject> {
    const { data, error } = await supabase.from('subjects').insert([subject]).select().single();
    if (error) throw error;
    return data;
  },
  
  async updateSubject(id: string, updates: Partial<Database['public']['Tables']['subjects']['Update']>): Promise<Subject> {
    const { data, error } = await supabase.from('subjects').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },
  
  async deleteSubject(id: string): Promise<void> {
    const { error } = await supabase.from('subjects').delete().eq('id', id);
    if (error) throw error;
  },

  // --- Timetable ---
  async fetchTimetable(semesterId: string): Promise<TimetableSlot[]> {
    const { data, error } = await supabase.from('timetable_slots').select('*').eq('semester_id', semesterId);
    if (error) throw error;
    return data || [];
  },

  // --- Holidays ---
  async fetchHolidays(semesterId: string): Promise<Holiday[]> {
    const { data, error } = await supabase.from('holidays').select('*').eq('semester_id', semesterId);
    if (error) throw error;
    return data || [];
  },

  // --- Attendance Records ---
  async fetchAttendanceRecords(semesterId: string): Promise<AttendanceRecord[]> {
    // We join records via subject to filter by semester
    const { data, error } = await supabase
      .from('attendance_records')
      .select('*, subjects!inner(semester_id)')
      .eq('subjects.semester_id', semesterId)
      .order('date', { ascending: false });
      
    if (error) throw error;
    return data || [];
  },

  async logAttendanceSession(record: Omit<Database['public']['Tables']['attendance_records']['Insert'], 'id' | 'created_at'>): Promise<AttendanceRecord> {
    const { data, error } = await supabase.from('attendance_records').insert([record]).select().single();
    if (error) throw error;
    return data;
  },
};
