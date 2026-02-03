import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile, UserRole } from '../types';
import { MOCK_USERS } from './mockData';
import { supabase, IS_SUPABASE_CONFIGURED, SUPABASE_URL } from './supabase';

const AUTH_KEY = '@auth_user';
const ALL_USERS_KEY = '@all_users';

export const authService = {
    _getAllUsers: async (): Promise<UserProfile[]> => {
        try {
            const stored = await AsyncStorage.getItem(ALL_USERS_KEY);
            return stored ? JSON.parse(stored) : [...MOCK_USERS];
        } catch (error) {
            return [...MOCK_USERS];
        }
    },

    _saveAllUsers: async (users: UserProfile[]) => {
        await AsyncStorage.setItem(ALL_USERS_KEY, JSON.stringify(users));
    },

    login: async (email: string, password: string): Promise<{ user: any; profile: UserProfile }> => {
        if (IS_SUPABASE_CONFIGURED) {
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;

            // Wait for profile created by trigger or existing
            const profile = await authService._waitAndFetchProfile(data.user.id);
            if (!profile) throw new Error('Failed to retrieve user profile after login.');

            const authData = { user: data.user, profile };
            await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(authData));
            return authData;
        }

        // Simulation Mode Fallback
        const users = await authService._getAllUsers();
        const profile = users.find(u => u.email.toLowerCase() === email.toLowerCase());

        if (!profile) {
            throw new Error('User not found in simulation mode.');
        }

        const authData = { user: { id: profile.id, email: profile.email }, profile };
        await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(authData));
        return authData;
    },

    register: async (name: string, email: string, password: string, role: UserRole): Promise<{ user: any; profile: UserProfile }> => {
        if (IS_SUPABASE_CONFIGURED) {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: { name, role }
                }
            });
            if (error) throw error;
            if (!data.user) throw new Error('Registration failed');

            // Wait for the database trigger to create the profile
            const profile = await authService._waitAndFetchProfile(data.user.id);
            if (!profile) throw new Error('Registration successful, but profile creation timed out. Please try logging in.');

            const authData = { user: data.user, profile };
            await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(authData));
            return authData;
        }

        // Simulation Mode Fallback
        const users = await authService._getAllUsers();

        if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
            throw new Error('User already exists with this email.');
        }

        const profile: UserProfile = {
            id: 'u_' + Math.random().toString(36).substr(2, 9),
            email,
            name,
            role,
            verification_status: 'none',
        };

        users.push(profile);
        await authService._saveAllUsers(users);

        const authData = { user: { id: profile.id, email: profile.email }, profile };
        await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(authData));
        return authData;
    },

    _mapProfile: (profile: any): UserProfile => {
        const supabaseUrl = SUPABASE_URL;
        let avatar = profile.avatar;
        if (avatar && !avatar.startsWith('http')) {
            avatar = `${supabaseUrl}/storage/v1/object/public/user-assets/${avatar}`;
        }

        return {
            id: profile.id,
            email: profile.email,
            name: profile.name,
            role: profile.role,
            verification_status: profile.verification_status,
            avatar: avatar,
            id_document_url: profile.id_document_url,
            bio: profile.bio,
            phone_number: profile.phone_number,
            student_id_verified: profile.student_id_verified,
            boost_credits: profile.boost_credits,
        };
    },

    /**
     * Helper to wait for the database trigger to create a profile
     * Retries for up to 8 seconds (more robust for slower DB triggers)
     */
    _waitAndFetchProfile: async (userId: string): Promise<UserProfile | null> => {
        const MAX_RETRIES = 15; // Increased attempts but shorter delay
        const DELAY_MS = 300;   // Significantly reduced delay (was 1000ms)

        for (let i = 0; i < MAX_RETRIES; i++) {
            try {
                const { data: profile, error } = await supabase
                    .from('profiles')
                    .select('id, email, name, role, verification_status, avatar, id_document_url, bio, phone_number, student_id_verified, boost_credits')
                    .eq('id', userId)
                    .maybeSingle();

                if (profile && !error) {
                    console.log(`[AuthService] Profile found on attempt ${i + 1} (${(i + 1) * DELAY_MS}ms)`);
                    return authService._mapProfile(profile);
                }

                if (error) {
                    console.error(`[AuthService] Error fetching profile (attempt ${i + 1}):`, error.message);
                }
            } catch (err: any) {
                console.error(`[AuthService] Unexpected error during profile fetch:`, err.message);
            }

            await new Promise(resolve => setTimeout(resolve, DELAY_MS));
        }

        console.error(`[AuthService] Timeout: Profile creation failed for user ${userId}`);
        return null;
    },

    signOut: async () => {
        if (IS_SUPABASE_CONFIGURED) {
            await supabase.auth.signOut();
        }
        await AsyncStorage.removeItem(AUTH_KEY);
    },

    getCurrentSession: async () => {
        const stored = await AsyncStorage.getItem(AUTH_KEY);
        return stored ? JSON.parse(stored) : null;
    },

    updateProfile: async (userId: string, updates: Partial<UserProfile>): Promise<UserProfile> => {
        if (IS_SUPABASE_CONFIGURED) {
            const { data, error } = await supabase
                .from('profiles')
                .update(updates)
                .eq('id', userId)
                .select()
                .single();

            if (error) throw error;

            const updatedProfile = authService._mapProfile(data);

            const storedAuth = await AsyncStorage.getItem(AUTH_KEY);
            if (storedAuth) {
                const authData = JSON.parse(storedAuth);
                if (authData.profile.id === userId) {
                    authData.profile = updatedProfile;
                    await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(authData));
                }
            }
            return updatedProfile;
        }

        // Simulation Mode Fallback
        const users = await authService._getAllUsers();
        const index = users.findIndex(u => u.id === userId);

        if (index === -1) throw new Error('User not found');

        users[index] = { ...users[index], ...updates };
        await authService._saveAllUsers(users);

        const storedAuth = await AsyncStorage.getItem(AUTH_KEY);
        if (storedAuth) {
            const authData = JSON.parse(storedAuth);
            if (authData.profile.id === userId) {
                authData.profile = users[index];
                await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(authData));
            }
        }

        return users[index];
    },

    // Admin Simulation
    getPendingVerifications: async (): Promise<UserProfile[]> => {
        if (IS_SUPABASE_CONFIGURED) {
            const { data, error } = await supabase
                .from('profiles')
                .select('id, email, name, role, verification_status, avatar, id_document_url, bio, phone_number, student_id_verified, boost_credits')
                .eq('verification_status', 'pending');

            if (error) throw error;
            return (data || []).map(authService._mapProfile);
        }

        const users = await authService._getAllUsers();
        return users.filter(u => u.role === 'student' && u.verification_status !== 'verified');
    }
};
