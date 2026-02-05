import { createClient } from '@supabase/supabase-js';

// WORKAROUND: The execution environment does not support loading environment variables
// from a .env file. Hardcoding credentials from the provided .env.local to resolve
// the application startup crash. This is not recommended for production deployment.
const supabaseUrl = 'https://ovqerhvsmijdpwefmqak.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92cWVyaHZzbWlqZHB3ZWZtcWFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2NzYyNDYsImV4cCI6MjA4NTI1MjI0Nn0.nwJD-lh1dru-ZAYxUnDMs8VItG1OHwoijCXJHyeMpP0';

// Safety check to ensure credentials are provided
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL and Anon Key must be defined.");
}

/**
 * Emes CBT - Supabase Client Configuration
 * File ini menghubungkan aplikasi dengan Database Cloud.
 */

// Inisialisasi client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);