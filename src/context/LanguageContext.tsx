import React, { createContext, useContext, useState, useEffect } from 'react';
import i18n from '../i18n/i18n';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface LanguageContextType {
    language: string;
    setLanguage: (lng: string) => Promise<void>;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [language, _setLanguageState] = useState(i18n.language);

    useEffect(() => {
        const loadLanguage = async () => {
            const savedLng = await AsyncStorage.getItem('user-language');
            if (savedLng) {
                i18n.changeLanguage(savedLng);
                _setLanguageState(savedLng);
            }
        };
        loadLanguage();
    }, []);

    const setLanguage = async (lng: string) => {
        await i18n.changeLanguage(lng);
        await AsyncStorage.setItem('user-language', lng);
        _setLanguageState(lng);
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};
