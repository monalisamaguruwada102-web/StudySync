import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Modal,
    ScrollView,
    Linking
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import {
    ChevronLeft,
    Calendar,
    CheckCircle2,
    Clock,
    Building2,
    CreditCard,
    Smartphone,
    Banknote,
    Landmark,
    ChevronRight,
    X,
    Send
} from 'lucide-react-native';

import { Theme, Spacing, Typography, Shadows } from '../../theme/Theme';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { bookingsService } from '../../services/bookings.service';
import { notificationService } from '../../services/notifications.service';
import { clicknpayService, PaymentChannel } from '../../services/clicknpay.service';
import { Booking } from '../../types';

const getStatusStyle = (status: Booking['status']) => {
    switch (status) {
        case 'approved': return { bg: '#10b98120', text: '#10b981', label: 'Approved' };
        case 'paid': return { bg: '#3b82f620', text: '#3b82f6', label: 'Paid' };
        case 'rejected': return { bg: '#ef444420', text: '#ef4444', label: 'Rejected' };
        case 'cancelled': return { bg: '#64748b20', text: '#64748b', label: 'Cancelled' };
        default: return { bg: '#f59e0b20', text: '#f59e0b', label: 'Pending' };
    }
};

// Memoized Booking Item
const BookingItem = React.memo(({
    item,
    colors,
    shadows,
    handleMarkAsPaid,
    handlePayNow,
    formatDateSafely
}: {
    item: Booking;
    colors: any;
    shadows: any;
    handleMarkAsPaid: (id: string) => void;
    handlePayNow: (booking: Booking) => void;
    formatDateSafely: (date: string) => string;
}) => {
    const status = getStatusStyle(item.status);
    const isApproved = item.status === 'approved';

    return (
        <View style={[styles.bookingCard, { backgroundColor: colors.surface }, shadows.soft]}>
            <View style={styles.cardHeader}>
                <View style={styles.propertyInfo}>
                    <Text style={[styles.propertyName, { color: colors.text }]}>{item.listingTitle || 'Boarding House'}</Text>
                    <View style={styles.locationRow}>
                        <Building2 size={14} color={colors.textLight} />
                        <Text style={[styles.locationText, { color: colors.textLight }]}>Property Room</Text>
                    </View>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
                    <Text style={[styles.statusText, { color: status.text }]}>{status.label}</Text>
                </View>
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <View style={styles.detailRow}>
                <View style={styles.detailItem}>
                    <Calendar size={16} color={colors.primary} />
                    <View style={styles.detailTextCol}>
                        <Text style={[styles.detailLabel, { color: colors.textLight }]}>Request Date</Text>
                        <Text style={[styles.detailVal, { color: colors.text }]}>{formatDateSafely(item.createdAt)}</Text>
                    </View>
                </View>
                <View style={styles.detailItem}>
                    <CreditCard size={16} color={colors.primary} />
                    <View style={styles.detailTextCol}>
                        <Text style={[styles.detailLabel, { color: colors.textLight }]}>Total Price</Text>
                        <Text style={[styles.detailVal, { color: colors.text }]}>${item.totalPrice}</Text>
                    </View>
                </View>
            </View>

            {isApproved && (
                <View style={styles.actionRow}>
                    <TouchableOpacity
                        style={[styles.payBtn, { backgroundColor: colors.primary, flex: 1, marginRight: 8 }]}
                        onPress={() => handlePayNow(item)}
                    >
                        <CreditCard size={18} color="white" />
                        <Text style={styles.payBtnText}>Secure & Pay Now</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.whatsappNotifyBtn, { borderColor: colors.secondary, borderWidth: 1 }]}
                        onPress={() => handleMarkAsPaid(item.id)}
                    >
                        <Text style={[styles.whatsappNotifyText, { color: colors.secondary }]}>Paid manual?</Text>
                    </TouchableOpacity>
                </View>
            )}

            {item.status === 'paid' && (
                <View style={styles.statusInfo}>
                    <CheckCircle2 size={18} color={colors.primary} />
                    <Text style={[styles.statusInfoText, { color: colors.primary }]}>Payment awaiting owner verification.</Text>
                </View>
            )}
        </View>
    );
});

