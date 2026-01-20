import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { ThemeProvider } from './src/context/ThemeContext';
import { LanguageProvider } from './src/context/LanguageContext';
import { QueryProvider } from './src/context/QueryContext';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { AppNavigator } from './src/navigation/AppNavigator';
import './src/i18n/i18n';

export default function App() {
  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryProvider>
          <LanguageProvider>
            <ThemeProvider>
              <AuthProvider>
                <AppNavigator />
              </AuthProvider>
            </ThemeProvider>
          </LanguageProvider>
        </QueryProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
