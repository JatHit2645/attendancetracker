import { supabase } from '../lib/supabase';

export interface AcademicTask {
  id: string;
  user_id: string;
  subject_id?: string | null;
  title: string;
  task_type: 'assignment' | 'exam' | 'quiz' | 'lab_report' | 'project';
  priority: 'low' | 'medium' | 'high' | 'critical';
  due_date: string;
  is_completed: boolean;
}

export const TaskService = {
  async fetchTasks() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('academic_tasks')
      .select('*')
      .eq('user_id', user.id)
      .order('due_date', { ascending: true });

    if (error) throw error;
    return data as AcademicTask[];
  },

  async createTask(task: Omit<AcademicTask, 'id' | 'user_id' | 'is_completed'>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('academic_tasks')
      .insert({
        user_id: user.id,
        is_completed: false,
        ...task,
      })
      .select()
      .single();

    if (error) throw error;
    return data as AcademicTask;
  },

  async completeTask(id: string) {
    const { data, error } = await supabase
      .from('academic_tasks')
      .update({ is_completed: true })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as AcademicTask;
  },

  async deleteTask(id: string) {
    const { error } = await supabase
      .from('academic_tasks')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}
