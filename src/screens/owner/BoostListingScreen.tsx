import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Image,
    Alert,
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ChevronLeft, Sparkle, Zap, ShieldCheck, Check } from 'lucide-react-native';

import { Theme, Spacing, Typography, Shadows } from '../../theme/Theme';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { listingsService } from '../../services/listings.service';
import { paymentService } from '../../services/payment.service';
import { notificationService } from '../../services/notifications.service';
import { Lock } from 'lucide-react-native';
import { Modal, TextInput } from 'react-native';

const { width } = Dimensions.get('window');

export const BoostListingScreen = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { listing } = route.params;
    const { isDark } = useTheme();
    const colors = isDark ? Theme.Dark.Colors : Theme.Light.Colors;
    const shadows = isDark ? Theme.Dark.Shadows : Theme.Light.Shadows;

    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [reference, setReference] = useState('');

    React.useEffect(() => {
        setReference(paymentService.generateReference('BST'));
    }, []);

    const handleManualSubmit = async () => {
        setIsProcessing(true);
        try {
            await paymentService.submitManualPayment(user?.id || 'guest', {
                amount: 5.00,
                reference: reference,
                serviceName: `Listing Boost: ${listing.propertyName || listing.title}`,
                propertyId: listing.id
            });

            setTimeout(() => {
                setIsProcessing(false);
                Alert.alert(
                    'Verification Pending! ⏳',
                    'Your payment has been submitted for review. Your listing will be boosted once verified.',
                    [{ text: 'OK', onPress: () => navigation.popToTop() }]
                );
                notificationService.scheduleLocalNotification(
                    'Boost Pending! ⚡',
                    `We've received your notification for "${listing.propertyName}". Activation is in progress.`
                );
            }, 1500);
        } catch (error) {
            setIsProcessing(false);
            Alert.alert('Error', 'Failed to notify us. Please try again.');
        }
    };

    const handleWhatsAppPay = async () => {
        await paymentService.openWhatsAppPayment(
            reference,
            5.00,
            `Listing Boost: ${listing.propertyName || listing.title}`
        );
    };

    const copyToClipboard = () => {
        Alert.alert('Copied!', 'Reference copied to clipboard.');
    };

    const FeatureRow = ({ icon: Icon, title, description, color }: any) => (
        <View style={styles.featureRow}>
            <View style={[styles.iconBox, { backgroundColor: color + '20' }]}>
                <Icon size={24} color={color} />
            </View>
            <View style={styles.featureText}>
                <Text style={[styles.featureTitle, { color: colors.text }]}>{title}</Text>
                <Text style={[styles.featureDesc, { color: colors.textLight }]}>{description}</Text>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <ChevronLeft size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Boost Property</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={[styles.previewCard, { backgroundColor: colors.surface }, shadows.soft]}>
                    <Image source={{ uri: listing.images[0] }} style={styles.previewImage} />
                    <View style={styles.previewInfo}>
                        <Text style={[styles.previewName, { color: colors.text }]}>{listing.propertyName}</Text>
                        <Text style={[styles.previewTitle, { color: colors.textLight }]}>{listing.title}</Text>
                    </View>
                    <View style={styles.premiumOverlay}>
                        <Sparkle size={16} color="#f59e0b" fill="#f59e0b" />
                        <Text style={styles.premiumLabel}>PREMIUM PREVIEW</Text>
                    </View>
                </View>

                <View style={styles.benefitsSection}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Why Boost?</Text>

                    <FeatureRow
                        icon={Zap}
                        color="#f59e0b"
                        title="Top of Search"
                        description="Appear at the very top of all search results for 7 days."
                    />
                    <FeatureRow
                        icon={Sparkle}
                        color="#8b5cf6"
                        title="Premium Styling"
                        description="Exclusive gold borders and 'Featured' badges to grab attention."
                    />
                    <FeatureRow
                        icon={ShieldCheck}
                        color={colors.primary}
                        title="Increased Trust"
                        description="Featured properties get up to 3x more bookings."
                    />
                </View>

                <View style={[styles.priceBox, { backgroundColor: colors.surface }]}>
                    <Text style={[styles.priceLabel, { color: colors.textLight }]}>7 Day Boost</Text>
                    <View style={styles.priceRow}>
                        <Text style={[styles.price, { color: colors.text }]}>$5.00</Text>
                        <Text style={[styles.priceUnit, { color: colors.textLight }]}>/week</Text>
                    </View>
                </View>

                <View style={[styles.paymentSection, { backgroundColor: colors.surface }, shadows.soft]}>
                    <Text style={[styles.sectionTitle, { color: colors.text, fontSize: 18 }]}>Manual Payment Instructions</Text>

                    <View style={[styles.instructionCard, { backgroundColor: colors.background }]}>
                        <View style={styles.instructionRow}>
                            <Text style={[styles.instLabel, { color: colors.textLight }]}>Ecocash Number</Text>
                            <Text style={[styles.instValue, { color: colors.primary }]}>0789 932 832</Text>
                        </View>
                        <View style={styles.instructionRow}>
                            <Text style={[styles.instLabel, { color: colors.textLight }]}>Account Name</Text>
                            <Text style={[styles.instValue, { color: colors.text }]}>Josh Boarding Admin</Text>
                        </View>
                        <View style={styles.instructionRow}>
                            <Text style={[styles.instLabel, { color: colors.textLight }]}>Amount</Text>
                            <Text style={[styles.instValue, { color: colors.text, fontWeight: '800' }]}>$5.00</Text>
                        </View>
                        <View style={[styles.instructionRow, { borderTopWidth: 1, borderTopColor: colors.border + '20', marginTop: 8, paddingTop: 12 }]}>
                            <Text style={[styles.instLabel, { color: colors.textLight }]}>Reference</Text>
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
                            1. Pay $5.00 to the EcoCash number above.{"\n"}
                            2. Use the <Text style={{ fontWeight: '700', color: colors.primary }}>Reference</Text> in your payment.{"\n"}
                            3. Send proof via WhatsApp for instant activation.
                        </Text>
                    </View>

                    <TouchableOpacity
                        style={[styles.whatsappBtn, { backgroundColor: '#25D366' }]}
                        onPress={handleWhatsAppPay}
                    >
                        <Text style={styles.whatsappBtnText}>Verify via WhatsApp</Text>
                    </TouchableOpacity>

                    <View style={styles.verificationAlert}>
                        <ShieldCheck size={16} color={colors.secondary} />
                        <Text style={[styles.alertText, { color: colors.textLight }]}>
                            Boosts are verified manually by our team.
                        </Text>
                    </View>
                </View>
            </ScrollView>

            <View style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
                <TouchableOpacity
                    style={[styles.boostBtn, { backgroundColor: colors.primary }]}
                    onPress={handleManualSubmit}
                    disabled={isProcessing}
                >
                    <Zap size={20} color="white" fill="white" />
                    <Text style={styles.boostBtnText}>
                        {isProcessing ? 'Notifying Admin...' : 'I Have Paid'}
                    </Text>
                </TouchableOpacity>
            </View>

            <Modal visible={isProcessing} transparent animationType="fade">
                <View style={styles.processingOverlay}>
                    <View style={[styles.processingCard, { backgroundColor: colors.surface }]}>
                        <View style={[styles.processingIcon, { backgroundColor: colors.primary + '15' }]}>
                            <Lock size={32} color={colors.primary} />
                        </View>
                        <Text style={[styles.processingTitle, { color: colors.text }]}>Processing Boost</Text>
                        <Text style={[styles.processingText, { color: colors.textLight }]}>Notifying admin to verify your boost payment...</Text>
                        <View style={styles.loadingBarContainer}>
                            <View style={[styles.loadingBar, { backgroundColor: colors.primary }]} />
                        </View>
                        <Text style={[styles.securityLabel, { color: colors.textLight }]}>Manual Verification In Progress</Text>
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.m,
        paddingVertical: Spacing.s,
    },
    backBtn: {
        padding: Spacing.s,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '800',
        marginLeft: Spacing.s,
    },
    scrollContent: {
        padding: Spacing.m,
    },
    previewCard: {
        borderRadius: 24,
        overflow: 'hidden',
        marginBottom: Spacing.xl,
    },
    previewImage: {
        width: '100%',
        height: 200,
    },
    previewInfo: {
        padding: Spacing.m,
    },
    previewName: {
        fontSize: 18,
        fontWeight: '800',
    },
    previewTitle: {
        fontSize: 14,
        marginTop: 4,
    },
    premiumOverlay: {
        position: 'absolute',
        top: 12,
        right: 12,
        backgroundColor: 'rgba(0,0,0,0.7)',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
    },
    premiumLabel: {
        color: '#f59e0b',
        fontSize: 10,
        fontWeight: '900',
        marginLeft: 6,
    },
    benefitsSection: {
        marginBottom: Spacing.xl,
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: '800',
        marginBottom: Spacing.m,
    },
    featureRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.m,
    },
    iconBox: {
        width: 48,
        height: 48,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.m,
    },
    featureText: {
        flex: 1,
    },
    featureTitle: {
        fontSize: 16,
        fontWeight: '700',
    },
    featureDesc: {
        fontSize: 13,
        marginTop: 2,
    },
    priceBox: {
        padding: Spacing.xl,
        borderRadius: 24,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#f59e0b20',
        marginBottom: Spacing.xl,
    },
    priceLabel: {
        fontSize: 14,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginTop: 8,
    },
    price: {
        fontSize: 32,
        fontWeight: '900',
    },
    priceUnit: {
        fontSize: 16,
        marginLeft: 4,
        fontWeight: '600',
    },
    paymentSection: {
        padding: 24,
        borderRadius: 24,
        marginBottom: 20,
    },
    instructionCard: {
        padding: 16,
        borderRadius: 16,
        marginBottom: 16,
    },
    instructionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
    },
    instLabel: {
        fontSize: 13,
        fontWeight: '500',
    },
    instValue: {
        fontSize: 14,
        fontWeight: '700',
    },
    whatsappNote: {
        marginBottom: 20,
    },
    noteText: {
        fontSize: 12,
        lineHeight: 18,
    },
    whatsappBtn: {
        height: 50,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    whatsappBtnText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '800',
    },
    verificationAlert: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        backgroundColor: '#fef3c7',
        borderRadius: 10,
    },
    alertText: {
        fontSize: 11,
        fontWeight: '600',
        marginLeft: 8,
        flex: 1,
    },
    footer: {
        padding: Spacing.m,
        borderTopWidth: 1,
    },
    boostBtn: {
        height: 56,
        borderRadius: 18,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    boostBtnText: {
        color: 'white',
        fontSize: 18,
        fontWeight: '800',
        marginLeft: 10,
    },
    processingOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
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
