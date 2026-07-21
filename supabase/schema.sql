-- Phase 5: Supabase Schema for Attendance Tracker

-- 1. Academic Semesters
CREATE TABLE academic_semesters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL, -- e.g. "Semester 3"
    start_date DATE NOT NULL,
    end_date DATE,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Subjects
CREATE TABLE subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    semester_id UUID REFERENCES academic_semesters(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL, -- e.g. "Data Structures and Algorithms"
    short_name TEXT NOT NULL, -- e.g. "DSA"
    color TEXT NOT NULL, -- Hex code e.g. "#4ADE80"
    target_threshold INTEGER NOT NULL DEFAULT 75, -- Percentage
    credits INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Timetable Slots
CREATE TABLE timetable_slots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    semester_id UUID REFERENCES academic_semesters(id) ON DELETE CASCADE NOT NULL,
    subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE NOT NULL,
    day_of_week INTEGER NOT NULL, -- 0=Sunday, 1=Monday... 6=Saturday
    start_time TEXT NOT NULL, -- "09:00"
    end_time TEXT NOT NULL, -- "10:00"
    room_number TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Attendance Records
-- Captures individual logs when a lecture happens
CREATE TABLE attendance_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL, -- "2026-07-20"
    status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'cancelled', 'holiday')),
    ist_start_time TEXT, -- "09:00:00"
    ist_end_time TEXT, -- "10:00:00"
    duration_minutes INTEGER,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes for performance
CREATE INDEX idx_subjects_semester ON subjects(semester_id);
CREATE INDEX idx_slots_semester ON timetable_slots(semester_id);
CREATE INDEX idx_slots_subject ON timetable_slots(subject_id);
CREATE INDEX idx_records_subject ON attendance_records(subject_id);
CREATE INDEX idx_records_date ON attendance_records(date);

-- Security: Disable Row Level Security for local/personal use (can be enabled later for multi-user auth)
ALTER TABLE academic_semesters DISABLE ROW LEVEL SECURITY;
ALTER TABLE subjects DISABLE ROW LEVEL SECURITY;
ALTER TABLE timetable_slots DISABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records DISABLE ROW LEVEL SECURITY;
