import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    Image,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ChevronLeft, Calendar, CheckCircle2, Clock, MapPin, Building2, CreditCard } from 'lucide-react-native';

import { Theme, Spacing, Typography, Shadows } from '../../theme/Theme';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { bookingsService } from '../../services/bookings.service';
import { notificationService } from '../../services/notifications.service';
import { Booking } from '../../types';

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

    const formatDateSafely = (dateString: string) => {
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return 'N/A';
            return date.toLocaleDateString();
        } catch (e) {
            return 'N/A';
        }
    };

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
                setHasMore(data.length === 20); // Assuming page size is 20
            } else {
                setBookings(prev => [...prev, ...data]);
                setHasMore(data.length === 20);
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
                console.log('[MyBookings] Received booking update:', updatedBooking.id, updatedBooking.status);

                setBookings(prev => {
                    const index = prev.findIndex(b => b.id === updatedBooking.id);
                    if (index !== -1) {
                        const newBookings = [...prev];
                        const oldStatus = newBookings[index].status;
                        newBookings[index] = updatedBooking;

                        // Notify if status changed
                        if (oldStatus !== updatedBooking.status) {
                            notificationService.scheduleLocalNotification(
                                `Booking Update: ${updatedBooking.listingTitle || 'Property'}`,
                                `Your booking request is now ${updatedBooking.status.toUpperCase()}.`
                            );
                        }
                        return newBookings;
                    }
                    return [updatedBooking, ...prev];
                });

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

    const handleMarkAsPaid = async (bookingId: string) => {
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
    };

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
    const BookingItem = React.memo(({ item }: { item: Booking }) => {
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
                    <TouchableOpacity
                        style={[styles.payBtn, { backgroundColor: colors.secondary }]}
                        onPress={() => handleMarkAsPaid(item.id)}
                    >
                        <Text style={styles.payBtnText}>Sent Payment? Notify Owner</Text>
                    </TouchableOpacity>
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

    const renderBookingItem = useCallback(({ item }: { item: Booking }) => (
        <BookingItem item={item} />
    ), [colors, shadows]);

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
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
    },
    payBtnText: {
        color: 'white',
        fontSize: 15,
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
