import React, { createContext, useContext, useEffect, useState, useMemo } from "react";
import { getCurrentUser } from "../services/authService";
import { supabase } from "../services/supabase";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const checkAuth = async () => {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
        setLoading(false);
    };

    useEffect(() => {
        checkAuth();

        // Supabase Auth State Listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                checkAuth();
            } else if (event === 'SIGNED_OUT') {
                setUser(null);
            }
        });

        const handleAuthUpdate = () => {
            checkAuth();
        };

        window.addEventListener('study-sync-auth', handleAuthUpdate);

        return () => {
            subscription.unsubscribe();
            window.removeEventListener('study-sync-auth', handleAuthUpdate);
        };
    }, []);

    const value = useMemo(() => ({
        user,
        authorized: !!user,
        loading,
        refreshAuth: checkAuth
    }), [user, loading]);

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
