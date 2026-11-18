import { createClient } from "@supabase/supabase-js";

// Production defaults baked directly into the application code
// No manual environment variable setup required on Vercel
const DEFAULT_SUPABASE_URL = "https://izdellrmoeleychjwuzo.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY = "sb_publishable_T8yJ86FF7FxZKQpCFVoXcw_FTHtnDqt";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== "https://your-project.supabase.co"
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
