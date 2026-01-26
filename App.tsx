import React, { useEffect, useState } from 'react';
import { Alert, View, Text, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Updates from 'expo-updates';
import { AuthProvider } from './src/context/AuthContext';
import { ThemeProvider } from './src/context/ThemeContext';
import { LanguageProvider } from './src/context/LanguageContext';
import { QueryProvider } from './src/context/QueryContext';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { AppNavigator } from './src/navigation/AppNavigator';
import './src/i18n/i18n';
import NetInfo from '@react-native-community/netinfo';
import { syncService } from './src/services/sync.service';
import { bookingsService } from './src/services/bookings.service';
import { authService } from './src/services/auth.service';
import { chatService } from './src/services/chat.service';

export default function App() {
  const [updateStatus, setUpdateStatus] = useState<string | null>(null);

  useEffect(() => {
    async function checkForUpdates() {
      if (__DEV__) {
        console.log('[Updates] Skipping in development mode');
        return;
      }

      try {
        // Check if app just updated by checking the manifest creation time
        // This runs on every app launch
        const manifest = await Updates.checkForUpdateAsync();

        // Check if this is an emergency launch (update failed)
        if (Updates.isEmergencyLaunch) {
          console.log('[Updates] Emergency launch - update failed');
          setUpdateStatus('⚠️ Update failed, running previous version');
          setTimeout(() => setUpdateStatus(null), 5000);
          return;
        }

        // Check if we just reloaded from an update
        // Updates.createdAt represents when the currently running update bundle was created
        if (Updates.createdAt) {
          const minutesSinceUpdate = (Date.now() - new Date(Updates.createdAt).getTime()) / 1000 / 60;
          console.log('[Updates] Minutes since update created:', minutesSinceUpdate);

          // If the update was created very recently (< 1 minute), we likely just applied it
          if (minutesSinceUpdate < 1) {
            console.log('[Updates] App was just updated!');
            setUpdateStatus('✨ App updated successfully!');
            setTimeout(() => setUpdateStatus(null), 3000);
            return;
          }
        }

        // Now check if there's a new update available
        if (manifest.isAvailable) {
          console.log('[Updates] New update available, downloading...');
          setUpdateStatus('📥 Downloading update...');

          await Updates.fetchUpdateAsync();
          setUpdateStatus('✅ Update ready! Restarting...');

          setTimeout(async () => {
            await Updates.reloadAsync();
          }, 1500);
        } else {
          console.log('[Updates] App is up to date');
        }
      } catch (error) {
        console.error('[Updates] Error checking for updates:', error);
      }
    }

    checkForUpdates();
  }, []);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      if (state.isConnected) {
        console.log('[App] Device online, triggering sync');
        syncService.sync(async (action) => {
          if (action.type === 'CREATE_BOOKING') {
            await bookingsService.createBooking(action.payload);
          }
          // Add other action types here if needed
        });
      }
    });

    return () => unsubscribe();
  }, []);

  // Pre-fetch data when session is established for instant feel
  useEffect(() => {
    async function prefetchData() {
      const session = await authService.getCurrentSession();
      if (session?.profile?.id) {
        console.log('[App] Pre-fetching conversations for user:', session.profile.id);
        chatService.getConversations(session.profile.id).catch(e => console.warn('Pre-fetch failed', e));
      }
    }
    prefetchData();
  }, []);

  return (
    <SafeAreaProvider>
      {updateStatus && (
        <View style={styles.updateBanner}>
          <Text style={styles.updateText}>{updateStatus}</Text>
        </View>
      )}
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

const styles = StyleSheet.create({
  updateBanner: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    backgroundColor: '#10b981',
    padding: 16,
    borderRadius: 12,
    zIndex: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  updateText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
});
