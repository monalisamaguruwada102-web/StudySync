import React, { useEffect } from 'react';
import { View, ActivityIndicator, StatusBar } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, MessageSquare, User, LayoutDashboard, ListPlus, Heart, Map as MapIcon } from 'lucide-react-native';

import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Theme } from '../theme/Theme';

// Auth Screens
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';

// Student Screens
import { HomeListingScreen } from '../screens/student/HomeListingScreen';
import { ListingDetailsScreen } from '../screens/student/ListingDetailsScreen';

// Owner Screens
import { OwnerDashboardScreen } from '../screens/owner/OwnerDashboardScreen';
import { MyListingsScreen } from '../screens/owner/MyListingsScreen';
import { CreateEditListingScreen } from '../screens/owner/CreateEditListingScreen';
import { ManageBookingsScreen } from '../screens/owner/ManageBookingsScreen';

import { SavedListingsScreen } from '../screens/student/SavedListingsScreen';
import { MapScreen } from '../screens/student/MapScreen';
import { ProfileScreen } from '../screens/student/ProfileScreen';
import { PaymentScreen } from '../screens/student/PaymentScreen';
import { AnalyticsDetailScreen } from '../screens/owner/AnalyticsDetailScreen';
import { VerificationScreen } from '../screens/auth/VerificationScreen';
import { OnboardingScreen } from '../screens/auth/OnboardingScreen';
import { AdminDashboardScreen } from '../screens/admin/AdminDashboardScreen';
import { BoostListingScreen } from '../screens/owner/BoostListingScreen';
import { SupportScreen } from '../screens/support/SupportScreen';
import { LegalScreen } from '../screens/support/LegalScreen';
import { PaymentHistoryScreen } from '../screens/student/PaymentHistoryScreen';
import { SupportBotScreen } from '../screens/support/SupportBotScreen';
import { MyBookingsScreen } from '../screens/student/MyBookingsScreen';

// Chat
import { ChatListScreen } from '../screens/chat/ChatListScreen';
import { ChatRoomScreen } from '../screens/chat/ChatRoomScreen';
import { notificationService } from '../services/notifications.service';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const StudentTabs = () => {
    const { isDark } = useTheme();
    const colors = isDark ? Theme.Dark.Colors : Theme.Light.Colors;

    return (
        <Tab.Navigator
            screenOptions={{
                tabBarActiveTintColor: colors.primary,
                tabBarInactiveTintColor: colors.textLight,
                tabBarStyle: {
                    backgroundColor: colors.surface,
                    borderTopColor: colors.border,
                    elevation: 0,
                    shadowOpacity: 0,
                    height: 60,
                    paddingBottom: 8,
                },
                headerStyle: {
                    backgroundColor: colors.surface,
                    elevation: 0,
                    shadowOpacity: 0,
                },
                headerTintColor: colors.text,
                headerShown: false, // We use custom headers in screens
            }}
        >
            <Tab.Screen
                name="Explore"
                component={HomeListingScreen}
                options={{ tabBarIcon: ({ color, size }) => <Home color={color} size={size} /> }}
            />
            <Tab.Screen
                name="Messages"
                component={ChatListScreen}
                options={{ tabBarIcon: ({ color, size }) => <MessageSquare color={color} size={size} /> }}
            />
            <Tab.Screen
                name="Saved"
                component={SavedListingsScreen}
                options={{ tabBarIcon: ({ color, size }) => <Heart color={color} size={size} /> }}
            />
            <Tab.Screen
                name="Profile"
                component={ProfileScreen}
                options={{ tabBarIcon: ({ color, size }) => <User color={color} size={size} /> }}
            />
        </Tab.Navigator>
    );
};

