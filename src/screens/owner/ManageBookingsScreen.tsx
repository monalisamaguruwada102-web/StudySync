import React, { useState, useEffect } from 'react';
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

export const ManageBookingsScreen = () => {
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

        const subscription = bookingsService.subscribeToBookings(user.id, 'owner', (newBooking) => {
            setBookings(prev => {
                const exists = prev.some(b => b.id === newBooking.id);
                if (exists) {
                    return prev.map(b => b.id === newBooking.id ? newBooking : b);
                }

                // If it's a completely new request, notify the owner
                notificationService.scheduleLocalNotification(
                    "New Booking Request!",
                    `${newBooking.studentName || 'A student'} has requested a booking for ${newBooking.listingTitle || 'your property'}.`
                );

                return [newBooking, ...prev];
            });
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const handleCall = (phone: string) => {
        const url = `tel:${phone}`;
        Linking.openURL(url).catch(() => {
            Alert.alert('Error', 'Unable to open phone dialer');
        });
    };

    const handleWhatsApp = (phone: string, studentName: string, listingTitle: string) => {
        const message = `Hi ${studentName}, I'm the owner of ${listingTitle}. I'm reaching out regarding your booking request.`;
        const url = `whatsapp://send?phone=${phone}&text=${encodeURIComponent(message)}`;

        Linking.canOpenURL(url).then(supported => {
            if (supported) {
                Linking.openURL(url);
            } else {
                Linking.openURL(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`);
            }
        });
    };

    const loadBookings = async () => {
        if (!user?.id) return;
        setLoading(true);
        try {
            const data = await bookingsService.getBookingsForOwner(user.id);
            setBookings(data);
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to load bookings');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (bookingId: string, status: Booking['status']) => {
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
                            loadBookings();
                        } catch (error) {
                            Alert.alert('Error', 'Failed to update status');
                        }
                    }
                }
            ]
        );
    };

    const renderBookingItem = ({ item }: { item: Booking }) => {
        const isPending = item.status === 'pending';
        const isApproved = item.status === 'approved';

        return (
            <View style={[styles.card, { backgroundColor: colors.surface }, shadows.soft]}>
                <View style={styles.cardHeader}>
                    <View style={styles.studentInfo}>
                        <Text style={[styles.studentName, { color: colors.text }]}>{item.studentName || 'Student'}</Text>
                        <Text style={[styles.listingTitle, { color: colors.textLight }]}>{item.listingTitle}</Text>
                    </View>
                    <View style={[styles.statusBadge, {
                        backgroundColor: item.status === 'pending' ? colors.warning + '20' :
                            item.status === 'approved' ? colors.secondary + '20' :
                                item.status === 'paid' ? colors.primary + '20' : colors.error + '20'
                    }]}>
                        <Text style={[styles.statusText, {
                            color: item.status === 'pending' ? colors.warning :
                                item.status === 'approved' ? colors.secondary :
                                    item.status === 'paid' ? colors.primary : colors.error
                        }]}>{item.status.toUpperCase()}</Text>
                    </View>
                </View>

                <View style={[styles.divider, { backgroundColor: colors.border }]} />

                <View style={styles.detailsRow}>
                    <View style={styles.detailItem}>
                        <Calendar size={14} color={colors.textLight} />
                        <Text style={[styles.detailText, { color: colors.textLight }]}>
                            {new Date(item.createdAt).toLocaleDateString()}
                        </Text>
                    </View>
                    <View style={styles.detailItem}>
                        <Hash size={14} color={colors.textLight} />
                        <Text style={[styles.detailText, { color: colors.textLight }]}>
                            Ref: {item.paymentReference || 'No Reference'}
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
                        style={[styles.iconBtn, { backgroundColor: colors.primary + '15' }]}
                        onPress={() => handleCall(item.studentPhone || '0771234567')}
                    >
                        <Phone size={18} color={colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.iconBtn, { backgroundColor: colors.primary + '15', marginLeft: 12 }]}
                        onPress={() => handleWhatsApp(item.studentPhone || '0771234567', item.studentName || 'Student', item.listingTitle || 'the property')}
                    >
                        <MessageCircle size={18} color={colors.primary} />
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ChevronLeft size={28} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Manage Bookings</Text>
                <TouchableOpacity onPress={loadBookings} style={styles.refreshBtn}>
                    <Text style={{ color: colors.primary, fontWeight: '700' }}>Refresh</Text>
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={bookings}
                    renderItem={renderBookingItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.list}
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
    }
});
