import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    Alert,
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import {
    LayoutDashboard,
    PlusCircle,
    Users,
    TrendingUp,
    ChevronRight,
    Home,
    MessageSquare,
    Eye,
    Calendar,
} from 'lucide-react-native';

import { Theme, Spacing, Typography, Shadows } from '../../theme/Theme';
import { useTheme } from '../../context/ThemeContext';
import { listingsService } from '../../services/listings.service';
import { useAuth } from '../../context/AuthContext';
import { analyticsService } from '../../services/analytics.service';

const { width } = Dimensions.get('window');

export const OwnerDashboardScreen = () => {
    const navigation = useNavigation<any>();
    const { user } = useAuth();
    const { mode, isDark } = useTheme();
    const colors = isDark ? Theme.Dark.Colors : Theme.Light.Colors;
    const shadows = isDark ? Theme.Dark.Shadows : Theme.Light.Shadows;

    const { data: listings = [], isLoading: loading } = useQuery({
        queryKey: ['listings'],
        queryFn: listingsService.getListings,
    });

    const ownerListings = listings.filter(l => l.ownerId === user?.id);
    const recentListing = ownerListings.length > 0 ? ownerListings[ownerListings.length - 1] : null;

    const [stats, setStats] = useState({
        totalViews: '0',
        activeListings: 0,
        potentialRent: 0,
        avgRating: '0',
        monthlyGrowth: '0%'
    });

    useEffect(() => {
        loadStats();
    }, [ownerListings.length, user?.id]);

    const loadStats = async () => {
        if (!user) return;
        const overall = await analyticsService.getOwnerOverallStats(user.id);
        setStats({
            totalViews: overall.totalViews.toLocaleString(),
            activeListings: ownerListings.length,
            potentialRent: ownerListings.reduce((acc, curr) => acc + curr.price, 0),
            avgRating: overall.avgRating.toString(),
            monthlyGrowth: overall.monthlyGrowth
        });
    };

    const StatCard = ({ label, value, icon: Icon, color }: any) => (
        <View style={[styles.statCard, { backgroundColor: colors.surface }, shadows.soft]}>
            <View style={[styles.statIconContainer, { backgroundColor: color + '15' }]}>
                <Icon size={22} color={color} />
            </View>
            <View>
                <Text style={[styles.statLabel, { color: colors.textLight }]}>{label}</Text>
                <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
            </View>
        </View>
    );

    const QuickAction = ({ title, icon: Icon, onPress, color }: any) => (
        <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.surface }, shadows.soft]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View style={[styles.actionIcon, { backgroundColor: color }]}>
                <Icon size={24} color="#ffffff" />
            </View>
            <Text style={[styles.actionTitle, { color: colors.text }]}>{title}</Text>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                <View style={styles.header}>
                    <View>
                        <Text style={[styles.welcomeText, { color: colors.textLight }]}>Welcome back,</Text>
                        <Text style={[styles.ownerName, { color: colors.text }]}>{user?.name} 👋</Text>
                    </View>
                    <Image
                        source={{ uri: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100' }}
                        style={styles.profileAvatar}
                    />
                </View>

                {/* Stats Grid - 2x2 with improved alignment */}
                <View style={styles.statsGrid}>
                    <StatCard label="Total Views" value={stats.totalViews} icon={Eye} color="#3b82f6" />
                    <StatCard label="My Listings" value={stats.activeListings} icon={Home} color="#f59e0b" />
                    <StatCard label="Monthly Rent" value={`$${stats.potentialRent}`} icon={MessageSquare} color="#10b981" />
                    <StatCard label="Rating" value={`${stats.avgRating}/5`} icon={TrendingUp} color="#8b5cf6" />
                </View>

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Management Actions</Text>
                    <View style={styles.actionsContainer}>
                        <QuickAction
                            title="Add Listing"
                            icon={PlusCircle}
                            color={colors.primary}
                            onPress={() => navigation.navigate('CreateEditListing')}
                        />
                        <QuickAction
                            title="Analytics"
                            icon={TrendingUp}
                            color="#8b5cf6"
                            onPress={() => {
                                if (recentListing) {
                                    navigation.navigate('AnalyticsDetail', { listing: recentListing });
                                } else {
                                    Alert.alert('No Listings', 'Add a listing first to see analytics.');
                                }
                            }}
                        />
                        <QuickAction
                            title="Bookings"
                            icon={Calendar}
                            color="#10b981"
                            onPress={() => navigation.navigate('ManageBookings')}
                        />
                    </View>
                </View>

                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Featured Listing</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('MyListings')}>
                            <Text style={[styles.seeAll, { color: colors.primary }]}>View All</Text>
                        </TouchableOpacity>
                    </View>

                    {recentListing ? (
                        <TouchableOpacity
                            style={[styles.recentPropertyCard, { backgroundColor: colors.surface }, shadows.medium]}
                            onPress={() => navigation.navigate('ListingDetails', { listing: recentListing })}
                        >
                            <Image
                                source={{ uri: recentListing.images[0] }}
                                style={styles.propertyImage}
                            />
                            <View style={styles.propertyInfo}>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.propertyPropertyName, { color: colors.text }]}>{recentListing.propertyName || 'Sunrise Heights'}</Text>
                                    <Text style={[styles.propertyTitle, { color: colors.textLight }]}>{recentListing.title}</Text>
                                    <Text style={[styles.propertyLocation, { color: colors.textLight }]}>{recentListing.location}</Text>
                                </View>
                                <View style={[styles.priceTag, { backgroundColor: colors.primaryLight }]}>
                                    <Text style={[styles.priceText, { color: colors.primary }]}>${recentListing.price}/mo</Text>
                                </View>
                            </View>
                            <View style={[styles.propertyFooter, { borderTopColor: colors.border }]}>
                                <View style={styles.verifiedBadge}>
                                    <TrendingUp size={14} color={colors.primary} />
                                    <Text style={[styles.verifiedText, { color: colors.primary }]}>Engagement Up Today</Text>
                                </View>
                                <ChevronRight size={20} color={colors.textLight} />
                            </View>
                        </TouchableOpacity>
                    ) : (
                        <View style={[styles.emptyState, { backgroundColor: colors.surface }, shadows.soft]}>
                            <Home size={40} color={colors.border} />
                            <Text style={[styles.emptyText, { color: colors.textLight }]}>You haven't listed any properties yet.</Text>
                            <TouchableOpacity
                                style={[styles.createBtn, { backgroundColor: colors.primary }]}
                                onPress={() => navigation.navigate('CreateEditListing')}
                            >
                                <Text style={styles.createBtnText}>Create Your First Listing</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                <View style={{ height: 40 }} />
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
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.xl,
    },
    welcomeText: {
        fontSize: 16,
        fontWeight: '500',
    },
    ownerName: {
        ...Typography.h1,
        fontSize: 26,
    },
    profileAvatar: {
        width: 56,
        height: 56,
        borderRadius: 18,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: Spacing.xl,
    },
    statCard: {
        width: '48%',
        padding: 16,
        borderRadius: 24,
        marginBottom: 16,
        flexDirection: 'row',
        alignItems: 'center',
        height: 84, // Fixed height for alignment
    },
    statIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    statLabel: {
        fontSize: 12,
        fontWeight: '600',
    },
    statValue: {
        fontSize: 18,
        fontWeight: '800',
    },
    section: {
        marginBottom: Spacing.xl,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.m,
    },
    sectionTitle: {
        ...Typography.h3,
    },
    seeAll: {
        fontWeight: '700',
    },
    actionsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    actionBtn: {
        width: (width - 64) / 3,
        padding: 16,
        borderRadius: 24,
        alignItems: 'center',
    },
    actionIcon: {
        width: 48,
        height: 48,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    actionTitle: {
        fontSize: 12,
        fontWeight: '700',
        textAlign: 'center',
    },
    recentPropertyCard: {
        borderRadius: 24,
        overflow: 'hidden',
    },
    propertyImage: {
        width: '100%',
        height: 180,
    },
    propertyInfo: {
        padding: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    propertyPropertyName: {
        fontSize: 18,
        fontWeight: '800',
    },
    propertyTitle: {
        fontSize: 14,
        fontWeight: '500',
    },
    propertyLocation: {
        fontSize: 12,
        marginTop: 2,
    },
    priceTag: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    priceText: {
        fontWeight: '800',
        fontSize: 15,
    },
    propertyFooter: {
        padding: 16,
        paddingTop: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        marginBottom: 8,
    },
    verifiedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    verifiedText: {
        marginLeft: 6,
        fontSize: 12,
        fontWeight: '700',
    },
    emptyState: {
        padding: 40,
        borderRadius: 24,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 14,
        marginTop: 12,
        textAlign: 'center',
        marginBottom: 20,
    },
    createBtn: {
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 16,
    },
    createBtnText: {
        color: 'white',
        fontWeight: '700',
    }
});
