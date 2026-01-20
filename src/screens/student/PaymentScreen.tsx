import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    ScrollView,
    Alert,
    Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ChevronLeft, CreditCard, ShieldCheck, Lock, CheckCircle2 } from 'lucide-react-native';

import { Theme, Spacing, Typography, Shadows } from '../../theme/Theme';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { notificationService } from '../../services/notifications.service';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { paymentService } from '../../services/payment.service';

export const PaymentScreen = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { listing } = route.params;
    const { user } = useAuth();
    const { isDark } = useTheme();
    const colors = isDark ? Theme.Dark.Colors : Theme.Light.Colors;
    const shadows = isDark ? Theme.Dark.Shadows : Theme.Light.Shadows;

    const [paymentMethod, setPaymentMethod] = useState<'whatsapp_manual'>('whatsapp_manual');
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [reference, setReference] = useState('');

    React.useEffect(() => {
        setReference(paymentService.generateReference('BK'));
    }, []);

    const handleManualSubmit = async () => {
        setIsProcessing(true);
        try {
            await paymentService.submitManualPayment(user?.id || 'guest', {
                amount: listing.price,
                reference: reference,
                serviceName: `Room Booking: ${listing.propertyName || listing.title}`,
                propertyId: listing.id,
                phoneNumber: user?.phone || undefined
            });

            setTimeout(() => {
                setIsProcessing(false);
                setIsSuccess(true);
                notificationService.scheduleLocalNotification(
                    'Payment Submitted! ⏳',
                    'Your payment is now being verified. This typically takes a few minutes.'
                );
            }, 1500);
        } catch (error) {
            setIsProcessing(false);
            Alert.alert('Error', 'Failed to submit payment proof. Please try again.');
        }
    };

    const handleWhatsAppPay = async () => {
        await paymentService.openWhatsAppPayment(
            reference,
            listing.price,
            `Room Booking: ${listing.propertyName || listing.title}`
        );
    };

    const copyToClipboard = () => {
        Alert.alert('Copied!', 'Reference copied to clipboard.');
    };

    if (isSuccess) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
                <View style={styles.successContainer}>
                    <View style={[styles.successIconBox, { backgroundColor: colors.primary + '15' }]}>
                        <CheckCircle2 size={64} color={colors.primary} />
                    </View>
                    <View style={[styles.receiptCard, { backgroundColor: colors.surface }, shadows.soft]}>
                        <Text style={styles.receiptTitle}>Payment Submitted</Text>
                        <View style={[styles.receiptDivider, { backgroundColor: colors.border }]} />

                        <View style={styles.receiptRow}>
                            <Text style={[styles.receiptLabel, { color: colors.textLight }]}>Status</Text>
                            <Text style={[styles.receiptValue, { color: '#f59e0b', fontWeight: '800' }]}>PENDING VERIFICATION</Text>
                        </View>
                        <View style={styles.receiptRow}>
                            <Text style={[styles.receiptLabel, { color: colors.textLight }]}>Reference</Text>
                            <Text style={[styles.receiptValue, { color: colors.text }]}>#{reference}</Text>
                        </View>
                        <View style={styles.receiptRow}>
                            <Text style={[styles.receiptLabel, { color: colors.textLight }]}>Property</Text>
                            <Text style={[styles.receiptValue, { color: colors.text }]} numberOfLines={1}>{listing.propertyName || listing.title}</Text>
                        </View>
                        <View style={styles.receiptRow}>
                            <Text style={[styles.receiptLabel, { color: colors.textLight }]}>Amount Due</Text>
                            <Text style={[styles.receiptValue, { color: colors.text, fontWeight: '700' }]}>${listing.price}</Text>
                        </View>
                        <View style={styles.receiptRow}>
                            <Text style={[styles.receiptLabel, { color: colors.textLight }]}>Instruction</Text>
                            <Text style={[styles.receiptValue, { color: colors.text }]}>Manual Verification</Text>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[styles.doneBtn, { backgroundColor: colors.primary }]}
                        onPress={() => navigation.navigate('StudentMain')}
                    >
                        <Text style={styles.doneBtnText}>Back to Home</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ChevronLeft size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Checkout</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <View style={[styles.summaryCard, { backgroundColor: colors.surface }, shadows.soft]}>
                    <Text style={[styles.summaryLabel, { color: colors.textLight }]}>Securing Room at</Text>
                    <Text style={[styles.propertyName, { color: colors.text }]}>{listing.propertyName || listing.title}</Text>
                    <View style={[styles.divider, { backgroundColor: colors.border }]} />
                    <View style={styles.priceRow}>
                        <Text style={[styles.priceLabel, { color: colors.text }]}>Security Deposit</Text>
                        <Text style={[styles.priceVal, { color: colors.primary }]}>${listing.price}</Text>
                    </View>
                    <Text style={[styles.notice, { color: colors.textLight }]}>
                        This deposit is refundable according to the owner's policy.
                    </Text>
                </View>

                <View style={styles.form}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Payment Instructions</Text>

                    <View style={[styles.instructionCard, { backgroundColor: colors.surface }, shadows.soft]}>
                        <View style={[styles.instructionRow, { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
                            <Text style={[styles.instLabel, { color: colors.textLight }]}>Ecocash Number</Text>
                            <Text style={[styles.instValue, { color: colors.primary }]}>0789 932 832</Text>
                        </View>
                        <View style={[styles.instructionRow, { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
                            <Text style={[styles.instLabel, { color: colors.textLight }]}>Account Name</Text>
                            <Text style={[styles.instValue, { color: colors.text }]}>Josh Boarding Payments</Text>
                        </View>
                        <View style={[styles.instructionRow, { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
                            <Text style={[styles.instLabel, { color: colors.textLight }]}>Amount Due</Text>
                            <Text style={[styles.instValue, { color: colors.text, fontWeight: '800' }]}>${listing.price}</Text>
                        </View>
                        <View style={styles.instructionRow}>
                            <Text style={[styles.instLabel, { color: colors.textLight }]}>Your Reference</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Text style={[styles.instValue, { color: colors.primary, fontWeight: '800' }]}>{reference}</Text>
                                <TouchableOpacity onPress={copyToClipboard} style={{ marginLeft: 8 }}>
                                    <View style={{ backgroundColor: colors.primary + '20', padding: 4, borderRadius: 4 }}>
                                        <Text style={{ fontSize: 10, color: colors.primary, fontWeight: '700' }}>COPY</Text>
                                    </View>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>

                    <View style={styles.whatsappNote}>
                        <Text style={[styles.noteText, { color: colors.textLight }]}>
                            1. Send the amount above to the EcoCash number provided.{"\n"}
                            2. Use the <Text style={{ fontWeight: '700', color: colors.primary }}>Reference</Text> in your payment message.{"\n"}
                            3. Tap "Pay via WhatsApp" to send your proof of payment.{"\n"}
                            4. Tap "I Have Paid" to notify us in-app.
                        </Text>
                    </View>

                    <TouchableOpacity
                        style={[styles.whatsappBtn, { backgroundColor: '#25D366' }]}
                        onPress={handleWhatsAppPay}
                    >
                        <Text style={styles.whatsappBtnText}>Pay via WhatsApp</Text>
                    </TouchableOpacity>

                    <View style={styles.verificationAlert}>
                        <ShieldCheck size={16} color={colors.secondary} />
                        <Text style={[styles.alertText, { color: colors.textLight }]}>
                            Payments are verified manually. Activation may take a few minutes.
                        </Text>
                    </View>
                </View>
            </ScrollView>

            <View style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
                <TouchableOpacity
                    style={[styles.payBtn, { backgroundColor: colors.primary }, shadows.strong]}
                    onPress={handleManualSubmit}
                    disabled={isProcessing}
                >
                    <Text style={styles.payBtnText}>
                        {isProcessing ? 'Processing...' : 'I Have Paid'}
                    </Text>
                </TouchableOpacity>
            </View>

            <Modal visible={isProcessing} transparent animationType="fade">
                <View style={[styles.processingOverlay, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
                    <View style={[styles.processingCard, { backgroundColor: colors.surface }]}>
                        <View style={[styles.processingIcon, { backgroundColor: colors.primary + '15' }]}>
                            <Lock size={32} color={colors.primary} />
                        </View>
                        <Text style={[styles.processingTitle, { color: colors.text }]}>Processing Payment</Text>
                        <Text style={[styles.processingText, { color: colors.textLight }]}>Notifying administrator of your payment proof...</Text>
                        <View style={styles.loadingBarContainer}>
                            <View style={[styles.loadingBar, { backgroundColor: colors.primary }]} />
                        </View>
                        <Text style={[styles.securityLabel, { color: colors.textLight }]}>Manual Verification In Progress</Text>
                    </View>
                </View>
            </Modal>
        </SafeAreaView >
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.l,
        paddingVertical: Spacing.m,
    },
    backBtn: {
        padding: 4,
    },
    headerTitle: {
        ...Typography.h2,
        fontSize: 18,
    },
    scrollContent: {
        padding: Spacing.l,
    },
    summaryCard: {
        padding: 20,
        borderRadius: 24,
        marginBottom: Spacing.xl,
    },
    summaryLabel: {
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    propertyName: {
        fontSize: 20,
        fontWeight: '800',
    },
    divider: {
        height: 1,
        marginVertical: 16,
    },
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    priceLabel: {
        fontSize: 16,
        fontWeight: '700',
    },
    priceVal: {
        fontSize: 24,
        fontWeight: '800',
    },
    notice: {
        fontSize: 12,
        marginTop: 12,
        fontStyle: 'italic',
    },
    form: {
        flex: 1,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 16,
    },
    instructionCard: {
        padding: 20,
        borderRadius: 24,
        marginBottom: 20,
    },
    instructionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 14,
    },
    instLabel: {
        fontSize: 14,
        fontWeight: '500',
    },
    instValue: {
        fontSize: 15,
        fontWeight: '700',
    },
    whatsappNote: {
        marginBottom: 24,
        paddingHorizontal: 8,
    },
    noteText: {
        fontSize: 13,
        lineHeight: 22,
    },
    whatsappBtn: {
        height: 56,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    whatsappBtnText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '800',
    },
    verificationAlert: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        backgroundColor: '#fef3c7',
        borderRadius: 12,
    },
    alertText: {
        fontSize: 12,
        fontWeight: '600',
        marginLeft: 8,
        flex: 1,
    },
    footer: {
        padding: Spacing.l,
        borderTopWidth: 1,
    },
    payBtn: {
        height: 56,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    payBtnText: {
        color: 'white',
        fontSize: 18,
        fontWeight: '800',
    },
    successContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    successIconBox: {
        width: 120,
        height: 120,
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 32,
    },
    doneBtn: {
        width: '100%',
        height: 56,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    doneBtnText: {
        color: 'white',
        fontSize: 18,
        fontWeight: '700',
    },
    receiptCard: {
        width: '100%',
        padding: 24,
        borderRadius: 24,
        marginBottom: 32,
    },
    receiptTitle: {
        fontSize: 18,
        fontWeight: '800',
        textAlign: 'center',
        marginBottom: 16,
    },
    receiptDivider: {
        height: 1,
        marginBottom: 16,
    },
    receiptRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    receiptLabel: {
        fontSize: 14,
    },
    receiptValue: {
        fontSize: 14,
        textAlign: 'right',
        flex: 1,
        marginLeft: 16,
    },
    processingOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 30,
    },
    processingCard: {
        width: '100%',
        padding: 30,
        borderRadius: 32,
        alignItems: 'center',
    },
    processingIcon: {
        width: 70,
        height: 70,
        borderRadius: 35,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    processingTitle: {
        fontSize: 20,
        fontWeight: '800',
        marginBottom: 8,
    },
    processingText: {
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 20,
    },
    loadingBarContainer: {
        width: '100%',
        height: 6,
        backgroundColor: '#e2e8f0',
        borderRadius: 3,
        overflow: 'hidden',
        marginBottom: 20,
    },
    loadingBar: {
        height: '100%',
        width: '40%',
        borderRadius: 3,
    },
    securityLabel: {
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
});
