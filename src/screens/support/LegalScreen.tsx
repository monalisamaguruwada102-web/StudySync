import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Shield, Lock, Eye, FileCheck } from 'lucide-react-native';
import { Theme, Spacing, Typography } from '../../theme/Theme';
import { useTheme } from '../../context/ThemeContext';

export const LegalScreen = () => {
    const { isDark } = useTheme();
    const colors = isDark ? Theme.Dark.Colors : Theme.Light.Colors;

    const PolicySection = ({ icon: Icon, title, content }: any) => (
        <View style={styles.policySection}>
            <View style={[styles.iconBar, { backgroundColor: colors.primary + '15' }]}>
                <Icon size={20} color={colors.primary} />
                <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
            </View>
            <Text style={[styles.policyText, { color: colors.textLight }]}>{content}</Text>
        </View>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <Text style={[styles.title, { color: colors.text }]}>Security & Privacy</Text>
                    <Text style={[styles.lastUpdated, { color: colors.textLight }]}>Last Updated: January 2026</Text>
                </View>

                <PolicySection
                    icon={Shield}
                    title="Our Commitment"
                    content="Off Rez Connect is dedicated to providing a safe and trusted marketplace for students and property owners in Zimbabwe. We prioritize your security above all else."
                />

                <PolicySection
                    icon={Lock}
                    title="Data Protection"
                    content="Your personal information, including identification documents and contact details, are encrypted and stored securely. We do not sell your data to third parties."
                />

                <PolicySection
                    icon={Eye}
                    title="Transparency"
                    content="We only collect information necessary to facilitate room bookings and user verifications. You have full control over your profile and can request data deletion at any time."
                />

                <PolicySection
                    icon={FileCheck}
                    title="Terms of Service"
                    content="By using this platform, you agree to provide accurate information and respect other users. Owners must provide genuine property details, and students must adhere to booking ethics."
                />
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { padding: Spacing.l },
    header: { marginBottom: Spacing.xl, alignItems: 'center' },
    title: { ...Typography.h1, fontSize: 28 },
    lastUpdated: { ...Typography.caption, marginTop: 4 },
    policySection: { marginBottom: Spacing.xl },
    iconBar: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        marginBottom: 12,
    },
    sectionTitle: { fontSize: 18, fontWeight: '700', marginLeft: 12 },
    policyText: { fontSize: 15, lineHeight: 24 },
});
