import { createClient } from '@supabase/supabase-js';

const PROJECT_URL = 'https://ibsmrkwkmcjyekwllxic.supabase.co';
const PROJECT_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlic21ya3drbWNqeWVrd2xseGljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY1NzMxNDIsImV4cCI6MjEwMjE0OTE0Mn0.QPl-L43oCPFk1MrgkpFK9SwYB6hy7cZhsfutgDOdkwk';

// Force this app to the Regional17-Voluntarios project. Vercel env vars are not
// trusted here because an old deployment was pointing at another Supabase project.
export const supabase = createClient(PROJECT_URL, PROJECT_ANON_KEY);
export const isSupabaseConfigured = true;
