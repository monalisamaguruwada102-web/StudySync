import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Share,
    Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { CheckCircle2, Share2, Home, Download, Printer } from 'lucide-react-native';
import { Theme, Spacing, Typography, Shadows } from '../../theme/Theme';
import { useTheme } from '../../context/ThemeContext';

export const PaymentReceiptScreen = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { paymentData, listing } = route.params || {};
    const { isDark } = useTheme();
    const colors = isDark ? Theme.Dark.Colors : Theme.Light.Colors;
    const shadows = isDark ? Theme.Dark.Shadows : Theme.Light.Shadows;

    const handleShare = async () => {
        try {
            await Share.share({
                message: `Payment Receipt\nProperty: ${listing?.propertyName || listing?.title}\nAmount: $${listing?.price}\nRef: ${paymentData?.clientReference || paymentData?.id}\nStatus: SUCCESS`,
            });
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.successHeader}>
                    <View style={[styles.iconContainer, { backgroundColor: colors.primary + '15' }]}>
                        <CheckCircle2 size={64} color={colors.primary} />
                    </View>
                    <Text style={[styles.successTitle, { color: colors.text }]}>Payment Successful</Text>
                    <Text style={[styles.successSubtitle, { color: colors.textLight }]}>
                        Your room has been secured successfully!
                    </Text>
                </View>

                <View style={[styles.receiptCard, { backgroundColor: colors.surface }, shadows.soft]}>
                    <Text style={[styles.receiptHeader, { color: colors.text }]}>Receipt Details</Text>
                    <View style={[styles.divider, { backgroundColor: colors.border }]} />

                    <View style={styles.detailRow}>
                        <Text style={[styles.detailLabel, { color: colors.textLight }]}>Reference</Text>
                        <Text style={[styles.detailVal, { color: colors.text }]}>{paymentData?.clientReference || paymentData?.id || 'N/A'}</Text>
                    </View>

                    <View style={styles.detailRow}>
                        <Text style={[styles.detailLabel, { color: colors.textLight }]}>Date</Text>
                        <Text style={[styles.detailVal, { color: colors.text }]}>{new Date().toLocaleDateString()}</Text>
                    </View>

                    <View style={styles.detailRow}>
                        <Text style={[styles.detailLabel, { color: colors.textLight }]}>Property</Text>
                        <Text style={[styles.detailVal, { color: colors.text }]} numberOfLines={1}>
                            {listing?.propertyName || listing?.title}
                        </Text>
                    </View>

                    <View style={styles.detailRow}>
                        <Text style={[styles.detailLabel, { color: colors.textLight }]}>Payment Method</Text>
                        <Text style={[styles.detailVal, { color: colors.text }]}>ClicknPay Online</Text>
                    </View>

                    <View style={[styles.divider, { backgroundColor: colors.border }]} />

                    <View style={styles.totalRow}>
                        <Text style={[styles.totalLabel, { color: colors.text }]}>Total Amount</Text>
                        <Text style={[styles.totalVal, { color: colors.primary }]}>${listing?.price || '0.00'}</Text>
                    </View>
                </View>

                <View style={styles.actionButtons}>
                    <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: colors.surface }, shadows.soft]}
                        onPress={handleShare}
                    >
                        <Share2 size={20} color={colors.text} />
                        <Text style={[styles.actionBtnText, { color: colors.text }]}>Share Receipt</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: colors.surface }, shadows.soft]}
                        onPress={() => { }}
                    >
                        <Printer size={20} color={colors.text} />
                        <Text style={[styles.actionBtnText, { color: colors.text }]}>Print / PDF</Text>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity
                    style={[styles.homeBtn, { backgroundColor: colors.primary }, shadows.strong]}
                    onPress={() => navigation.navigate('StudentMain')}
                >
                    <Home size={20} color="white" />
                    <Text style={styles.homeBtnText}>Back to Home</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        padding: Spacing.l,
        alignItems: 'center',
    },
    successHeader: {
        alignItems: 'center',
        marginTop: 40,
        marginBottom: 32,
    },
    iconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    successTitle: {
        fontSize: 24,
        fontWeight: '800',
        marginBottom: 8,
    },
    successSubtitle: {
        fontSize: 15,
        textAlign: 'center',
    },
    receiptCard: {
        width: '100%',
        padding: 24,
        borderRadius: 24,
        marginBottom: 24,
    },
    receiptHeader: {
        fontSize: 18,
        fontWeight: '800',
        marginBottom: 16,
    },
    divider: {
        height: 1,
        marginVertical: 16,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    detailLabel: {
        fontSize: 14,
        fontWeight: '500',
    },
    detailVal: {
        fontSize: 14,
        fontWeight: '700',
        maxWidth: '60%',
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    totalLabel: {
        fontSize: 16,
        fontWeight: '800',
    },
    totalVal: {
        fontSize: 22,
        fontWeight: '800',
    },
    actionButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginBottom: 24,
    },
    actionBtn: {
        flex: 0.48,
        height: 56,
        borderRadius: 16,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionBtnText: {
        fontSize: 14,
        fontWeight: '700',
        marginLeft: 8,
    },
    homeBtn: {
        width: '100%',
        height: 60,
        borderRadius: 20,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 40,
    },
    homeBtnText: {
        color: 'white',
        fontSize: 18,
        fontWeight: '800',
        marginLeft: 10,
    }
});
