import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://pocuggehxeuheqzgixsx.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBvY3VnZ2VoeGV1aGVxemdpeHN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3MDU1MzQsImV4cCI6MjA4NTI4MTUzNH0.QjIFMzJ4xf3PNnUbMSUMg8mIyPLis7yI_PuPNZT5CMg';

if (!import.meta.env.VITE_SUPABASE_URL) {
    console.info('ℹ️ Using fallback Supabase credentials.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
