import React, { createContext, useContext, useEffect, useState } from "react";
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

    useEffect(() => {
        checkAuth();
    }, []);

    const value = {
        user,
        authorized,
        loading,
        refreshAuth: checkAuth
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
