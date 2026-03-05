import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../services/api';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState('default');
    const [isDarkMode, setIsDarkMode] = useState(false);

    // Initial fetch from cloud
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await api.get('/user/profile');
                if (response.data.theme) setTheme(response.data.theme);
                if (response.data.dark_mode !== undefined) setIsDarkMode(response.data.dark_mode);
            } catch (error) {
                console.warn('Theme fetch failed or unauthorized:', error.message);
                // System default as fallback
                setIsDarkMode(window.matchMedia('(prefers-color-scheme: dark)').matches);
            }
        };
        fetchSettings();
    }, []);

    useEffect(() => {
        // Apply theme attribute
        document.documentElement.setAttribute('data-theme', theme);

        // Apply dark mode class
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }

        // Only save to cloud if we are authenticated
        api.post('/user/profile', {
            theme,
            dark_mode: isDarkMode
        }).catch(err => {
            // Silently fail if not logged in (e.g. on login page)
            if (err.response?.status !== 401) {
                console.error('Failed to sync theme to cloud:', err);
            }
        });
    }, [theme, isDarkMode]);

    const toggleTheme = (newTheme) => setTheme(newTheme);
    const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

    return (
        <ThemeContext.Provider value={{ theme, isDarkMode, toggleTheme, toggleDarkMode }}>
            {children}
        </ThemeContext.Provider>
    );
};
