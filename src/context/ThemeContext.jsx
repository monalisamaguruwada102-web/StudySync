import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState(() => {
        const saved = localStorage.getItem('theme');
        return saved || 'default';
    });

    const [isDarkMode, setIsDarkMode] = useState(() => {
        const saved = localStorage.getItem('darkMode');
        if (saved !== null) return saved === 'true';
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
    });

    useEffect(() => {
        // Apply theme attribute
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);

        // Apply dark mode class
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('darkMode', 'true');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('darkMode', 'false');
        }
    }, [theme, isDarkMode]);

    const toggleTheme = (newTheme) => setTheme(newTheme);
    const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

    return (
        <ThemeContext.Provider value={{ theme, isDarkMode, toggleTheme, toggleDarkMode }}>
            {children}
        </ThemeContext.Provider>
    );
};
