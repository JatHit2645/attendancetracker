-- ==============================================================================
-- SUPABASE RPC: DELETE USER ACCOUNT
-- ==============================================================================
-- Run this script in the SQL Editor of your Supabase Dashboard to enable
-- the "Delete Account" button to fully remove your auth.users credentials.
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.delete_user()
RETURNS void AS $$
BEGIN
  -- Wipes the user row from auth.users (cascades to all other tables)
  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- Expose function execution to authenticated users
REVOKE ALL ON FUNCTION public.delete_user() FROM public;
GRANT EXECUTE ON FUNCTION public.delete_user() TO authenticated;
