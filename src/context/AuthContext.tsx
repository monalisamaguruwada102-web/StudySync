import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { authService } from '../services/auth.service';

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (name: string, email: string, password: string, role: UserRole) => Promise<void>;
    logout: () => void;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const initAuth = async () => {
            try {
                const session = await authService.getCurrentSession();
                console.log('Auth Init: Session found:', !!session);
                if (session?.user) {
                    const profile = session.profile;
                    console.log('Auth Init: User Profile:', profile.name, profile.role);
                    setUser({
                        id: profile.id,
                        email: profile.email,
                        name: profile.name,
                        role: profile.role,
                        verificationStatus: profile.verification_status,
                    });
                }
            } catch (error) {
                console.error('Auth Init Error:', error);
            } finally {
                setIsLoading(false);
            }
        };
        initAuth();
    }, []);

    const login = async (email: string, password: string) => {
        setIsLoading(true);
        try {
            const { profile } = await authService.login(email, password);
            setUser({
                id: profile.id,
                email: profile.email,
                name: profile.name,
                role: profile.role,
                verificationStatus: profile.verification_status,
            });
        } catch (error: any) {
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const register = async (name: string, email: string, password: string, role: UserRole) => {
        setIsLoading(true);
        try {
            const { profile } = await authService.register(name, email, password, role);
            setUser({
                id: profile.id,
                email: profile.email,
                name: profile.name,
                role: profile.role,
                verificationStatus: profile.verification_status,
            });
        } catch (error: any) {
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        await authService.signOut();
        setUser(null);
    };

    const refreshUser = async () => {
        try {
            const session = await authService.getCurrentSession();
            if (session?.user) {
                const profile = session.profile;
                setUser({
                    id: profile.id,
                    email: profile.email,
                    name: profile.name,
                    role: profile.role,
                    verificationStatus: profile.verification_status,
                    avatar: profile.avatar, // Ensure avatar is propagated
                });
            }
        } catch (error) {
            console.error('Failed to refresh user', error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, login, register, logout, refreshUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
