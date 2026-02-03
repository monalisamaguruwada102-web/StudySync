import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Image,
    Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ChevronLeft, Check, X, Phone, MessageCircle, Calendar, Hash } from 'lucide-react-native';

import { Theme, Spacing, Typography, Shadows } from '../../theme/Theme';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { bookingsService } from '../../services/bookings.service';
import { notificationService } from '../../services/notifications.service';
import { Booking } from '../../types';

// Memoized Booking Item defined outside to prevent re-creation on parent render
const BookingItem = React.memo(({
    item,
    colors,
    shadows,
    handleUpdateStatus,
    handleCall,
    handleWhatsApp,
    formatDateSafely
}: {
    item: Booking;
    colors: any;
    shadows: any;
    handleUpdateStatus: (id: string, status: Booking['status']) => void;
    handleCall: (phone: string) => void;
    handleWhatsApp: (phone: string, name: string, title: string) => void;
    formatDateSafely: (date: string) => string;
}) => {
    const isPending = item.status === 'pending';
    const isApproved = item.status === 'approved';

    // Helper for safe hex opacity
    const withOpacity = (hex: string, opacity: string) => {
        if (!hex || typeof hex !== 'string' || !hex.startsWith('#')) return hex;
        return hex + opacity;
    };

    return (
        <View style={[styles.card, { backgroundColor: colors.surface }, shadows.soft]}>
            <View style={styles.cardHeader}>
                <View style={styles.studentInfo}>
                    <Text style={[styles.studentName, { color: colors.text }]}>{item.studentName || 'Student'}</Text>
                    <Text style={[styles.listingTitle, { color: colors.textLight }]}>{item.listingTitle}</Text>
                </View>
                <View style={[styles.statusBadge, {
                    backgroundColor: (item?.status === 'pending') ? withOpacity(colors.warning, '20') :
                        (item?.status === 'approved') ? withOpacity(colors.secondary, '20') :
                            (item?.status === 'paid') ? withOpacity(colors.primary, '20') : withOpacity(colors.error, '20')
                }]}>
                    <Text style={[styles.statusText, {
                        color: (item?.status === 'pending') ? colors.warning :
                            (item?.status === 'approved') ? colors.secondary :
                                (item?.status === 'paid') ? colors.primary : colors.error
                    }]}>{(item?.status || 'unknown').toUpperCase()}</Text>
                </View>
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <View style={styles.detailsRow}>
                <View style={styles.detailItem}>
                    <Calendar size={14} color={colors.textLight} />
                    <Text style={[styles.detailText, { color: colors.textLight }]}>
                        {formatDateSafely(item.createdAt)}
                    </Text>
                </View>
                <View style={styles.detailItem}>
                    <Hash size={14} color={colors.textLight} />
                    <Text style={[styles.detailText, { color: colors.textLight }]} numberOfLines={1}>
                        Ref: {item?.paymentReference || 'No Reference'}
                    </Text>
                </View>
            </View>

            {isPending && (
                <View style={styles.actions}>
                    <TouchableOpacity
                        style={[styles.actionBtn, { borderColor: colors.error }]}
                        onPress={() => handleUpdateStatus(item.id, 'rejected')}
                    >
                        <X size={20} color={colors.error} />
                        <Text style={[styles.actionBtnText, { color: colors.error }]}>Reject</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: colors.primary, borderColor: colors.primary }]}
                        onPress={() => handleUpdateStatus(item.id, 'approved')}
                    >
                        <Check size={20} color="white" />
                        <Text style={[styles.actionBtnText, { color: 'white' }]}>Approve</Text>
                    </TouchableOpacity>
                </View>
            )}

            {isApproved && (
                <TouchableOpacity
                    style={[styles.confirmPaidBtn, { backgroundColor: colors.secondary }]}
                    onPress={() => handleUpdateStatus(item.id, 'paid')}
                >
                    <Check size={20} color="white" />
                    <Text style={styles.confirmPaidText}>Confirm Payment Received</Text>
                </TouchableOpacity>
            )}

            <View style={styles.contactActions}>
                <TouchableOpacity
                    style={[styles.iconBtn, { backgroundColor: withOpacity(colors.primary || '#2563eb', '15') }]}
                    onPress={() => handleCall(item?.studentPhone || '0771234567')}
                >
                    <Phone size={18} color={colors.primary || '#2563eb'} />
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.iconBtn, { backgroundColor: withOpacity(colors.primary || '#2563eb', '15'), marginLeft: 12 }]}
                    onPress={() => handleWhatsApp(item?.studentPhone || '0771234567', item?.studentName || 'Student', item?.listingTitle || 'the property')}
                >
                    <MessageCircle size={18} color={colors.primary || '#2563eb'} />
                </TouchableOpacity>
            </View>
        </View>
    );
});