export const MyBookingsScreen = () => {
    const navigation = useNavigation<any>();
    const { user } = useAuth();
    const { isDark } = useTheme();
    const colors = isDark ? Theme.Dark.Colors : Theme.Light.Colors;
    const shadows = isDark ? Theme.Dark.Shadows : Theme.Light.Shadows;

    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);

    // Payment States
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
    const [paymentModalVisible, setPaymentModalVisible] = useState(false);
    const [paymentProcessing, setPaymentProcessing] = useState(false);

    const formatDateSafely = useCallback((dateString: string) => {
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return 'N/A';
            return date.toLocaleDateString();
        } catch (e) {
            return 'N/A';
        }
    }, []);

    const loadBookings = useCallback(async (pageNum: number = 0, shouldRefresh: boolean = false) => {
        if (!user?.id) return;

        if (pageNum === 0 && !shouldRefresh) setLoading(true);
        if (shouldRefresh) setRefreshing(true);
        if (pageNum > 0) setLoadingMore(true);

        try {
            console.log('[MyBookings] Loading bookings for student:', user.id, 'Page:', pageNum);
            const data = await bookingsService.getBookingsForStudent(user.id, pageNum);

            if (shouldRefresh || pageNum === 0) {
                setBookings(data);
                setPage(0);
                setHasMore(data.length >= 20); // Accurate hasMore check
            } else {
                setBookings(prev => {
                    const existingIds = new Set(prev.map(b => b.id));
                    const newUnique = data.filter(b => !existingIds.has(b.id));
                    return [...prev, ...newUnique];
                });
                setHasMore(data.length >= 20);
            }
        } catch (error: any) {
            console.error('[MyBookings] Load Error:', error);
            const errorMessage = error.message || error.details || error.hint || 'Unknown connectivity issue';
            Alert.alert(
                'Load Error',
                `Unable to fetch your bookings. \n\nError: ${errorMessage}`,
                [{ text: 'Retry', onPress: () => loadBookings(pageNum, shouldRefresh) }, { text: 'OK', style: 'cancel' }]
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
            setLoadingMore(false);
        }
    }, [user?.id]);

    const handleRefresh = useCallback(() => {
        loadBookings(0, true);
    }, [loadBookings]);

    const handleLoadMore = useCallback(() => {
        if (!loadingMore && hasMore && !loading && !refreshing) {
            const nextPage = page + 1;
            setPage(nextPage);
            loadBookings(nextPage);
        }
    }, [loadingMore, hasMore, loading, refreshing, page, loadBookings]);

    useEffect(() => {
        loadBookings(0);

        if (!user?.id) return;

        console.log('[MyBookings] Setting up subscription for student:', user.id);

        const subscription = bookingsService.subscribeToBookings(user.id, 'student', (updatedBooking) => {
            try {
                if (!updatedBooking || !updatedBooking.id) return;

                console.log('[MyBookings] Received booking update:', updatedBooking.id, updatedBooking.status);

                setBookings(prev => {
                    const index = prev.findIndex(b => b.id === updatedBooking.id);
                    if (index !== -1) {
                        const newBookings = [...prev];
                        newBookings[index] = updatedBooking;
                        return newBookings;
                    }
                    return [updatedBooking, ...prev];
                });

                // Trigger notification OUTSIDE of setBookings via timeout
                setTimeout(() => {
                    notificationService.scheduleLocalNotification(
                        `Booking Update: ${updatedBooking.listingTitle || 'Property'}`,
                        `Your booking request is now ${updatedBooking.status.toUpperCase()}.`
                    );
                }, 0);

                // Also invalidate cache
                bookingsService.invalidateCache(user.id, 'student');
            } catch (error) {
                console.error('[MyBookings] Error handling booking update:', error);
            }
        });

        return () => {
            console.log('[MyBookings] Cleaning up subscription');
            subscription.unsubscribe();
        };
    }, [user?.id, loadBookings]);

    const handleMarkAsPaid = useCallback(async (bookingId: string) => {
        Alert.alert(
            "Confirm Payment",
            "Have you sent the payment via EcoCash/WhatsApp? This will notify the owner.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "YES, I PAID",
                    onPress: async () => {
                        try {
                            await bookingsService.updateBookingStatus(bookingId, 'paid');
                            await notificationService.scheduleLocalNotification(
                                "Payment Notified",
                                "The owner has been notified of your payment. They will verify and confirm shortly."
                            );
                            // Local update for instant feedback
                            setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: 'paid' } : b));
                        } catch (error: any) {
                            Alert.alert('Update Failed', error.message || 'Failed to update status. Please try again.');
                        }
                    }
                }
            ]
        );
    }, []);

    const handlePayNow = useCallback((booking: Booking) => {
        setSelectedBooking(booking);
        setPaymentModalVisible(true);
    }, []);

    const initiateDirectPayment = async (channel: PaymentChannel) => {
        if (!selectedBooking || !user) return;

        setPaymentProcessing(true);
        try {
            // 1. Initiate ClicknPay Order
            const orderResponse = await clicknpayService.createOrder({
                clientReference: selectedBooking.id,
                channel: channel,
                customerPhoneNumber: user.phone || '0771234567',
                description: `Payment for ${selectedBooking.listingTitle}`,
                productsList: [{
                    description: `Room Payment: ${selectedBooking.listingTitle}`,
                    id: 1,
                    price: selectedBooking.totalPrice,
                    productName: 'Room Booking',
                    quantity: 1
                }],
                publicUniqueId: selectedBooking.id,
                returnUrl: 'https://boarding-app.expo.app/payment-success'
            });

            // 2. Poll for status if it's a mobile money channel
            if (channel === 'VISA' || channel === 'MASTERCARD') {
                setPaymentModalVisible(false);
                if (orderResponse.paymeURL) {
                    Linking.openURL(orderResponse.paymeURL);
                    Alert.alert('Payment Initiated', 'Please complete payment in your browser.');
                }
            } else {
                Alert.alert(
                    'USSD Push Sent',
                    `A prompt has been sent to your phone. Please confirm the payment of $${selectedBooking.totalPrice}.`,
                    [{ text: 'OK' }]
                );

                try {
                    const finalStatus = await clicknpayService.pollStatus(selectedBooking.id);
                    setPaymentModalVisible(false);
                    if (finalStatus.status === 'PAID' || finalStatus.status === 'SUCCESS') {
                        // 3. Update booking status in database with reference
                        try {
                            await bookingsService.updateBookingStatus(selectedBooking.id, 'paid', finalStatus.clientReference || finalStatus.id);
                            setBookings(prev => prev.map(b => b.id === selectedBooking.id ? { ...b, status: 'paid', paymentReference: finalStatus.clientReference || finalStatus.id } : b));
                        } catch (updateErr) {
                            console.error('[MyBookings] Status update error:', updateErr);
                        }

                        // 4. Navigate to receipt
                        navigation.navigate('PaymentReceipt', {
                            paymentData: finalStatus,
                            listing: { title: selectedBooking.listingTitle, price: selectedBooking.totalPrice }
                        });
                    }
                } catch (pollError: any) {
                    setPaymentModalVisible(false);
                    Alert.alert('Payment Status', pollError.message || 'Still processing. We will notify you once confirmed.');
                }
            }
        } catch (error: any) {
            console.error('[MyBookings] Payment Error:', error);
            Alert.alert('Payment Failed', error.message || 'Something went wrong.');
        } finally {
            setPaymentProcessing(false);
        }
    };

    const renderBookingItem = useCallback(({ item }: { item: Booking }) => (
        <BookingItem
            item={item}
            colors={colors}
            shadows={shadows}
            handleMarkAsPaid={handleMarkAsPaid}
            handlePayNow={handlePayNow}
            formatDateSafely={formatDateSafely}
        />
    ), [colors, shadows, handleMarkAsPaid, handlePayNow, formatDateSafely]);

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ChevronLeft size={28} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>My Bookings</Text>
                <View style={{ width: 44 }} />
            </View>

            {loading && !refreshing ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={bookings}
                    renderItem={renderBookingItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    onRefresh={handleRefresh}
                    refreshing={refreshing}
                    onEndReached={handleLoadMore}
                    onEndReachedThreshold={0.5}
                    ListFooterComponent={() => (
                        loadingMore ? (
                            <View style={styles.footerLoader}>
                                <ActivityIndicator size="small" color={colors.primary} />
                            </View>
                        ) : null
                    )}
                    // Performance Optimizations
                    initialNumToRender={10}
                    maxToRenderPerBatch={10}
                    windowSize={5}
                    removeClippedSubviews={true}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Clock size={64} color={colors.border} />
                            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Bookings Yet</Text>
                            <Text style={[styles.emptySubtitle, { color: colors.textLight }]}>
                                After you secure a room, your requests will appear here.
                            </Text>
                        </View>
                    }
                />
            )}

            {/* Payment Channel Modal */}
            <Modal
                visible={paymentModalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setPaymentModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: colors.text }]}>Choose Payment</Text>
                            <TouchableOpacity onPress={() => setPaymentModalVisible(false)}>
                                <X size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>

                        <Text style={[styles.paymentSubtitle, { color: colors.textLight }]}>
                            Select your preferred method to quickly secure this room.
                        </Text>

                        <ScrollView style={{ maxHeight: 400 }}>
                            <PaymentOption
                                icon={<Smartphone size={24} color="#2563eb" />}
                                title="EcoCash"
                                subtitle="USSD Push to your phone"
                                onPress={() => initiateDirectPayment('ECOCASH')}
                                colors={colors}
                            />
                            <PaymentOption
                                icon={<Smartphone size={24} color="#059669" />}
                                title="OneMoney"
                                subtitle="USSD Push to your phone"
                                onPress={() => initiateDirectPayment('ONEMONEY')}
                                colors={colors}
                            />
                            <PaymentOption
                                icon={<CreditCard size={24} color="#ea580c" />}
                                title="Visa / MasterCard"
                                subtitle="Pay with your card securely"
                                onPress={() => initiateDirectPayment('VISA')}
                                colors={colors}
                            />
                            <PaymentOption
                                icon={<Landmark size={24} color="#6366f1" />}
                                title="InnBucks"
                                subtitle="Direct InnBucks payment"
                                onPress={() => initiateDirectPayment('INNBUCKS')}
                                colors={colors}
                            />
                        </ScrollView>

                        {paymentProcessing && (
                            <View style={styles.processingOverlay}>
                                <ActivityIndicator size="large" color={colors.primary} />
                                <Text style={[styles.processingText, { color: colors.text }]}>Processing Payment...</Text>
                            </View>
                        )}
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const PaymentOption = ({ icon, title, subtitle, onPress, colors }: any) => (
    <TouchableOpacity
        style={[styles.paymentOption, { backgroundColor: colors.background, borderColor: colors.border }]}
        onPress={onPress}
    >
        <View style={styles.optionIconContainer}>
            {icon}
        </View>
        <View style={styles.optionContent}>
            <Text style={[styles.optionTitle, { color: colors.text }]}>{title}</Text>
            <Text style={[styles.optionSubtitle, { color: colors.textLight }]}>{subtitle}</Text>
        </View>
        <ChevronRight size={20} color={colors.textLight} />
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.m,
        paddingVertical: 12,
    },
    backBtn: {
        padding: 8,
    },
    headerTitle: {
        ...Typography.h2,
        fontSize: 18,
    },
    listContent: {
        padding: Spacing.l,
    },
    bookingCard: {
        padding: 20,
        borderRadius: 24,
        marginBottom: 20,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    propertyInfo: {
        flex: 1,
        marginRight: 10,
    },
    propertyName: {
        fontSize: 18,
        fontWeight: '800',
        marginBottom: 4,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    locationText: {
        fontSize: 13,
        marginLeft: 4,
        fontWeight: '500',
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '800',
        textTransform: 'uppercase',
    },
    divider: {
        height: 1,
        marginVertical: 16,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    detailTextCol: {
        marginLeft: 10,
    },
    detailLabel: {
        fontSize: 11,
        fontWeight: '600',
    },
    detailVal: {
        fontSize: 14,
        fontWeight: '700',
        marginTop: 2,
    },
    payBtn: {
        height: 52,
        borderRadius: 16,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    payBtnText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '700',
        marginLeft: 8,
    },
    actionRow: {
        flexDirection: 'row',
        marginTop: 20,
        alignItems: 'center',
    },
    whatsappNotifyBtn: {
        paddingHorizontal: 12,
        height: 52,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    whatsappNotifyText: {
        fontSize: 12,
        fontWeight: '700',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 36,
        borderTopRightRadius: 36,
        padding: 28,
        paddingBottom: 40,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: '900',
    },
    paymentSubtitle: {
        fontSize: 13,
        marginBottom: 20,
    },
    paymentOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 12,
    },
    optionIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: 'rgba(0,0,0,0.03)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    optionContent: {
        flex: 1,
    },
    optionTitle: {
        fontSize: 15,
        fontWeight: '700',
    },
    optionSubtitle: {
        fontSize: 11,
    },
    processingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255,255,255,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
        borderRadius: 32,
    },
    processingText: {
        marginTop: 12,
        fontWeight: '700',
    },
    statusInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 20,
        backgroundColor: 'rgba(59, 130, 246, 0.05)',
        padding: 12,
        borderRadius: 12,
    },
    statusInfoText: {
        fontSize: 13,
        fontWeight: '700',
        marginLeft: 10,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 100,
    },
    emptyTitle: {
        fontSize: 22,
        fontWeight: '800',
        marginTop: 24,
    },
    emptySubtitle: {
        fontSize: 15,
        marginTop: 10,
        textAlign: 'center',
        paddingHorizontal: 40,
        lineHeight: 22,
    },
    footerLoader: {
        paddingVertical: 20,
        alignItems: 'center',
    }
});
