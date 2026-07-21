import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

// NOTE: Replace these with your actual Supabase URL and Anon Key in production!
// You can use a .env file (e.g. process.env.EXPO_PUBLIC_SUPABASE_URL)
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://ieimaotamtsywkvflknb.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImllaW1hb3RhbXRzeXdrdmZsa25iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ1NTc3NzEsImV4cCI6MjEwMDEzMzc3MX0.l2cwbexUtleArDHdRhO-v0B-GC3RAcDgue-JRYRURBQ';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
