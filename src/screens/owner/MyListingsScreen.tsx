import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Image,
    RefreshControl,
    ActivityIndicator,
    Alert,
    Dimensions,
    Modal,
    TextInput,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Plus, MapPin, Edit3, Trash2, Eye, Building2, MoreVertical, Zap, ShieldCheck, X, FileText, Camera } from 'lucide-react-native';

import { Theme, Spacing, Typography, Shadows } from '../../theme/Theme';
import { useTheme } from '../../context/ThemeContext';
import { listingsService } from '../../services/listings.service';
import { useAuth } from '../../context/AuthContext';
import { Listing } from '../../types';

const { width } = Dimensions.get('window');

export const MyListingsScreen = () => {
    const navigation = useNavigation<any>();
    const { user } = useAuth();
    const { isDark } = useTheme();
    const colors = isDark ? Theme.Dark.Colors : Theme.Light.Colors;
    const shadows = isDark ? Theme.Dark.Shadows : Theme.Light.Shadows;

    const [isVerifyModalVisible, setVerifyModalVisible] = React.useState(false);
    const [verifyingListingId, setVerifyingListingId] = React.useState<string | null>(null);
    const [isVerifying, setIsVerifying] = React.useState(false);

    const {
        data: listings = [],
        isLoading: loading,
        refetch,
        isRefetching
    } = useQuery({
        queryKey: ['owner-listings', user?.id],
        queryFn: () => listingsService.getListingsByOwner(user!.id),
        enabled: !!user?.id,
    });

    const handleDelete = (listingId: string) => {
        Alert.alert(
            'Delete Listing',
            'Are you sure you want to remove this property permanently?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        await listingsService.deleteListing(listingId);
                        refetch();
                    }
                }
            ]
        );
    };

    const handleRequestVerification = (listingId: string) => {
        setVerifyingListingId(listingId);
        setVerifyModalVisible(true);
    };

    const submitVerification = async () => {
        if (!verifyingListingId) return;

        setIsVerifying(true);
        // Simulation: Delay for "uploading"
        setTimeout(async () => {
            try {
                // In simulation, we just mark it as verified immediately or after a "review"
                // For this demo, let's update it to verified
                const listing = listings.find(l => l.id === verifyingListingId);
                if (listing) {
                    await listingsService.saveListing({ ...listing, isVerified: true });
                    refetch();
                    Alert.alert('Success', 'Verification request submitted! Your property is now being reviewed (Simulation: Verified immediately).');
                }
            } catch (error) {
                Alert.alert('Error', 'Failed to submit verification');
            } finally {
                setIsVerifying(false);
                setVerifyModalVisible(false);
                setVerifyingListingId(null);
            }
        }, 2000);
    };

    const renderListingItem = ({ item }: { item: Listing }) => (
        <TouchableOpacity
            style={[styles.listingCard, { backgroundColor: colors.surface }, shadows.soft]}
            onPress={() => navigation.navigate('ListingDetails', { listing: item })}
            activeOpacity={0.9}
        >
            <View style={styles.cardMain}>
                <Image source={{ uri: item.images[0] }} style={styles.listingImage} />
                <View style={styles.listingInfo}>
                    <View style={styles.listingHeader}>
                        <Text style={[styles.propertyName, { color: colors.text }]} numberOfLines={1}>
                            {item.propertyName || 'Boarding Home'}
                        </Text>
                        <View style={[
                            styles.statusBadge,
                            { backgroundColor: item.isVerified ? colors.secondary + '20' : '#fef3c7' }
                        ]}>
                            <Text style={[
                                styles.statusText,
                                { color: item.isVerified ? colors.secondary : '#d97706' }
                            ]}>
                                {item.isVerified ? 'Verified' : 'Pending'}
                            </Text>
                        </View>
                    </View>

                    <Text style={[styles.listingTitle, { color: colors.textLight }]} numberOfLines={1}>{item.title}</Text>

                    <View style={styles.locationRow}>
                        <MapPin size={14} color={colors.primary} />
                        <Text style={[styles.locationText, { color: colors.textLight }]}>{item.location}</Text>
                    </View>

                    <View style={styles.priceRow}>
                        <Text style={[styles.priceText, { color: colors.primary }]}>${item.price}<Text style={styles.priceUnit}>/mo</Text></Text>
                    </View>
                </View>
            </View>

            <View style={[styles.cardActions, { borderTopColor: colors.border }]}>
                {!item.isVerified && (
                    <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: colors.primary + '10' }]}
                        onPress={() => handleRequestVerification(item.id)}
                    >
                        <ShieldCheck size={18} color={colors.primary} />
                        <Text style={[styles.actionText, { color: colors.primary }]}>Verify</Text>
                    </TouchableOpacity>
                )}
                <View style={[styles.actionDivider, { backgroundColor: colors.border }]} />
                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => navigation.navigate('CreateEditListing', { listingId: item.id })}
                >
                    <Edit3 size={18} color={colors.text} />
                    <Text style={[styles.actionText, { color: colors.text }]}>Manage</Text>
                </TouchableOpacity>
                <View style={[styles.actionDivider, { backgroundColor: colors.border }]} />
                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => navigation.navigate('BoostListing', { listing: item })}
                >
                    <Zap size={18} color={item.isPremium ? '#f59e0b' : colors.textLight} fill={item.isPremium ? '#f59e0b' : 'transparent'} />
                    <Text style={[styles.actionText, { color: item.isPremium ? '#f59e0b' : colors.textLight }]}>
                        {item.isPremium ? 'Boosted' : 'Boost'}
                    </Text>
                </TouchableOpacity>
                <View style={[styles.actionDivider, { backgroundColor: colors.border }]} />
                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleDelete(item.id)}
                >
                    <Trash2 size={18} color={colors.error} />
                    <Text style={[styles.actionText, { color: colors.error }]}>Delete</Text>
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <View>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>My Listings</Text>
                    <Text style={[styles.headerSubtitle, { color: colors.textLight }]}>{listings.length} Properties</Text>
                </View>
                <TouchableOpacity
                    style={[styles.addButton, { backgroundColor: colors.primary }, shadows.strong]}
                    onPress={() => navigation.navigate('CreateEditListing')}
                >
                    <Plus size={22} color="#ffffff" />
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={listings}
                    renderItem={renderListingItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={isRefetching}
                            onRefresh={refetch}
                            tintColor={colors.primary}
                            colors={[colors.primary]}
                        />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <View style={[styles.emptyIconBox, { backgroundColor: colors.surface }]}>
                                <Building2 size={48} color={colors.border} />
                            </View>
                            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Listings Yet</Text>
                            <Text style={[styles.emptySubtitle, { color: colors.textLight }]}>List your property and start connecting with students today.</Text>
                            <TouchableOpacity
                                style={[styles.emptyAddBtn, { backgroundColor: colors.primary }]}
                                onPress={() => navigation.navigate('CreateEditListing')}
                            >
                                <Text style={styles.emptyAddBtnText}>Add Your First Property</Text>
                            </TouchableOpacity>
                        </View>
                    }
                />
            )}

            {/* Verification Modal */}
            <Modal
                visible={isVerifyModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setVerifyModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: colors.text }]}>Property Verification</Text>
                            <TouchableOpacity onPress={() => setVerifyModalVisible(false)}>
                                <X size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            <Text style={[styles.modalSubTitle, { color: colors.textLight }]}>
                                Upload property documents to get the verified badge and build trust with students.
                            </Text>

                            <TouchableOpacity style={[styles.uploadBox, { borderColor: colors.border, borderStyle: 'dashed' }]}>
                                <FileText size={32} color={colors.textLight} />
                                <Text style={[styles.uploadText, { color: colors.textLight }]}>Property Deeds / Council Papers</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={[styles.uploadBox, { borderColor: colors.border, borderStyle: 'dashed' }]}>
                                <Camera size={32} color={colors.textLight} />
                                <Text style={[styles.uploadText, { color: colors.textLight }]}>Photo of ID / Passport</Text>
                            </TouchableOpacity>

                            <View style={[styles.infoNote, { backgroundColor: colors.primary + '10' }]}>
                                <ShieldCheck size={18} color={colors.primary} />
                                <Text style={[styles.infoNoteText, { color: colors.primary }]}>
                                    Verification increases booking rates by up to 40%.
                                </Text>
                            </View>

                            <TouchableOpacity
                                style={[styles.submitBtn, { backgroundColor: colors.primary }, isVerifying && { opacity: 0.7 }]}
                                onPress={submitVerification}
                                disabled={isVerifying}
                            >
                                <Text style={styles.submitBtnText}>{isVerifying ? 'Uploading Documents...' : 'Submit for Verification'}</Text>
                            </TouchableOpacity>
                        </ScrollView>
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
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.l,
        paddingVertical: Spacing.m,
    },
    headerTitle: {
        ...Typography.h1,
        fontSize: 28,
    },
    headerSubtitle: {
        fontSize: 14,
        fontWeight: '600',
        marginTop: -2,
    },
    addButton: {
        width: 50,
        height: 50,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        padding: Spacing.l,
        paddingBottom: 40,
    },
    listingCard: {
        borderRadius: 24,
        marginBottom: 20,
        overflow: 'hidden',
    },
    cardMain: {
        flexDirection: 'row',
        padding: 12,
    },
    listingImage: {
        width: 100,
        height: 110,
        borderRadius: 16,
    },
    listingInfo: {
        flex: 1,
        paddingLeft: 16,
        justifyContent: 'center',
    },
    listingHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    propertyName: {
        fontSize: 18,
        fontWeight: '800',
        flex: 1,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '800',
        textTransform: 'uppercase',
    },
    listingTitle: {
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 6,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    locationText: {
        fontSize: 13,
        marginLeft: 4,
        fontWeight: '600',
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    priceText: {
        fontSize: 20,
        fontWeight: '800',
    },
    priceUnit: {
        fontSize: 12,
        fontWeight: '500',
    },
    cardActions: {
        flexDirection: 'row',
        borderTopWidth: 1,
        height: 54,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionDivider: {
        width: 1,
        height: '60%',
        alignSelf: 'center',
    },
    actionText: {
        fontSize: 14,
        fontWeight: '700',
        marginLeft: 8,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 80,
    },
    emptyIconBox: {
        width: 100,
        height: 100,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    emptyTitle: {
        fontSize: 22,
        fontWeight: '800',
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 15,
        textAlign: 'center',
        paddingHorizontal: 50,
        lineHeight: 22,
        marginBottom: 32,
    },
    emptyAddBtn: {
        paddingHorizontal: 28,
        paddingVertical: 16,
        borderRadius: 20,
    },
    emptyAddBtnText: {
        color: '#ffffff',
        fontWeight: '800',
        fontSize: 16,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        height: '75%',
        borderTopLeftRadius: 36,
        borderTopRightRadius: 36,
        padding: 24,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: '800',
    },
    modalSubTitle: {
        fontSize: 15,
        lineHeight: 22,
        marginBottom: 24,
    },
    uploadBox: {
        height: 120,
        borderRadius: 20,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    uploadText: {
        marginTop: 8,
        fontSize: 13,
        fontWeight: '600',
    },
    infoNote: {
        flexDirection: 'row',
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
        marginVertical: 12,
    },
    infoNoteText: {
        flex: 1,
        marginLeft: 12,
        fontSize: 13,
        fontWeight: '700',
    },
    submitBtn: {
        height: 60,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
    },
    submitBtnText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '800',
    }
});
