import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Theme } from '../theme/Theme';

type ThemeMode = 'light' | 'dark' | 'midnight' | 'forest';

interface ThemeContextType {
    mode: ThemeMode;
    toggleTheme: () => void;
    setTheme: (newMode: ThemeMode) => void;
    isDark: boolean;
    colors: any;
    shadows: any;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@OFF_REZ_THEME';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const systemScheme = useColorScheme();
    const [mode, setMode] = useState<ThemeMode>(systemScheme || 'light');

    useEffect(() => {
        loadTheme();
    }, []);

    const loadTheme = async () => {
        try {
            const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
            if (savedTheme) {
                setMode(savedTheme as ThemeMode);
            } else if (systemScheme) {
                setMode(systemScheme as ThemeMode);
            }
        } catch (error) {
            console.error('Failed to load theme:', error);
        }
    };

    const setTheme = useCallback(async (newMode: ThemeMode) => {
        setMode(newMode);
        try {
            await AsyncStorage.setItem(THEME_STORAGE_KEY, newMode);
        } catch (error) {
            console.error('Failed to save theme:', error);
        }
    }, []);

    const toggleTheme = useCallback(async () => {
        const nextThemes: Record<ThemeMode, ThemeMode> = {
            'light': 'dark',
            'dark': 'midnight',
            'midnight': 'forest',
            'forest': 'light'
        };
        await setTheme(nextThemes[mode]);
    }, [mode, setTheme]);

    const value = useMemo(() => ({
        mode,
        toggleTheme,
        setTheme,
        isDark: mode !== 'light',
        colors: (Theme as any)[mode].Colors,
        shadows: (Theme as any)[mode].Shadows
    }), [mode, toggleTheme, setTheme]);

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
