import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Dimensions,
    Alert,
    ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { User, Mail, Lock, UserPlus, GraduationCap, Building2, CheckCircle2 } from 'lucide-react-native';

import { Colors, Spacing, Typography } from '../../theme/Theme';
import { useAuth } from '../../context/AuthContext';
import { CustomInput } from '../../components/CustomInput';
import { CustomButton } from '../../components/CustomButton';

const { width } = Dimensions.get('window');

export const RegisterScreen = () => {
    const navigation = useNavigation<any>();
    const { register } = useAuth();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<'student' | 'owner'>('student');
    const [loading, setLoading] = useState(false);

    const handleRegister = async () => {
        if (!name || !email || !password) {
            Alert.alert('Missing Info', 'Please fill in all fields to create your account.');
            return;
        }

        setLoading(true);
        try {
            await register(name, email, password, role);
            // navigation is handled by AuthContext state change in AppNavigator
        } catch (error: any) {
            Alert.alert('Registration Error', error.message || 'Could not create account.');
        } finally {
            setLoading(false);
        }
    };

    const RoleCard = ({ type, label, icon: Icon }: any) => (
        <TouchableOpacity
            style={[styles.roleCard, role === type && styles.activeRoleCard]}
            onPress={() => setRole(type)}
            activeOpacity={0.8}
        >
            <View style={[styles.roleIcon, role === type && styles.activeRoleIcon]}>
                <Icon size={24} color={role === type ? Colors.white : Colors.textLight} />
            </View>
            <Text style={[styles.roleLabel, role === type && styles.activeRoleLabel]}>{label}</Text>
            {role === type && (
                <View style={styles.checkIcon}>
                    <CheckCircle2 size={16} color={Colors.primary} fill="white" />
                </View>
            )}
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                    <View style={styles.header}>
                        <Text style={styles.title}>Join Off Rez</Text>
                        <Text style={styles.subtitle}>Create your account for Zimbabwe's top boarding marketplace</Text>
                    </View>

                    <View style={styles.roleSection}>
                        <Text style={styles.sectionTitle}>I am a...</Text>
                        <View style={styles.roleContainer}>
                            <RoleCard type="student" label="Student" icon={GraduationCap} />
                            <RoleCard type="owner" label="Owner" icon={Building2} />
                        </View>
                    </View>

                    <View style={styles.formCard}>
                        <View style={styles.inputWrapper}>
                            <User size={18} color={Colors.textLight} style={styles.inputIcon} />
                            <CustomInput
                                placeholder="Full Name"
                                value={name}
                                onChangeText={setName}
                                style={styles.field}
                            />
                        </View>

                        <View style={styles.inputWrapper}>
                            <Mail size={18} color={Colors.textLight} style={styles.inputIcon} />
                            <CustomInput
                                placeholder="Email Address"
                                value={email}
                                onChangeText={setEmail}
                                autoCapitalize="none"
                                keyboardType="email-address"
                                style={styles.field}
                            />
                        </View>

                        <View style={styles.inputWrapper}>
                            <Lock size={18} color={Colors.textLight} style={styles.inputIcon} />
                            <CustomInput
                                placeholder="Create Password"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                                style={styles.field}
                            />
                        </View>

                        <Text style={styles.termsText}>
                            By signing up, you agree to our <Text style={styles.link}>Terms of Service</Text> and <Text style={styles.link}>Privacy Policy</Text>.
                        </Text>

                        <CustomButton
                            title="Create Account"
                            onPress={handleRegister}
                            loading={loading}
                            style={styles.registerBtn}
                        />
                    </View>

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Already have an account?</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.loginLink}>
                            <Text style={styles.loginLinkText}>Log In</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f1f5f9',
    },
    scrollContent: {
        padding: Spacing.l,
        flexGrow: 1,
    },
    header: {
        marginTop: Spacing.l,
        marginBottom: Spacing.xl,
    },
    title: {
        ...Typography.h1,
        fontSize: 32,
        color: Colors.text,
    },
    subtitle: {
        ...Typography.caption,
        marginTop: 8,
        color: Colors.textLight,
    },
    roleSection: {
        marginBottom: Spacing.xl,
    },
    sectionTitle: {
        ...Typography.caption,
        fontWeight: '800',
        marginBottom: 12,
        color: Colors.text,
        textTransform: 'uppercase',
    },
    roleContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    roleCard: {
        width: '48%',
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 24,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    activeRoleCard: {
        borderColor: Colors.primary,
        backgroundColor: '#eff6ff',
    },
    roleIcon: {
        width: 54,
        height: 54,
        borderRadius: 18,
        backgroundColor: '#f8fafc',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    activeRoleIcon: {
        backgroundColor: Colors.primary,
    },
    roleLabel: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.textLight,
    },
    activeRoleLabel: {
        color: Colors.primary,
    },
    checkIcon: {
        position: 'absolute',
        top: 10,
        right: 10,
    },
    formCard: {
        backgroundColor: 'white',
        padding: Spacing.l,
        borderRadius: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.05,
        shadowRadius: 20,
        elevation: 5,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.m,
    },
    inputIcon: {
        position: 'absolute',
        left: 14,
        zIndex: 1,
        bottom: 18,
    },
    field: {
        flex: 1,
        paddingLeft: 44,
        backgroundColor: '#f8fafc',
        borderRadius: 16,
        height: 56,
    },
    termsText: {
        fontSize: 12,
        color: Colors.textLight,
        textAlign: 'center',
        marginTop: Spacing.s,
        marginBottom: Spacing.l,
        lineHeight: 18,
    },
    link: {
        color: Colors.primary,
        fontWeight: '700',
    },
    registerBtn: {
        height: 56,
        borderRadius: 18,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: Spacing.xl,
        marginBottom: Spacing.xl,
    },
    footerText: {
        color: Colors.textLight,
        fontSize: 15,
    },
    loginLink: {
        marginLeft: 8,
    },
    loginLinkText: {
        color: Colors.primary,
        fontSize: 15,
        fontWeight: '700',
    },
});
