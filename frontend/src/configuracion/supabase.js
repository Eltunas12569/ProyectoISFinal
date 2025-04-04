import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://atblgjgeihjoomeqrwwp.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0YmxnamdlaWhqb29tZXFyd3dwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM3NzUwMTQsImV4cCI6MjA1OTM1MTAxNH0.LltwngGqX8bneGnY1r9olmyykkVsK23ZQnc43W63rqQ'
export const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  });