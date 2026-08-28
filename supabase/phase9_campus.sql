
-- Campus Tables
CREATE TABLE IF NOT EXISTS public.campus_buildings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.campus_floors (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  building_id uuid REFERENCES public.campus_buildings(id) ON DELETE CASCADE,
  floor_number integer NOT NULL,
  floor_name text,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.campus_nodes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  floor_id uuid REFERENCES public.campus_floors(id) ON DELETE CASCADE,
  node_name text NOT NULL,
  node_type text,
  x_coord numeric NOT NULL,
  y_coord numeric NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.campus_edges (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  from_node_id uuid REFERENCES public.campus_nodes(id) ON DELETE CASCADE,
  to_node_id uuid REFERENCES public.campus_nodes(id) ON DELETE CASCADE,
  weight numeric DEFAULT 1.0,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.campus_buildings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campus_floors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campus_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campus_edges ENABLE ROW LEVEL SECURITY;

-- Allow public read access for navigation
CREATE POLICY "Public can read buildings" ON public.campus_buildings FOR SELECT USING (true);
CREATE POLICY "Public can read floors" ON public.campus_floors FOR SELECT USING (true);
CREATE POLICY "Public can read nodes" ON public.campus_nodes FOR SELECT USING (true);
CREATE POLICY "Public can read edges" ON public.campus_edges FOR SELECT USING (true);

-- Allow authenticated users to insert/update nodes (Admin Mode)
CREATE POLICY "Auth can insert nodes" ON public.campus_nodes FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Auth can update nodes" ON public.campus_nodes FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Auth can insert edges" ON public.campus_edges FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Auth can update edges" ON public.campus_edges FOR UPDATE USING (auth.role() = 'authenticated');
