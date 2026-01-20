import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { supabase } from './supabase';

export const notificationService = {
    registerForPushNotificationsAsync: async (userId: string) => {
        if (!Device.isDevice) {
            console.log('Must use physical device for Push Notifications');
            return null;
        }

        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }
        if (finalStatus !== 'granted') {
            console.log('Failed to get push token for push notification!');
            return null;
        }

        const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
        if (!projectId) {
            console.log('Project ID not found in Expo config');
            return null;
        }

        try {
            const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;

            // Save token to Supabase
            const { error } = await supabase
                .from('profiles')
                .update({ expo_push_token: token })
                .eq('id', userId);

            if (error) throw error;

            if (Platform.OS === 'android') {
                Notifications.setNotificationChannelAsync('default', {
                    name: 'default',
                    importance: Notifications.AndroidImportance.MAX,
                    vibrationPattern: [0, 250, 250, 250],
                    lightColor: '#FF231F7C',
                });
            }

            return token;
        } catch (e) {
            console.error('Error registering for push notifications', e);
            return null;
        }
    },

    sendNotification: async (expoPushToken: string, title: string, body: string, data = {}) => {
        const message = {
            to: expoPushToken,
            sound: 'default',
            title,
            body,
            data,
        };

        await fetch('https://exp.host/--/api/v2/push/send', {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Accept-encoding': 'gzip, deflate',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(message),
        });
    },
    scheduleLocalNotification: async (title: string, body: string, data = {}) => {
        await Notifications.scheduleNotificationAsync({
            content: {
                title,
                body,
                data,
            },
            trigger: null, // deliver immediately
        });
    },
};
