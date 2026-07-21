-- ==============================================================================
-- PHASE 7 MIGRATION: HOLIDAYS & EXEMPTIONS TABLE
-- ==============================================================================
-- Purpose:
--   Stores user-defined non-class days (e.g., Diwali break, semester exams, 
--   or unexpected cancelled lectures).
-- 
-- Security:
--   Enforces Row Level Security (RLS) so that students can only view, 
--   create, update, or delete their own recorded holidays.
-- ==============================================================================

-- Create the holidays table to store exempted dates per semester
CREATE TABLE public.holidays (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),                       -- Unique record ID
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,    -- Links record to authenticated user
    semester_id UUID NOT NULL REFERENCES public.academic_semesters(id) ON DELETE CASCADE, -- Links record to active semester
    date DATE NOT NULL,                                                   -- Date of the holiday (YYYY-MM-DD)
    title TEXT NOT NULL,                                                  -- Name/reason (e.g. "Diwali Break")
    type TEXT NOT NULL CHECK (type IN ('holiday', 'exam', 'cancelled')),   -- Classification of exemption
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS) for data privacy
ALTER TABLE public.holidays ENABLE ROW LEVEL SECURITY;

-- Security Policy: Restricts access so users only manage their own data
CREATE POLICY "Users can manage their own holidays" 
    ON public.holidays 
    FOR ALL 
    USING (auth.uid() = user_id);

-- Performance Indexes: Speeds up calendar queries by semester and date
CREATE INDEX idx_holidays_semester ON public.holidays(semester_id);
CREATE INDEX idx_holidays_date ON public.holidays(date);

