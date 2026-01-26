import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Switch,
    Alert,
    Image,
    Modal,
    TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User, Mail, Shield, LogOut, ChevronRight, Settings, Bell, Palette, Moon, Sun, ShieldCheck, Receipt, Home, LayoutDashboard, MessageCircle, Camera } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { Theme, Spacing, Typography, Shadows } from '../../theme/Theme';
import { useTranslation } from 'react-i18next';
import { authService } from '../../services/auth.service';
import { notificationService } from '../../services/notifications.service';
import * as ImagePicker from 'expo-image-picker';
import { storageService } from '../../services/storage.service';
import { UserAvatar } from '../../components/UserAvatar';
import * as FileSystem from 'expo-file-system/legacy';

export const ProfileScreen = () => {
    const navigation = useNavigation<any>();
    const { user, logout, refreshUser } = useAuth();
    const { mode, toggleTheme, isDark } = useTheme();
    const { language, setLanguage } = useLanguage();
    const { t } = useTranslation();
    const colors = isDark ? Theme.Dark.Colors : Theme.Light.Colors;
    const shadows = isDark ? Theme.Dark.Shadows : Theme.Light.Shadows;

    const [isEditModalVisible, setEditModalVisible] = React.useState(false);
    const [editName, setEditName] = React.useState(user?.name || '');
    const [editBio, setEditBio] = React.useState('');
    const [editPhone, setEditPhone] = React.useState('');
    const [editAvatar, setEditAvatar] = React.useState(user?.avatar || '');
    const [isAdminUnlocked, setIsAdminUnlocked] = React.useState(false);
    const [tapCount, setTapCount] = React.useState(0);
    const [isAdminModalVisible, setAdminModalVisible] = React.useState(false);
    const [adminCodeInput, setAdminCodeInput] = React.useState('');

    React.useEffect(() => {
        if (user) {
            setEditName(user.name || '');
            // We need to fetch the full profile to get bio and phone_number
            loadProfileDetails();
        }
    }, [user]);

    const loadProfileDetails = async () => {
        const session = await authService.getCurrentSession();
        if (session?.profile) {
            setEditBio(session.profile.bio || '');
            setEditPhone(session.profile.phone_number || '');
            setEditAvatar(session.profile.avatar || '');
        }
    };

    const uploadAvatar = async (uri: string) => {
        if (!user?.id) throw new Error('User not authenticated');
        return await storageService.uploadAvatar(user.id, uri);
    };

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to make this work!');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
        });

        if (!result.canceled) {
            setEditAvatar(result.assets[0].uri);
        }
    };

    const handleAdminUnlock = () => {
        setTapCount(prev => {
            const next = prev + 1;
            if (next === 5) {
                setAdminModalVisible(true);
                return 0;
            }
            return next;
        });
    };

    const verifyAdminCode = () => {
        if (adminCodeInput === 'ADMIN789') {
            setIsAdminUnlocked(true);
            setAdminModalVisible(false);
            setAdminCodeInput('');
            Alert.alert("Success", "Admin Dashboard unlocked!");
        } else {
            Alert.alert("Error", "Invalid code.");
            setAdminCodeInput('');
        }
    };

    const handleLogout = () => {
        Alert.alert(
            "Logout",
            "Are you sure you want to logout?",
            [
                { text: "Cancel", style: "cancel" },
                { text: "Logout", style: "destructive", onPress: logout }
            ]
        );
    };

    const SettingItem = ({ icon: Icon, label, value, onPress, showArrow = true, isLast = false, color, description }: any) => (
        <TouchableOpacity
            style={[
                styles.settingItem,
                { borderBottomColor: colors.border },
                isLast && { borderBottomWidth: 0 }
            ]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View style={[styles.settingIcon, { backgroundColor: (color || colors.primary) + '15' }]}>
                <Icon size={20} color={color || colors.primary} />
            </View>
            <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>{label}</Text>
                {description && <Text style={[styles.settingDescription, { color: colors.textLight }]}>{description}</Text>}
            </View>
            {value !== undefined ? (
                <Text style={[styles.settingValue, { color: colors.textLight }]}>{value}</Text>
            ) : showArrow ? (
                <ChevronRight size={18} color={colors.textLight} />
            ) : null}
        </TouchableOpacity>
    );

    const LangButton = ({ label, lng }: { label: string, lng: string }) => (
        <TouchableOpacity
            style={[
                styles.langBtn,
                { backgroundColor: colors.surface },
                language === lng && { backgroundColor: colors.primary }
            ]}
            onPress={() => setLanguage(lng)}
        >
            <Text style={[
                styles.langBtnText,
                { color: colors.text },
                language === lng && { color: 'white' }
            ]}>{label}</Text>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <Text style={[styles.screenTitle, { color: colors.text }]}>Profile</Text>
                    <TouchableOpacity
                        style={[styles.editBtn, { backgroundColor: colors.surface }, shadows.soft]}
                        onPress={() => setEditModalVisible(true)}
                    >
                        <Settings size={20} color={colors.text} />
                    </TouchableOpacity>
                </View>

                {/* Profile Card */}
                <View style={[styles.profileCard, { backgroundColor: colors.surface }, shadows.medium]}>
                    <View style={styles.avatarContainer}>
                        <UserAvatar uri={user?.avatar} name={user?.name} size={100} color={colors.primary} />
                        <TouchableOpacity
                            style={[styles.cameraBtn, { backgroundColor: colors.primary }]}
                            onPress={pickImage}
                        >
                            <Camera size={16} color="white" />
                        </TouchableOpacity>
                    </View>
                    <Text style={[styles.name, { color: colors.text }]}>{user?.name}</Text>
                    <Text style={[styles.email, { color: colors.textLight }]}>{user?.email}</Text>
                    <View style={[styles.roleBadge, { backgroundColor: colors.primaryLight }]}>
                        <Text style={[styles.roleText, { color: colors.primary }]}>{user?.role?.toUpperCase()}</Text>
                    </View>
                    {user?.verificationStatus === 'verified' && (
                        <View style={styles.verifiedBadge}>
                            <ShieldCheck size={16} color={colors.primary} />
                            <Text style={[styles.verifiedText, { color: colors.primary }]}>Verified</Text>
                        </View>
                    )}
                </View>

                {/* Verification Section */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Verification</Text>
                    <View style={[styles.settingsGroup, { backgroundColor: colors.surface }, shadows.soft]}>
                        <SettingItem
                            icon={ShieldCheck}
                            label="Identity Verification"
                            description="Get verified to build trust"
                            value={user?.verificationStatus === 'verified' ? 'Verified' : user?.verificationStatus === 'pending' ? 'Pending' : 'Not Verified'}
                            onPress={() => navigation.navigate('Verification')}
                            color="#3b82f6"
                            isLast={true}
                        />
                    </View>
                </View>

                {/* Language Selection */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('common.profile')} - Language</Text>
                    <View style={styles.langRow}>
                        <LangButton label="English" lng="en" />
                        <LangButton label="Shona" lng="sn" />
                        <LangButton label="Ndebele" lng="nd" />
                    </View>
                </View>

                {/* Appearance */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Appearance</Text>
                    <View style={[styles.settingsGroup, { backgroundColor: colors.surface }, shadows.soft]}>
                        <View style={styles.settingItem}>
                            <View style={[styles.settingIcon, { backgroundColor: '#8b5cf615' }]}>
                                {isDark ? <Moon size={20} color="#8b5cf6" /> : <Sun size={20} color="#f59e0b" />}
                            </View>
                            <Text style={[styles.settingLabel, { color: colors.text }]}>Dark Mode</Text>
                            <Switch
                                value={isDark}
                                onValueChange={toggleTheme}
                                trackColor={{ false: '#cbd5e1', true: colors.primary }}
                                thumbColor={colors.white}
                            />
                        </View>
                    </View>
                </View>

                {/* Account Settings */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Account</Text>
                    <View style={[styles.settingsGroup, { backgroundColor: colors.surface }, shadows.soft]}>
                        {user?.role === 'admin' && (
                            <SettingItem
                                icon={ShieldCheck}
                                label="Admin Panel"
                                description="Manage system settings"
                                color="#8b5cf6"
                                onPress={() => navigation.navigate('AdminDashboard')}
                            />
                        )}
                        <SettingItem
                            icon={User}
                            label="Personal Information"
                            description="Name, Bio, Phone"
                        />
                        <SettingItem
                            icon={Home}
                            label="My Bookings"
                            description="View past & upcoming stays"
                            onPress={() => navigation.navigate('MyBookings')}
                        />
                        <SettingItem
                            icon={Receipt}
                            label="Payment History"
                            description="Transactions & receipts"
                            onPress={() => navigation.navigate('PaymentHistory')}
                        />
                        <SettingItem
                            icon={Bell}
                            label="Notifications"
                            description="In-app alerts & emails"
                        />
                        <SettingItem
                            icon={Shield}
                            label="Security"
                            description="Password, Privacy & Safety"
                            onPress={() => navigation.navigate('Legal')}
                            isLast={true}
                        />
                    </View>
                </View>

                {/* Admin */}
                {isAdminUnlocked && (
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Administration</Text>
                        <View style={[styles.settingsGroup, { backgroundColor: colors.surface }, shadows.soft]}>
                            <SettingItem
                                icon={LayoutDashboard}
                                label="Admin Dashboard"
                                color={colors.primary}
                                onPress={() => navigation.navigate('AdminDashboard')}
                                isLast={true}
                            />
                        </View>
                    </View>
                )}

                {/* Support */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Support</Text>
                    <View style={[styles.settingsGroup, { backgroundColor: colors.surface }, shadows.soft]}>
                        <SettingItem
                            icon={MessageCircle}
                            label="Help & Support"
                            description="Chat with us via WhatsApp"
                            onPress={() => navigation.navigate('Support')}
                        />
                        <SettingItem
                            icon={Palette}
                            label="Guidelines"
                            description="Terms of Service & Usage"
                            onPress={handleAdminUnlock}
                            isLast={true}
                        />
                    </View>
                </View>

                {/* Logout */}
                <TouchableOpacity
                    style={[styles.logoutBtn, { borderTopColor: colors.border }]}
                    onPress={handleLogout}
                >
                    <LogOut size={22} color={colors.error} />
                    <Text style={[styles.logoutText, { color: colors.error }]}>Log Out</Text>
                </TouchableOpacity>

                <View style={{ height: 40 }} />
            </ScrollView>

            <Modal
                visible={isEditModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setEditModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: colors.text }]}>Edit Profile</Text>
                            <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                                <Text style={{ color: colors.primary, fontWeight: '700' }}>Cancel</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={{ flex: 1 }}>
                            <View style={styles.modalInputGroup}>
                                <Text style={[styles.inputLabel, { color: colors.textLight }]}>Full Name</Text>
                                <TextInput
                                    style={[styles.modalInput, { backgroundColor: colors.surface, color: colors.text }]}
                                    value={editName}
                                    onChangeText={setEditName}
                                    placeholder="Enter your name"
                                    placeholderTextColor={colors.textLight}
                                />
                            </View>

                            <View style={styles.modalInputGroup}>
                                <Text style={[styles.inputLabel, { color: colors.textLight }]}>Phone Number</Text>
                                <TextInput
                                    style={[styles.modalInput, { backgroundColor: colors.surface, color: colors.text }]}
                                    value={editPhone}
                                    onChangeText={setEditPhone}
                                    placeholder="Enter your phone number"
                                    placeholderTextColor={colors.textLight}
                                    keyboardType="phone-pad"
                                />
                            </View>

                            <View style={styles.modalInputGroup}>
                                <Text style={[styles.inputLabel, { color: colors.textLight }]}>Bio / Personal Info</Text>
                                <TextInput
                                    style={[styles.modalInput, { backgroundColor: colors.surface, color: colors.text, height: 100 }]}
                                    value={editBio}
                                    onChangeText={setEditBio}
                                    multiline
                                    placeholder="Tell us about yourself..."
                                    placeholderTextColor={colors.textLight}
                                />
                            </View>

                            <TouchableOpacity
                                style={[styles.saveBtn, { backgroundColor: colors.primary }]}
                                onPress={async () => {
                                    try {
                                        if (user?.id) {
                                            let finalAvatar = editAvatar;
                                            if (editAvatar && !editAvatar.startsWith('http')) {
                                                finalAvatar = await uploadAvatar(editAvatar);
                                            }

                                            await authService.updateProfile(user.id, {
                                                name: editName,
                                                bio: editBio,
                                                phone_number: editPhone,
                                                avatar: finalAvatar
                                            });

                                            await refreshUser(); // Refresh global user state

                                            await notificationService.scheduleLocalNotification(
                                                'Profile Updated',
                                                'Your profile changes have been saved successfully.'
                                            );
                                            setEditModalVisible(false);
                                        }
                                    } catch (error) {
                                        console.error(error);
                                        Alert.alert('Error', 'Failed to update profile');
                                    }
                                }}
                            >
                                <Text style={styles.saveBtnText}>Save Changes</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
            {/* Admin Unlock Modal */}
            <Modal
                visible={isAdminModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setAdminModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.background, height: 350 }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: colors.text }]}>Admin Access</Text>
                            <TouchableOpacity onPress={() => setAdminModalVisible(false)}>
                                <Text style={{ color: colors.primary, fontWeight: '700' }}>Cancel</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.modalInputGroup}>
                            <Text style={[styles.inputLabel, { color: colors.textLight }]}>Enter Administrator Code</Text>
                            <TextInput
                                style={[styles.modalInput, { backgroundColor: colors.surface, color: colors.text }]}
                                value={adminCodeInput}
                                onChangeText={setAdminCodeInput}
                                placeholder="Enter code"
                                placeholderTextColor={colors.textLight}
                                secureTextEntry={true}
                            />
                        </View>

                        <TouchableOpacity
                            style={[styles.saveBtn, { backgroundColor: colors.primary, marginTop: 20 }]}
                            onPress={verifyAdminCode}
                        >
                            <Text style={styles.saveBtnText}>Unlock Admin Panel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    // ... existing styles ...
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        height: '80%',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        padding: 24,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: '800',
    },
    modalInputGroup: {
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 8,
        marginLeft: 4,
    },
    modalInput: {
        borderRadius: 16,
        padding: 16,
        fontSize: 16,
    },
    saveBtn: {
        height: 60,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
    },
    saveBtnText: {
        color: 'white',
        fontSize: 18,
        fontWeight: '800',
    },
    scrollContent: {
        padding: Spacing.l,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.xl,
    },
    screenTitle: {
        ...Typography.h1,
        fontSize: 28,
    },
    editBtn: {
        width: 44,
        height: 44,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    profileCard: {
        alignItems: 'center',
        padding: 24,
        borderRadius: 32,
        marginBottom: Spacing.xl,
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 16,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 32,
    },
    cameraBtn: {
        position: 'absolute',
        bottom: -5,
        right: -5,
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: 'white',
    },
    name: {
        ...Typography.h2,
        marginBottom: 4,
    },
    email: {
        ...Typography.caption,
        fontSize: 15,
        marginBottom: 12,
    },
    roleBadge: {
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 12,
    },
    roleText: {
        fontSize: 12,
        fontWeight: '800',
    },
    verifiedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
    },
    verifiedText: {
        fontSize: 14,
        fontWeight: '700',
        marginLeft: 4,
    },
    section: {
        marginBottom: Spacing.xl,
    },
    sectionTitle: {
        ...Typography.h3,
        marginBottom: Spacing.m,
        marginLeft: 4,
    },
    settingsGroup: {
        borderRadius: 24,
        overflow: 'hidden',
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
    },
    settingIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    settingLabel: {
        flex: 1,
        fontSize: 16,
        fontWeight: '600',
    },
    settingValue: {
        fontSize: 14,
        fontWeight: '500',
        marginRight: 8,
    },
    settingDescription: {
        fontSize: 12,
        marginTop: 2,
    },
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 24,
        borderTopWidth: 1,
        marginTop: 10,
    },
    logoutText: {
        fontSize: 18,
        fontWeight: '700',
        marginLeft: 12,
    },
    langRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
    },
    langBtn: {
        flex: 1,
        height: 48,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 4,
    },
    langBtnText: {
        fontWeight: '700',
        fontSize: 14,
    },
});
