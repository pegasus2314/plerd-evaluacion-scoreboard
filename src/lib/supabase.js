import { createClient } from '@supabase/supabase-js';

// Regional 17 · Evaluación uses the Regional17-Voluntarios Supabase project.
// Keep Vercel env vars as optional overrides only when they point to this same project.
const PROJECT_URL = 'https://ibsmrkwkmcjyekwllxic.supabase.co';
const PROJECT_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlic21ya3drbWNqeWVrd2xseGl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY1NzMxNDIsImV4cCI6MjEwMjE0OTE0Mn0.QPl-L43oCPFk1MrgkpFK9SwYB6hy7cZhsfutgDOdkwk';

const envUrl = import.meta.env.VITE_SUPABASE_URL;
const envAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const sameProject = !envUrl || envUrl === PROJECT_URL;
const supabaseUrl = sameProject ? (envUrl || PROJECT_URL) : PROJECT_URL;
const supabaseAnonKey = sameProject ? (envAnonKey || PROJECT_ANON_KEY) : PROJECT_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
export const isSupabaseConfigured = Boolean(supabase);
