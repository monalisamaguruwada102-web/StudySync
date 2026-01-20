import React, { useState, useEffect } from 'react';
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

    useEffect(() => {
        loadBookings();

        if (!user?.id) return;

        const subscription = bookingsService.subscribeToBookings(user.id, 'student', (updatedBooking) => {
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
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const loadBookings = async () => {
        if (!user?.id) return;
        setLoading(true);
        try {
            const data = await bookingsService.getBookingsForStudent(user.id);
            setBookings(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

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
                            loadBookings();
                        } catch (error) {
                            Alert.alert('Error', 'Failed to update status');
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

    const renderBookingItem = ({ item }: { item: Booking }) => {
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
                            <Text style={[styles.detailVal, { color: colors.text }]}>{new Date(item.createdAt).toLocaleDateString()}</Text>
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
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ChevronLeft size={28} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>My Bookings</Text>
                <View style={{ width: 44 }} />
            </View>

            {loading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={bookings}
                    renderItem={renderBookingItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
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
});
