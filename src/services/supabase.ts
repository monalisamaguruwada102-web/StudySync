import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Use environment variables for production security.
// Ensure you have these defined in your .env or CI/CD environment.
export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://YOUR_PROJECT_REF.supabase.co';
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'YOUR_ANON_KEY';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
});

export const IS_SUPABASE_CONFIGURED =
    SUPABASE_URL !== 'https://YOUR_PROJECT_REF.supabase.co' &&
    SUPABASE_ANON_KEY !== 'YOUR_ANON_KEY';
