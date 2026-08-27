-- Phase 8 Migration: Ratings, Teachers, and Timetable Versions

-- 1. Create Timetable Versions Table
CREATE TABLE public.timetable_versions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  semester_id uuid REFERENCES public.academic_semesters(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  start_date date NOT NULL,
  end_date date,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- RLS for timetable_versions
ALTER TABLE public.timetable_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own timetable versions" ON public.timetable_versions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own timetable versions" ON public.timetable_versions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own timetable versions" ON public.timetable_versions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own timetable versions" ON public.timetable_versions FOR DELETE USING (auth.uid() = user_id);

-- 2. Update Subjects Table
ALTER TABLE public.subjects 
ADD COLUMN teachers text[] DEFAULT '{}'::text[];

-- 3. Update Timetable Slots Table
ALTER TABLE public.timetable_slots 
ADD COLUMN version_id uuid REFERENCES public.timetable_versions(id) ON DELETE CASCADE,
ADD COLUMN class_type text DEFAULT 'theory' CHECK (class_type IN ('theory', 'lab', 'tutorial')),
ADD COLUMN default_teacher text;

-- Migration script to auto-generate a Default Version for existing semesters and assign existing slots to it
DO $$
DECLARE
  sem RECORD;
  new_version_id uuid;
BEGIN
  FOR sem IN SELECT * FROM public.academic_semesters LOOP
    -- Insert a default version for each semester
    INSERT INTO public.timetable_versions (user_id, semester_id, name, start_date, is_active)
    VALUES (sem.user_id, sem.id, 'Initial Timetable', sem.start_date, true)
    RETURNING id INTO new_version_id;

    -- Assign all existing slots for this semester to the new version
    UPDATE public.timetable_slots
    SET version_id = new_version_id
    WHERE semester_id = sem.id AND version_id IS NULL;
  END LOOP;
END $$;

-- 4. Update Attendance Records Table
ALTER TABLE public.attendance_records
ADD COLUMN teacher_name text,
ADD COLUMN class_type text DEFAULT 'theory' CHECK (class_type IN ('theory', 'lab', 'tutorial')),
ADD COLUMN rating numeric(3,1) CHECK (rating >= 0.0 AND rating <= 10.0);
