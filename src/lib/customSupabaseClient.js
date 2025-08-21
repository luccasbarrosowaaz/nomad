import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jjyitdzsbnfwzlxmsxkb.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpqeWl0ZHpzYm5md3pseG1zeGtiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4MTIyNzgsImV4cCI6MjA2ODM4ODI3OH0.zGrMbwEpdfz81sXSf3M7mNAmJW2BFvl3Okn2ckU-oec';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);