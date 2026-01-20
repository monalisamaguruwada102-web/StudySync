import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile, UserRole } from '../types';
import { MOCK_USERS } from './mockData';
import { supabase, IS_SUPABASE_CONFIGURED } from './supabase';

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

            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', data.user.id)
                .single();

            if (profileError) throw profileError;

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

            const profile: UserProfile = {
                id: data.user.id,
                email,
                name,
                role,
                verification_status: 'none',
            };

            const { error: profileError } = await supabase.from('profiles').insert([profile]);
            if (profileError) throw profileError;

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

            const storedAuth = await AsyncStorage.getItem(AUTH_KEY);
            if (storedAuth) {
                const authData = JSON.parse(storedAuth);
                if (authData.profile.id === userId) {
                    authData.profile = data;
                    await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(authData));
                }
            }
            return data;
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
        const users = await authService._getAllUsers();
        return users.filter(u => u.role === 'student' && u.verification_status !== 'verified');
    }
};
