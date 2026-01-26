import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Alert,
    Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, ShieldCheck, XCircle, CheckCircle, Users as UsersIcon, Home, Zap } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { Spacing } from '../../theme/Theme';
import { useTheme } from '../../context/ThemeContext';
import { listingsService } from '../../services/listings.service';
import { supabase } from '../../services/supabase';
import { Listing } from '../../types';

export const AdminDashboardScreen = () => {
    const navigation = useNavigation<any>();
    const { colors, shadows } = useTheme();
    const [activeTab, setActiveTab] = React.useState<'properties' | 'users' | 'boosts'>('properties');
    const queryClient = useQueryClient();

    const { data: pendingListings = [], isLoading: loadingListings, refetch: refetchListings } = useQuery({
        queryKey: ['admin-pending-listings'],
        queryFn: async () => {
            const all = await listingsService.getListings();
            return all.filter(l => !l.isVerified);
        },
    });

    const { data: pendingUsers = [], isLoading: loadingUsers, refetch: refetchUsers } = useQuery({
        queryKey: ['admin-pending-users'],
        queryFn: async () => {
            const { authService } = await import('../../services/auth.service');
            return authService.getPendingVerifications();
        },
    });

    const { data: pendingBoosts = [], isLoading: loadingBoosts, refetch: refetchBoosts } = useQuery({
        queryKey: ['admin-pending-boosts'],
        queryFn: async () => {
            const all = await listingsService.getListings();
            return all.filter(l => l.boostStatus === 'pending');
        },
    });

    const refetch = () => {
        refetchListings();
        refetchUsers();
        refetchBoosts();
    };

    const handleApproveProperty = async (listingId: string) => {
        try {
            const listing = pendingListings.find(l => l.id === listingId);
            if (listing) {
                await listingsService.saveListing({ ...listing, isVerified: true });

                // Refresh both admin view and public listings
                await queryClient.invalidateQueries({ queryKey: ['admin-pending-listings'] });
                await queryClient.invalidateQueries({ queryKey: ['listings'] });

                Alert.alert('Success', 'Property verified successfully!');
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to verify property');
        }
    };

    const handleApproveUser = async (userId: string) => {
        try {
            const { authService } = await import('../../services/auth.service');
            await authService.updateProfile(userId, { verification_status: 'verified' });
            refetchUsers();
            Alert.alert('Success', 'User verified successfully!');
        } catch (error) {
            Alert.alert('Error', 'Failed to verify user');
        }
    };

    const handleApproveBoost = async (listingId: string) => {
        try {
            await listingsService.approveBoost(listingId);

            await queryClient.invalidateQueries({ queryKey: ['admin-pending-boosts'] });
            await queryClient.invalidateQueries({ queryKey: ['listings'] });

            Alert.alert('Success', 'Boost approved successfully!');
        } catch (error) {
            Alert.alert('Error', 'Failed to approve boost');
        }
    };

    const handleRejectBoost = async (listingId: string) => {
        try {
            await listingsService.rejectBoost(listingId);
            refetchBoosts();
            Alert.alert('Rejected', 'Boost request rejected.');
        } catch (error) {
            Alert.alert('Error', 'Failed to reject boost');
        }
    };

    const handleReject = (id: string, type: 'property' | 'user') => {
        Alert.alert('Rejected', `${type.charAt(0).toUpperCase() + type.slice(1)} verification request rejected.`);
    };

    const renderListingItem = ({ item }: { item: Listing }) => (
        <View style={[styles.card, { backgroundColor: colors.surface }, shadows.soft]}>
            <View style={styles.cardHeader}>
                <View style={styles.userInfo}>
                    <Text style={[styles.userName, { color: colors.text }]}>{item.propertyName || 'Boarding Home'}</Text>
                    <Text style={[styles.userRole, { color: colors.textLight }]}>{item.ownerName}</Text>
                </View>
                <ShieldCheck size={20} color={colors.primary} />
            </View>

            {item.images && item.images.length > 0 ? (
                <View style={styles.documentPreview}>
                    <Image source={{ uri: item.images[0] }} style={styles.idImage} />
                </View>
            ) : (
                <View style={[styles.noDoc, { backgroundColor: colors.background }]}>
                    <Text style={{ color: colors.textLight }}>No photos uploaded</Text>
                </View>
            )}

            <View style={styles.actions}>
                <TouchableOpacity
                    style={[styles.actionBtn, styles.rejectBtn]}
                    onPress={() => handleReject(item.id, 'property')}
                >
                    <XCircle size={20} color="#ef4444" />
                    <Text style={styles.rejectText}>Reject</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.actionBtn, styles.approveBtn]}
                    onPress={() => handleApproveProperty(item.id)}
                >
                    <CheckCircle size={20} color="#10b981" />
                    <Text style={styles.approveText}>Approve</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderUserItem = ({ item }: { item: any }) => (
        <View style={[styles.card, { backgroundColor: colors.surface }, shadows.soft]}>
            <View style={styles.cardHeader}>
                <View style={styles.userInfo}>
                    <Text style={[styles.userName, { color: colors.text }]}>{item.name}</Text>
                    <Text style={[styles.userRole, { color: colors.textLight }]}>{item.email}</Text>
                </View>
                <UsersIcon size={20} color={colors.primary} />
            </View>

            {item.id_document_url ? (
                <View style={styles.documentPreview}>
                    <Image
                        source={{
                            uri: item.id_document_url.startsWith('http')
                                ? item.id_document_url
                                : supabase.storage.from('verifications').getPublicUrl(item.id_document_url).data.publicUrl
                        }}
                        style={styles.idImage}
                    />
                </View>
            ) : (
                <View style={[styles.noDoc, { backgroundColor: colors.background }]}>
                    <Text style={{ color: colors.textLight }}>No ID document uploaded</Text>
                </View>
            )}

            <View style={styles.actions}>
                <TouchableOpacity
                    style={[styles.actionBtn, styles.rejectBtn]}
                    onPress={() => handleReject(item.id, 'user')}
                >
                    <XCircle size={20} color="#ef4444" />
                    <Text style={styles.rejectText}>Reject</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.actionBtn, styles.approveBtn]}
                    onPress={() => handleApproveUser(item.id)}
                >
                    <CheckCircle size={20} color="#10b981" />
                    <Text style={styles.approveText}>Approve</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderBoostItem = ({ item }: { item: Listing }) => (
        <View style={[styles.card, { backgroundColor: colors.surface }, shadows.soft]}>
            <View style={styles.cardHeader}>
                <View style={styles.userInfo}>
                    <Text style={[styles.userName, { color: colors.text }]}>{item.propertyName || item.title}</Text>
                    <Text style={[styles.userRole, { color: colors.textLight }]}>Ow: {item.ownerName} • {item.boostPeriod === 'monthly' ? 'Monthly Boost' : 'Weekly Boost'}</Text>
                </View>
                <Zap size={20} color="#f59e0b" fill="#f59e0b" />
            </View>

            <View style={[styles.paymentInfo, { backgroundColor: colors.background, padding: 12, borderRadius: 12, marginBottom: 16 }]}>
                <Text style={{ color: colors.text, fontWeight: '600' }}>Request: 30 Days Premium</Text>
                <Text style={{ color: colors.primary, fontWeight: '800', fontSize: 16, marginTop: 4 }}>$20.00 PAID</Text>
            </View>

            <View style={styles.actions}>
                <TouchableOpacity
                    style={[styles.actionBtn, styles.rejectBtn]}
                    onPress={() => handleRejectBoost(item.id)}
                >
                    <XCircle size={20} color="#ef4444" />
                    <Text style={styles.rejectText}>Reject</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.actionBtn, styles.approveBtn]}
                    onPress={() => handleApproveBoost(item.id)}
                >
                    <CheckCircle size={20} color="#10b981" />
                    <Text style={styles.approveText}>Approve</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <ChevronLeft size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Admin Panel</Text>
            </View>

            <View style={styles.tabBar}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'properties' && { borderBottomColor: colors.primary, borderBottomWidth: 3 }]}
                    onPress={() => setActiveTab('properties')}
                >
                    <Home size={20} color={activeTab === 'properties' ? colors.primary : colors.textLight} />
                    <Text style={[styles.tabText, { color: activeTab === 'properties' ? colors.primary : colors.textLight }]}>Properties ({pendingListings.length})</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'users' && { borderBottomColor: colors.primary, borderBottomWidth: 3 }]}
                    onPress={() => setActiveTab('users')}
                >
                    <UsersIcon size={20} color={activeTab === 'users' ? colors.primary : colors.textLight} />
                    <Text style={[styles.tabText, { color: activeTab === 'users' ? colors.primary : colors.textLight }]}>Users ({pendingUsers.length})</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'boosts' && { borderBottomColor: colors.primary, borderBottomWidth: 3 }]}
                    onPress={() => setActiveTab('boosts')}
                >
                    <Zap size={20} color={activeTab === 'boosts' ? colors.primary : colors.textLight} />
                    <Text style={[styles.tabText, { color: activeTab === 'boosts' ? colors.primary : colors.textLight }]}>Boosts ({pendingBoosts.length})</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.content}>
                <FlatList
                    data={(activeTab === 'properties' ? pendingListings : activeTab === 'users' ? pendingUsers : pendingBoosts) as any[]}
                    renderItem={activeTab === 'properties' ? (renderListingItem as any) : activeTab === 'users' ? renderUserItem : (renderBoostItem as any)}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Text style={{ color: colors.textLight }}>No {activeTab} pending verification</Text>
                        </View>
                    }
                />
            </View>
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
        fontSize: 22,
        fontWeight: '900',
        marginLeft: Spacing.s,
    },
    tabBar: {
        flexDirection: 'row',
        paddingHorizontal: Spacing.m,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        marginBottom: Spacing.s,
    },
    tab: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        marginRight: 24,
        paddingHorizontal: 4,
    },
    tabText: {
        fontWeight: '700',
        marginLeft: 8,
    },
    content: {
        flex: 1,
        paddingHorizontal: Spacing.m,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginVertical: Spacing.m,
    },
    list: {
        paddingBottom: Spacing.xl,
    },
    card: {
        padding: Spacing.m,
        borderRadius: 20,
        marginBottom: Spacing.m,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.m,
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        fontSize: 16,
        fontWeight: '700',
    },
    userRole: {
        fontSize: 12,
        fontWeight: '600',
        marginTop: 2,
    },
    documentPreview: {
        width: '100%',
        height: 200,
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: Spacing.m,
    },
    idImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    noDoc: {
        width: '100%',
        height: 100,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.m,
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 12,
        flex: 0.48,
    },
    rejectBtn: {
        backgroundColor: '#ef444410',
    },
    approveBtn: {
        backgroundColor: '#10b98110',
    },
    rejectText: {
        color: '#ef4444',
        fontWeight: '700',
        marginLeft: 8,
    },
    approveText: {
        color: '#10b981',
        fontWeight: '700',
        marginLeft: 8,
    },
    emptyState: {
        alignItems: 'center',
        marginTop: 40,
    },
    paymentInfo: {
        marginBottom: 16,
    }
});