const OwnerTabs = () => {
    const { isDark } = useTheme();
    const colors = isDark ? Theme.Dark.Colors : Theme.Light.Colors;

    return (
        <Tab.Navigator
            screenOptions={{
                tabBarActiveTintColor: colors.primary,
                tabBarInactiveTintColor: colors.textLight,
                tabBarStyle: {
                    backgroundColor: colors.surface,
                    borderTopColor: colors.border,
                    elevation: 0,
                    shadowOpacity: 0,
                    height: 60,
                    paddingBottom: 8,
                },
                headerStyle: {
                    backgroundColor: colors.surface,
                    elevation: 0,
                    shadowOpacity: 0,
                },
                headerTintColor: colors.text,
                headerShown: false,
            }}
        >
            <Tab.Screen
                name="Dashboard"
                component={OwnerDashboardScreen}
                options={{ tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size} /> }}
            />
            <Tab.Screen
                name="My Listings"
                component={MyListingsScreen}
                options={{ tabBarIcon: ({ color, size }) => <ListPlus color={color} size={size} /> }}
            />
            <Tab.Screen
                name="Messages"
                component={ChatListScreen}
                options={{ tabBarIcon: ({ color, size }) => <MessageSquare color={color} size={size} /> }}
            />
            <Tab.Screen
                name="Profile"
                component={ProfileScreen}
                options={{ tabBarIcon: ({ color, size }) => <User color={color} size={size} /> }}
            />
        </Tab.Navigator>
    );
};

export const AppNavigator = () => {
    const { user, isLoading: authLoading } = useAuth();
    const { isDark } = useTheme();
    const colors = isDark ? Theme.Dark.Colors : Theme.Light.Colors;
    const [onboardingComplete, setOnboardingComplete] = React.useState<boolean | null>(null);

    useEffect(() => {
        checkOnboarding();
    }, []);

    const checkOnboarding = async () => {
        try {
            const value = await AsyncStorage.getItem('has-onboarded');
            setOnboardingComplete(value === 'true');
        } catch (error) {
            setOnboardingComplete(false);
        }
    };

    useEffect(() => {
        if (user?.id) {
            notificationService.registerForPushNotificationsAsync(user.id);
        }
    }, [user?.id]);

    const MyTheme = {
        ...DefaultTheme,
        colors: {
            ...DefaultTheme.colors,
            background: colors.background,
            card: colors.surface,
            text: colors.text,
            border: colors.border,
            primary: colors.primary,
        },
    };

    if (authLoading || onboardingComplete === null) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <NavigationContainer theme={isDark ? DarkTheme : DefaultTheme}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                {!user ? (
                    <>
                        {!onboardingComplete && <Stack.Screen name="Onboarding" component={OnboardingScreen} />}
                        <Stack.Screen name="Login" component={LoginScreen} />
                        <Stack.Screen name="Register" component={RegisterScreen} />
                    </>
                ) : user.role === 'student' ? (
                    <>
                        <Stack.Screen name="StudentMain" component={StudentTabs} />
                        <Stack.Screen name="ListingDetails" component={ListingDetailsScreen} />
                        <Stack.Screen name="ChatRoom" component={ChatRoomScreen} />
                        <Stack.Screen name="Map" component={MapScreen} />
                        <Stack.Screen name="Payment" component={PaymentScreen} />
                        <Stack.Screen name="Verification" component={VerificationScreen} />
                        <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
                        <Stack.Screen name="Support" component={SupportScreen} />
                        <Stack.Screen name="Legal" component={LegalScreen} />
                        <Stack.Screen name="PaymentHistory" component={PaymentHistoryScreen} />
                        <Stack.Screen name="SupportBot" component={SupportBotScreen} />
                        <Stack.Screen name="MyBookings" component={MyBookingsScreen} />
                        <Stack.Screen name="ManageBookings" component={ManageBookingsScreen} />
                    </>
                ) : (
                    <>
                        <Stack.Screen name="OwnerMain" component={OwnerTabs} />
                        <Stack.Screen name="ListingDetails" component={ListingDetailsScreen} />
                        <Stack.Screen name="ChatRoom" component={ChatRoomScreen} />
                        <Stack.Screen name="CreateEditListing" component={CreateEditListingScreen} />
                        <Stack.Screen name="AnalyticsDetail" component={AnalyticsDetailScreen} />
                        <Stack.Screen name="Verification" component={VerificationScreen} />
                        <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
                        <Stack.Screen name="BoostListing" component={BoostListingScreen} />
                        <Stack.Screen name="Support" component={SupportScreen} />
                        <Stack.Screen name="Legal" component={LegalScreen} />
                        <Stack.Screen name="PaymentHistory" component={PaymentHistoryScreen} />
                        <Stack.Screen name="SupportBot" component={SupportBotScreen} />
                        <Stack.Screen name="MyBookings" component={MyBookingsScreen} />
                        <Stack.Screen name="ManageBookings" component={ManageBookingsScreen} />
                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
};
