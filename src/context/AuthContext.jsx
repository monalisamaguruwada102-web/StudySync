import React, { createContext, useContext, useEffect, useState, useMemo } from "react";
import { getCurrentUser, isUserAuthorized } from "../services/authService";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [authorized, setAuthorized] = useState(false);

    const checkAuth = async () => {
        setLoading(true);
        const currentUser = await getCurrentUser();

        if (currentUser) {
            setUser(currentUser);
            const isAuth = await isUserAuthorized(currentUser);
            setAuthorized(isAuth);
        } else {
            setUser(null);
            setAuthorized(false);
        }
        setLoading(false);
    };

    const updateUser = (updates) => {
        setUser(prev => prev ? { ...prev, ...updates } : null);
    };

    useEffect(() => {
        checkAuth();

        const handleAuthUpdate = () => {
            checkAuth();
        };

        window.addEventListener('study-sync-auth', handleAuthUpdate);
        return () => window.removeEventListener('study-sync-auth', handleAuthUpdate);
    }, []);

    const value = useMemo(() => ({
        user,
        authorized,
        loading,
        refreshAuth: checkAuth,
        updateUser
    }), [user, authorized, loading]);

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
