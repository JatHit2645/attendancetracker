-- Phase 6: Multi-User Authentication & Row Level Security Migration

-- 1. Create Profiles Table
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    college_name TEXT,
    default_target_threshold INTEGER DEFAULT 75,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Clear dummy data from Phase 5 to avoid null constraint violations on user_id
DELETE FROM academic_semesters;

-- 3. Add user_id to all existing tables
ALTER TABLE academic_semesters ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid() NOT NULL;
ALTER TABLE subjects ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid() NOT NULL;
ALTER TABLE timetable_slots ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid() NOT NULL;
ALTER TABLE attendance_records ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid() NOT NULL;

-- 4. Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_semesters ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE timetable_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;

-- 5. Create Security Policies (Users can only read/write their own data)
CREATE POLICY "Users access own profile" ON profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "Users access own semesters" ON academic_semesters FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users access own subjects" ON subjects FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users access own timetable" ON timetable_slots FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users access own records" ON attendance_records FOR ALL USING (auth.uid() = user_id);

-- 6. Trigger to automatically create a profile when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
