import { supabase } from '../lib/supabase';
import { Database } from '../lib/database.types';
import { LogbookService } from './LogbookService';
import { RecycleBinService } from './RecycleBinService';

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
    
    await LogbookService.addLog('update', 'auth', `Updated profile settings`);
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
    const now = new Date();
    const end = new Date();
    end.setMonth(end.getMonth() + 6);
    
    const { data, error } = await supabase.from('academic_semesters').insert([{ 
      name: 'Semester 1', 
      start_date: now.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }), 
      end_date: end.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }), 
      is_active: true 
    }]).select().single();
    
    if (error) throw error;
    await LogbookService.addLog('create', 'semester', 'Initialized first semester (Semester 1)');
    return data;
  },

  async createSemester(name: string, startDate: string, endDate?: string): Promise<Semester> {
    // Deactivate currently active semesters first to keep active state unique
    await supabase.from('academic_semesters').update({ is_active: false } as any).eq('is_active', true);

    const { data, error } = await supabase.from('academic_semesters').insert([{ name, start_date: startDate, end_date: endDate, is_active: true }]).select().single();
    if (error) throw error;
    
    await LogbookService.addLog('create', 'semester', `Created Semester: ${name}`);
    return data;
  },

  async updateSemester(id: string, updates: Partial<Database['public']['Tables']['academic_semesters']['Update']>): Promise<Semester> {
    const { data, error } = await supabase.from('academic_semesters').update(updates).eq('id', id).select().single();
    if (error) throw error;
    
    await LogbookService.addLog('update', 'semester', `Updated semester: ${data.name}`);
    return data;
  },

  async deleteSemester(id: string): Promise<void> {
    const { data: semester } = await supabase.from('academic_semesters').select('*').eq('id', id).single();
    if (semester) {
      // 1. Fetch all subjects in this semester
      const { data: subjects } = await supabase.from('subjects').select('*').eq('semester_id', id);
      if (subjects && subjects.length > 0) {
        const subjectIds = subjects.map((s: any) => s.id);
        
        const { data: slots } = await supabase.from('timetable_slots').select('*').in('subject_id', subjectIds);
        if (slots) {
          for (const slot of slots) {
            const sub = subjects.find((s: any) => s.id === slot.subject_id);
            await RecycleBinService.archiveItem('timetable_slots', slot, `Slot for ${sub?.short_name} (${slot.start_time})`);
          }
        }

        const { data: records } = await supabase.from('attendance_records').select('*').in('subject_id', subjectIds);
        if (records) {
          for (const r of records) {
            const sub = subjects.find((s: any) => s.id === r.subject_id);
            await RecycleBinService.archiveItem('attendance_records', r, `Record for ${sub?.short_name} (${r.date})`);
          }
        }

        for (const sub of subjects) {
          await RecycleBinService.archiveItem('subjects', sub, `${sub.name} (${sub.short_name})`);
        }
      }

      // 2. Fetch and archive holidays
      const { data: holidays } = await supabase.from('holidays').select('*').eq('semester_id', id);
      if (holidays) {
        for (const h of holidays) {
          await RecycleBinService.archiveItem('holidays', h, `${h.title} (${h.date})`);
        }
      }

      // 3. Archive semester
      await RecycleBinService.archiveItem('academic_semesters', semester, semester.name);
      await LogbookService.addLog('delete', 'semester', `Deleted semester: ${semester.name}`);
    }
    
    const { error } = await supabase.from('academic_semesters').delete().eq('id', id);
    if (error) throw error;
  },

  async activateSemester(semesterId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    await supabase.from('academic_semesters').update({ is_active: false } as any).neq('id', semesterId);
    const { data: semester } = await supabase.from('academic_semesters').update({ is_active: true } as any).eq('id', semesterId).select().single();
    
    if (semester) {
      await LogbookService.addLog('update', 'semester', `Activated Semester: ${semester.name}`);
    }
  },

  // --- Subjects ---
  async fetchSubjects(semesterId?: string): Promise<Subject[]> {
    let query = supabase.from('subjects').select('*').order('created_at', { ascending: true });
    if (semesterId) {
      query = query.eq('semester_id', semesterId);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async createSubject(subject: Omit<Database['public']['Tables']['subjects']['Insert'], 'id' | 'created_at'>): Promise<Subject> {
    const { data, error } = await supabase.from('subjects').insert([subject]).select().single();
    if (error) throw error;
    
    await LogbookService.addLog('create', 'subject', `Created subject: ${data.name} (${data.short_name})`);
    return data;
  },
  
  async updateSubject(id: string, updates: Partial<Database['public']['Tables']['subjects']['Update']>): Promise<Subject> {
    const { data, error } = await supabase.from('subjects').update(updates).eq('id', id).select().single();
    if (error) throw error;
    
    await LogbookService.addLog('update', 'subject', `Updated subject: ${data.name}`);
    return data;
  },
  
  async deleteSubject(id: string): Promise<void> {
    const { data: subject } = await supabase.from('subjects').select('*').eq('id', id).single();
    if (subject) {
      // 1. Fetch and archive timetable slots
      const { data: slots } = await supabase.from('timetable_slots').select('*').eq('subject_id', id);
      if (slots) {
        for (const slot of slots) {
          await RecycleBinService.archiveItem('timetable_slots', slot, `Slot for ${subject.short_name} (${slot.start_time})`);
        }
      }
      // 2. Fetch and archive attendance records
      const { data: records } = await supabase.from('attendance_records').select('*').eq('subject_id', id);
      if (records) {
        for (const r of records) {
          await RecycleBinService.archiveItem('attendance_records', r, `Record for ${subject.short_name} (${r.date})`);
        }
      }

      // 3. Archive subject
      await RecycleBinService.archiveItem('subjects', subject, `${subject.name} (${subject.short_name})`);
      await LogbookService.addLog('delete', 'subject', `Deleted subject: ${subject.name}`);
    }
    
    const { error } = await supabase.from('subjects').delete().eq('id', id);
    if (error) throw error;
  },

  // --- Timetable Versions ---
  async fetchTimetableVersions(semesterId: string): Promise<Database['public']['Tables']['timetable_versions']['Row'][]> {
    const { data, error } = await supabase.from('timetable_versions').select('*').eq('semester_id', semesterId).order('start_date', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async createTimetableVersion(version: Omit<Database['public']['Tables']['timetable_versions']['Insert'], 'id' | 'created_at'>, cloneFromVersionId?: string): Promise<Database['public']['Tables']['timetable_versions']['Row']> {
    const { data, error } = await supabase.from('timetable_versions').insert([version]).select().single();
    if (error) throw error;
    
    // If copying from an existing version, duplicate its slots
    if (cloneFromVersionId) {
      const { data: slots } = await supabase.from('timetable_slots').select('*').eq('version_id', cloneFromVersionId);
      if (slots && slots.length > 0) {
        const clonedSlots = slots.map(slot => ({
          user_id: data.user_id,
          semester_id: data.semester_id,
          version_id: data.id,
          subject_id: slot.subject_id,
          day_of_week: slot.day_of_week,
          start_time: slot.start_time,
          end_time: slot.end_time,
          room_number: slot.room_number,
          class_type: slot.class_type,
          default_teacher: slot.default_teacher
        }));
        await supabase.from('timetable_slots').insert(clonedSlots);
      }
    }
    
    await LogbookService.addLog('create', 'timetable', `Created timetable version: ${data.name}`);
    return data;
  },

  async updateTimetableVersion(id: string, updates: Partial<Database['public']['Tables']['timetable_versions']['Update']>): Promise<Database['public']['Tables']['timetable_versions']['Row']> {
    const { data, error } = await supabase.from('timetable_versions').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  async deleteTimetableVersion(id: string): Promise<void> {
    const { error } = await supabase.from('timetable_versions').delete().eq('id', id);
    if (error) throw error;
  },

  // --- Timetable Slots ---
  async fetchTimetable(semesterId: string, targetDate?: string): Promise<TimetableSlot[]> {
    if (targetDate) {
      // Find the correct version for the target date
      const versions = await this.fetchTimetableVersions(semesterId);
      let activeVersionId: string | null = null;
      for (const v of versions) {
        if (targetDate >= v.start_date && (!v.end_date || targetDate <= v.end_date)) {
          activeVersionId = v.id;
          break;
        }
      }
      if (!activeVersionId && versions.length > 0) {
        // Fallback to the latest version if date is before all versions (shouldn't happen) or after but unbounded
        activeVersionId = versions[0].id;
      }
      
      if (activeVersionId) {
        const { data, error } = await supabase.from('timetable_slots').select('*').eq('version_id', activeVersionId);
        if (error) throw error;
        return data || [];
      }
    }
    
    // Fallback: fetch all slots for the semester (for legacy or general viewing if version is ignored)
    const { data, error } = await supabase.from('timetable_slots').select('*').eq('semester_id', semesterId);
    if (error) throw error;
    return data || [];
  },

  async fetchTimetableByVersion(versionId: string): Promise<TimetableSlot[]> {
    const { data, error } = await supabase.from('timetable_slots').select('*').eq('version_id', versionId);
    if (error) throw error;
    return data || [];
  },

  async createTimetableSlot(slot: Omit<Database['public']['Tables']['timetable_slots']['Insert'], 'id' | 'created_at'>): Promise<TimetableSlot> {
    const { data, error } = await supabase.from('timetable_slots').insert([slot]).select().single();
    if (error) throw error;
    
    const { data: subject } = await supabase.from('subjects').select('*').eq('id', data.subject_id).single();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayStr = dayNames[data.day_of_week];
    
    await LogbookService.addLog(
      'create',
      'timetable',
      `Scheduled ${subject?.short_name || 'Class'} on ${dayStr} at ${data.start_time}`
    );
    return data;
  },

  async updateTimetableSlot(id: string, updates: Partial<Database['public']['Tables']['timetable_slots']['Update']>): Promise<TimetableSlot> {
    const { data, error } = await supabase.from('timetable_slots').update(updates).eq('id', id).select().single();
    if (error) throw error;
    
    await LogbookService.addLog('update', 'timetable', `Updated schedule entry`);
    return data;
  },

  async deleteTimetableSlot(id: string): Promise<void> {
    const { data: slot } = await supabase.from('timetable_slots').select('*').eq('id', id).single();
    if (slot) {
      const { data: subject } = await supabase.from('subjects').select('*').eq('id', slot.subject_id).single();
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const dayStr = dayNames[slot.day_of_week];
      const label = `${subject?.short_name || 'Class'} (${dayStr} ${slot.start_time})`;
      
      await RecycleBinService.archiveItem('timetable_slots', slot, label);
      await LogbookService.addLog('delete', 'timetable', `Removed timetable slot for ${subject?.short_name || 'Class'}`);
    }
    
    const { error } = await supabase.from('timetable_slots').delete().eq('id', id);
    if (error) throw error;
  },

  // --- Holidays ---
  async fetchHolidays(semesterId: string): Promise<Holiday[]> {
    const { data, error } = await supabase.from('holidays').select('*').eq('semester_id', semesterId);
    if (error) throw error;
    return data || [];
  },

  async createHoliday(holiday: Omit<Database['public']['Tables']['holidays']['Insert'], 'id' | 'created_at'>): Promise<Holiday> {
    const { data, error } = await supabase.from('holidays').insert([holiday]).select().single();
    if (error) throw error;
    
    await LogbookService.addLog('create', 'holiday', `Marked holiday: ${data.title} on ${data.date}`);
    return data;
  },

  async updateHoliday(id: string, updates: Partial<Database['public']['Tables']['holidays']['Update']>): Promise<Holiday> {
    const { data, error } = await supabase.from('holidays').update(updates).eq('id', id).select().single();
    if (error) throw error;
    
    await LogbookService.addLog('update', 'holiday', `Updated holiday: ${data.title}`);
    return data;
  },

  async deleteHoliday(id: string): Promise<void> {
    const { data: holiday } = await supabase.from('holidays').select('*').eq('id', id).single();
    if (holiday) {
      await RecycleBinService.archiveItem('holidays', holiday, `${holiday.title} (${holiday.date})`);
      await LogbookService.addLog('delete', 'holiday', `Deleted holiday: ${holiday.title}`);
    }
    
    const { error } = await supabase.from('holidays').delete().eq('id', id);
    if (error) throw error;
  },

  // --- Attendance Records ---
  async fetchAttendanceRecords(semesterId?: string): Promise<AttendanceRecord[]> {
    let query = supabase
      .from('attendance_records')
      .select('*, subjects!inner(semester_id)')
      .order('date', { ascending: false });
      
    if (semesterId) {
      query = query.eq('subjects.semester_id', semesterId);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async logAttendanceSession(record: Omit<Database['public']['Tables']['attendance_records']['Insert'], 'id' | 'created_at'>): Promise<AttendanceRecord> {
    const { data, error } = await supabase.from('attendance_records').insert([record]).select().single();
    if (error) throw error;
    
    const { data: subject } = await supabase.from('subjects').select('*').eq('id', data.subject_id).single();
    await LogbookService.addLog(
      'create',
      'attendance',
      `Marked ${subject?.short_name || 'Class'} as ${data.status.toUpperCase()} on ${data.date}`
    );
    return data;
  },

  async updateAttendanceRecord(id: string, updates: Partial<Database['public']['Tables']['attendance_records']['Update']>): Promise<AttendanceRecord> {
    const { data, error } = await supabase.from('attendance_records').update(updates).eq('id', id).select().single();
    if (error) throw error;
    
    const { data: subject } = await supabase.from('subjects').select('*').eq('id', data.subject_id).single();
    await LogbookService.addLog(
      'update',
      'attendance',
      `Changed ${subject?.short_name || 'Class'} status to ${data.status.toUpperCase()} on ${data.date}`
    );
    return data;
  },

  async deleteAttendanceRecord(id: string): Promise<void> {
    const { data: record } = await supabase.from('attendance_records').select('*').eq('id', id).single();
    if (record) {
      const { data: subject } = await supabase.from('subjects').select('*').eq('id', record.subject_id).single();
      const label = `${subject?.short_name || 'Class'} (${record.date})`;
      
      await RecycleBinService.archiveItem('attendance_records', record, label);
      await LogbookService.addLog('delete', 'attendance', `Deleted attendance entry for ${subject?.short_name || 'Class'} on ${record.date}`);
    }
    
    const { error } = await supabase.from('attendance_records').delete().eq('id', id);
    if (error) throw error;
  },

  // --- Real Account Deletion Sequence ---
  async deleteAccountData(): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // 1. Delete rows sequentially to handle cascades smoothly and wipe database clean
    await supabase.from('attendance_records').delete().eq('user_id', user.id);
    await supabase.from('timetable_slots').delete().eq('user_id', user.id);
    await supabase.from('holidays').delete().eq('user_id', user.id);
    await supabase.from('subjects').delete().eq('user_id', user.id);
    await supabase.from('academic_semesters').delete().eq('user_id', user.id);
    await supabase.from('profiles').delete().eq('id', user.id);
    
    // Clean local services
    await LogbookService.clearLogs();
    
    try {
      await supabase.rpc('delete_user');
    } catch (e) {}
  }
};
