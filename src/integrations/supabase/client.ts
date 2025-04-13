
import { createClient } from '@supabase/supabase-js';

// Supabase project details
const supabaseUrl = 'https://ofmtivaqxsdzkttvbojx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mbXRpdmFxeHNkemt0dHZib2p4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ1NjM3NDcsImV4cCI6MjA2MDEzOTc0N30.A5GoHikbC5NvFUZ8AJXfHQEHPwPgO2TcY_m-ohSnqMU';

// Create a Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
});

// Helper functions for Auth
export const getCurrentUser = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user || null;
};

export const getCurrentSession = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
};