export const ManageBookingsScreen = () => {
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

    const formatDateSafely = useCallback((dateString: string) => {
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return 'N/A';
            return date.toLocaleDateString();
        } catch (e) {
            return 'N/A';
        }
    }, []);

    const handleCall = useCallback((phone: string) => {
        const url = `tel:${phone}`;
        Linking.openURL(url).catch((err) => {
            console.error('[ManageBookings] Call Error:', err);
            Alert.alert('Call Failed', 'Unable to open the phone dialer. Please make sure your device supports calls.');
        });
    }, []);

    const handleWhatsApp = useCallback((phone: string, studentName: string, listingTitle: string) => {
        const message = `Hi ${studentName}, I'm the owner of ${listingTitle}. I'm reaching out regarding your booking request.`;
        const url = `whatsapp://send?phone=${phone}&text=${encodeURIComponent(message)}`;

        Linking.canOpenURL(url).then(supported => {
            if (supported) {
                Linking.openURL(url).catch(() => {
                    Linking.openURL(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`).catch(() => {
                        Alert.alert('Error', 'Unable to open WhatsApp or Browser.');
                    });
                });
            } else {
                Linking.openURL(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`).catch(() => {
                    Alert.alert('Error', 'Unable to open browser.');
                });
            }
        });
    }, []);

    const loadBookings = useCallback(async (pageNum: number = 0, shouldRefresh: boolean = false) => {
        if (!user?.id) return;

        if (pageNum === 0 && !shouldRefresh) setLoading(true);
        if (shouldRefresh) setRefreshing(true);
        if (pageNum > 0) setLoadingMore(true);

        try {
            console.log('[ManageBookings] Loading bookings for owner:', user.id, 'Page:', pageNum);
            const data = await bookingsService.getBookingsForOwner(user.id, pageNum);

            if (shouldRefresh || pageNum === 0) {
                setBookings(data);
                setPage(0);
                setHasMore(data.length === 20); // Assuming page size is 20
            } else {
                setBookings(prev => {
                    // Filter out any duplicates that might have been added via subscription
                    const existingIds = new Set(prev.map(b => b.id));
                    const newUnique = data.filter(b => !existingIds.has(b.id));
                    return [...prev, ...newUnique];
                });
                setHasMore(data.length === 20);
            }
        } catch (error: any) {
            console.error('[ManageBookings] Load Error:', error);
            const errorMessage = error.message || error.details || error.hint || 'Unknown connectivity issue';
            Alert.alert(
                'Load Error',
                `Unable to fetch booking requests. \n\nError: ${errorMessage}`,
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

    const handleUpdateStatus = useCallback(async (bookingId: string, status: Booking['status']) => {
        if (!bookingId) return;
        const statusLabel = status === 'approved' ? 'Approve' : status === 'rejected' ? 'Reject' : 'Confirm Payment';

        Alert.alert(
            `${statusLabel} Request`,
            `Are you sure you want to ${status.toLowerCase()} this booking?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Confirm',
                    onPress: async () => {
                        try {
                            await bookingsService.updateBookingStatus(bookingId, status);
                            await notificationService.scheduleLocalNotification(
                                'Booking Updated',
                                `The booking status has been updated to ${status}.`
                            );
                            setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status } : b));
                        } catch (error: any) {
                            Alert.alert('Update Failed', error.message || 'Failed to update booking status. Please try again.');
                        }
                    }
                }
            ]
        );
    }, []);

    useEffect(() => {
        loadBookings(0);

        if (!user?.id) return;

        console.log('[ManageBookings] Setting up subscription for owner:', user.id);

        const subscription = bookingsService.subscribeToBookings(user.id, 'owner', (newBooking) => {
            try {
                if (!newBooking || !newBooking.id) return;

                console.log('[ManageBookings] Received new booking update:', newBooking.id, newBooking.status);

                setBookings(prev => {
                    const exists = prev.some(b => b.id === newBooking.id);
                    if (exists) {
                        console.log('[ManageBookings] Updating existing booking:', newBooking.id);
                        return prev.map(b => b.id === newBooking.id ? newBooking : b);
                    }

                    console.log('[ManageBookings] Adding new booking:', newBooking.id);

                    // Side effect moved outside of state updater
                    setTimeout(() => {
                        notificationService.scheduleLocalNotification(
                            "New Booking Request!",
                            `${newBooking.studentName || 'A student'} has requested a booking for ${newBooking.listingTitle || 'your property'}.`
                        );
                    }, 0);

                    // Sort to keep newest at top
                    return [newBooking, ...prev];
                });

                // Also invalidate cache so next fresh load gets the update
                bookingsService.invalidateCache(user.id, 'owner');
            } catch (error) {
                console.error('[ManageBookings] Error handling booking update:', error);
            }
        });

        return () => {
            console.log('[ManageBookings] Cleaning up subscription');
            subscription.unsubscribe();
        };
    }, [user?.id, loadBookings, colors.primary]); // Added relevant deps

    const renderBookingItem = useCallback(({ item }: { item: Booking }) => (
        <BookingItem
            item={item}
            colors={colors}
            shadows={shadows}
            handleUpdateStatus={handleUpdateStatus}
            handleCall={handleCall}
            handleWhatsApp={handleWhatsApp}
            formatDateSafely={formatDateSafely}
        />
    ), [colors, shadows, handleUpdateStatus, handleCall, handleWhatsApp, formatDateSafely]);

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ChevronLeft size={28} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Manage Bookings</Text>
                <TouchableOpacity onPress={() => loadBookings(0)} style={styles.refreshBtn}>
                    <Text style={{ color: colors.primary, fontWeight: '700' }}>Refresh</Text>
                </TouchableOpacity>
            </View>

            {loading && !refreshing ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={bookings}
                    renderItem={renderBookingItem}
                    keyExtractor={item => item?.id || Math.random().toString()}
                    contentContainerStyle={styles.list}
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
                        <View style={styles.empty}>
                            <Text style={[styles.emptyText, { color: colors.textLight }]}>No booking requests yet</Text>
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
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '800',
    },
    refreshBtn: {
        padding: 4,
    },
    list: {
        padding: Spacing.l,
    },
    card: {
        borderRadius: 24,
        padding: 20,
        marginBottom: 20,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    studentInfo: {
        flex: 1,
    },
    studentName: {
        fontSize: 18,
        fontWeight: '800',
        marginBottom: 4,
    },
    listingTitle: {
        fontSize: 14,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '800',
    },
    divider: {
        height: 1,
        marginVertical: 16,
    },
    detailsRow: {
        flexDirection: 'row',
        marginBottom: 16,
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 20,
    },
    detailText: {
        fontSize: 13,
        marginLeft: 6,
    },
    actions: {
        flexDirection: 'row',
        marginTop: 8,
    },
    actionBtn: {
        flex: 1,
        height: 48,
        borderRadius: 14,
        borderWidth: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 4,
    },
    actionBtnText: {
        fontWeight: '700',
        marginLeft: 8,
    },
    confirmPaidBtn: {
        height: 52,
        borderRadius: 14,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 8,
    },
    confirmPaidText: {
        color: 'white',
        fontWeight: '800',
        marginLeft: 8,
    },
    contactActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 16,
    },
    iconBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    empty: {
        alignItems: 'center',
        marginTop: 100,
    },
    emptyText: {
        fontSize: 16,
    },
    footerLoader: {
        paddingVertical: 20,
        alignItems: 'center',
    }
});
