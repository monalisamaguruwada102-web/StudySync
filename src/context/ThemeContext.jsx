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
                console.error('Failed to fetch theme from cloud:', error);
                // Fallback to local if absolutely necessary or match hardware
                const saved = localStorage.getItem('theme');
                if (saved) setTheme(saved);
                const savedDark = localStorage.getItem('darkMode');
                if (savedDark !== null) setIsDarkMode(savedDark === 'true');
                else setIsDarkMode(window.matchMedia('(prefers-color-scheme: dark)').matches);
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

        // Only save to cloud if we have a token (avoid errors on login page)
        if (localStorage.getItem('token')) {
            api.post('/user/settings', {
                theme,
                dark_mode: isDarkMode
            }).catch(err => console.error('Failed to sync theme to cloud:', err));
        }

        // Keep localStorage as a secondary fallback for flicker-free initial load
        localStorage.setItem('theme', theme);
        localStorage.setItem('darkMode', isDarkMode.toString());
    }, [theme, isDarkMode]);

    const toggleTheme = (newTheme) => setTheme(newTheme);
    const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

    return (
        <ThemeContext.Provider value={{ theme, isDarkMode, toggleTheme, toggleDarkMode }}>
            {children}
        </ThemeContext.Provider>
    );
};
